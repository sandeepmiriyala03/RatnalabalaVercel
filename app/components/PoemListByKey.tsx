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


interface Poem {
  title: string;
  content: string;
  slug?: string;
}

interface Props {
  apiKey: string;          // 👈 vemana | sumati | jandhyala
  poetryName: string;      // 👈 "వేమన పద్యాలు"
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

  /* 📥 Load poems */
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch(`/api/shatakamu?key=${apiKey}`);
        if (!res.ok) throw new Error();

        const data = await res.json();

        const poemArray: Poem[] = Object.entries(data.poems || data)
          .map(([title, content]: any) => ({
            title,
            content,
            slug: title,
          }))
          .sort((a, b) => {
            const n = (t: string) => {
              const m = t.match(/\d+/);
              return m ? parseInt(m[0], 10) : 0;
            };
            return n(a.title) - n(b.title);
          });

        setPoems(poemArray);
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
  }, [search, viewAll]);

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

      {loading && <Typography align="center">లోడ్ అవుతోంది…</Typography>}
      {error && <Typography align="center" color="error">{error}</Typography>}

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
