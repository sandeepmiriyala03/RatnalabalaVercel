"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
  Button,
} from "@mui/material";

import type {
  TeluguLetter,
  Sameta,
  SametaluFile,
} from "@/app/types/sametalu";
import { SAMETALU_FILE_MAP } from "@/app/types/sametalu";

import SametaCard from "@/app/components/SametaCard";

interface Props {
  letter: TeluguLetter;
}

const PAGE_SIZE = 100;

export default function SametaluList({ letter }: Props) {
  const [sametalu, setSametalu] = useState<Sameta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* 📥 Load sametalu by letter */
  useEffect(() => {
    let mounted = true;

    setPage(1);
    setSearch("");
    setLoading(true);

    const loadSametalu = async () => {
      try {
        if (letter === "all") {
          if (mounted) setSametalu([]);
          return;
        }

        const file = SAMETALU_FILE_MAP[letter];
        const res = await fetch(`/ssmetalamala/${file}.json`);

        if (!res.ok) {
          if (mounted) setSametalu([]);
          return;
        }

        const data: SametaluFile = await res.json();
        if (mounted) setSametalu(data.sametalu);
      } catch {
        if (mounted) setSametalu([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSametalu();
    return () => {
      mounted = false;
    };
  }, [letter]);

  /* 🔍 Search filter */
  const filtered = useMemo(() => {
    if (!search.trim()) return sametalu;
    return sametalu.filter((s) =>
      s.text.includes(search)
    );
  }, [sametalu, search]);

  /* 📄 Pagination */
  const visible = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const totalCount = sametalu.length;
  const visibleCount = visible.length;
  const hasMore = visibleCount < filtered.length;

  /* 🔤 Letter header card */
  const letterHeader: Sameta | null =
    letter !== "all"
      ? { id: `header-${letter}`, text: letter }
      : null;

  /* ⏳ Loading */
  if (loading) {
    return <Typography align="center">లోడ్ అవుతోంది…</Typography>;
  }

  /* 🚫 Empty */
  if (totalCount === 0) {
    return (
      <Typography align="center" sx={{ opacity: 0.7 }}>
        ఈ అక్షరానికి సామెతలు లేవు
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {/* 🔢 Counts */}
      <Box
        display="flex"
        gap={1}
        justifyContent="center"
        flexWrap="wrap"
      >
        <Chip label={`📚 మొత్తం: ${totalCount}`} variant="outlined" />
        <Chip
          label={`🔍 చూపిస్తున్నవి: ${visibleCount}`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* 🔍 Search */}
      <TextField
        size="small"
        placeholder="సామెత వెతకండి…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* 🔤 Letter Header (no speaker / no share) */}
      {letterHeader && (
        <SametaCard
          sameta={letterHeader}
          
        />
      )}

      {/* 🚫 No match */}
      {visible.length === 0 && (
        <Typography align="center" sx={{ opacity: 0.7 }}>
          సరిపోయే సామెతలు లేవు
        </Typography>
      )}

      {/* 📜 Sametalu list */}
      {visible.map((s, i) => (
        <SametaCard
          key={`${s.id}-${i}`}
          sameta={s}
        />
      ))}

      {/* ⬇️ Load more */}
      {hasMore && (
        <Box textAlign="center" mt={2}>
          <Button
            variant="outlined"
            onClick={() => setPage((p) => p + 1)}
          >
            మరిన్ని చూపించు
          </Button>
        </Box>
      )}
    </Stack>
  );
}
