"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
  Stack,
  Collapse,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

import PoemCardNew from "@/app/components/PoemCardNew";
import { POETRY_COLLECTIONS } from "@/types/poetry";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

interface Props {
  apiKey: string; // "all" | Jandhyala | Sumati | ...
  poetryName: string;
  authors: string | string[];
}

const ITEMS_PER_PAGE = 10;

const PoemListByKey: React.FC<Props> = ({ apiKey, poetryName, authors }) => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

  // Bulk-download tools (poster ZIP, voice ZIP, video ZIP) start collapsed.
  // A casual reader arriving to read/listen shouldn't be greeted by three
  // heavy export buttons before seeing a single poem — these are power-user
  // tools, tucked one tap away instead of first-thing-on-screen.
  const [toolsOpen, setToolsOpen] = useState(false);

  /* 🔢 Numeric sort helper */
  const sortPoems = (list: Poem[]) =>
    list.sort((a, b) => {
      const n = (t: string) => {
        const m = t.match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };
      return n(a.title) - n(b.title);
    });

  /* 📥 Load poems */
  useEffect(() => {
    const fetchPoems = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ CASE 1: ALL poems
        if (apiKey === "all") {
          const collections = POETRY_COLLECTIONS.filter((p) => p.key !== "all");

          const responses = await Promise.all(
            collections.map((c) =>
              fetch(`/api/shatakamu?key=${c.key}`).then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
              })
            )
          );

          const merged: Poem[] = responses.flatMap((data, idx) =>
            Object.entries(data.poems || data).map(([title, content]: any) => ({
              title: `${collections[idx].label} – ${title}`,
              content,
              slug: `${collections[idx].key}-${title}`,
            }))
          );

          setPoems(sortPoems(merged));
          return;
        }

        // ✅ CASE 2: Single collection (existing behavior)
        const res = await fetch(`/api/shatakamu?key=${apiKey}`);
        if (!res.ok) throw new Error();

        const data = await res.json();

        const poemArray: Poem[] = Object.entries(data.poems || data).map(
          ([title, content]: any) => ({
            title,
            content,
            slug: title,
          })
        );

        setPoems(sortPoems(poemArray));
      } catch {
        setError("పద్యాలను లోడ్ చేయడంలో లోపం వచ్చింది.");
      } finally {
        setLoading(false);
      }
    };

    fetchPoems();
  }, [apiKey]);

  /* 🔍 Filter */
  const filtered = useMemo(
    () => poems.filter((p) => p.title.includes(search) || p.content.includes(search)),
    [poems, search]
  );

  const itemsPerPage = viewAll ? filtered.length : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const current = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(page * itemsPerPage, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, viewAll, apiKey]);

  const handlePageChange = (_: unknown, val: number) => {
    setPage(val);
    // Jumping pages without scrolling leaves the reader staring at
    // whatever they'd scrolled down to on the OLD page — disorienting
    // since the content underneath just silently swapped out.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto" }}>
      <Typography align="center" fontWeight={700} fontSize="1.8rem">
        {poetryName}
      </Typography>

      <Typography align="center" sx={{ mb: 2 }} color="text.secondary">
        మొత్తం పద్యాలు: <strong>{filtered.length}</strong>
      </Typography>

      <TextField
        label="పద్యం కోసం వెతకండి..."
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="వెతకడం క్లియర్ చేయండి"
                  onClick={() => setSearch("")}
                >
                  <ClearRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Box textAlign="center" mb={3}>
        <Button
          variant={viewAll ? "outlined" : "contained"}
          onClick={() => setViewAll((v) => !v)}
          disabled={loading || filtered.length === 0}
        >
          {viewAll ? "పేజీలవారీగా చూడండి" : "అన్ని పద్యాలు చూడండి"}
        </Button>
      </Box>

      {/* ── Loading state — a real spinner instead of a plain text line,
          so it reads as "actively working" rather than "did something
          break?" during the initial fetch (which can take a moment for
          apiKey === "all", since it's fetching every collection). */}
      {loading && (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">పద్యాలు లోడ్ అవుతున్నాయి…</Typography>
        </Stack>
      )}

      {error && (
        <Typography align="center" color="error" sx={{ py: 4 }}>
          {error}
        </Typography>
      )}

      {/* ── Empty state — search returned nothing. Previously this case
          rendered a blank page with no explanation, which reads as
          broken rather than "no matches." */}
      {!loading && !error && filtered.length === 0 && (
        <Stack alignItems="center" spacing={1} sx={{ py: 6, opacity: 0.75 }}>
          <SearchOffRoundedIcon fontSize="large" color="disabled" />
          <Typography color="text.secondary">
            &ldquo;{search}&rdquo; కోసం ఏ పద్యం దొరకలేదు.
          </Typography>
          <Button size="small" onClick={() => setSearch("")}>
            వెతకడం క్లియర్ చేయండి
          </Button>
        </Stack>
      )}

      {/* ── Listen — the primary experience, always visible right under
          search. This is what most readers actually came for. */}
      {!loading && !error && filtered.length > 0 && <PoemRadio poems={filtered} />}

      {/* ── Bulk export tools — collapsed by default. These are genuinely
          useful (poster ZIP, voice ZIP, video ZIP) but heavy and
          secondary to "read/listen to a poem," so they live one tap
          away instead of crowding the top of the page for every visitor. */}
      {!loading && !error && filtered.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => setToolsOpen((v) => !v)}
            variant="outlined"
            fullWidth
            startIcon={<DownloadForOfflineRoundedIcon fontSize="small" />}
            endIcon={
              toolsOpen ? (
                <ExpandLessRoundedIcon fontSize="small" />
              ) : (
                <ExpandMoreRoundedIcon fontSize="small" />
              )
            }
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
          >
            బల్క్ డౌన్‌లోడ్‌లు (పోస్టర్లు · వాయిస్‌లు · వీడియోలు)
          </Button>

          <Collapse in={toolsOpen} timeout={280} unmountOnExit>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <DownloadAllPosters poems={filtered} authors={authors} poetryName={poetryName} />
              <DownloadAllVideos poems={filtered} />
              <DownloadAllVoices poems={filtered} />
            </Stack>
          </Collapse>
        </Box>
      )}

      {!loading &&
        !error &&
        current.map((poem) => (
          <PoemCardNew
            key={poem.slug}
            poem={poem}
            authors={authors}
            poetryName={poetryName}
          />
        ))}

      {!loading && !error && filtered.length > 0 && (
        <>
          {!viewAll && totalPages > 1 && (
            <>
              <Typography align="center" variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                {rangeStart}–{rangeEnd} / {filtered.length} పద్యాలు చూపిస్తున్నాం
              </Typography>
              <Box display="flex" justifyContent="center" mt={1}>
                <Pagination count={totalPages} page={page} onChange={handlePageChange} />
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default PoemListByKey;