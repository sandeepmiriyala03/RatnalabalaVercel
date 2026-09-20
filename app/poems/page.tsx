"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Skeleton,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";

import SearchRoundedIcon         from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon          from "@mui/icons-material/ClearRounded";
import HeadphonesRoundedIcon     from "@mui/icons-material/HeadphonesRounded";
import DownloadRoundedIcon       from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon     from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon     from "@mui/icons-material/ExpandLessRounded";
import ArrowBackRoundedIcon      from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon   from "@mui/icons-material/ArrowForwardRounded";
import HelpOutlineRoundedIcon    from "@mui/icons-material/HelpOutlineRounded";
import VolumeUpRoundedIcon       from "@mui/icons-material/VolumeUpRounded";
import QuestionAnswerRoundedIcon from "@mui/icons-material/QuestionAnswerRounded";
import WhatsAppIcon              from "@mui/icons-material/WhatsApp";

import PoemCard from "@/app/components/PoemCard";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";
import WebMCP from "@/app/components/WebMCP";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Tool = "radio" | "downloads";

const ITEMS_PER_PAGE = 3;

const POETRY_NAME = "రత్నాలబాల — పద్యాలవాల — భావాలమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";

/* ------------------------------------------------------------------ */
/* POEMS CACHE — the API is hit ONCE, then the poems are kept          */
/* ------------------------------------------------------------------ */
//
// 1. First visit          → one request to /api/getpoems, saved in the browser.
// 2. Next page / reload    → poems come from the saved copy. NO server call.
// 3. After CACHE_TTL_MS    → the next visit fetches fresh poems once, again.
// 4. Server / internet down → an older saved copy is shown instead of an error.
//
// Change CACHE_TTL_MS to keep poems longer or shorter (poems rarely change).
// Bump CACHE_VERSION if the shape of the API response ever changes.

const POET_ID = 1;
const CACHE_VERSION = "v1";
const CACHE_KEY = `ratnalabala:poems:${CACHE_VERSION}:poet-${POET_ID}`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type PoemMap = Record<string, string>;
type CacheEntry = { savedAt: number; data: PoemMap };

// Survives page-to-page navigation inside the same tab (no storage read needed).
let memoryCache: CacheEntry | null = null;
// If two components ask at the same moment (or React dev mode mounts twice),
// they share ONE request instead of sending two.
let inflight: Promise<PoemMap> | null = null;

function readStored(): CacheEntry | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.savedAt === "number" &&
      parsed.data &&
      typeof parsed.data === "object"
    ) {
      return parsed as CacheEntry;
    }
  } catch {
    // corrupted value or storage blocked — behave as "nothing saved"
  }
  return null;
}

function writeStored(entry: CacheEntry) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // storage full / blocked (private mode) — memory cache still works
  }
}

function isFresh(entry: CacheEntry | null): entry is CacheEntry {
  return !!entry && Date.now() - entry.savedAt < CACHE_TTL_MS;
}

async function getPoems(forceRefresh = false): Promise<PoemMap> {
  if (!forceRefresh) {
    if (isFresh(memoryCache)) return memoryCache.data;

    const stored = readStored();
    if (isFresh(stored)) {
      memoryCache = stored;
      return stored.data;
    }
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const response = await fetch(`/api/getpoems?poet_id=${POET_ID}`);

      if (!response.ok) {
        throw new Error("Failed to load database poems");
      }

      const data: PoemMap = await response.json();

      // Never cache an empty answer — it would hide poems added a minute later.
      if (data && Object.keys(data).length > 0) {
        const entry = { savedAt: Date.now(), data };
        memoryCache = entry;
        writeStored(entry);
      }

      return data;
    } catch (err) {
      // Server or internet problem: an old saved copy beats an error message.
      const stale = memoryCache ?? readStored();
      if (stale) return stale.data;
      throw err;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/* ------------------------------------------------------------------ */
/* HOW TO USE — short, simple Telugu                                   */
/* ------------------------------------------------------------------ */

const HELP_SEEN_KEY = "ratnalabala:help-seen";

const HELP_STEPS: { icon: React.ReactNode; text: string }[] = [
  {
    icon: <SearchRoundedIcon />,
    text: "పద్యం వెతకాలంటే, పైన ఉన్న గడిలో పద్యం పేరు రాయండి.",
  },
  {
    icon: <VolumeUpRoundedIcon />,
    text: "పద్యం వినాలంటే “వినండి” బటన్ నొక్కండి. ఆపాలంటే “ఆపండి” నొక్కండి.",
  },
  {
    icon: <QuestionAnswerRoundedIcon />,
    text: "పద్యం అర్థం తెలుసుకోవాలంటే “భావాలమాల” బటన్ నొక్కండి. తరువాత ➤ గుర్తు నొక్కండి. అర్థం కింద కనిపిస్తుంది. దాన్ని కూడా వినవచ్చు.",
  },
  {
    icon: <WhatsAppIcon />,
    text: "ఆ అర్థాన్ని మిత్రులకు పంపాలంటే “వాట్సాప్” బటన్ నొక్కండి.",
  },
  {
    icon: <ArrowForwardRoundedIcon />,
    text: "ఇంకా పద్యాలు చూడాలంటే కింద “ముందుకు” నొక్కండి. వెనక్కి వెళ్ళాలంటే “వెనుకకు” నొక్కండి.",
  },
  {
    icon: <HeadphonesRoundedIcon />,
    text: "పద్యాలన్నీ వరుసగా వినాలంటే “రేడియో” బటన్ నొక్కండి.",
  },
];

export default function PoemList() {
  const theme = useTheme();

  const [poems, setPoems] = useState<Poem[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

  // Which of the two tool panels (radio / bulk downloads) is open. Only one at
  // a time, and both start closed so the page opens on search + poems.
  const [openTool, setOpenTool] = useState<Tool | null>(null);

  // "ఈ పేజీ ఎలా వాడాలి?" — opens by itself on the very first visit only.
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(HELP_SEEN_KEY)) {
        setHelpOpen(true);
        window.localStorage.setItem(HELP_SEEN_KEY, "1");
      }
    } catch {
      // storage blocked — help simply stays closed until the person opens it
    }
  }, []);

  /* LOAD POEMS — PostgreSQL (poet_id = 1) through the cache above */

  const loadPoems = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPoems(forceRefresh);

      setPoems(
        Object.entries(data).map(([title, content]) => ({
          title,
          content,
          slug: `db-${title}`,
        }))
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
    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();

        if (v.length) {
          setVoices(v);
          setReady(true);
        }
      };

      loadVoices();

      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => window.speechSynthesis?.cancel();
  }, []);

  const stopSpeech = () => window.speechSynthesis?.cancel();

  const speak = (text: string) => {
    stopSpeech();

    const u = new SpeechSynthesisUtterance(text);

    u.lang = "te-IN";
    u.rate = 0.8;

    const voice = voices.find((v) => v.lang === "te-IN" || v.lang === "te");

    if (voice) u.voice = voice;

    window.speechSynthesis.speak(u);
  };

  /* FILTER + PAGING */

  const query = search.trim();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return poems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
    );
  }, [poems, query]);

  const itemsPerPage = viewAll ? Math.max(filtered.length, 1) : ITEMS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const current = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1);
    stopSpeech();
  }, [search, viewAll]);

  // If the list shrinks below the current page, step back to the last page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    stopSpeech();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const hasPoems = !loading && !error && filtered.length > 0;
  const isEmpty = !loading && !error && filtered.length === 0;

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
    boxShadow: open
      ? `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.12)}`
      : "none",
    "&:hover": {
      borderColor: "secondary.main",
      background: alpha(theme.palette.secondary.main, 0.09),
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.secondary.main}`,
      outlineOffset: 2,
    },
  });

  const pagerButtonSx = {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    borderRadius: "14px",
    textTransform: "none" as const,
    fontWeight: 700,
    fontSize: { xs: "1.02rem", sm: "1.1rem" },
    "&:focus-visible": {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  };

  const toggleTool = (tool: Tool) => {
    setOpenTool((current) => (current === tool ? null : tool));
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 900,
        mx: "auto",
      }}
    >
      {/* TITLE */}

      <Box sx={{ textAlign: "center", mb: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            background: "linear-gradient(90deg,#0f172a,#2563eb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          రత్నాలబాల
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {loading ? (
            "పద్యాలు లోడ్ అవుతున్నాయి…"
          ) : (
            <>
              మొత్తం పద్యాలు: <strong>{poems.length}</strong>
            </>
          )}
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
                <Typography sx={{ fontSize: "1.02rem", lineHeight: 1.8, pt: 0.25 }}>
                  {step.text}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Button
            fullWidth
            variant="contained"
            disableElevation
            onClick={() => setHelpOpen(false)}
            sx={{
              mt: 2.5,
              minHeight: 52,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1.05rem",
            }}
          >
            అర్థమైంది
          </Button>
        </Box>
      </Collapse>

      {/* SEARCH + VIEW MODE */}

      <TextField
        fullWidth
        placeholder="పద్యం కోసం వెతకండి..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        inputProps={{ "aria-label": "పద్యం కోసం వెతకండి" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                size="small"
                aria-label="క్లియర్"
                onClick={() => setSearch("")}
              >
                <ClearRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { borderRadius: "12px" },
        }}
      />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 1.5, minHeight: 36 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          role="status"
          aria-live="polite"
        >
          {query && !loading && !error
            ? `${filtered.length} / ${poems.length} పద్యాలు`
            : ""}
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewAll ? "all" : "pages"}
          onChange={(_, value) => {
            if (value) setViewAll(value === "all");
          }}
          aria-label="చూపే విధానం"
        >
          <ToggleButton value="pages" sx={{ textTransform: "none", px: 1.75 }}>
            పేజీలు
          </ToggleButton>
          <ToggleButton value="all" sx={{ textTransform: "none", px: 1.75 }}>
            అన్ని
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* TOOLS — radio + download-all, closed by default */}

      {hasPoems && (
        <Box sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => toggleTool("radio")}
              aria-expanded={openTool === "radio"}
              aria-controls="poem-tool-radio"
              startIcon={<HeadphonesRoundedIcon fontSize="small" />}
              endIcon={
                openTool === "radio" ? (
                  <ExpandLessRoundedIcon fontSize="small" />
                ) : (
                  <ExpandMoreRoundedIcon fontSize="small" />
                )
              }
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
              endIcon={
                openTool === "downloads" ? (
                  <ExpandLessRoundedIcon fontSize="small" />
                ) : (
                  <ExpandMoreRoundedIcon fontSize="small" />
                )
              }
              sx={toolButtonSx(openTool === "downloads")}
            >
              అన్నీ డౌన్‌లోడ్
            </Button>

          </Stack>

          {/* Reusable WebMCP component */}
          <WebMCP />

          {/* Radio plays through whatever is currently filtered. Kept mounted
              (just collapsed) so it keeps playing if the panel is closed. */}
          <Collapse in={openTool === "radio"} timeout={300}>
            <Box id="poem-tool-radio" sx={{ pt: 1.5 }}>
              <PoemRadio poems={filtered} />
            </Box>
          </Collapse>

          {/* Bulk downloads for every currently-filtered poem. */}
          <Collapse in={openTool === "downloads"} timeout={300}>
            <Stack id="poem-tool-downloads" spacing={1.5} sx={{ pt: 1.5 }}>
              <DownloadAllPosters
                poems={filtered}
                authors={AUTHORS}
                poetryName={POETRY_NAME}
              />

              <DownloadAllVideos
                poems={filtered}
                authors={AUTHORS}
                poetryName={POETRY_NAME}
              />

              <DownloadAllVoices poems={filtered} />
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* POEMS */}

      <Box sx={{ mt: 3 }}>
        {loading && (
          <Stack spacing={2}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              role="status"
              aria-live="polite"
              sx={{ py: 1 }}
            >
              <CircularProgress size={24} />
              <Typography sx={{ fontWeight: 600 }}>
                పద్యాలు లోడ్ అవుతున్నాయి… కొంచెం ఆగండి
              </Typography>
            </Stack>

            {[0, 1].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={420}
                sx={{ borderRadius: "16px" }}
              />
            ))}
          </Stack>
        )}

        {error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => loadPoems(true)}
              >
                మళ్ళీ ప్రయత్నించండి
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {isEmpty && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {query
                ? `“${query}” కోసం పద్యాలు కనబడలేదు.`
                : "ఇంకా పద్యాలు లేవు."}
            </Typography>

            {query && (
              <Button
                variant="outlined"
                startIcon={<ClearRoundedIcon />}
                onClick={() => setSearch("")}
              >
                క్లియర్
              </Button>
            )}
          </Box>
        )}

        {hasPoems &&
          current.map((poem) => (
            <PoemCard
              key={poem.slug}
              poem={poem}
              ready={ready}
              speak={speak}
              stopSpeech={stopSpeech}
              authors={AUTHORS}
              poetryName={POETRY_NAME}
            />
          ))}
      </Box>

      {/* PAGES — two big buttons and "పేజీ 2 / 12" in the middle */}

      {hasPoems && !viewAll && totalPages > 1 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          component="nav"
          aria-label="పేజీలు"
          sx={{ mt: 3 }}
        >
          <Button
            variant="outlined"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            startIcon={<ArrowBackRoundedIcon />}
            sx={pagerButtonSx}
          >
            వెనుకకు
          </Button>

          <Typography
            role="status"
            aria-live="polite"
            sx={{
              flex: "0 0 auto",
              minWidth: 92,
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "1rem", sm: "1.1rem" },
              lineHeight: 1.4,
            }}
          >
            పేజీ {page} / {totalPages}
          </Typography>

          <Button
            variant="contained"
            disableElevation
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={pagerButtonSx}
          >
            ముందుకు
          </Button>
        </Stack>
      )}
    </Box>
  );
}