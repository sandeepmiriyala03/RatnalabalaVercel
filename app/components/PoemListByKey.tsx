"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
} from "@mui/material";

import PoemCardNew from "@/app/components/PoemCardNew";
import { POETRY_COLLECTIONS } from "@/types/poetry";
import DownloadAllPosters from "@/app/components/DownloadAllPosters";
import DownloadAllVoices from "@/app/components/DownloadAllVoices";
interface Poem {
  title: string;
  content: string;
  slug?: string;
}

interface Props {
  apiKey: string;          // "all" | Jandhyala | Sumati | ...
  poetryName: string;
  authors: string | string[];
}

const ITEMS_PER_PAGE = 10;

const PoemListByKey: React.FC<Props> = ({
  apiKey,
  poetryName,
  authors,
}) => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

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
          const collections = POETRY_COLLECTIONS.filter(
            (p) => p.key !== "all"
          );

          const responses = await Promise.all(
            collections.map((c) =>
              fetch(`/api/shatakamu?key=${c.key}`).then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
              })
            )
          );

          const merged: Poem[] = responses.flatMap((data, idx) =>
            Object.entries(data.poems || data).map(
              ([title, content]: any) => ({
                title: `${collections[idx].label} – ${title}`,
                content,
                slug: `${collections[idx].key}-${title}`,
              })
            )
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
    () =>
      poems.filter(
        (p) =>
          p.title.includes(search) ||
          p.content.includes(search)
      ),
    [poems, search]
  );

  const itemsPerPage = viewAll ? filtered.length : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const current = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search, viewAll, apiKey]);

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Typography align="center" fontWeight={700} fontSize="1.8rem">
        {poetryName}
      </Typography>

      <Typography align="center" sx={{ mb: 2 }}>
        మొత్తం పద్యాలు: <strong>{filtered.length}</strong>
      </Typography>

      <TextField
        label="పద్యం కోసం వెతకండి..."
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Box textAlign="center" mb={3}>
        <Button
          variant={viewAll ? "outlined" : "contained"}
          onClick={() => setViewAll((v) => !v)}
        >
          {viewAll ? "పేజీలవారీగా చూడండి" : "అన్ని పద్యాలు చూడండి"}
        </Button>
      </Box>

      {loading && (
        <Typography align="center">లోడ్ అవుతోంది…</Typography>
      )}

      {error && (
        <Typography align="center" color="error">
          {error}
        </Typography>
      )}
       {/* Download every currently-filtered poem's poster as one ZIP.
                THIS is the button that was missing — it did not exist anywhere
                in this file before. */}
            {!loading && !error && filtered.length > 0 && (
      
              <DownloadAllPosters
                poems={filtered}
                authors={authors}
                poetryName={poetryName}
              />
      
            )}
      
            {/* Download every currently-filtered poem's VOICE audio as one
                ZIP — same idea as the poster ZIP above, but each file is a
                real live /api/tts call, not a free instant browser capture,
                so this one is genuinely slower for large collections. */}
            {!loading && !error && filtered.length > 0 && (
      
              <DownloadAllVoices poems={filtered} />
      
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

      {!viewAll && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
          />
        </Box>
      )}
    </Box>
  );
};

export default PoemListByKey;
