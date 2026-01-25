"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
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

export default function SametaluList({ letter }: Props) {
  const [sametalu, setSametalu] = useState<Sameta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSametalu = async () => {
      setLoading(true);

      try {
        if (letter === "all") {
          const files = Object.entries(SAMETALU_FILE_MAP)
            .filter(([k]) => k !== "all")
            .map(([, v]) => v);

          const responses = await Promise.all(
            files.map(async (file) => {
              const res = await fetch(`/ssmetalamala/${file}.json`);
              if (!res.ok) return null;
              return (await res.json()) as SametaluFile;
            })
          );

          const merged = responses
            .filter(Boolean)
            .flatMap((d) => d!.sametalu);

          if (mounted) setSametalu(merged);
        } else {
          const file = SAMETALU_FILE_MAP[letter];
          const res = await fetch(`/ssmetalamala/${file}.json`);
          if (!res.ok) {
            if (mounted) setSametalu([]);
            return;
          }
          const data: SametaluFile = await res.json();
          if (mounted) setSametalu(data.sametalu);
        }
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

  const totalCount = sametalu.length;
  const visibleCount = filtered.length;

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
        <Chip
          label={`📚 మొత్తం: ${totalCount}`}
          variant="outlined"
        />
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
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 🚫 No match */}
      {visibleCount === 0 && (
        <Typography align="center" sx={{ opacity: 0.7 }}>
          సరిపోయే సామెతలు లేవు
        </Typography>
      )}

      {/* 📜 List */}
      {filtered.map((s, i) => (
        <SametaCard
          key={`${s.id}-${i}`}
          sameta={s}
        />
      ))}
    </Stack>
  );
}
