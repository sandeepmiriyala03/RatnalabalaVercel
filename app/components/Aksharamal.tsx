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
} from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

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

/* ================= CONSTANTS ================= */

// Was 100 (all 44 cards mounted at once, each with TTS/canvas/audio refs),
// which caused an Out of Memory crash. Keep this small.
const PAGE_SIZE = 3;
const DEBOUNCE_MS = 400;
const API_BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "/api";

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
    "🔁 ఒకే కోడ్ — అదే Rust కోడ్‌ను Android యాప్ లేదా సర్వర్‌లో కూడా వాడవచ్చు",
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

/* ================= MAIN COMPONENT ================= */

export default function AksharamalaParent() {
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

  const [similar, setSimilar] = useState<SimilarResult | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);

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

  const handleCardClick = async (a: Akshara) => {
    setSimilarLoading(true);
    setSimilar(null);
    try {
      const params = new URLSearchParams({ letter: a.letter, word: a.word || "" });
      const res = await fetch(`${API_BASE}/aksharamala_similar?${params}`);
      if (!res.ok) {
        console.error(`[Aksharamala Similar] ${res.status} ${res.statusText}`);
        return;
      }
      setSimilar(await res.json());
    } catch (err) {
      console.error("[Aksharamala Similar] fetch failed:", err);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleFilter = (type: "all" | "swaralu" | "vyanjanalu") => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 6 }}>
        {/* HEADER */}
        <Box textAlign="center">
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

        {loading ? (
          <Box textAlign="center" sx={{ py: 10 }}>
            <CircularProgress />
          </Box>
        ) : errorMsg ? null : items.length === 0 ? (
          <Box textAlign="center" sx={{ py: 10 }}>
            <Typography variant="h6" sx={{ opacity: 0.5 }}>క్షమించండి! ఏమీ దొరకలేదు.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
            {items.map((a) => (
              <Box
                key={a.id}
                onClick={() => handleCardClick(a)}
                sx={{ cursor: "pointer", flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)" }, maxWidth: { xs: "100%", sm: "440px" } }}
              >
                <AksharaPosterCard akshara={a} enableRead={true} voiceGender={voiceGender} />
              </Box>
            ))}
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

        {similarLoading && (
          <Box textAlign="center" sx={{ py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {similar && !similarLoading && (
          <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              &quot;{similar.clicked.letter}&quot; కి సంబంధించినవి
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {similar.same_type.map((s) => (
                <Chip key={s.id} label={`${s.letter} — ${s.word || ""}`} />
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
    </Container>
  );
}