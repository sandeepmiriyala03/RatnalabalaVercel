"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Box, Typography, Card, CardContent,
  Button, Stack, Collapse, TextField,
  Select, MenuItem, FormControl, InputLabel,
  Slider, CircularProgress,
  alpha, useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import VolumeUpRoundedIcon        from "@mui/icons-material/VolumeUpRounded";
import VolumeDownRoundedIcon      from "@mui/icons-material/VolumeDownRounded";
import AutoAwesomeRoundedIcon     from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon      from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon      from "@mui/icons-material/ExpandLessRounded";
import TuneRoundedIcon            from "@mui/icons-material/TuneRounded";
import QuestionAnswerRoundedIcon  from "@mui/icons-material/QuestionAnswerRounded";
import SendRoundedIcon            from "@mui/icons-material/SendRounded";
import ContentCopyRoundedIcon     from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon           from "@mui/icons-material/CheckRounded";
import WhatsAppIcon               from "@mui/icons-material/WhatsApp";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice  from "@/app/components/TeluguVoice";

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

// Asks the Groq-backed poem-ai endpoint a question about THIS poem.
// - .md poems: send collection + filename; the backend reads the real file.
// - database poems (no file): those two are undefined, so the poem's
//   title + content are sent and the backend answers from that text.
async function askPoemAI(
  question: string,
  poem: { title: string; content: string; collection?: string; filename?: string }
): Promise<string> {
  const res = await fetch("/api/main?endpoint=poem-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collection: poem.collection,
      filename: poem.filename,
      title: poem.title,
      content: poem.content,
      question,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || "సమాధానం రాలేదు — మళ్ళీ ప్రయత్నించండి.");
  }

  return data.answer as string;
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
  const [aiQuestion,   setAiQuestion]   = useState("");
  const [aiAnswer,     setAiAnswer]     = useState<string | null>(null);
  const [aiError,      setAiError]      = useState<string | null>(null);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // poem.collection wins over the prop (see Props). The AI button shows on
  // every poem that has text — file-based poems are looked up by
  // collection + filename, database poems are answered from their content.
  const collection = poem.collection ?? collectionProp;
  const canAskAI = Boolean(poem.content?.trim());

  // The moment the AI panel opens, drop the default question into the box.
  // Only fills when empty, so reopening never stomps on the person's own text.
  useEffect(() => {
    if (aiOpen && canAskAI && !aiQuestion.trim()) {
      setAiQuestion(DEFAULT_AI_QUESTION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiOpen, canAskAI]);

  // Reset the Q&A state when the poem changes, so a stale answer from a
  // previous poem can never show under a new one.
  useEffect(() => {
    setAiQuestion("");
    setAiAnswer(null);
    setAiError(null);
    setAiLoading(false);
    setCopied(false);
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
    const text = target === "answer" ? (aiAnswer ?? "") : voiceText;
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

  const handleAskAI = async () => {
    const trimmed = aiQuestion.trim();
    if (!trimmed) return;

    // A new question replaces the answer, so stop its narration.
    if (speakingTarget === "answer") handleStop();

    setAiLoading(true);
    setAiError(null);
    setAiAnswer(null);
    setCopied(false);

    try {
      const answer = await askPoemAI(trimmed, {
        title: poem.title,
        content: poem.content,
        collection,
        filename: poem.filename,
      });
      setAiAnswer(answer);
    } catch (err: any) {
      setAiError(err.message || "ఏదో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setAiLoading(false);
    }
  };

  /* ---------------------- copy / share the AI answer ---------------------- */

  // Copy the answer text exactly as shown.
  const handleCopyAnswer = async () => {
    if (!aiAnswer) return;

    let ok = false;
    try {
      await navigator.clipboard.writeText(aiAnswer);
      ok = true;
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = aiAnswer;
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
    if (!aiAnswer) return;
    const text = `${poem.title}\n\n${aiAnswer}\n\n${SITE_URL}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleQuestionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter submits, Shift+Enter still allows a newline in the question.
    // (Enter that only confirms a Telugu keyboard composition is ignored.)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!aiLoading) handleAskAI();
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
          </Stack>

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
                onClick={() => { setAiOpen((v) => !v); setToolsOpen(false); }}
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
                </Box>

                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                    placeholder="ఈ పద్యం భావం ఏమిటి? ఏదైనా ప్రశ్న అడగండి…"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={handleQuestionKeyDown}
                    disabled={aiLoading}
                  />
                  <Button
                    onClick={handleAskAI}
                    disabled={aiLoading || !aiQuestion.trim()}
                    variant="contained"
                    color="secondary"
                    sx={{ minWidth: 44, height: 40, px: 1.5 }}
                    aria-label="ప్రశ్న పంపండి"
                  >
                    {aiLoading ? (
                      <CircularProgress size={18} sx={{ color: "#fff" }} />
                    ) : (
                      <SendRoundedIcon fontSize="small" />
                    )}
                  </Button>
                </Stack>

                {aiError && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                    {aiError}
                  </Typography>
                )}

                {aiAnswer && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: "10px",
                      background: alpha(theme.palette.secondary.main, 0.08),
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {aiAnswer}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
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