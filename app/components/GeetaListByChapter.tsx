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

import GeetaCard from "@/app/components/GeetaCard";
import { GEETA_CHAPTERS } from "@/types/geeta";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
import PoemRadio from "@/app/components/Poemradio";
import DownloadAllVideos from "@/app/components/DownloadAllVideos";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

interface GeetaVerseItem {
  verse: number;
  sloka: string;
  meaning: string;
  chapterLabel: string;
  slug: string;
}

interface GeetaVerseRaw {
  verse: number;
  sloka: string;
  meaning: string;
}

interface GeetaChapterJson {
  chapter: number;
  chapterName: string;
  totalVerses: number;
  verses: GeetaVerseRaw[];
}

interface Props {
  chapter: number | "all";
  poetryName: string;
  authors: string | string[];
}

const ITEMS_PER_PAGE = 10;

const GeetaListByChapter: React.FC<Props> = ({ chapter, poetryName, authors }) => {
  // Kept as the RICH shape (verse, sloka, meaning separate) so
  // GeetaCard can render sloka/meaning as distinct sections — not
  // squashed into one generic "content" string like before.
  const [verses, setVerses] = useState<GeetaVerseItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const sortVerses = (list: GeetaVerseItem[]) => list.sort((a, b) => a.verse - b.verse);

  /* 📥 Load verses — from static JSON files */
  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      setError(null);

      try {
        if (chapter === "all") {
          const results = await Promise.allSettled(
            GEETA_CHAPTERS.map((c) =>
              fetch(`/geeta/chapter${c.key}.json`).then((r) => {
                if (!r.ok) throw new Error();
                return r.json() as Promise<GeetaChapterJson>;
              })
            )
          );

          const merged: GeetaVerseItem[] = results
            .filter((r): r is PromiseFulfilledResult<GeetaChapterJson> => r.status === "fulfilled")
            .flatMap((r) => {
              const meta = GEETA_CHAPTERS.find((c) => c.key === r.value.chapter);
              const label = meta?.label ?? `అధ్యాయం ${r.value.chapter}`;
              return r.value.verses.map((v) => ({
                verse: v.verse,
                sloka: v.sloka,
                meaning: v.meaning,
                chapterLabel: `అధ్యాయం ${r.value.chapter}: ${label}`,
                slug: `chapter${r.value.chapter}-verse${v.verse}`,
              }));
            });

          setVerses(sortVerses(merged));
          return;
        }

        const res = await fetch(`/geeta/chapter${chapter}.json`);
        if (!res.ok) throw new Error();

        const data: GeetaChapterJson = await res.json();
        const items: GeetaVerseItem[] = data.verses.map((v) => ({
          verse: v.verse,
          sloka: v.sloka,
          meaning: v.meaning,
          chapterLabel: `అధ్యాయం ${data.chapter}: ${data.chapterName}`,
          slug: `chapter${data.chapter}-verse${v.verse}`,
        }));
        setVerses(sortVerses(items));
      } catch {
        setError("శ్లోకాలను లోడ్ చేయడంలో లోపం వచ్చింది.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [chapter]);

  /* 🔍 Filter — searches sloka + meaning */
  const filtered = useMemo(
    () => verses.filter((v) => v.sloka.includes(search) || v.meaning.includes(search)),
    [verses, search]
  );

  const itemsPerPage = viewAll ? filtered.length : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const current = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(page * itemsPerPage, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, viewAll, chapter]);

  const handlePageChange = (_: unknown, val: number) => {
    setPage(val);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // PoemRadio / DownloadAllPosters / DownloadAllVideos / DownloadAllVoices
  // all expect the generic Poem{title, content, slug} shape — derived
  // here from the filtered verses, without changing those components
  // at all.
  const poemsForTools: Poem[] = useMemo(
    () =>
      filtered.map((v) => ({
        title: `శ్లోకం ${v.verse}`,
        content: `${v.sloka}\n\n${v.meaning}`,
        slug: v.slug,
      })),
    [filtered]
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto" }}>
      <Typography align="center" fontWeight={700} fontSize="1.8rem">
        {poetryName}
      </Typography>

      <Typography align="center" sx={{ mb: 2 }} color="text.secondary">
        మొత్తం శ్లోకాలు: <strong>{filtered.length}</strong>
      </Typography>

      <TextField
        label="శ్లోకం కోసం వెతకండి..."
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="వెతకడం క్లియర్ చేయండి" onClick={() => setSearch("")}>
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
          {viewAll ? "పేజీలవారీగా చూడండి" : "అన్ని శ్లోకాలు చూడండి"}
        </Button>
      </Box>

      {loading && (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary">శ్లోకాలు లోడ్ అవుతున్నాయి…</Typography>
        </Stack>
      )}

      {error && (
        <Typography align="center" color="error" sx={{ py: 4 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Stack alignItems="center" spacing={1} sx={{ py: 6, opacity: 0.75 }}>
          <SearchOffRoundedIcon fontSize="large" color="disabled" />
          <Typography color="text.secondary">&ldquo;{search}&rdquo; కోసం ఏ శ్లోకం దొరకలేదు.</Typography>
          <Button size="small" onClick={() => setSearch("")}>
            వెతకడం క్లియర్ చేయండి
          </Button>
        </Stack>
      )}

      {!loading && !error && filtered.length > 0 && <PoemRadio poems={poemsForTools} />}

      {!loading && !error && filtered.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => setToolsOpen((v) => !v)}
            variant="outlined"
            fullWidth
            startIcon={<DownloadForOfflineRoundedIcon fontSize="small" />}
            endIcon={toolsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
          >
            బల్క్ డౌన్‌లోడ్‌లు (పోస్టర్లు · వాయిస్‌లు · వీడియోలు)
          </Button>

          <Collapse in={toolsOpen} timeout={280} unmountOnExit>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <DownloadAllPosters poems={poemsForTools} authors={authors} poetryName={poetryName} />
              <DownloadAllVideos poems={poemsForTools} />
              <DownloadAllVoices poems={poemsForTools} />
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* ── ప్రతి verse ఇప్పుడు GeetaCard తో — sloka + meaning విడివిడిగా ── */}
      {!loading &&
        !error &&
        current.map((v) => (
          <GeetaCard
            key={v.slug}
            verse={v.verse}
            sloka={v.sloka}
            meaning={v.meaning}
            chapterLabel={chapter === "all" ? v.chapterLabel : undefined}
            authors={authors}
          />
        ))}

      {!loading && !error && filtered.length > 0 && (
        <>
          {!viewAll && totalPages > 1 && (
            <>
              <Typography align="center" variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                {rangeStart}–{rangeEnd} / {filtered.length} శ్లోకాలు చూపిస్తున్నాం
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

export default GeetaListByChapter;