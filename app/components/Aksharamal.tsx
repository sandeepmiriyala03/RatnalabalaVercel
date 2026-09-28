"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
  Pagination,
  Container,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import AksharaPosterCard from "@/app/components/AksharaMalaPoster";
import { splitTeluguAksharas } from "@/lib/telugu-akshara-wasm";

/* ================= TYPES ================= */
type Akshara = {
  id: string;
  type: "swaralu" | "vyanjanalu" | "gunintalu";
  letter: string;
  word?: string;
  image?: string;
};

type SimilarResult = {
  clicked: { letter: string; word: string };
  same_type: Akshara[];
  related_from_json: any[];
  source: string;
};

type VoiceGender = "male" | "female";

type AnalyzerStats = {
  text: string;
  bytes: number;
  count: number;
  ms: number;
};

type AiWord = {
  word: string;
  meaning_en?: string;
  emoji?: string;
  /** Rust split of the word; null if the WASM check wasn't available */
  aksharas: string[] | null;
};

type AiWordsState =
  | { status: "idle" }
  | { status: "loading"; letter: string }
  | { status: "ready"; letter: string; words: AiWord[]; rejected: number }
  | { status: "error"; letter: string };

/* ================= CONSTANTS ================= */

// Was 100 (all 44 cards mounted at once, each with TTS/canvas/audio refs),
// which caused an Out of Memory crash. 4 fills a 2×2 grid next to the panel.
const PAGE_SIZE = 4;
const DEBOUNCE_MS = 400;
const AI_TIMEOUT_MS = 20000;
const PANEL_WIDTH = 380;
const API_BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "/api";
const VIRAMA = "\u0c4d";

/* ================= HELPERS ================= */

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Browsers round performance.now() (often to 0.1 ms), so very fast runs can read as 0. */
function formatDuration(ms: number): string {
  if (ms <= 0) return "< 0.1 ms";
  if (ms < 1) return `${Math.round(ms * 1000)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Rust check for AI words: the FIRST akshara must be this letter, or this
 * letter with a vowel sign (క → కా, కి are fine). A virama right after the
 * letter means a different conjunct (క → క్ష), so that word is rejected.
 */
function firstAksharaMatches(aksharas: string[], letter: string): boolean {
  const first = aksharas[0];
  if (!first || !first.startsWith(letter)) return false;
  return first.charAt(letter.length) !== VIRAMA;
}

/* ================= HOW-IT-WORKS PANEL ================= */

function HowItWorks({
  stats,
  wasmLoadMs,
}: {
  stats: AnalyzerStats | null;
  wasmLoadMs: number | null;
}) {
  const steps = [
    {
      title: "మీరు టైప్ చేస్తారు",
      detail: stats ? `"${stats.text}"` : "సెర్చ్ బాక్స్‌లో ఒక తెలుగు పదం టైప్ చేయండి",
    },
    {
      title: `${DEBOUNCE_MS} ms ఆగడం (debounce)`,
      detail: "ప్రతి కీ నొక్కినప్పుడు కాకుండా, టైపింగ్ ఆపిన తర్వాతే పని మొదలవుతుంది",
    },
    {
      title: "UTF-8 బైట్లుగా మార్చడం",
      detail: stats
        ? `${stats.bytes} బైట్లు (ప్రతి తెలుగు గుర్తుకు 3 బైట్లు)`
        : "TextEncoder తో పదాన్ని బైట్లుగా మారుస్తాం",
    },
    {
      title: "WebAssembly మెమరీలో రాయడం",
      detail: "input_ptr() చూపించే చోట బైట్లను నేరుగా రాస్తాం",
    },
    {
      title: "Rust analyze() పని చేస్తుంది",
      detail: stats
        ? `${stats.count} అక్షరాలుగా విడదీసింది — ${formatDuration(stats.ms)}`
        : "క్ + ష వంటి సంయుక్తాక్షరాలను ఒకే అక్షరంగా ఉంచుతుంది",
    },
    {
      title: "ఫలితం చదివి చూపించడం",
      detail: "output_ptr() నుండి చదివి, U+001F గుర్తు దగ్గర విడదీసి చిప్స్‌గా చూపిస్తాం",
    },
  ];

  const whyRust = [
    "⚡ వేగం — Rust నేరుగా WebAssembly గా కంపైల్ అవుతుంది; మెమరీ శుభ్రపరిచే విరామాలు (GC) ఉండవు",
    "🛡️ భద్రత — బఫర్ పరిమితులు దాటకుండా Rust చూసుకుంటుంది",
    "📦 చిన్న ఫైల్ — ఒక్కసారి డౌన్‌లోడ్ అయితే బ్రౌజర్ కాష్‌లో ఉంటుంది",
    "📴 సర్వర్ అవసరం లేదు — విశ్లేషణ మొత్తం మీ బ్రౌజర్‌లోనే జరుగుతుంది",
    "🤖 AI తనిఖీ — AI సూచించిన పదాలను చూపించే ముందు Rust సరిచూస్తుంది",
  ];

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 2,
        border: "1px dashed",
        borderColor: "secondary.main",
        borderRadius: 2,
        textAlign: "left",
      }}
    >
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
        అక్షరాల విశ్లేషణ ఎలా జరుగుతుంది?
      </Typography>

      <Stack spacing={1.25}>
        {steps.map((step, i) => (
          <Stack key={step.title} direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                minWidth: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {step.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {step.detail}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      {wasmLoadMs !== null && (
        <Typography variant="caption" sx={{ display: "block", mt: 1.5, opacity: 0.75 }}>
          📥 WASM లోడ్ సమయం: {formatDuration(wasmLoadMs)} (పేజీ తెరిచినప్పుడు ఒక్కసారి మాత్రమే)
        </Typography>
      )}

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
        Rust ఎందుకు?
      </Typography>
      <Stack spacing={0.5}>
        {whyRust.map((line) => (
          <Typography key={line} variant="caption" sx={{ opacity: 0.85 }}>
            {line}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

/* ================= AI WORDS PANEL ================= */

function AiWordsPanel({
  state,
  onSpeak,
}: {
  state: Exclude<AiWordsState, { status: "idle" }>;
  onSpeak: (word: string) => void;
}) {
  return (
    <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
        <AutoAwesomeRoundedIcon color="secondary" fontSize="small" />
        <Typography fontWeight={700}>
          &quot;{state.letter}&quot; తో మొదలయ్యే పదాలు
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
        <Chip size="small" label="AI · Groq" variant="outlined" />
        <Chip size="small" icon={<CodeRoundedIcon />} label="Rust తనిఖీ" variant="outlined" color="secondary" />
      </Stack>

      {state.status === "loading" && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            AI పదాలు వెతుకుతోంది...
          </Typography>
        </Stack>
      )}

      {state.status === "error" && (
        <Typography variant="body2" color="text.secondary">
          AI పదాలు ఇప్పుడు అందుబాటులో లేవు. కొద్దిసేపటి తర్వాత మళ్ళీ కార్డ్‌పై నొక్కండి.
        </Typography>
      )}

      {state.status === "ready" && state.words.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          ఈ అక్షరానికి సరైన పదాలు దొరకలేదు.
        </Typography>
      )}

      {state.status === "ready" && state.words.length > 0 && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 1.25,
            }}
          >
            {state.words.map((w) => (
              <Box
                key={w.word}
                component="button"
                type="button"
                onClick={() => onSpeak(w.word)}
                aria-label={`${w.word} వినండి`}
                sx={{
                  p: 1.25,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  font: "inherit",
                  color: "inherit",
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { borderColor: "secondary.main" },
                  "&:focus-visible": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
                }}
              >
                {w.emoji && <Typography sx={{ fontSize: 26, lineHeight: 1.2 }}>{w.emoji}</Typography>}
                <Typography sx={{ fontWeight: 800, fontSize: "1.2rem" }}>{w.word}</Typography>
                {w.aksharas && w.aksharas.length > 1 && (
                  <Typography variant="caption" sx={{ display: "block", opacity: 0.75 }}>
                    {w.aksharas.join(" · ")}
                  </Typography>
                )}
                {w.meaning_en && (
                  <Typography variant="caption" sx={{ display: "block", opacity: 0.55 }}>
                    {w.meaning_en}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.6 }}>
            🔊 పదంపై నొక్కితే వినిపిస్తుంది
            {state.rejected > 0 &&
              ` • 🦀 Rust తనిఖీలో ${state.rejected} సరిపోని పదం(లు) తొలగించబడ్డాయి`}
          </Typography>
        </>
      )}
    </Box>
  );
}

/* ================= CARD RESULTS (side panel / bottom sheet) ================= */

function CardResults({
  selected,
  similar,
  similarLoading,
  aiWords,
  onSpeak,
  onPickLetter,
}: {
  selected: Akshara | null;
  similar: SimilarResult | null;
  similarLoading: boolean;
  aiWords: AiWordsState;
  onSpeak: (word: string) => void;
  onPickLetter: (letter: string) => void;
}) {
  if (!selected) {
    return (
      <Box
        sx={{
          p: 3,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <TouchAppRoundedIcon color="secondary" sx={{ fontSize: 36, mb: 1 }} />
        <Typography fontWeight={700}>ఏదైనా అక్షరం కార్డ్‌పై నొక్కండి</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          సంబంధిత అక్షరాలు, AI సూచించిన కొత్త పదాలు ఇక్కడ కనిపిస్తాయి.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Selected letter */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            minWidth: 64,
            height: 64,
            px: 1,
            borderRadius: "12px",
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
            display: "grid",
            placeItems: "center",
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          {selected.letter}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            ఎంచుకున్న అక్షరం
          </Typography>
          {selected.word && (
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {selected.word}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Related letters */}
      <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Typography fontWeight={700} sx={{ mb: 1 }}>
          సంబంధిత అక్షరాలు
        </Typography>
        {similarLoading && <CircularProgress size={20} />}
        {!similarLoading && similar && similar.same_type.length > 0 && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {similar.same_type.map((s) => (
              <Chip
                key={s.id}
                label={`${s.letter} — ${s.word || ""}`}
                clickable
                onClick={() => onPickLetter(s.letter)}
                aria-label={`${s.letter} అక్షరం చూడండి`}
              />
            ))}
          </Stack>
        )}
        {!similarLoading && (!similar || similar.same_type.length === 0) && (
          <Typography variant="body2" color="text.secondary">
            సంబంధిత అక్షరాలు దొరకలేదు.
          </Typography>
        )}
      </Box>

      {/* AI words */}
      {aiWords.status !== "idle" && <AiWordsPanel state={aiWords} onSpeak={onSpeak} />}
    </Stack>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function AksharamalaParent() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS);

  // Rust / WASM analyzer
  const [aksharas, setAksharas] = useState<string[]>([]);
  const [analyzerState, setAnalyzerState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [stats, setStats] = useState<AnalyzerStats | null>(null);
  const [wasmLoadMs, setWasmLoadMs] = useState<number | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const wasmReadyRef = useRef<Promise<void> | null>(null);

  // List / filters
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "swaralu" | "vyanjanalu">("all");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("male");

  const [items, setItems] = useState<Akshara[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiMs, setApiMs] = useState<number | null>(null);

  const [sametaluMatches, setSametaluMatches] = useState<string[]>([]);

  // Card click → side panel (desktop) / bottom sheet (mobile)
  const [selected, setSelected] = useState<Akshara | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [similar, setSimilar] = useState<SimilarResult | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [aiWords, setAiWords] = useState<AiWordsState>({ status: "idle" });
  const clickIdRef = useRef(0); // ignores late answers from an older click
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* 1. Preload WASM once, so the search timer measures only the analysis */
  useEffect(() => {
    if (wasmReadyRef.current) return;
    const t0 = performance.now();
    wasmReadyRef.current = splitTeluguAksharas("అ")
      .then(() => setWasmLoadMs(performance.now() - t0))
      .catch(() => {
        /* a real failure will show up on the first search */
      });
  }, []);

  // Stop any AI-word audio when leaving the page
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Close the mobile sheet if the screen becomes wide (rotation, resize)
  useEffect(() => {
    if (isDesktop) setSheetOpen(false);
  }, [isDesktop]);

  /* 2. Split the search text with Rust, and time it */
  useEffect(() => {
    const text = debouncedSearch.trim();
    if (!/[\u0c00-\u0c7f]/u.test(text)) {
      setAksharas([]);
      setStats(null);
      setAnalyzerState("idle");
      return;
    }

    let active = true;
    setAnalyzerState("loading");

    (async () => {
      try {
        await wasmReadyRef.current;
        const t0 = performance.now();
        const segments = await splitTeluguAksharas(text);
        const ms = performance.now() - t0;
        if (!active) return;

        setAksharas(segments);
        setStats({
          text,
          bytes: new TextEncoder().encode(text).length,
          count: segments.length,
          ms,
        });
        setAnalyzerState("ready");
      } catch {
        if (active) setAnalyzerState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  /* 3. Fetch the list from the server, and time it */
  useEffect(() => {
    const controller = new AbortController();

    const resetResults = () => {
      setItems([]);
      setTotalCount(0);
      setPageCount(1);
      setSametaluMatches([]);
      setApiMs(null);
    };

    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);

      const url = `${API_BASE}/aksharamala?${new URLSearchParams({
        search: debouncedSearch,
        type: typeFilter,
        page: String(page),
        page_size: String(PAGE_SIZE),
      })}`;

      const t0 = performance.now();

      try {
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          const bodyText = await res.text();
          if (controller.signal.aborted) return;
          console.error(`[Aksharamala] ${res.status} ${res.statusText}\n${bodyText}`);
          setErrorMsg(`API ఎర్రర్ (${res.status}): ${bodyText.slice(0, 200) || res.statusText}`);
          resetResults();
          return;
        }

        const data = await res.json();
        if (controller.signal.aborted) return;

        setApiMs(performance.now() - t0);
        setItems(data.items || []);
        setTotalCount(data.total_count || 0);
        setPageCount(data.page_count || 1);
        setSametaluMatches(data.sametalu_matches || []);
      } catch (err) {
        if (controller.signal.aborted) return; // a newer search replaced this one
        console.error("[Aksharamala] fetch failed:", err);
        setErrorMsg(err instanceof Error ? err.message : "తెలియని ఎర్రర్ వచ్చింది.");
        resetResults();
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [debouncedSearch, typeFilter, page]);

  /* 4. Card click: similar letters (fast) and AI words (slower), in parallel */

  const loadSimilar = async (a: Akshara, clickId: number) => {
    setSimilarLoading(true);
    setSimilar(null);
    try {
      const params = new URLSearchParams({ endpoint: "similar", letter: a.letter, word: a.word || "" });
      const res = await fetch(`${API_BASE}/aksharamala?${params}`);
      if (!res.ok) {
        console.error(`[Aksharamala Similar] ${res.status} ${res.statusText}`);
        return;
      }
      const data = await res.json();
      if (clickId === clickIdRef.current) setSimilar(data);
    } catch (err) {
      console.error("[Aksharamala Similar] fetch failed:", err);
    } finally {
      if (clickId === clickIdRef.current) setSimilarLoading(false);
    }
  };

  const loadAiWords = async (a: Akshara, clickId: number) => {
    setAiWords({ status: "loading", letter: a.letter });

    // Don't spin forever if Groq is slow: give up after AI_TIMEOUT_MS
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({ endpoint: "ai_words", letter: a.letter, word: a.word || "" });
      const res = await fetch(`${API_BASE}/aksharamala?${params}`, { signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || `AI words ${res.status}`);

      // Rust check: keep only words whose first akshara really is this letter.
      // If WASM isn't available, keep the word (the server already checked it).
      const checked: AiWord[] = await Promise.all(
        (data.words || []).map(async (w: Omit<AiWord, "aksharas">) => ({
          ...w,
          aksharas: await splitTeluguAksharas(w.word).catch(() => null),
        }))
      );
      const valid = checked.filter((w) => w.aksharas === null || firstAksharaMatches(w.aksharas, a.letter));

      if (clickId !== clickIdRef.current) return;
      setAiWords({
        status: "ready",
        letter: a.letter,
        words: valid,
        rejected: checked.length - valid.length,
      });
    } catch (err) {
      console.error("[Aksharamala AI words] failed:", err);
      if (clickId === clickIdRef.current) setAiWords({ status: "error", letter: a.letter });
    } finally {
      clearTimeout(timer);
    }
  };

  const handleCardClick = (a: Akshara) => {
    const clickId = ++clickIdRef.current;
    setSelected(a);
    if (!isDesktop) setSheetOpen(true);
    loadSimilar(a, clickId);
    loadAiWords(a, clickId);
  };

  /** A related-letter chip was tapped: show that letter's card. */
  const handlePickLetter = (letter: string) => {
    setSheetOpen(false);
    setTypeFilter("all");
    setSearch(letter);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Speaks an AI word: same TTS as the cards, browser voice as fallback. */
  const speakWord = async (text: string) => {
    audioRef.current?.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: "edge", voice: voiceGender }),
      });
      if (!res.ok) throw new Error(`TTS API ${res.status}`);

      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.warn("[Aksharamala] TTS failed, using browser voice:", err);
      if (!("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "te-IN";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFilter = (type: "all" | "swaralu" | "vyanjanalu") => {
    setTypeFilter(type);
    setPage(1);
  };

  const resultsPanel = (
    <CardResults
      selected={selected}
      similar={similar}
      similarLoading={similarLoading}
      aiWords={aiWords}
      onSpeak={speakWord}
      onPickLetter={handlePickLetter}
    />
  );

  return (
    <Container maxWidth="lg">
      <Stack spacing={4} sx={{ py: 6 }}>
        {/* HEADER (kept narrow so the search box doesn't stretch too wide) */}
        <Box textAlign="center" sx={{ maxWidth: 760, mx: "auto", width: "100%" }}>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip label="అన్నీ" clickable color={typeFilter === "all" ? "primary" : "default"} onClick={() => handleFilter("all")} />
            <Chip label="అచ్చులు" clickable color={typeFilter === "swaralu" ? "primary" : "default"} onClick={() => handleFilter("swaralu")} />
            <Chip label="హల్లులు" clickable color={typeFilter === "vyanjanalu" ? "primary" : "default"} onClick={() => handleFilter("vyanjanalu")} />
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>🔊 స్వరం:</Typography>
            <ToggleButtonGroup
              size="small"
              value={voiceGender}
              exclusive
              onChange={(_, v) => { if (v) setVoiceGender(v); }}
            >
              <ToggleButton value="male" sx={{ textTransform: "none", px: 2 }}>🎙️ మగ స్వరం</ToggleButton>
              <ToggleButton value="female" sx={{ textTransform: "none", px: 2 }}>👩 స్త్రీ స్వరం</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack direction="row" spacing={1.5} justifyContent="center" useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
            <Chip label={`మొత్తం: ${totalCount}`} color="secondary" sx={{ fontWeight: 800 }} />
            <Chip label={`పేజీ: ${page} / ${pageCount}`} color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
            {apiMs !== null && !loading && !errorMsg && (
              <Chip
                icon={<CloudOutlinedIcon />}
                label={`సర్వర్: ${formatDuration(apiMs)}`}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>

          <TextField
            fullWidth
            placeholder="అక్షరం లేదా పదం వెతకండి..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ bgcolor: "white", borderRadius: "12px", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />

          {analyzerState !== "idle" && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                textAlign: "left",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                useFlexGap
                flexWrap="wrap"
              >
                <Typography variant="caption" fontWeight={700}>
                  విభజించిన అక్షరాలు
                </Typography>
                <Chip
                  size="small"
                  icon={<CodeRoundedIcon />}
                  label="Rust · WebAssembly"
                  variant="outlined"
                  color="secondary"
                />
                {analyzerState === "ready" && stats && (
                  <Chip
                    size="small"
                    icon={<TimerOutlinedIcon />}
                    label={formatDuration(stats.ms)}
                    variant="outlined"
                    color="success"
                  />
                )}
                {analyzerState === "loading" && <CircularProgress size={18} />}
                {analyzerState === "error" && (
                  <Typography variant="caption" color="text.secondary">
                    విశ్లేషణ అందుబాటులో లేదు
                  </Typography>
                )}
                {analyzerState === "ready" && (
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {aksharas.map((akshara, index) => (
                      <Chip
                        key={`${index}-${akshara}`}
                        label={akshara}
                        size="small"
                        clickable
                        aria-label={`అక్షరం ${akshara} కోసం వెతకండి`}
                        onClick={() => {
                          setSearch(akshara);
                          setPage(1);
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          )}

          <Button
            size="small"
            color="secondary"
            startIcon={<HelpOutlineRoundedIcon />}
            onClick={() => setShowHowItWorks((v) => !v)}
            sx={{ mt: 1, textTransform: "none" }}
            aria-expanded={showHowItWorks}
          >
            {showHowItWorks ? "వివరణ దాచండి" : "ఎలా పనిచేస్తుంది?"}
          </Button>

          <Collapse in={showHowItWorks} unmountOnExit>
            <HowItWorks stats={stats} wasmLoadMs={wasmLoadMs} />
          </Collapse>
        </Box>

        {errorMsg && !loading && (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            {errorMsg}
            <br />
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              బ్రౌజర్ కన్సోల్ (F12) లో పూర్తి వివరాలు చూడండి.
            </Typography>
          </Alert>
        )}

        {/* MAIN: cards on the left, results panel on the right (desktop) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "minmax(0, 1fr)", md: `minmax(0, 1fr) ${PANEL_WIDTH}px` },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <Stack spacing={3}>
            {loading ? (
              <Box textAlign="center" sx={{ py: 10 }}>
                <CircularProgress />
              </Box>
            ) : errorMsg ? null : items.length === 0 ? (
              <Box textAlign="center" sx={{ py: 10 }}>
                <Typography variant="h6" sx={{ opacity: 0.5 }}>క్షమించండి! ఏమీ దొరకలేదు.</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 3,
                }}
              >
                {items.map((a) => {
                  const isSelected = selected?.id === a.id;
                  return (
                    <Box
                      key={a.id}
                      onClick={() => handleCardClick(a)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 4,
                        outline: isSelected ? "3px solid" : "3px solid transparent",
                        outlineColor: isSelected ? "secondary.main" : "transparent",
                        outlineOffset: 3,
                        transition: "outline-color 0.2s ease",
                      }}
                    >
                      <AksharaPosterCard akshara={a} enableRead={true} voiceGender={voiceGender} />
                    </Box>
                  );
                })}
              </Box>
            )}

            {sametaluMatches.length > 0 && !loading && (
              <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider" }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>సంబంధిత సామెతలు:</Typography>
                <Stack spacing={0.5}>
                  {sametaluMatches.map((s, i) => (
                    <Typography key={i} sx={{ opacity: 0.85 }}>• {s}</Typography>
                  ))}
                </Stack>
              </Box>
            )}

            {pageCount > 1 && (
              <Box display="flex" justifyContent="center">
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, v) => {
                    setPage(v);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  color="primary"
                  size="large"
                  shape="rounded"
                />
              </Box>
            )}
          </Stack>

          {/* Right column: stays in view while scrolling (desktop only) */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "sticky",
              top: 16,
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
            }}
          >
            {resultsPanel}
          </Box>
        </Box>
      </Stack>

      {/* Mobile: results open as a bottom sheet over the page */}
      <Drawer
        anchor="bottom"
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80vh",
            px: 2,
            pt: 1,
            pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
          },
        }}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "divider", mx: "auto", mb: 1 }} />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={() => setSheetOpen(false)} aria-label="మూసివేయండి" size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        {resultsPanel}
      </Drawer>
    </Container>
  );
}

