"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "@yuktishaalaa/yuktai";
import type { GridTheme } from "@yuktishaalaa/yuktai";

import PoemCard from "@/app/components/PoemCard";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";
import { authorsToText, type Poem } from "@/types/poetry";

const YuktaiGridView = dynamic(() => import("@/app/components/YuktaiGridView"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
      <Skeleton variant="rounded" width="100%" height={420} />
    </Box>
  ),
});

/* ================================================================== */
/* TYPES + CONSTANTS                                                  */
/* ================================================================== */

type Tool = "radio" | "downloads";
type ViewMode = "cards" | "grid";

type Props = {
  /** PostgreSQL poets.poet_id → /api/getpoems?poet_id=... */
  poetId: number;
  /** శతకం / సంకలనం పేరు — posters, videos, PDF, Excel */
  poetryName: string;
  authors: string | string[];
  /** AI tool prefix, unique per collection: "mira_poems", "shatakam_4" */
  toolName: string;
  /** Big page heading; leave empty when the page already has its own */
  heading?: string;
  /** Live poem count from the database (for the parent page's chips) */
  onCountChange?: (count: number) => void;
};

const ITEMS_PER_PAGE = 3;

/* ================================================================== */
/* DATA — every API shape becomes one Poem shape                      */
/* ================================================================== */

type RawPoem = Record<string, unknown>;

function normalizePoems(data: unknown): Poem[] {
  // PostgreSQL: [ {poem_id, title, content, special_line, ...} ]
  // File API:   { poems: [ {title, text, filename} ] }
  const list: RawPoem[] | null = Array.isArray(data)
    ? (data as RawPoem[])
    : data && typeof data === "object" && Array.isArray((data as { poems?: unknown }).poems)
      ? ((data as { poems: RawPoem[] }).poems)
      : null;

  if (list) {
    const poems = list.map((p, i): Poem => {
      const poemId = typeof p.poem_id === "number" ? p.poem_id : undefined;
      return {
        poem_id: poemId,
        title: String(p.title ?? ""),
        content: String(p.content ?? p.text ?? ""),
        special_line: (p.special_line as string | null | undefined) ?? "",
        poet_id: typeof p.poet_id === "number" ? p.poet_id : undefined,
        poet_name: p.poet_name ? String(p.poet_name) : undefined,
        slug: `db-${poemId ?? i}`,
      };
    });
    // Insert order = poem order (1, 2, 3 …), so poem_id keeps the right sequence
    return poems.every((p) => p.poem_id !== undefined)
      ? poems.sort((a, b) => a.poem_id! - b.poem_id!)
      : poems;
  }

  // Older shape: { "title": "content", ... }
  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .filter(([key]) => key !== "error")
      .map(([title, content], i) => ({ title, content: String(content), special_line: "", slug: `db-${i}` }));
  }
  return [];
}

/* ================================================================== */
/* COMPONENT                                                          */
/* ================================================================== */

export default function PoemBrowser({ poetId, poetryName, authors, toolName, heading, onCountChange }: Props) {
  const theme = useTheme();
  const authorsText = authorsToText(authors);

  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [gridTheme, setGridTheme] = useState<GridTheme>("default");
  const [openTool, setOpenTool] = useState<Tool | null>(null);

  /* LOAD POEMS — PostgreSQL */

  // Ref, so an inline onCountChange from the parent can't cause a re-fetch loop
  const onCountRef = useRef(onCountChange);
  onCountRef.current = onCountChange;

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/getpoems?poet_id=${poetId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const loaded = normalizePoems(await response.json());
      if (!loaded.length) throw new Error("No poems returned from API");

      setPoems(loaded);
      onCountRef.current?.(loaded.length);
    } catch (err) {
      console.error(`Error loading poems (poet_id=${poetId}):`, err);
      setError("పద్యాలను లోడ్ చేయడంలో లోపం సంభవించింది.");
    } finally {
      setLoading(false);
    }
  }, [poetId]);

  useEffect(() => {
    loadPoems();
  }, [loadPoems]);

  /* SPEECH (browser-voice fallback used by the poem cards) */

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        setVoices(v);
        setReady(true);
      }
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
    if (!q) return poems;
    return poems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.special_line ?? "").toLowerCase().includes(q)
    );
  }, [poems, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const current = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const rangeStart = filtered.length ? (page - 1) * ITEMS_PER_PAGE + 1 : 0;
  const rangeEnd = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  useEffect(() => {
    setPage(1);
    stopSpeech();
  }, [search, viewMode]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasPoems = !loading && !error && filtered.length > 0;
  const isEmpty = !loading && !error && filtered.length === 0;

  const goToPage = (next: number) => {
    setPage(Math.min(totalPages, Math.max(1, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const toggleTool = (tool: Tool) => setOpenTool((cur) => (cur === tool ? null : tool));

  const toolIcon = (tool: Tool) =>
    openTool === tool ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />;

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
      {/* TITLE (optional — the shatakam page has its own) */}
      {heading && (
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
            {heading}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {loading ? "పద్యాలు లోడ్ అవుతున్నాయి…" : <>మొత్తం పద్యాల సంఖ్య: <strong>{poems.length}</strong></>}
          </Typography>
        </Box>
      )}

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
              <SearchIcon size={22} color="currentColor" label="శోధన" />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton edge="end" size="small" aria-label="క్లియర్" onClick={() => setSearch("")}>
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
        <Typography variant="body2" color="text.secondary" role="status" aria-live="polite">
          {query && !loading && !error ? `${filtered.length} / ${poems.length} పద్యాలు` : `${poems.length} పద్యాలు`}
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          disabled={filtered.length === 0}
          onChange={(_, value: ViewMode | null) => value && setViewMode(value)}
          aria-label="చూపే విధానం"
        >
          <ToggleButton value="cards" sx={{ textTransform: "none", px: 1.75 }}>పద్యాలు</ToggleButton>
          <ToggleButton value="grid" sx={{ textTransform: "none", px: 1.75 }}>యుక్తి AI</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* TOOLS — radio + posters/videos, closed by default */}
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
              endIcon={toolIcon("radio")}
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
              endIcon={toolIcon("downloads")}
              sx={toolButtonSx(openTool === "downloads")}
            >
              అన్నీ డౌన్‌లోడ్
            </Button>
          </Stack>

          {/* Kept mounted (just collapsed) so the radio keeps playing */}
          <Collapse in={openTool === "radio"} timeout={300}>
            <Box id="poem-tool-radio" sx={{ pt: 1.5 }}>
              <PoemRadio poems={filtered} />
            </Box>
          </Collapse>

          <Collapse in={openTool === "downloads"} timeout={300}>
            <Stack id="poem-tool-downloads" spacing={1.5} sx={{ pt: 1.5 }}>
              <DownloadAllPosters poems={filtered} authors={authors} poetryName={poetryName} />
              <DownloadAllVideos poems={filtered} authors={authors} poetryName={poetryName} />
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* ERROR / EMPTY — shown in both views */}
      {error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={<Button color="inherit" size="small" onClick={loadPoems}>మళ్ళీ ప్రయత్నించండి</Button>}
        >
          {error}
        </Alert>
      )}

      {isEmpty && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {query ? `“${query}” కోసం పద్యాలు కనబడలేదు.` : "ఇంకా పద్యాలు లేవు."}
          </Typography>
          {query && (
            <Button variant="outlined" startIcon={<ClearRoundedIcon />} onClick={() => setSearch("")}>క్లియర్</Button>
          )}
        </Box>
      )}

      {/* POEMS / YUKTAI GRID */}
      {viewMode === "grid" && !error ? (
        <Box sx={{ mt: 3 }}>
          <YuktaiGridView
            poems={filtered}
            poet={authorsText}
            poetryName={poetryName}
            loading={loading}
            toolName={toolName}
            onOpenPoem={(title: string) => {
              const poem = poems.find((item) => item.title === title);
              if (poem) {
                setSearch(poem.title);
                setViewMode("cards");
              }
            }}
            theme={gridTheme}
            onThemeChange={setGridTheme}
          />
        </Box>
      ) : (
        <Box sx={{ mt: 3 }}>
          {loading && (
            <Stack spacing={2}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={420} sx={{ borderRadius: "16px" }} />
              ))}
            </Stack>
          )}

          {hasPoems &&
            current.map((poem) => (
              <PoemCard
                key={poem.slug}
                poem={poem}
                ready={ready}
                speak={speak}
                stopSpeech={stopSpeech}
                authors={authors}
                poetryName={poetryName}
              />
            ))}
        </Box>
      )}

      {/* PAGINATION (cards only — the grid pages itself) */}
      {viewMode === "cards" && hasPoems && filtered.length > ITEMS_PER_PAGE && (
        <Stack alignItems="center" spacing={1} sx={{ mt: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton aria-label="మునుపటి పేజీ" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              <ChevronLeftIcon size={24} label="మునుపటి పేజీ" />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 72, textAlign: "center" }}>
              {page} / {totalPages}
            </Typography>
            <IconButton aria-label="తదుపరి పేజీ" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              <ChevronRightIcon size={24} label="తదుపరి పేజీ" />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            పద్యాలు {rangeStart}–{rangeEnd} / {filtered.length}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}