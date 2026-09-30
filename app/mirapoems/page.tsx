"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  Stack,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Skeleton,
  Alert,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import SearchRoundedIcon     from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon      from "@mui/icons-material/ClearRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import DownloadRoundedIcon   from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

import type { GridTheme, YuktaiGridRule } from "@yuktishaalaa/yuktai";

const YuktaiGridView = dynamic(
  () => import("@/app/components/YuktaiGridView"),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <Skeleton variant="rounded" width="100%" height={420} />
      </Box>
    ),
  }
);

import PoemCard from "@/app/components/PoemCard";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";

interface Poem {
  poem_id?: number;
  title: string;
  content: string;
  special_line?: string | null;
  poet_id?: number;
  poet_name?: string;
  slug?: string;
}

type Tool = "radio" | "downloads";

const ITEMS_PER_PAGE = 3;

/* 🔖 SINGLE SOURCE OF TRUTH */
const POETRY_NAME = " మిరా పద్యాలు";
const AUTHORS: string | string[] = "డాక్టర్ మిరియాల రామకృష్ణ";

const poemRules: YuktaiGridRule<Poem>[] = [
  {
    name: "help",
    description: "Explain how to use the poem grid.",
    matches: (input) =>
      /help|how to|సహాయం|ఎలా ఉపయోగించ|ఎలా వాడాలి/i.test(input),
    execute: async () =>
      "పద్యం పేరు లేదా పద్యంలో ఉన్న పదంతో వెతకండి. తెలుగులో ప్రశ్న అడగండి. ఒక పద్యాన్ని తెరవడానికి పద్యం పేరు చెప్పవచ్చు.",
  },
  {
    name: "count-poems",
    description: "Count the available poems.",
    matches: (input) =>
      /how many|count|ఎన్ని|మొత్తం.*పద్య/i.test(input),
    execute: async ({ data }) => `మొత్తం ${data.length} పద్యాలు ఉన్నాయి.`,
  },
  {
    name: "list-titles",
    description: "List poem titles.",
    matches: (input) =>
      /list.*poem|titles|పద్యాల పేర్లు|పద్యాలు చెప్పు/i.test(input),
    execute: async ({ data }) =>
      data.length
        ? data.map((poem, index) => `${index + 1}. ${poem.title}`).join("\n")
        : "పద్యాలు లేవు.",
  },
];

export default function PoemList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [poems, setPoems] = useState<Poem[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

  // Card view / YuktAI Grid view.
  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [gridTheme, setGridTheme] = useState<GridTheme>("default");
  const [highlightIds, setHighlightIds] = useState<string[]>([]);

  // Which of the two tool panels (radio / bulk downloads) is open. Only one at
  // a time, and both start closed so the page opens on search + poems.
  const [openTool, setOpenTool] = useState<Tool | null>(null);

  /* LOAD POEMS — PostgreSQL (poet_id = 2 · డాక్టర్ మిరియాల రామకృష్ణ) */

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/getpoems?poet_id=2");

      if (!response.ok) {
        throw new Error("Failed to load database poems");
      }

      const data = await response.json();

      let loadedPoems: Poem[] = [];

      // Current PostgreSQL API shape: array of poem records.
      if (Array.isArray(data)) {
        loadedPoems = data.map((poem) => ({
          poem_id: poem.poem_id,
          title: String(poem.title ?? ""),
          content: String(poem.content ?? ""),
          special_line: poem.special_line ?? "",
          poet_id: poem.poet_id,
          poet_name: poem.poet_name,
          slug: `db-${poem.poem_id ?? poem.title}`,
        }));
      } else if (data && typeof data === "object") {
        // Backward compatibility with the older title -> content response.
        loadedPoems = Object.entries(data)
          .filter(([key]) => key !== "error")
          .map(([title, content]) => ({
            title,
            content: String(content),
            special_line: "",
            slug: `db-${title}`,
          }));
      }

      if (!loadedPoems.length) {
        throw new Error("No poems returned from API");
      }

      setPoems(loadedPoems);
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

  const rangeStart = filtered.length ? (page - 1) * itemsPerPage + 1 : 0;
  const rangeEnd = Math.min(page * itemsPerPage, filtered.length);

  useEffect(() => {
    setPage(1);
    stopSpeech();
  }, [search, viewAll, viewMode]);

  // If the list shrinks below the current page, step back to the last page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  const toggleTool = (tool: Tool) =>
    setOpenTool((current) => (current === tool ? null : tool));

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 900,
        mx: "auto",
        fontFamily: "var(--telugu-font-family)",
        fontSize: "var(--telugu-font-size)",
        lineHeight: 1.8,
      }}
    >
      {/* TITLE */}

      <Box sx={{ textAlign: "center", mb: { xs: 2.5, sm: 3 } }}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            letterSpacing: "-0.5px",
            background: "linear-gradient(90deg,#0f172a,#2563eb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          మిరా పద్యాలు
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {loading ? (
            "పద్యాలు లోడ్ అవుతున్నాయి…"
          ) : (
            <>
              మొత్తం పద్యాల సంఖ్య: <strong>{poems.length}</strong>
            </>
          )}
        </Typography>
      </Box>

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
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ mt: 1.5 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          role="status"
          aria-live="polite"
        >
          {query && !loading && !error
            ? `${filtered.length} / ${poems.length} పద్యాలు`
            : `${poems.length} పద్యాలు`}
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          disabled={filtered.length === 0}
          onChange={(_, value) => {
            if (value) setViewMode(value);
          }}
          aria-label="చూపే విధానం"
        >
          <ToggleButton value="cards" sx={{ textTransform: "none", px: 1.75 }}>
            పద్యాలు
          </ToggleButton>
          <ToggleButton value="grid" sx={{ textTransform: "none", px: 1.75 }}>
            పట్టిక
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
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* POEMS / YUKTAI GRID */}

      {viewMode === "grid" ? (
        <Box sx={{ mt: 3 }}>
          <YuktaiGridView
            poems={filtered}
            highlightIds={highlightIds}
            loading={loading}
            onOpenPoem={(title: string) => {
              const poem = poems.find((item) => item.title === title);
              if (poem) {
                setSearch(poem.title);
                setViewMode("cards");
              }
            }}
            customRules={poemRules}
            theme={gridTheme}
            onThemeChange={setGridTheme}
          />
        </Box>
      ) : (
        <Box sx={{ mt: 3 }}>
          {loading && (
          <Stack spacing={2}>
            {[0, 1, 2].map((i) => (
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
      )}

      {/* PAGINATION */}

      {viewMode === "cards" && hasPoems && !viewAll && filtered.length > ITEMS_PER_PAGE && (
        <Stack alignItems="center" spacing={1} sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            siblingCount={isMobile ? 0 : 1}
            color="primary"
            showFirstButton
            showLastButton
            onChange={(_, val) => {
              setPage(val);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          />

          <Typography variant="caption" color="text.secondary">
            పద్యాలు {rangeStart}–{rangeEnd} / {filtered.length}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}