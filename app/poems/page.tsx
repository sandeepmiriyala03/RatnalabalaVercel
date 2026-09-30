"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Typography,
  Button,
  Stack,
  Tabs,
  Tab,
  Collapse,
  Skeleton,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

import PoemCard from "@/app/components/PoemCard";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";
import type { GridTheme } from "@yuktishaalaa/yuktai";

// YuktAI Grid — loaded only when the "పట్టిక" tab is opened
const YuktaiGridView = dynamic(() => import("@/app/components/YuktaiGridView"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  ),
});

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Tool = "radio" | "downloads";
type ViewTab = "cards" | "grid";

const ITEMS_PER_PAGE = 3;
const TAB_BAR_HEIGHT = 52; // px — the grid header sticks right below the tabs

const POETRY_NAME = "రత్నాలబాల — పద్యాలవాల — భావాలమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";
const POET_ID = 1;

const HELP_SEEN_KEY = "ratnalabala:help-seen";
const GRID_THEME_KEY = "ratnalabala:grid-theme";
const GRID_THEMES: GridTheme[] = ["default", "dark", "high-contrast", "color-blind", "dyslexia"];

/* ------------------------------------------------------------------ */
/* HOW TO USE — short, simple Telugu                                   */
/* ------------------------------------------------------------------ */

const HELP_STEPS: { icon: React.ReactNode; text: string }[] = [
  {
    icon: <MenuBookRoundedIcon />,
    text: "“పద్యాలు” ట్యాబ్‌లో ఒక్కో పద్యం పూర్తిగా కనిపిస్తుంది. “ముందుకు”, “వెనుకకు” నొక్కి ఇతర పద్యాలు చూడండి.",
  },
  {
    icon: <VolumeUpRoundedIcon />,
    text: "పద్యం వినాలంటే “వినండి” బటన్ నొక్కండి. ఆపాలంటే “ఆపండి” నొక్కండి.",
  },
  {
    icon: <QuestionAnswerRoundedIcon />,
    text: "పద్యం అర్థం తెలుసుకోవాలంటే “భావాలమాల” నొక్కి, ➤ గుర్తు నొక్కండి. అర్థాన్ని కూడా వినవచ్చు.",
  },
  {
    icon: <WhatsAppIcon />,
    text: "ఆ అర్థాన్ని మిత్రులకు పంపాలంటే “వాట్సాప్” బటన్ నొక్కండి.",
  },
  {
    icon: <TableRowsRoundedIcon />,
    text: "అన్ని పద్యాలు ఒకేచోట చూడాలంటే “పట్టిక” ట్యాబ్ నొక్కండి. పద్యం పేరు నొక్కితే ఆ పద్యం పూర్తిగా తెరుచుకుంటుంది.",
  },
  {
    icon: <SearchRoundedIcon />,
    text: "పట్టికలోని శోధన గడిలో పద్యం పేరు లేదా పద్యంలోని పదం రాసి వెతకండి.",
  },
  {
    icon: <SmartToyRoundedIcon />,
    text: "పట్టికలోని AI సహాయకుడిని తెలుగులో అడగండి: “గర్వం తెరువు”, “మకుటం ఏమిటి”, “ఈరోజు పద్యం”.",
  },
  {
    icon: <HeadphonesRoundedIcon />,
    text: "పద్యాలన్నీ వరుసగా వినాలంటే “రేడియో” బటన్ నొక్కండి.",
  },
];

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function readStoredTheme(): GridTheme {
  try {
    const saved = window.localStorage.getItem(GRID_THEME_KEY) as GridTheme | null;
    return saved && GRID_THEMES.includes(saved) ? saved : "default";
  } catch {
    return "default";
  }
}

/** Keeps ?view=grid in the address bar (shareable) without a page reload. */
function writeViewToUrl(tab: ViewTab) {
  try {
    const url = new URL(window.location.href);
    if (tab === "grid") url.searchParams.set("view", "grid");
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", url);
  } catch {
    /* ignore */
  }
}

export default function PoemList() {
  const theme = useTheme();

  const [poems, setPoems] = useState<Poem[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  // "వినండి" uses the server voice first; the browser voice is only a fallback,
  // so the button never waits for browser voices.
  const [ready] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  // Poem cards open first; the grid only when the person chooses it
  const [tab, setTab] = useState<ViewTab>("cards");

  // Grid theme is owned by the page (the grid stays reusable) and remembered
  const [gridTheme, setGridTheme] = useState<GridTheme>("default");

  // Poems to glow in the table — for RAG "search by meaning" later
  const [highlightIds] = useState<string[]>([]);

  // After opening a poem from the grid: scroll to it and flash it briefly
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const [flashSlug, setFlashSlug] = useState<string | null>(null);

  const [openTool, setOpenTool] = useState<Tool | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  /* First-visit help, remembered tab (?view=grid) and theme */
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(HELP_SEEN_KEY)) {
        setHelpOpen(true);
        window.localStorage.setItem(HELP_SEEN_KEY, "1");
      }
    } catch {
      /* storage blocked */
    }
    if (new URL(window.location.href).searchParams.get("view") === "grid") setTab("grid");
    setGridTheme(readStoredTheme());
  }, []);

  const changeGridTheme = (next: GridTheme) => {
    setGridTheme(next);
    try {
      window.localStorage.setItem(GRID_THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  /* LOAD POEMS — the page owns data loading; the grid only receives poems */
  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/getpoems?poet_id=${POET_ID}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load poems");
      const data: Record<string, string> = await response.json();
      setPoems(
        Object.entries(data).map(([title, content]) => ({ title, content, slug: `db-${title}` }))
      );
    } catch (err) {
      console.error("Error loading poems:", err);
      setError("పద్యాలను లోడ్ చేయడంలో లోపం సంభవించింది.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPoems();
  }, [loadPoems]);

  /* SPEECH (browser-voice fallback used by the poem cards) */
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeech = () => window.speechSynthesis?.cancel();

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    stopSpeech();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "te-IN";
    u.rate = 0.8;
    const voice = voices.find((v) => v.lang === "te-IN" || v.lang === "te");
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };

  /* PAGING (cards tab) */
  const totalPages = Math.max(1, Math.ceil(poems.length / ITEMS_PER_PAGE));
  const current = poems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const changeTab = (next: ViewTab) => {
    stopSpeech();
    setTab(next);
    writeViewToUrl(next);
  };

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    stopSpeech();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Grid row / assistant / AI agent opened a poem → show its full card */
  const openPoemFromGrid = (title: string) => {
    const index = poems.findIndex((poem) => poem.title === title);
    if (index < 0) return;
    setPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
    setFocusSlug(poems[index].slug ?? poems[index].title);
    changeTab("cards");
  };

  // Scroll to the opened poem once its card is on screen, then flash it
  useEffect(() => {
    if (tab !== "cards" || !focusSlug) return;
    const frame = window.requestAnimationFrame(() => {
      const safe =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(focusSlug)
          : focusSlug.replace(/["\\]/g, "\\$&");
      const el = document.querySelector(`[data-poem-slug="${safe}"]`);
      if (el) {
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        setFlashSlug(focusSlug);
        window.setTimeout(() => setFlashSlug(null), 1800);
      }
      setFocusSlug(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tab, focusSlug, page]);

  const hasPoems = !loading && !error && poems.length > 0;
  const isEmpty = !loading && !error && poems.length === 0;

  /* STYLES */
  const toolButtonSx = (open: boolean) => ({
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: "10px",
    textTransform: "none" as const,
    fontWeight: 700,
    fontSize: { xs: "0.92rem", sm: "0.95rem" },
    color: "secondary.main",
    borderColor: alpha(theme.palette.secondary.main, open ? 0.8 : 0.45),
    background: alpha(theme.palette.secondary.main, open ? 0.1 : 0.04),
    boxShadow: open ? `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.12)}` : "none",
    "&:hover": { borderColor: "secondary.main", background: alpha(theme.palette.secondary.main, 0.09) },
    "&:focus-visible": { outline: `2px solid ${theme.palette.secondary.main}`, outlineOffset: 2 },
  });

  const pagerButtonSx = {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    borderRadius: "14px",
    textTransform: "none" as const,
    fontWeight: 700,
    fontSize: { xs: "1.02rem", sm: "1.1rem" },
    "&:focus-visible": { outline: `3px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
  };

  const toggleTool = (tool: Tool) => setOpenTool((cur) => (cur === tool ? null : tool));

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, pb: { xs: 4, sm: 6 }, pt: { xs: 2, sm: 4 }, maxWidth: 1000, mx: "auto" }}>
      {/* TITLE */}
      <Box sx={{ textAlign: "center", mb: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            fontSize: { xs: "2.1rem", sm: "3rem" },
            background: "linear-gradient(90deg,#0f172a,#2563eb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          రత్నాలబాల
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {loading ? "పద్యాలు లోడ్ అవుతున్నాయి…" : <>మొత్తం పద్యాలు: <strong>{poems.length}</strong></>}
        </Typography>
      </Box>

      {/* HOW TO USE */}
      <Button
        fullWidth
        onClick={() => setHelpOpen((v) => !v)}
        aria-expanded={helpOpen}
        aria-controls="poem-help"
        startIcon={<HelpOutlineRoundedIcon />}
        endIcon={helpOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        sx={{
          justifyContent: "space-between",
          minHeight: 52,
          mb: 1.5,
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: "1.02rem",
          color: "primary.main",
          background: alpha(theme.palette.primary.main, 0.06),
          "&:hover": { background: alpha(theme.palette.primary.main, 0.1) },
        }}
      >
        <Box component="span" sx={{ flex: 1, textAlign: "left", ml: 1 }}>
          ఈ పేజీ ఎలా వాడాలి?
        </Box>
      </Button>

      <Collapse in={helpOpen} timeout={300}>
        <Box
          id="poem-help"
          sx={{
            mb: 2,
            p: { xs: 1.75, sm: 2.5 },
            borderRadius: "14px",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            background: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Stack spacing={2}>
            {HELP_STEPS.map((step, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  aria-hidden
                  sx={{
                    flex: "0 0 auto",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.main",
                    background: alpha(theme.palette.primary.main, 0.12),
                  }}
                >
                  {step.icon}
                </Box>
                <Typography sx={{ fontSize: "1.02rem", lineHeight: 1.8, pt: 0.25 }}>{step.text}</Typography>
              </Stack>
            ))}
          </Stack>
          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => setHelpOpen(false)}
            sx={{ mt: 2.5, minHeight: 52, borderRadius: "12px", textTransform: "none", fontWeight: 700, fontSize: "1.05rem" }}
          >
            అర్థమైంది
          </Button>
        </Box>
      </Collapse>

      {/* TOOLS — radio + download-all, closed by default */}
      {hasPoems && (
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => toggleTool("radio")}
              aria-expanded={openTool === "radio"}
              aria-controls="poem-tool-radio"
              startIcon={<HeadphonesRoundedIcon fontSize="small" />}
              endIcon={openTool === "radio" ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              sx={toolButtonSx(openTool === "radio")}
            >
              రేడియో
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => toggleTool("downloads")}
              aria-expanded={openTool === "downloads"}
              aria-controls="poem-tool-downloads"
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              endIcon={openTool === "downloads" ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              sx={toolButtonSx(openTool === "downloads")}
            >
              అన్నీ డౌన్‌లోడ్
            </Button>
          </Stack>

          {/* Radio stays mounted (collapsed) so it keeps playing when closed */}
          <Collapse in={openTool === "radio"} timeout={300}>
            <Box id="poem-tool-radio" sx={{ pt: 1.5 }}>
              <PoemRadio poems={poems} />
            </Box>
          </Collapse>

          <Collapse in={openTool === "downloads"} timeout={300}>
            <Stack id="poem-tool-downloads" spacing={1.5} sx={{ pt: 1.5 }}>
              <DownloadAllPosters poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
              <DownloadAllVideos poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
              <DownloadAllVoices poems={poems} />
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* TABS — sticky on every screen, so switching is always one tap away */}
      <Box
        sx={{
          position: "sticky",
          top: "var(--app-header-height, 0px)",
          zIndex: 5,
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
          bgcolor: "background.default",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
          backdropFilter: "saturate(180%) blur(6px)",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, next: ViewTab) => changeTab(next)}
          variant="fullWidth"
          aria-label="పద్యాలు చూపే విధానం"
          sx={{
            minHeight: TAB_BAR_HEIGHT,
            "& .MuiTab-root": { minHeight: TAB_BAR_HEIGHT, textTransform: "none", fontWeight: 800, fontSize: "1rem" },
          }}
        >
          <Tab
            value="cards"
            id="poem-tab-cards"
            aria-controls="poem-panel-cards"
            icon={<MenuBookRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="పద్యాలు"
          />
          <Tab
            value="grid"
            id="poem-tab-grid"
            aria-controls="poem-panel-grid"
            icon={<TableRowsRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="పట్టిక"
          />
        </Tabs>
      </Box>

      {/* CONTENT */}
      <Box sx={{ mt: 2.5 }}>
        {loading && (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} role="status" aria-live="polite" sx={{ py: 1 }}>
              <CircularProgress size={24} />
              <Typography sx={{ fontWeight: 600 }}>పద్యాలు లోడ్ అవుతున్నాయి… కొంచెం ఆగండి</Typography>
            </Stack>
            {[0, 1].map((i) => (
              <Skeleton key={i} variant="rounded" height={420} sx={{ borderRadius: "16px" }} />
            ))}
          </Stack>
        )}

        {error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadPoems}>
                మళ్ళీ ప్రయత్నించండి
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {isEmpty && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary">ఇంకా పద్యాలు లేవు.</Typography>
          </Box>
        )}

        {/* TAB 1 — "పద్యాలు": full poem cards (default) */}
        {hasPoems && tab === "cards" && (
          <Box role="tabpanel" id="poem-panel-cards" aria-labelledby="poem-tab-cards">
            {current.map((poem) => {
              const slug = poem.slug ?? poem.title;
              return (
                <Box
                  key={slug}
                  data-poem-slug={slug}
                  sx={{
                    // leave room for the sticky tab bar when scrolled into view
                    scrollMarginTop: `calc(var(--app-header-height, 0px) + ${TAB_BAR_HEIGHT + 12}px)`,
                    borderRadius: "18px",
                    outline: flashSlug === slug ? `3px solid ${theme.palette.secondary.main}` : "3px solid transparent",
                    outlineOffset: 4,
                    transition: "outline-color 0.4s ease",
                  }}
                >
                  <PoemCard
                    poem={poem}
                    ready={ready}
                    speak={speak}
                    stopSpeech={stopSpeech}
                    authors={AUTHORS}
                    poetryName={POETRY_NAME}
                  />
                </Box>
              );
            })}

            {totalPages > 1 && (
              <Stack direction="row" alignItems="center" spacing={1.5} component="nav" aria-label="పేజీలు" sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => goToPage(page - 1)} disabled={page <= 1} startIcon={<ArrowBackRoundedIcon />} sx={pagerButtonSx}>
                  వెనుకకు
                </Button>
                <Typography
                  role="status"
                  aria-live="polite"
                  sx={{ flex: "0 0 auto", minWidth: 92, textAlign: "center", fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem" }, lineHeight: 1.4 }}
                >
                  పేజీ {page} / {totalPages}
                </Typography>
                <Button variant="contained" disableElevation onClick={() => goToPage(page + 1)} disabled={page >= totalPages} endIcon={<ArrowForwardRoundedIcon />} sx={pagerButtonSx}>
                  ముందుకు
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {/* TAB 2 — "పట్టిక": YuktAI Grid with the assistant + WebMCP */}
        {hasPoems && tab === "grid" && (
          <Box role="tabpanel" id="poem-panel-grid" aria-labelledby="poem-tab-grid">
            <YuktaiGridView
              poems={poems}
              highlightIds={highlightIds}
              loading={loading}
              onOpenPoem={openPoemFromGrid}
              theme={gridTheme}
              onThemeChange={changeGridTheme}
              stickyOffset={TAB_BAR_HEIGHT}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}