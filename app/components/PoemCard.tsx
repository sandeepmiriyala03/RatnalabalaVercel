"use client";

import React, { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, unstable_isUnrecognizedActionError } from "next/navigation";
import { useOffline } from "next/offline";
import {
  Box, Typography, Card, CardContent,
  Button, Stack, Collapse, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Slider, CircularProgress, Tooltip, IconButton,
  alpha, useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@/lib/yuktai-icons";
import { VolumeDownRounded as VolumeDownRoundedIcon } from "@/lib/yuktai-icons";
import { AutoAwesomeRounded as AutoAwesomeRoundedIcon } from "@/lib/yuktai-icons";
import { ExpandMoreRounded as ExpandMoreRoundedIcon } from "@/lib/yuktai-icons";
import { ExpandLessRounded as ExpandLessRoundedIcon } from "@/lib/yuktai-icons";
import { TuneRounded as TuneRoundedIcon } from "@/lib/yuktai-icons";
import { QuestionAnswerRounded as QuestionAnswerRoundedIcon } from "@/lib/yuktai-icons";
import { SendRounded as SendRoundedIcon } from "@/lib/yuktai-icons";
import { ContentCopyRounded as ContentCopyRoundedIcon } from "@/lib/yuktai-icons";
import { CheckRounded as CheckRoundedIcon } from "@/lib/yuktai-icons";
import { InfoOutlined as InfoOutlinedIcon } from "@/lib/yuktai-icons";
import { WhatsApp as WhatsAppIcon } from "../../lib/yuktai-icons";
import { ScheduleRounded as ScheduleRoundedIcon } from "@/lib/yuktai-icons";
import { RestartAltRounded as RestartAltRoundedIcon } from "@/lib/yuktai-icons";
import { DoneAllRounded as CheckRoundedIcon2 } from "@/lib/yuktai-icons";
import { PsychologyRounded as PsychologyRoundedIcon } from "../../lib/yuktai-icons";

// AI SDK RSC — client వైపు hooks. Server వైపు (createAI, getMutableAIState,
// streamUI) అంతా ./poemAI.tsx లో ఉంది.
import { readStreamableValue, useActions, useAIState, useUIState } from "@ai-sdk/rsc";
import type { PoemAI, PoemLifecycle } from "@/app/components/poemAI";
import {
  PLAIN_EXAMPLE,
  POEM_AI_ACTION_EVENT,
  POEM_TOOLS,
  type PoemAIActionDetail,
  type PoemClientAction,
  type PoemToolName,
  type PoetPoem,
  type Sametha,
  type SimilarPoem,
} from "@/app/components/poemAITools";
import { capturePosterAsDataUrl } from "@/lib/posterExport";
import { DownloadRounded as DownloadRoundedIcon } from "@/lib/yuktai-icons";
import { PlayArrowRounded as PlayArrowRoundedIcon } from "@/lib/yuktai-icons";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice  from "@/app/components/TeluguVoice";
import ReadingEntryButton from "@/app/components/ReadingEntryButton";

/* ------------------------------------------------------------------ */
/* సహాయకుల dropdown: ఎంచుకో → ఏం చేస్తుందో చదువు → పంపు → నిర్ధారించు */
/* ------------------------------------------------------------------ */
const PLAIN_VALUE = "plain";

type PoemAIToolPickerProps = {
  busy: boolean;
  offline: boolean;
  onRun: (question: string) => void;
};

const PoemAIToolPicker = memo(function PoemAIToolPicker({ busy, offline, onRun }: PoemAIToolPickerProps) {
  const [value, setValue] = useState("");
  const [confirming, setConfirming] = useState(false);

  const tool = POEM_TOOLS.find((t) => t.name === value);
  const picked = value === PLAIN_VALUE ? PLAIN_EXAMPLE : tool;
  const disabled = busy || offline;

  return (
    <Box sx={{ mb: 1.5 }}>
      <TextField
        select
        fullWidth
        size="small"
        label={`సహాయకుడిని ఎంచుకోండి · మొత్తం ${POEM_TOOLS.length}`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setConfirming(false);
        }}
        disabled={disabled}
        // ఫోన్ సొంత జాబితా (native select): తెరపై ఏదీ కప్పదు, ఒక్క నొక్కుతో తెరుచుకుంటుంది
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
      >
        <option value="" disabled>
          — ఎంచుకోండి —
        </option>
        <option value={PLAIN_VALUE}>{PLAIN_EXAMPLE.label} (సహాయకుడు లేకుండా)</option>
        {POEM_TOOLS.map((t) => (
          <option key={t.name} value={t.name}>
            {t.label}
          </option>
        ))}
      </TextField>

      {picked && (
        <Box
          role="region"
          aria-live="polite"
          aria-label="ఈ సహాయకుడు ఏం చేస్తుంది"
          sx={{ mt: 1, p: 1.25, borderRadius: "10px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.75 }}>
            {picked.about}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            AI కి వెళ్ళే ప్రశ్న: “{picked.example}”
          </Typography>

          {!confirming ? (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              disabled={disabled}
              onClick={() => setConfirming(true)}
              startIcon={<SendRoundedIcon fontSize="small" />}
              sx={{ mt: 1.25, textTransform: "none", fontWeight: 700, borderRadius: "8px", minHeight: 38, touchAction: "manipulation" }}
            >
              పంపండి
            </Button>
          ) : (
            <Box sx={{ mt: 1.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                “{picked.label}” ఇప్పుడు చేయమంటారా?
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  disabled={disabled}
                  onClick={() => {
                    setConfirming(false);
                    onRun(picked.example);
                  }}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", minHeight: 38, touchAction: "manipulation" }}
                >
                  అవును, చేయండి
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setConfirming(false)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px", minHeight: 38, touchAction: "manipulation" }}
                >
                  వద్దు
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Poster (shared as an image) — colours must stay light & fixed      */
/* ------------------------------------------------------------------ */

const POSTER_COLOR = {
  bg: "#F7F2EA",
  ink: "#2B2620",
  inkMuted: "#6B6258",
  accent: "#2B2620",
  bronze: "#8B6F47",
  hairline: "#E4DACB",
};

const DEFAULT_KAVI_IMAGE_SRC = "/CartoonStyle.png";

const KAVI_IMAGE_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "/MiriaPen.jpg",
};

const KAVI_FOCAL_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "50% 15%",
};
const DEFAULT_FOCAL_POINT = "50% 20%";

const SITE_TAGLINE = "చదవండి · వినండి · పంచుకోండి";
const SITE_URL = "https://ratnalabala.vercel.app";

/* ------------------------------------------------------------------ */
/* Voice + music options                                               */
/* ------------------------------------------------------------------ */

type VoiceOption = "mohan" | "shruti" | "google" | "svara-male" | "svara-female";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Shruti)",
  google: "🔊 Google TTS",
  "svara-male": "🤖 Svara మగ",
  "svara-female": "🤖 Svara స్త్రీ",
};

// Short names for the one-line settings summary.
const VOICE_SHORT: Record<VoiceOption, string> = {
  mohan: "మగ స్వరం",
  shruti: "స్త్రీ స్వరం",
  google: "Google",
  "svara-male": "Svara మగ",
  "svara-female": "Svara స్త్రీ",
};

type MusicOption = "none" | "guitar" | "tabla" | "drums" | "flute" | "veena";

const MUSIC_TRACKS: Record<MusicOption, { label: string; short: string; src: string | null }> = {
  none:   { label: "🔇 సంగీతం లేదు", short: "సంగీతం లేదు", src: null },
  guitar: { label: "🎸 గిటార్",       short: "గిటార్",       src: "/audio/bg-music-guitar-loop.wav" },
  tabla:  { label: "🥁 తబలా",        short: "తబలా",        src: "/audio/bg-music-tabla-loop.wav" },
  drums:  { label: "🪘 డ్రమ్స్",      short: "డ్రమ్స్",      src: "/audio/bg-music-drums-loop.wav" },
  flute:  { label: "🎶 వేణువు",       short: "వేణువు",       src: "/audio/bg-music-flute-loop.wav" },
  veena:  { label: "🎻 వీణ",         short: "వీణ",         src: "/audio/bg-music-veena-loop.wav" },
};

const BG_MUSIC_VOLUME_DEFAULT = 0.18;

/* ------------------------------------------------------------------ */
/* Ask-AI — same feature as PoemCardNew.tsx                            */
/* ------------------------------------------------------------------ */

// Auto-filled into the question box the moment the AI panel opens, so
// the person can just tap send immediately. They can still edit or clear it.
const DEFAULT_AI_QUESTION = "ఈ పద్యం భావం ఏమిటి? సులభంగా వివరించండి.";

/* ------------------------------------------------------------------ */
/* భావాలమాల AI జీవనచక్రం — panel లోని దశల పట్టీ                         */
/* ఒక్కో దశ ఒక AI SDK RSC function. వాడుకరికి "AI అంటే ఒక prompt మాత్రమే */
/* కాదు" అని కనిపించేలా, ప్రతి ప్రశ్నకు ఈ దశలు ఒక్కొక్కటిగా వెలుగుతాయి.    */
/* ------------------------------------------------------------------ */

type LifecycleKey =
  | "createAI" | "useUIState" | "useActions" | "getMutableAIState"
  | "streamUI" | "tool" | "done" | "useAIState";

const LIFECYCLE_STEPS: { key: LifecycleKey; fn: string; label: string; hint: string; optional?: boolean }[] = [
  { key: "createAI",          fn: "createAI",          label: "AI సిద్ధం",       hint: "పేజీ తెరవగానే భావాలమాల AI (provider) సిద్ధంగా ఉంది." },
  { key: "useUIState",        fn: "useUIState",        label: "ప్రశ్న తెరపై",     hint: "మీ ప్రశ్న వెంటనే సంభాషణలో కనిపించింది." },
  { key: "useActions",        fn: "useActions",        label: "Server కి",       hint: "ప్రశ్న server action కి వెళ్ళింది." },
  { key: "getMutableAIState", fn: "getMutableAIState", label: "జ్ఞాపకంలో",       hint: "ఈ పద్యం సంభాషణ చరిత్రలో మీ ప్రశ్న చేరింది." },
  { key: "streamUI",          fn: "streamUI",          label: "Groq ఆలోచన",      hint: "పద్యం, చరిత్ర, సహాయకుల జాబితాతో Groq కి పంపాం." },
  { key: "tool",              fn: "tool",              label: "సహాయకుడు",       hint: "Groq ఒక సహాయకుడిని (tool) పిలిచాడు.", optional: true },
  { key: "done",              fn: ".done()",           label: "జ్ఞాపకం పూర్తి",   hint: "జవాబు సంభాషణ చరిత్రలో చేరింది." },
  { key: "useAIState",        fn: "useAIState",        label: "బటన్లకు మాటలు",   hint: "జవాబు మాటలు వినండి, కాపీ, వాట్సాప్ బటన్లకు అందాయి." },
];

// తెలుగు పేర్లు poemAITools.ts నుంచే (ఒకే జాబితా)
const TOOL_LABELS = Object.fromEntries(POEM_TOOLS.map((t) => [t.name, t.label])) as Record<PoemToolName, string>;

const AI_SAFETY_TIMEOUT_MS = 90_000;

// కొత్త deploy తర్వాత పాత యాప్ (PWA cache) పాత server action ని పిలిస్తే
// ఒక్కసారి మాత్రమే పేజీ రీలోడ్ — అదే మళ్ళీ జరిగితే loop కాకుండా ఆగుతుంది
const STALE_RELOAD_KEY = "ratnalabala:poem-ai-stale-reload";

function reloadOnceForNewVersion(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(STALE_RELOAD_KEY) || 0);
    if (Date.now() - last < 60_000) return false; // ఇప్పుడే రీలోడ్ అయింది
    window.sessionStorage.setItem(STALE_RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage లేకపోయినా (private mode) ఒక్కసారి రీలోడ్ చేస్తాం
  }
  window.location.reload();
  return true;
}

/* ------------------------------------------------------------------ */
/* ప్రశ్న పెట్టె — తన అక్షరాలు తానే పట్టుకుంటుంది                      */
/* ------------------------------------------------------------------ */
// ముందు ప్రతి అక్షరానికీ మొత్తం PoemCard (పద్యం, పోస్టర్, స్వరం…) మళ్ళీ
// render అయ్యేది — మొబైల్‌లో టైప్ చేస్తుంటే నెమ్మది. ఇప్పుడు ఈ చిన్న భాగం మాత్రమే.
type PoemAIInputProps = {
  /** panel మూసి తెరిచినా రాసిన ప్రశ్న పోకుండా (render లేకుండా) */
  draftRef: React.MutableRefObject<string>;
  busy: boolean;
  offline: boolean;
  placeholder: string;
  onSend: (text: string) => void;
};

const PoemAIInput = memo(function PoemAIInput({ draftRef, busy, offline, placeholder, onSend }: PoemAIInputProps) {
  const [text, setText] = useState(() => draftRef.current);
  const canSend = !busy && !offline && Boolean(text.trim());

  const update = (value: string) => {
    draftRef.current = value;
    setText(value);
  };

  const send = () => {
    if (!canSend) return;
    onSend(text);
    update("");
  };

  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      {/* జవాబు వస్తున్నప్పుడూ పెట్టె disabled కాదు: మొబైల్ keyboard
          అకస్మాత్తుగా మూసుకుపోయి తెర ఎగరదు, తర్వాతి ప్రశ్న రాసుకోవచ్చు */}
      <TextField
        fullWidth
        size="small"
        multiline
        maxRows={4}
        placeholder={placeholder}
        value={text}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => {
          // Enter పంపుతుంది, Shift+Enter కొత్త లైన్ (తెలుగు keyboard composition లో Enter వదిలేస్తాం)
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        slotProps={{ htmlInput: { enterKeyHint: "send", "aria-label": "భావాలమాల ప్రశ్న" } }}
      />
      <Button
        onClick={send}
        disabled={!canSend}
        variant="contained"
        color="secondary"
        sx={{ minWidth: 44, height: 40, px: 1.5, touchAction: "manipulation" }}
        aria-label="ప్రశ్న పంపండి"
      >
        {busy ? (
          <CircularProgress size={18} sx={{ color: "#fff" }} />
        ) : (
          <SendRoundedIcon fontSize="small" />
        )}
      </Button>
    </Stack>
  );
});

/* ---- Server (poemAI.tsx) stream చేసే చిన్న display components ---- */
/* ఇవి "use client" ఫైల్‌లో ఉన్నాయి కాబట్టి server వీటిని బొమ్మలుగా    */
/* పంపగలదు. Props మాటలు / జాబితాలు మాత్రమే.                           */

export function PoemAIQuestion({ text }: { text: string }) {
  return (
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
      {text}
    </Typography>
  );
}

export function PoemAIThinking() {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
      <CircularProgress size={14} color="inherit" thickness={5} />
      <Typography variant="body2">Groq ఆలోచిస్తోంది…</Typography>
    </Stack>
  );
}

export function PoemAIAnswer({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }} aria-busy={streaming}>
      {text}
      {streaming && (
        <Box
          component="span"
          aria-hidden
          sx={{
            display: "inline-block", width: "0.5em", height: "1em", ml: 0.25,
            verticalAlign: "text-bottom", bgcolor: "secondary.main", opacity: 0.6,
            animation: "poemAiCaret 1s steps(2) infinite",
            "@keyframes poemAiCaret": { "0%": { opacity: 0.6 }, "100%": { opacity: 0 } },
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      )}
    </Typography>
  );
}

export function PoemAIToolLoading({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "secondary.main" }}>
      <CircularProgress size={14} color="inherit" thickness={5} />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
    </Stack>
  );
}

function ToolTag({ tool }: { tool: PoemToolName }) {
  return (
    <Typography
      component="span"
      sx={{
        display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
        px: 1, py: 0.1, borderRadius: "999px", border: "1px solid", borderColor: "secondary.main",
        color: "secondary.main", mb: 1,
      }}
    >
      సహాయకుడు · {TOOL_LABELS[tool]}
    </Typography>
  );
}

export function PoemAIPadalu({ padalu }: { padalu: string[] }) {
  return (
    <Box>
      <ToolTag tool="showPadalu" />
      <Stack spacing={0.75}>
        {padalu.map((pada, i) => (
          <Stack key={i} direction="row" spacing={1.25} alignItems="baseline">
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", minWidth: 44 }}>
              పాదం {i + 1}
            </Typography>
            <Typography sx={{ fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8 }}>{pada}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export function PoemAIWords({ words }: { words: { word: string; meaning: string }[] }) {
  return (
    <Box>
      <ToolTag tool="explainWords" />
      <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "max-content 1fr", columnGap: 1.5, rowGap: 0.75 }}>
        {words.map((w, i) => (
          <React.Fragment key={i}>
            <Typography component="dt" sx={{ fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }}>{w.word}</Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, lineHeight: 1.7 }}>{w.meaning}</Typography>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

// మూడో సహాయకుడు: database లో దొరికిన ఇలాంటి పద్యాలు
export function PoemAISimilar({ query, poems }: { query: string; poems: SimilarPoem[] }) {
  return (
    <Box>
      <ToolTag tool="findSimilarPoems" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        వెతికిన భావం: <b>{query}</b>
      </Typography>
      {poems.length === 0 ? (
        <Typography variant="body2">ఈ భావంతో ఇంకేమీ దొరకలేదు. వేరే మాటలతో అడిగి చూడండి.</Typography>
      ) : (
        <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: "none" }}>
          {poems.map((p, i) => (
            <Box
              component="li"
              key={`${p.title}-${i}`}
              sx={{ p: 1.25, borderRadius: "10px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
            >
              <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
                {p.link ? (
                  <Typography
                    component="a"
                    href={p.link}
                    sx={{ fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif", color: "secondary.main" }}
                  >
                    {p.title}
                  </Typography>
                ) : (
                  <Typography sx={{ fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }}>{p.title}</Typography>
                )}
                {p.mala && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    · {p.mala}
                  </Typography>
                )}
              </Stack>
              {p.snippet && (
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-line", lineHeight: 1.7, fontFamily: "'Noto Serif Telugu', serif" }}>
                  {p.snippet}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// 4. ఈ కవి ఇతర పద్యాలు
export function PoemAIPoetPoems({ author, poems }: { author: string; poems: PoetPoem[] }) {
  return (
    <Box>
      <ToolTag tool="findPoetPoems" />
      {author && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          కవి: <b>{author}</b>
        </Typography>
      )}
      {poems.length === 0 ? (
        <Typography variant="body2">ఈ కవి ఇతర పద్యాలు దొరకలేదు.</Typography>
      ) : (
        <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: "none" }}>
          {poems.map((p, i) => (
            <Box component="li" key={`${p.title}-${i}`} sx={{ p: 1.25, borderRadius: "10px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              <Typography sx={{ fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }}>{p.title}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-line", lineHeight: 1.7, fontFamily: "'Noto Serif Telugu', serif" }}>
                {p.snippet}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// 5. సామెత జత — సామెతల మాల నుంచి నిజమైన సామెతలు
export function PoemAISametha({ keywords, list }: { keywords: string[]; list: Sametha[] }) {
  return (
    <Box>
      <ToolTag tool="matchSametha" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        వెతికిన మాటలు: <b>{keywords.join(", ")}</b>
      </Typography>
      {list.length === 0 ? (
        <Typography variant="body2">ఈ మాటలతో సామెత దొరకలేదు. వేరే విధంగా అడిగి చూడండి.</Typography>
      ) : (
        <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: "none" }}>
          {list.map((x, i) => (
            <Box component="li" key={i} sx={{ pl: 1.25, borderLeft: "3px solid", borderColor: "secondary.main" }}>
              <Typography sx={{ fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8 }}>“{x.text}”</Typography>
            </Box>
          ))}
        </Stack>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        మూలం: సామెతల మాల
      </Typography>
    </Box>
  );
}

// 6, 7. వినిపించు / పోస్టర్ — బటన్ నొక్కితే అదే పద్యం కార్డు పని చేస్తుంది (event ద్వారా)
export function PoemAIAction({ poemKey, action }: { poemKey: string; action: PoemClientAction }) {
  const [sent, setSent] = useState(false);
  const isListen = action === "listen";

  const run = () => {
    const detail: PoemAIActionDetail = { poemKey, action };
    window.dispatchEvent(new CustomEvent<PoemAIActionDetail>(POEM_AI_ACTION_EVENT, { detail }));
    setSent(true);
    window.setTimeout(() => setSent(false), 4000); // మళ్ళీ నొక్కవచ్చు
  };

  return (
    <Box>
      <ToolTag tool={isListen ? "listenPoem" : "makePoster"} />
      <Typography variant="body2" sx={{ mb: 1 }}>
        {isListen ? "కింది బటన్ నొక్కితే ఈ పద్యం వినిపిస్తాను." : "కింది బటన్ నొక్కితే ఈ పద్యం పోస్టర్ మీ ఫోన్‌కి వస్తుంది."}
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        onClick={run}
        disabled={sent}
        startIcon={isListen ? <PlayArrowRoundedIcon /> : <DownloadRoundedIcon />}
        sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", minHeight: 40, touchAction: "manipulation" }}
      >
        {sent ? (isListen ? "వినిపిస్తోంది…" : "తయారవుతోంది…") : isListen ? "ఇప్పుడు వినండి" : "పోస్టర్ డౌన్‌లోడ్"}
      </Button>
    </Box>
  );
}

export function PoemAIError({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="error" role="alert">
      {message}
    </Typography>
  );
}

/* ---- దశల పట్టీ ---- */

function LifecycleStepper({
  reached, busy, failed, toolUsed,
}: {
  reached: LifecycleKey[];
  busy: boolean;
  failed: boolean;
  toolUsed: PoemToolName | null;
}) {
  const finished = !busy && reached.includes("done");
  const current = busy ? LIFECYCLE_STEPS.find((s) => !reached.includes(s.key) && !(s.optional && !toolUsed && reached.includes("done")))?.key : undefined;
  const last = [...LIFECYCLE_STEPS].reverse().find((s) => reached.includes(s.key));
  const status = failed
    ? "ఈ ప్రశ్న పూర్తి కాలేదు. మళ్ళీ ప్రయత్నించండి."
    : last
    ? (last.key === "tool" && toolUsed ? `Groq "${TOOL_LABELS[toolUsed]}" సహాయకుడిని పిలిచాడు.` : last.hint)
    : "ప్రశ్న పంపితే, AI ఈ దశల్లో పనిచేస్తుంది.";

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        component="ol"
        aria-label="భావాలమాల AI దశలు"
        sx={{
          listStyle: "none", m: 0, p: 0,
          display: "grid", gridTemplateColumns: { xs: "repeat(4, 1fr)", sm: "repeat(8, 1fr)" }, gap: 0.75,
        }}
      >
        {LIFECYCLE_STEPS.map((step, i) => {
          const isDone = reached.includes(step.key);
          const isSkipped = step.optional && !toolUsed && finished;
          const isCurrent = current === step.key;
          return (
            <Box
              component="li"
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              title={step.hint}
              sx={{
                borderRadius: "10px", px: 0.75, py: 0.75, minWidth: 0, textAlign: "center",
                border: "1.5px solid",
                borderStyle: step.optional ? "dashed" : "solid",
                borderColor: isDone ? "secondary.main" : isCurrent ? "secondary.light" : "divider",
                bgcolor: isDone ? (t) => alpha(t.palette.secondary.main, 0.1) : "transparent",
                opacity: isSkipped ? 0.45 : 1,
                transition: "background-color 0.2s, border-color 0.2s",
                animation: isCurrent ? "poemAiPulse 1.2s ease-in-out infinite" : "none",
                "@keyframes poemAiPulse": { "50%": { borderColor: "transparent" } },
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: isDone ? "secondary.main" : "text.secondary", lineHeight: 1.3 }}>
                {isDone ? "✓" : i + 1} {step.key === "tool" && toolUsed ? TOOL_LABELS[toolUsed] : step.label}
              </Typography>
              <Typography sx={{ fontSize: 9.5, fontFamily: "ui-monospace, Menlo, monospace", color: "text.secondary", overflowWrap: "anywhere", lineHeight: 1.3 }}>
                {isSkipped ? "అవసరం రాలేదు" : step.fn}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Typography role="status" aria-live="polite" variant="caption" color={failed ? "error" : "text.secondary"} sx={{ display: "block", mt: 0.75 }}>
        {status}
      </Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Shared helpers (duplicated in PoemCardNew.tsx on purpose — the two  */
/* card components are separate self-contained files, so "వినండి"      */
/* narrates the same text in both)                                     */
/* ------------------------------------------------------------------ */

// Title, poem content and, when an author is known, a closing credit line.
function buildNarrationText(title: string, content: string, authorText?: string): string {
  const base = `${title}. ${content}`;
  const author = authorText?.trim();
  return author ? `${base} ఈ పద్యం రాసినవారు ${author}.` : base;
}

// VoiceOption -> the { source, gender } shape the shared /api/tts contract expects.
function resolveTtsParams(voice: VoiceOption): { source: "edge" | "google" | "svara"; gender: "male" | "female" } {
  if (voice === "google") return { source: "google", gender: "male" };
  if (voice === "svara-male") return { source: "svara", gender: "male" };
  if (voice === "svara-female") return { source: "svara", gender: "female" };
  return { source: "edge", gender: voice === "shruti" ? "female" : "male" };
}

async function fetchTtsAudio(text: string, voice: VoiceOption): Promise<Blob> {
  const { source, gender } = resolveTtsParams(voice);
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, voice: gender }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`TTS request failed: ${res.status} ${errText}`);
  }

  return res.blob();
}

function SpeakingBars() {
  return (
    <span aria-hidden style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 14, width: 14 }}>
      {[3, 6, 4, 7, 2].map((h, i) => (
        <span
          key={i}
          className="speakbar"
          style={{
            width: 2, height: h, borderRadius: 1,
            background: "currentColor", display: "inline-block",
            animation: `speakbar 0.9s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes speakbar{0%{transform:scaleY(0.4)}100%{transform:scaleY(1.4)}}
        @media (prefers-reduced-motion: reduce){.speakbar{animation:none!important}}
      `}</style>
    </span>
  );
}

type SpeakTarget = "poem" | "answer";

// Voice + music pickers. Rendered both in the collapsed "స్వరం, సంగీతం" settings
// and under the AI answer. Both copies are wired to the SAME state, so changing
// one instantly updates the other.
function VoiceMusicFields({
  idPrefix,
  voiceChoice,
  musicChoice,
  musicVolume,
  onVoiceChange,
  onMusicChange,
  onVolumeChange,
}: {
  idPrefix: string;
  voiceChoice: VoiceOption;
  musicChoice: MusicOption;
  musicVolume: number;
  onVoiceChange: (e: SelectChangeEvent<VoiceOption>) => void;
  onMusicChange: (e: SelectChangeEvent<MusicOption>) => void;
  onVolumeChange: (volume: number) => void;
}) {
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <FormControl size="small" fullWidth>
          <InputLabel id={`${idPrefix}-voice-label`}>స్వరం</InputLabel>
          <Select
            labelId={`${idPrefix}-voice-label`}
            label="స్వరం"
            value={voiceChoice}
            onChange={onVoiceChange}
          >
            {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
              <MenuItem key={v} value={v}>{VOICE_LABELS[v]}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id={`${idPrefix}-music-label`}>నేపథ్య సంగీతం</InputLabel>
          <Select
            labelId={`${idPrefix}-music-label`}
            label="నేపథ్య సంగీతం"
            value={musicChoice}
            onChange={onMusicChange}
          >
            {(Object.keys(MUSIC_TRACKS) as MusicOption[]).map((m) => (
              <MenuItem key={m} value={m}>{MUSIC_TRACKS[m].label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {musicChoice !== "none" && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5, px: 0.5 }}>
          <VolumeDownRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
          <Slider
            size="small"
            aria-label="సంగీతం వాల్యూమ్"
            value={musicVolume}
            min={0}
            max={0.5}
            step={0.02}
            onChange={(_, v) => onVolumeChange(v as number)}
            sx={{ color: "#2d6a4f" }}
          />
          <VolumeUpRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
        </Stack>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface Poem {
  title: string;
  content: string;
  slug?: string;
  // Optional. Poems that live in .md files pass collection + filename so the
  // AI endpoint can read the real file. Poems that come from the database
  // (no file) omit them — the card then sends the poem text itself instead.
  filename?: string;
  collection?: string;
  /** database పద్యాలకు — "ఈ కవి ఇతర పద్యాలు" సహాయకుడికి */
  poet_id?: number;
}

type Props = {
  poem:        Poem;
  ready:       boolean;
  speak:       (text: string) => void;
  stopSpeech:  () => void;
  authors?:    string | string[];
  poetryName?: string;
  /** Optional — if every poem in this list is from the SAME collection, pass
   * it once here instead of on every poem. poem.collection wins if both
   * are present (correct for merged "all collections" views). */
  collection?: string;
};

const FOREST_GREEN = "#1a3d2b";
const FOREST_MID   = "#2d6a4f";

export default function PoemCard({
  poem, ready, speak, stopSpeech, authors, poetryName,
  collection: collectionProp,
}: Props) {
  const theme = useTheme();
  const uid   = useId();
  const pathname = usePathname() || "/poems";

  const poemRef          = useRef<HTMLDivElement>(null);
  const audioElRef       = useRef<HTMLAudioElement | null>(null);
  const bgMusicElRef     = useRef<HTMLAudioElement | null>(null);

  // Bumped on every play / stop so a slow TTS response can't start playing
  // after the reader already pressed "ఆపండి".
  const speakSessionRef       = useRef(0);
  const fallbackTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browserSpeechActiveRef = useRef(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen,    setToolsOpen]    = useState(false);
  const [aiOpen,       setAiOpen]       = useState(false);
  // ప్రశ్న పెట్టెలోని మాటలు — state కాదు ref: టైప్ చేస్తుంటే PoemCard render కాదు
  const aiDraftRef = useRef("");
  // రెండుసార్లు త్వరగా నొక్కితే రెండు ప్రశ్నలు వెళ్ళకుండా (state కంటే ముందే తెలిసే గుర్తు)
  const aiBusyRef = useRef(false);
  const [aiError,      setAiError]      = useState<string | null>(null);
  const [aiBusy,       setAiBusy]       = useState(false);
  const [memoryOpen,   setMemoryOpen]   = useState(false);
  // దశల పట్టీ: ఈ ప్రశ్నకు ఇప్పటివరకు పూర్తైన దశలు
  const [reached,      setReached]      = useState<LifecycleKey[]>([]);
  const [toolUsed,     setToolUsed]     = useState<PoemToolName | null>(null);
  // Next.js useOffline: నెట్ పోతే server action ఆగి, వచ్చాక మళ్ళీ వెళ్తుంది — ఆ సంగతి చూపిస్తాం
  const offline = useOffline();
  const [copied, setCopied] = useState(false);
  const [dailySendOpen, setDailySendOpen] = useState(false);
  const [sendPhone, setSendPhone] = useState("");
  const [sendTime, setSendTime] = useState("08:00");
  const [sendFrequency, setSendFrequency] = useState<"daily" | "six-hours">("daily");
  const [sendEnabled, setSendEnabled] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("ratnalabala:poem-delivery-settings");
    if (!saved) return;
    try {
      const settings = JSON.parse(saved);
      setSendPhone(settings.phone ?? "");
      setSendTime(settings.time ?? "08:00");
      setSendFrequency(settings.frequency === "six-hours" ? "six-hours" : "daily");
      setSendEnabled(settings.enabled === true);
    } catch {
      window.localStorage.removeItem("ratnalabala:poem-delivery-settings");
    }
  }, []);

  // poem.collection wins over the prop (see Props). The AI button shows on
  // every poem that has text — file-based poems are looked up by
  // collection + filename, database poems are answered from their content.
  const collection = poem.collection ?? collectionProp;
  const canAskAI = Boolean(poem.content?.trim());
  const readingEntry = {
    id: `poem:${collection ?? "poems"}:${poem.filename ?? poem.slug ?? poem.title}`,
    kind: "poem" as const,
    title: poem.title,
    module: poetryName ?? collection ?? "పద్యాలు",
    href: pathname,
  };

  /* ---------------- AI SDK RSC hooks (దశలు 2, 3, 8) ---------------- */
  // ప్రతి పద్యానికి వేరే సంభాషణ: AI state, UI state రెండూ ఈ key తో వేరవుతాయి
  const poemKey = readingEntry.id;
  const [uiMessages, setUIMessages] = useUIState<typeof PoemAI>();          // దశ 2
  const { askPoem, resetPoemChat } = useActions<typeof PoemAI>();          // దశ 3
  const [poemHistory] = useAIState<typeof PoemAI>(poemKey);                // దశ 8
  const history = poemHistory ?? [];
  const myMessages = uiMessages.filter((m) => m.poemKey === poemKey);
  // వినండి / కాపీ / వాట్సాప్ కి మాటలు — బొమ్మ (UI state) నుంచి కాదు, AI state నుంచి
  const lastAnswer = [...history].reverse().find((m) => m.role === "assistant")?.content ?? null;
  const reachedWithClient: LifecycleKey[] =
    reached.includes("done") && lastAnswer && !aiBusy ? [...reached, "useAIState"] : reached;

  // Reset the Q&A state when the poem changes, so a stale answer from a
  // previous poem can never show under a new one.
  // (సంభాషణలు poemKey తో వేరు కాబట్టి పాత జవాబు కొత్త పద్యం కింద రాదు.)
  useEffect(() => {
    aiDraftRef.current = "";
    aiBusyRef.current = false;
    setAiError(null);
    setAiBusy(false);
    setCopied(false);
    setReached([]);
    setToolUsed(null);
  }, [poem.slug, poem.filename, collection]);

  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<SpeakTarget | null>(null);
  const [voiceChoice,  setVoiceChoice]  = useState<VoiceOption>("mohan");
  const [musicChoice,  setMusicChoice]  = useState<MusicOption>("guitar");
  const [musicVolume,  setMusicVolume]  = useState(BG_MUSIC_VOLUME_DEFAULT);

  const authorText = Array.isArray(authors) ? authors.join(", ") : authors;

  const voiceText = useMemo(
    () => buildNarrationText(poem.title, poem.content, authorText),
    [poem.title, poem.content, authorText]
  );

  const kaviImageSrc = useMemo(() => {
    const names = Array.isArray(authors) ? authors : authors ? [authors] : [];
    for (const name of names) {
      if (KAVI_IMAGE_MAP[name.trim()]) return KAVI_IMAGE_MAP[name.trim()];
    }
    return DEFAULT_KAVI_IMAGE_SRC;
  }, [authors]);

  const kaviFocalPoint = useMemo(() => {
    const names = Array.isArray(authors) ? authors : authors ? [authors] : [];
    for (const name of names) {
      if (KAVI_FOCAL_MAP[name.trim()]) return KAVI_FOCAL_MAP[name.trim()];
    }
    return DEFAULT_FOCAL_POINT;
  }, [authors]);

  const contentLines = useMemo(
    () => poem.content.split("\n").map((line) => line.trim()).filter(Boolean),
    [poem.content]
  );

  const settingsSummary = `${VOICE_SHORT[voiceChoice]} · ${MUSIC_TRACKS[musicChoice].short}`;

  /* ---------------------------- audio ---------------------------- */

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const stopBgMusic = () => {
    if (bgMusicElRef.current) {
      bgMusicElRef.current.pause();
      bgMusicElRef.current.currentTime = 0;
      bgMusicElRef.current = null;
    }
  };

  const startBgMusicIfEnabled = () => {
    const track = MUSIC_TRACKS[musicChoice];
    if (!track.src) return;
    const bg = new Audio(track.src);
    bg.loop = true;
    bg.volume = musicVolume;
    bgMusicElRef.current = bg;
    bg.play().catch(() => {
      bgMusicElRef.current = null;
    });
  };

  const handleSpeak = async (target: SpeakTarget = "poem") => {
    const text = target === "answer" ? (lastAnswer ?? "") : voiceText;
    if (!text.trim()) return;

    // Starting one narration stops the other (poem <-> answer).
    handleStop();

    const session = ++speakSessionRef.current;
    setSpeakingTarget(target);
    setIsSpeaking(true);
    setIsGenerating(true);

    try {
      const blob = await fetchTtsAudio(text, voiceChoice);
      if (session !== speakSessionRef.current) return; // stopped while loading

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioElRef.current = audio;
      setIsGenerating(false);

      audio.onended = () => {
        setIsSpeaking(false);
        setSpeakingTarget(null);
        URL.revokeObjectURL(audioUrl);
        audioElRef.current = null;
        stopBgMusic();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioElRef.current = null;
        stopBgMusic();
        browserSpeechActiveRef.current = true;
        speak(text);
      };

      startBgMusicIfEnabled();
      await audio.play();
    } catch {
      if (session !== speakSessionRef.current) return;
      setIsGenerating(false);
      startBgMusicIfEnabled();
      browserSpeechActiveRef.current = true;
      speak(text);
      clearFallbackTimer();
      fallbackTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
        setSpeakingTarget(null);
        stopBgMusic();
        browserSpeechActiveRef.current = false;
      }, 60_000);
    }
  };

  const handleStop = () => {
    speakSessionRef.current += 1;
    clearFallbackTimer();
    setIsSpeaking(false);
    setSpeakingTarget(null);
    setIsGenerating(false);

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }

    stopBgMusic();
    browserSpeechActiveRef.current = false;
    stopSpeech();
  };

  // Leaving the page / unmounting the card must not leave audio playing.
  useEffect(() => {
    return () => {
      speakSessionRef.current += 1;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      audioElRef.current?.pause();
      bgMusicElRef.current?.pause();
      if (browserSpeechActiveRef.current) stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoiceChange = (event: SelectChangeEvent<VoiceOption>) => {
    if (isSpeaking) handleStop();
    setVoiceChoice(event.target.value as VoiceOption);
  };

  const handleMusicChange = (event: SelectChangeEvent<MusicOption>) => {
    const next = event.target.value as MusicOption;
    setMusicChoice(next);
    if (isSpeaking) {
      stopBgMusic();
      // startBgMusicIfEnabled reads musicChoice from the closure, so start the
      // new track directly here instead of waiting for the next render.
      const track = MUSIC_TRACKS[next];
      if (track.src) {
        const bg = new Audio(track.src);
        bg.loop = true;
        bg.volume = musicVolume;
        bgMusicElRef.current = bg;
        bg.play().catch(() => { bgMusicElRef.current = null; });
      }
    }
  };

  const handleVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    if (bgMusicElRef.current) bgMusicElRef.current.volume = vol;
  };

  /* ---------------------------- ask AI ---------------------------- */

  // chip నొక్కితే దాని ఉదాహరణ ప్రశ్న నేరుగా వెళ్తుంది; లేకపోతే పెట్టెలోని ప్రశ్న
  const handleAskAI = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || aiBusyRef.current || offline) return;
    aiBusyRef.current = true;

    // కొత్త ప్రశ్న వస్తే పాత జవాబు చదవడం ఆపేయాలి
    if (speakingTarget === "answer") handleStop();

    setAiBusy(true);
    setAiError(null);
    setCopied(false);
    setToolUsed(null);

    // దశ 1 (provider ఇప్పటికే ఉంది) + దశ 2: ప్రశ్న వెంటనే తెరపై (useUIState)
    setUIMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-q`, poemKey, role: "user", display: <PoemAIQuestion text={trimmed} /> },
    ]);
    // దశ 3: server action పిలుపు (useActions)
    setReached(["createAI", "useUIState", "useActions"]);

    let settled = false;
    const watchdog = setTimeout(() => {
      if (settled) return;
      settled = true;
      aiBusyRef.current = false;
      setAiError("సమాధానం రావడానికి ఎక్కువ సమయం పట్టింది. మళ్ళీ ప్రయత్నించండి.");
      setAiBusy(false);
    }, AI_SAFETY_TIMEOUT_MS);

    const add = (key: LifecycleKey) => setReached((r) => (r.includes(key) ? r : [...r, key]));

    try {
      const reply = await askPoem({
        poemKey,
        question: trimmed,
        title: poem.title,
        content: poem.content,
        author: authorText,
        poetId: poem.poet_id,
      });
      setUIMessages((prev) => [...prev, reply]);

      // దశలు 4–7: server నుంచి వచ్చే జీవనచక్ర సమాచారం
      if (reply.lifecycle) {
        for await (const event of readStreamableValue<PoemLifecycle>(reply.lifecycle)) {
          if (!event || settled) continue;
          if (event.step === "aiState") add("getMutableAIState");
          if (event.step === "streamUI" || event.step === "text") { add("getMutableAIState"); add("streamUI"); }
          if (event.step === "tool") { add("getMutableAIState"); add("streamUI"); add("tool"); setToolUsed(event.tool); }
          if (event.step === "done") { add("getMutableAIState"); add("streamUI"); add("done"); if (event.tool) { add("tool"); setToolUsed(event.tool); } }
          if (event.step === "error") setAiError(event.message);
        }
      }
    } catch (err) {
      // కొత్త deploy వచ్చింది కానీ ఈ ఫోన్‌లో పాత యాప్ (PWA cache) నడుస్తోంది:
      // పాత server action id కొత్త server కి తెలియదు → ఒక్కసారి రీలోడ్
      if (unstable_isUnrecognizedActionError(err)) {
        console.error("[PoemCard] askPoem: stale app version, reloading", { poemKey });
        if (!settled) setAiError("కొత్త వెర్షన్ వచ్చింది — పేజీ మళ్ళీ తెరుస్తున్నాం…");
        if (!reloadOnceForNewVersion() && !settled) {
          setAiError("కొత్త వెర్షన్ వచ్చింది. యాప్‌ను పూర్తిగా మూసి మళ్ళీ తెరవండి.");
        }
      } else {
        console.error("[PoemCard] askPoem failed", {
          poemKey,
          error: err instanceof Error ? err.message : String(err),
        });
        if (!settled) setAiError("ఏదో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
      }
    } finally {
      clearTimeout(watchdog);
      if (!settled) {
        settled = true;
        aiBusyRef.current = false;
        setAiBusy(false);
      }
    }
  };

  // ప్రశ్న పెట్టె memo అయింది కాబట్టి దానికి ఎప్పుడూ ఒకే function ఇవ్వాలి;
  // లోపల తాజా handleAskAI ని ref ద్వారా పిలుస్తుంది
  const askRef = useRef(handleAskAI);
  useEffect(() => { askRef.current = handleAskAI; });
  const sendFromBox = useMemo(() => (text: string) => { void askRef.current(text); }, []);

  // వినిపించు / పోస్టర్ సహాయకుల బటన్లు: ఈ పద్యం కార్డుకే వచ్చిన event అయితే పని చేయడం
  const downloadPoster = async () => {
    if (!poemRef.current) return;
    try {
      const img = await capturePosterAsDataUrl(poemRef.current, "social");
      if (!img) return;
      const link = document.createElement("a");
      link.href = img;
      link.download = "telugu-padyam.png";
      link.click();
    } catch (err) {
      console.error("[PoemCard] AI poster failed", { poemKey, error: err instanceof Error ? err.message : String(err) });
      setAiError("పోస్టర్ తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి.");
    }
  };
  const actionRef = useRef<(a: PoemClientAction) => void>(() => {});
  useEffect(() => {
    actionRef.current = (a) => {
      if (a === "listen") void handleSpeak("poem");
      else void downloadPoster();
    };
  });
  useEffect(() => {
    const onAction = (e: Event) => {
      const detail = (e as CustomEvent<PoemAIActionDetail>).detail;
      if (detail?.poemKey === poemKey) actionRef.current(detail.action);
    };
    window.addEventListener(POEM_AI_ACTION_EVENT, onAction);
    return () => window.removeEventListener(POEM_AI_ACTION_EVENT, onAction);
  }, [poemKey]);

  // "కొత్త సంభాషణ": ఈ పద్యం UI state, AI state రెండూ ఖాళీ
  const handleResetChat = async () => {
    if (aiBusyRef.current) return;
    if (speakingTarget === "answer") handleStop();
    setUIMessages((prev) => prev.filter((m) => m.poemKey !== poemKey));
    setReached([]);
    setToolUsed(null);
    setAiError(null);
    setCopied(false);
    try {
      await resetPoemChat(poemKey);
    } catch (err) {
      console.error("[PoemCard] resetPoemChat failed", {
        poemKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  /* ---------------------- copy / share the AI answer ---------------------- */

  // Copy the answer text exactly as shown.
  const handleCopyAnswer = async () => {
    if (!lastAnswer) return;

    let ok = false;
    try {
      await navigator.clipboard.writeText(lastAnswer);
      ok = true;
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = lastAnswer;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
    }

    if (!ok) return;
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // Share on WhatsApp: poem title + answer + site link, in the person's own
  // WhatsApp (app on phones, WhatsApp Web on desktop).
  const handleShareWhatsApp = () => {
    if (!lastAnswer) return;
    const text = `${poem.title}\n\n${lastAnswer}\n\n${SITE_URL}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDailySend = async (enabled: boolean) => {
    setSendBusy(true);
    setSendStatus("");
    try {
      const tokenKey = "ratnalabala:poem-delivery-token";
      let token = window.localStorage.getItem(tokenKey);
      if (!token) {
        token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((value) => value.toString(16).padStart(2, "0")).join("");
        window.localStorage.setItem(tokenKey, token);
      }

      const response = await fetch("/api/poem-subscriptions", {
        method: enabled ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(enabled ? {
          body: JSON.stringify({
            phone: sendPhone,
            time: sendTime,
            frequency: sendFrequency,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            consent: true,
          }),
        } : {}),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "సేవ్ చేయడం సాధ్యపడలేదు.");
      setSendEnabled(enabled);
      if (enabled) {
        window.localStorage.setItem("ratnalabala:poem-delivery-settings", JSON.stringify({
          phone: sendPhone,
          time: sendTime,
          frequency: sendFrequency,
          enabled: true,
        }));
      } else {
        window.localStorage.removeItem("ratnalabala:poem-delivery-settings");
      }
      setSendStatus(enabled ? "షెడ్యూల్ సేవ్ అయింది." : "రోజువారీ పద్యం పంపడం ఆపివేశాం.");
    } catch (error) {
      setSendStatus(error instanceof Error ? error.message : "సేవ్ చేయడం సాధ్యపడలేదు.");
    } finally {
      setSendBusy(false);
    }
  };

  /* ---------------------------- styles ---------------------------- */

  const focusRing = {
    "&:focus-visible": {
      outline: `2px solid ${FOREST_MID}`,
      outlineOffset: 2,
    },
  };

  const anyBusy = isSpeaking || isGenerating;
  const poemBusy = anyBusy && speakingTarget === "poem";
  const poemGenerating = isGenerating && speakingTarget === "poem";
  const answerBusy = anyBusy && speakingTarget === "answer";
  const answerGenerating = isGenerating && speakingTarget === "answer";

  const listenLabel = poemGenerating ? "తయారవుతోంది…" : poemBusy ? "ఆపండి" : "వినండి";

  const listenIcon = poemGenerating
    ? <CircularProgress size={18} color="inherit" thickness={5} />
    : poemBusy
    ? <SpeakingBars />
    : <VolumeUpRoundedIcon />;

  const quietButtonSx = {
    borderRadius: "10px",
    minHeight: 46,
    textTransform: "none" as const,
    fontWeight: 600,
    fontSize: { xs: "0.92rem", sm: "0.88rem" },
    borderColor: alpha(FOREST_GREEN, 0.28),
    color: FOREST_GREEN,
    "&:hover": {
      borderColor: alpha(FOREST_GREEN, 0.6),
      background: alpha(FOREST_GREEN, 0.05),
    },
    "&:active": { transform: "scale(0.98)" },
    transition: "background 0.15s, border-color 0.15s, transform 0.15s",
    ...focusRing,
  };

  // Shared look for the two side-by-side action buttons (same size, same colour,
  // stronger tint + ring while its panel is open).
  const actionButtonSx = (open: boolean) => ({
    ...quietButtonSx,
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    px: { xs: 1, sm: 1.5 },
    fontSize: { xs: "0.85rem", sm: "0.92rem" },
    fontWeight: 700,
    lineHeight: 1.3,
    color: "secondary.main",
    borderColor: alpha(theme.palette.secondary.main, open ? 0.8 : 0.45),
    background: alpha(theme.palette.secondary.main, open ? 0.1 : 0.04),
    boxShadow: open ? `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.12)}` : "none",
    "&:hover": {
      borderColor: "secondary.main",
      background: alpha(theme.palette.secondary.main, 0.09),
    },
    "& .MuiButton-startIcon": { marginLeft: 0, marginRight: { xs: 0.5, sm: 1 } },
    // chevrons are hidden on phones to leave room for the Telugu label
    "& .MuiButton-endIcon": { marginLeft: 0.5, display: { xs: "none", sm: "inherit" } },
  });

  /* ----------------------------- render ----------------------------- */

  return (
    <Card
      component="article"
      data-reading-entry={readingEntry.id}
      elevation={0}
      sx={{
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: "18px", sm: "16px" },
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 2px 16px ${alpha(theme.palette.common.black, 0.05)}`,
        overflow: "visible",
      }}
    >
      <CardContent sx={{
        p: { xs: "16px 14px", sm: "24px 24px 20px" },
        "&:last-child": { pb: { xs: "16px", sm: "20px" } },
      }}>

        {/* ============ POSTER — captured by ShareButtons as an image ============ */}
        <Box ref={poemRef} data-poster-root lang="te" sx={{
          textAlign: "center",
          bgcolor: POSTER_COLOR.bg,
          borderRadius: "12px",
          p: { xs: 2, sm: 3 },
        }}>

          <Box data-poster-body sx={{ p: { xs: 2, sm: 3 } }}>

            <Typography component="h2" data-poster-title sx={{
              fontWeight: 600,
              color: POSTER_COLOR.accent,
              mb: 2,
              fontFamily: "'Noto Serif Telugu', serif",
              letterSpacing: 0.5,
              lineHeight: 1.4,
              fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" },
            }}>
              {poem.title}
            </Typography>

            <Box data-poster-divider sx={{
              width: 40, height: 1, bgcolor: POSTER_COLOR.hairline,
              mx: "auto", mb: { xs: 2.5, sm: 3 },
            }} />

            <Box
              data-poster-image
              sx={{
                width: { xs: 140, sm: 170, md: 190 },
                height: { xs: 140, sm: 170, md: 190 },
                borderRadius: "50%",
                overflow: "hidden",
                mx: "auto",
                mb: { xs: 2.5, sm: 3 },
                border: `1px solid ${POSTER_COLOR.hairline}`,
              }}
            >
              <Box
                component="img"
                data-poster-image-inner
                src={kaviImageSrc}
                alt={authorText || poem.title}
                crossOrigin="anonymous"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: kaviFocalPoint,
                  display: "block",
                }}
              />
            </Box>

            <Box>
              {contentLines.map((line, i) => (
                <Typography
                  key={i}
                  data-poster-line
                  sx={{
                    fontSize: { xs: "1.05rem", sm: "1.18rem", md: "1.25rem" },
                    lineHeight: { xs: 1.9, sm: 1.9, md: 2.1 },
                    color: POSTER_COLOR.ink,
                    fontFamily: "'Noto Serif Telugu', serif",
                    mb: i === contentLines.length - 1 ? 0 : { xs: 0.5, sm: 0.75, md: 1 },
                    overflowWrap: "break-word",
                  }}
                >
                  {line}
                </Typography>
              ))}
            </Box>

            {authorText && (
              <Typography data-poster-author sx={{
                mt: { xs: 2.5, sm: 3 },
                fontWeight: 500,
                fontSize: { xs: "0.82rem", sm: "0.88rem" },
                color: POSTER_COLOR.inkMuted,
              }}>
                — {authorText}
              </Typography>
            )}

            {poetryName && (
              <Typography data-poster-hide variant="caption" sx={{
                display: "block", mt: 0.5, letterSpacing: 1,
                fontWeight: 700,
                color: POSTER_COLOR.bronze,
              }}>
                {poetryName}
              </Typography>
            )}

            <Box
              data-poster-footer
              sx={{
                mt: { xs: 3, sm: 3.5 },
                pt: { xs: 1.5, sm: 2 },
                borderTop: `1px solid ${POSTER_COLOR.hairline}`,
              }}
            >
              <Typography sx={{
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                fontWeight: 700,
                letterSpacing: 1.5,
                color: POSTER_COLOR.ink,
                mb: 0.5,
              }}>
                {SITE_TAGLINE}
              </Typography>
              <Typography sx={{
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                color: POSTER_COLOR.inkMuted,
              }}>
                {SITE_URL}
              </Typography>

              <Box
                component="img"
                data-poster-footer-image
                src="/cartoonkids1.png"
                alt=""
                crossOrigin="anonymous"
                sx={{
                  width: "100%",
                  maxWidth: 460,
                  height: "auto",
                  display: "block",
                  mx: "auto",
                  mt: { xs: 2, sm: 2.5 },
                }}
              />
            </Box>

          </Box>
        </Box>

        {/* ============ CONTROLS ============ */}
        <Stack spacing={1.25} sx={{ mt: { xs: 2, sm: 2.5 } }}>

          {/* 1 — Primary: listen + share */}
          <Stack direction="row" spacing={1} alignItems="stretch">
            <Button
              onClick={poemBusy ? handleStop : () => handleSpeak("poem")}
              disabled={!ready}
              variant="contained"
              disableElevation
              startIcon={listenIcon}
              aria-label={poemBusy ? "ఆపండి" : "పద్యం వినండి"}
              sx={{
                flex: 1,
                borderRadius: "12px",
                minHeight: 52,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1rem",
                background: poemBusy
                  ? alpha(theme.palette.error.main, 0.1)
                  : !ready
                  ? undefined
                  : `linear-gradient(135deg, ${FOREST_MID}, ${FOREST_GREEN})`,
                color: poemBusy ? "error.main" : "white",
                border: poemBusy
                  ? `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`
                  : "1.5px solid transparent",
                "&:hover": {
                  background: poemBusy
                    ? alpha(theme.palette.error.main, 0.16)
                    : `linear-gradient(135deg, ${FOREST_MID}, ${FOREST_GREEN})`,
                },
                "&:active": { transform: "scale(0.98)" },
                transition: "background 0.15s, transform 0.15s",
                ...focusRing,
              }}
            >
              {listenLabel}
            </Button>

            <Box sx={{ flex: "0 0 auto", display: "flex", alignItems: "stretch" }}>
              <ShareButtons targetRef={poemRef} />
            </Box>
            <ReadingEntryButton entry={readingEntry} />
          </Stack>

          <Button
            onClick={() => setDailySendOpen((open) => !open)}
            aria-expanded={dailySendOpen}
            startIcon={<ScheduleRoundedIcon />}
            variant="outlined"
            fullWidth
            sx={{ ...quietButtonSx, justifyContent: "flex-start" }}
          >
            {sendEnabled ? "పద్య పంపే సమయాన్ని మార్చండి" : "వాట్సాప్‌లో పద్యం షెడ్యూల్ చేయండి"}
          </Button>

          <Collapse in={dailySendOpen} unmountOnExit>
            <Box sx={{ p: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: "10px" }}>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  మీ సమ్మతితో, ఎంచుకున్న సమయంలో కొత్త పద్యం WhatsAppకు వస్తుంది. WhatsApp సందేశ ఛార్జీలు వర్తించవచ్చు.
                </Typography>
                <TextField
                  label="వాట్సాప్ నంబర్ (దేశ కోడ్‌తో)"
                  placeholder="+919876543210"
                  value={sendPhone}
                  onChange={(event) => setSendPhone(event.target.value)}
                  size="small"
                  fullWidth
                  inputProps={{ inputMode: "tel", autoComplete: "tel" }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <TextField
                    label="మీ సమయం"
                    type="time"
                    value={sendTime}
                    onChange={(event) => setSendTime(event.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormControl size="small" fullWidth>
                    <InputLabel id={`${uid}-send-frequency-label`}>ఎంత తరచుగా</InputLabel>
                    <Select
                      labelId={`${uid}-send-frequency-label`}
                      label="ఎంత తరచుగా"
                      value={sendFrequency}
                      onChange={(event) => setSendFrequency(event.target.value as "daily" | "six-hours")}
                    >
                      <MenuItem value="daily">రోజుకు ఒకసారి</MenuItem>
                      <MenuItem value="six-hours">ప్రతి 6 గంటలకు</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <FormControlLabel
                  control={<Switch checked={sendEnabled} onChange={(event) => {
                    if (event.target.checked) void handleDailySend(true);
                    else void handleDailySend(false);
                  }} disabled={sendBusy || (!sendEnabled && !sendPhone.trim())} />}
                  label={sendEnabled ? "ఆటోమేటిక్ పంపకం ప్రారంభమైంది" : "పంపడానికి నా సమ్మతి ఉంది"}
                />
                {sendEnabled && (
                  <Button
                    onClick={() => void handleDailySend(true)}
                    disabled={sendBusy || !sendPhone.trim()}
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  >
                    సమయాన్ని సేవ్ చేయండి
                  </Button>
                )}
                {sendStatus && <Typography role="status" variant="caption" color="text.secondary">{sendStatus}</Typography>}
                <Typography variant="caption" color="text.secondary">
                  ఆపడానికి ఈ స్విచ్‌ను ఆఫ్ చేయండి. పంపకం పనిచేయాలంటే సైట్ నిర్వాహకుడు Meta WhatsApp Cloud APIని అమర్చాలి.
                </Typography>
              </Stack>
            </Box>
          </Collapse>

          {/* 2 — Voice & music, collapsed, with a one-line summary of the current choice */}
          <Button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
            aria-controls={`${uid}-settings`}
            variant="text"
            fullWidth
            sx={{
              justifyContent: "space-between",
              borderRadius: "10px",
              px: 1.5,
              py: 0.9,
              minHeight: 44,
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.85rem",
              "&:hover": { background: alpha(FOREST_GREEN, 0.05) },
              ...focusRing,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <TuneRoundedIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <Typography component="span" noWrap sx={{ fontSize: "inherit" }}>
                స్వరం, సంగీతం: <b style={{ fontWeight: 600 }}>{settingsSummary}</b>
              </Typography>
            </Box>
            {settingsOpen
              ? <ExpandLessRoundedIcon fontSize="small" />
              : <ExpandMoreRoundedIcon fontSize="small" />}
          </Button>

          <Collapse in={settingsOpen} timeout={240} unmountOnExit>
            <Box
              id={`${uid}-settings`}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                background: alpha(theme.palette.background.default, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
              }}
            >
              <VoiceMusicFields
                idPrefix={`${uid}-set`}
                voiceChoice={voiceChoice}
                musicChoice={musicChoice}
                musicVolume={musicVolume}
                onVoiceChange={handleVoiceChange}
                onMusicChange={handleMusicChange}
                onVolumeChange={handleVolumeChange}
              />
            </Box>
          </Collapse>

          {/* 3 — two actions side by side: ధ్వనికళాదర్శి మాల (left) · భావాలమాల (right).
              Opening one closes the other so only one panel is ever open. */}
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => { setToolsOpen((v) => !v); setAiOpen(false); }}
              aria-expanded={toolsOpen}
              aria-controls={`${uid}-tools`}
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
              endIcon={toolsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              sx={actionButtonSx(toolsOpen)}
            >
              ధ్వనికళాదర్శి మాల
            </Button>

            {canAskAI && (
              <Button
                onClick={() => {
                  // తెరవగానే సాధారణ ప్రశ్న సిద్ధం (వాడుకరి రాసింది ఉంటే దాన్ని మార్చం)
                  if (!aiOpen && !aiDraftRef.current.trim()) aiDraftRef.current = DEFAULT_AI_QUESTION;
                  setAiOpen((v) => !v);
                  setToolsOpen(false);
                }}
                aria-expanded={aiOpen}
                aria-controls={`${uid}-ai`}
                variant="outlined"
                color="secondary"
                startIcon={<QuestionAnswerRoundedIcon fontSize="small" />}
                endIcon={aiOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                sx={actionButtonSx(aiOpen)}
              >
                భావాలమాల
              </Button>
            )}
          </Stack>

          {/* ధ్వనికళాదర్శి మాల panel */}
          <Collapse in={toolsOpen} timeout={320} unmountOnExit>
            <Box
              id={`${uid}-tools`}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                background: alpha(theme.palette.background.default, 0.6),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 15, color: "secondary.main" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "secondary.main" }}>
                  ధ్వనికళాదర్శి మాల
                </Typography>
              </Box>
              <TeluguVoice initialText={voiceText} />
            </Box>
          </Collapse>

          {/* AI Panel — Q&A assistant about this poem */}
          {canAskAI && (
            <Collapse in={aiOpen} timeout={320} unmountOnExit>
              <Box
                id={`${uid}-ai`}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: "12px",
                  background: alpha(theme.palette.background.default, 0.6),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <QuestionAnswerRoundedIcon sx={{ fontSize: 15, color: "secondary.main" }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "secondary.main" }}>
                    భావాలమాల
                  </Typography>
                  <Tooltip
                    arrow
                    placement="top"
                    enterTouchDelay={0}
                    title={
                      <Typography
                        component="span"
                        sx={{ display: "block", whiteSpace: "pre-line", lineHeight: 1.6 }}
                      >
                        {"AI అంటే ఒక prompt మాత్రమే కాదు. ప్రతి ప్రశ్నకు:\n1. createAI — AI సిద్ధంగా ఉంటుంది\n2. useUIState — ప్రశ్న తెరపై\n3. useActions — server కి\n4. getMutableAIState — సంభాషణ జ్ఞాపకంలో\n5. streamUI — Groq మాట మాటగా జవాబు\n6. tool — అవసరమైతే సహాయకుడు\n7. .done() — జ్ఞాపకం పూర్తి\n8. useAIState — మాటలు బటన్లకు\nAPI key సర్వర్‌లోనే ఉంటుంది."}
                      </Typography>
                    }
                  >
                    <IconButton
                      size="small"
                      aria-label="సర్వర్‌లో AI సమాధానం ఎలా తయారవుతుందో చూడండి"
                      sx={{ p: 0.25, color: "text.secondary" }}
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  {/* కొత్త సంభాషణ — panel పైనే, footer / floating buttons కింద దాగకుండా */}
                  {(myMessages.length > 0 || history.length > 0) && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={handleResetChat}
                      disabled={aiBusy}
                      startIcon={<RestartAltRoundedIcon fontSize="small" />}
                      sx={{ ml: "auto", textTransform: "none", fontWeight: 600, borderRadius: "8px", minHeight: 36, whiteSpace: "nowrap" }}
                    >
                      కొత్త సంభాషణ
                    </Button>
                  )}
                </Box>

                <LifecycleStepper
                  reached={reachedWithClient}
                  busy={aiBusy}
                  failed={Boolean(aiError)}
                  toolUsed={toolUsed}
                />

                {/* సహాయకులు: dropdown లో ఎంచుకోండి → ఏం చేస్తుందో చదవండి → పంపండి → నిర్ధారించండి.
                    (chips + Tooltip బదులు: ఫోన్‌లో చిన్న బటన్లు, tooltip సమస్యలు ఉండవు) */}
                <PoemAIToolPicker busy={aiBusy} offline={offline} onRun={sendFromBox} />

                {/* సంభాషణ — UI state (useUIState) లోని ఈ పద్యం సందేశాలు */}
                {myMessages.length > 0 && (
                  <Stack spacing={1} sx={{ mb: 1.5 }} aria-label="భావాలమాల సంభాషణ">
                    {myMessages.map((m) => (
                      <Box
                        key={m.id}
                        sx={{
                          alignSelf: m.role === "user" ? "flex-end" : "stretch",
                          maxWidth: m.role === "user" ? "88%" : "100%",
                          px: 1.5, py: 1, borderRadius: "10px",
                          background: m.role === "user"
                            ? alpha(theme.palette.secondary.main, 0.14)
                            : alpha(theme.palette.secondary.main, 0.06),
                        }}
                      >
                        {m.display}
                      </Box>
                    ))}
                  </Stack>
                )}

                <PoemAIInput
                  draftRef={aiDraftRef}
                  busy={aiBusy}
                  offline={offline}
                  placeholder={myMessages.length ? "ఇంకో ప్రశ్న: ఇంకా సులభంగా చెప్పు, పాదాలుగా చూపించు, కఠిన పదాలు…" : "ఈ పద్యం భావం ఏమిటి? ఏదైనా ప్రశ్న అడగండి…"}
                  onSend={sendFromBox}
                />

                {offline && (
                  <Typography variant="caption" role="status" sx={{ display: "block", mt: 1, color: "warning.main", fontWeight: 600 }}>
                    {aiBusy
                      ? "ఇంటర్నెట్ పోయింది — కనెక్షన్ రాగానే జవాబు దానంతట అదే వస్తుంది."
                      : "ఇంటర్నెట్ లేదు. కనెక్షన్ వచ్చాక ప్రశ్న పంపండి."}
                  </Typography>
                )}

                {aiError && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                    {aiError}
                  </Typography>
                )}

                {/* AI జ్ఞాపకం — AI state (useAIState) ను వాడుకరికి చూపడం */}
                {history.length > 0 && (
                  <Box sx={{ mt: 1.25 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        onClick={() => setMemoryOpen((v) => !v)}
                        aria-expanded={memoryOpen}
                        aria-controls={`${uid}-memory`}
                        startIcon={<PsychologyRoundedIcon fontSize="small" />}
                        endIcon={memoryOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                        sx={{ textTransform: "none", color: "text.secondary", fontWeight: 600 }}
                      >
                        AI జ్ఞాపకం · {history.length} సందేశాలు
                      </Button>
                    </Stack>
                    <Collapse in={memoryOpen} unmountOnExit>
                      <Box
                        id={`${uid}-memory`}
                        sx={{ mt: 0.75, p: 1.25, borderRadius: "8px", border: `1px dashed ${alpha(theme.palette.divider, 0.6)}` }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                          Groq కి గుర్తున్నది ఇదే (AI state). తదుపరి ప్రశ్నతో ఇదంతా మళ్ళీ వెళ్తుంది.
                        </Typography>
                        <Stack spacing={0.5}>
                          {history.map((m, i) => (
                            <Typography key={i} variant="caption" sx={{ display: "block", lineHeight: 1.6 }}>
                              <b>{m.role === "user" ? "మీరు" : "AI"}{m.tool ? ` (సహాయకుడు: ${TOOL_LABELS[m.tool]})` : ""}:</b>{" "}
                              {m.content.length > 140 ? `${m.content.slice(0, 140)}…` : m.content}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Box>
                )}

                {lastAnswer && !aiBusy && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: "10px",
                      background: alpha(theme.palette.secondary.main, 0.08),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CheckRoundedIcon2 sx={{ fontSize: 14 }} /> చివరి జవాబు (AI state నుంచి)
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={answerBusy ? handleStop : () => handleSpeak("answer")}
                        aria-label={answerBusy ? "సమాధానం చదవడం ఆపండి" : "సమాధానం వినండి"}
                        startIcon={
                          answerGenerating
                            ? <CircularProgress size={14} color="inherit" thickness={5} />
                            : answerBusy
                            ? <SpeakingBars />
                            : <VolumeUpRoundedIcon fontSize="small" />
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          minHeight: 36,
                          color: answerBusy ? "error.main" : FOREST_GREEN,
                          borderColor: answerBusy ? alpha(theme.palette.error.main, 0.5) : alpha(FOREST_GREEN, 0.4),
                          background: answerBusy ? alpha(theme.palette.error.main, 0.06) : "transparent",
                          "&:hover": {
                            borderColor: answerBusy ? "error.main" : FOREST_GREEN,
                            background: answerBusy ? alpha(theme.palette.error.main, 0.1) : alpha(FOREST_GREEN, 0.06),
                          },
                        }}
                      >
                        {answerGenerating ? "తయారవుతోంది…" : answerBusy ? "ఆపండి" : "వినండి"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={handleCopyAnswer}
                        aria-live="polite"
                        startIcon={copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
                        sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px", minHeight: 36 }}
                      >
                        {copied ? "కాపీ అయింది" : "కాపీ"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleShareWhatsApp}
                        startIcon={<WhatsAppIcon fontSize="small" />}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          minHeight: 36,
                          color: "#128C7E",
                          borderColor: alpha("#25D366", 0.6),
                          "&:hover": { borderColor: "#25D366", background: alpha("#25D366", 0.08) },
                        }}
                      >
                        వాట్సాప్
                      </Button>
                    </Stack>

                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${alpha(theme.palette.divider, 0.6)}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        స్వరం, సంగీతం
                      </Typography>
                      <VoiceMusicFields
                        idPrefix={`${uid}-ans`}
                        voiceChoice={voiceChoice}
                        musicChoice={musicChoice}
                        musicVolume={musicVolume}
                        onVoiceChange={handleVoiceChange}
                        onMusicChange={handleMusicChange}
                        onVolumeChange={handleVolumeChange}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          )}

        </Stack>
      </CardContent>
    </Card>
  );
}