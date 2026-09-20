"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import PoemCard from "@/app/components/PoemCard";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Tool = "radio" | "downloads";

const ITEMS_PER_PAGE = 3;

const POETRY_NAME = "రత్నాలబాల — పద్యాలవాల — భావాలమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";

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

  // Which of the two tool panels (radio / bulk downloads) is open. Only one at
  // a time, and both start closed so the page opens on search + poems.
  const [openTool, setOpenTool] = useState<Tool | null>(null);

  /* LOAD POEMS — PostgreSQL (poet_id = 1). The old .md source is disabled. */

  const loadPoems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/getpoems?poet_id=1");

      if (!response.ok) {
        throw new Error("Failed to load database poems");
      }

      const data: Record<string, string> = await response.json();

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

  const rangeStart = filtered.length ? (page - 1) * itemsPerPage + 1 : 0;
  const rangeEnd = Math.min(page * itemsPerPage, filtered.length);

  useEffect(() => {
    setPage(1);
    stopSpeech();
  }, [search, viewAll]);

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
      }}
    >
      {/* TITLE */}

      <Box sx={{ textAlign: "center", mb: { xs: 2.5, sm: 3 } }}>
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

      {/* PAGINATION */}

      {hasPoems && !viewAll && filtered.length > ITEMS_PER_PAGE && (
        <Stack alignItems="center" spacing={1} sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            siblingCount={isMobile ? 0 : 1}
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