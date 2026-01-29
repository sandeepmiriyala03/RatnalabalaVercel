"use client";

import React, { useMemo } from "react";
import { Box, Typography, Stack } from "@mui/material";

import storiesData from "@/data/kids_stories_te.json";
import StoryCard from "@/app/components/StoryCard";


import type {
  KathamalaStory,
  AgeKey,
} from "@/app/types/kathamala";


interface Props {
  ageKey: AgeKey;
}

export default function AksharamalaParent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* 🔍 Filter */
  const filtered = useMemo(() => {
    if (!search.trim()) return AKSHARALU;
    return AKSHARALU.filter(
      (a) =>
        a.letter.includes(search) ||
        a.word?.includes(search)
    );
  }, [search]);

  /* 📄 Pagination slice */
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  /* 🚫 Empty state */
  if (filtered.length === 0) {
    return (
      <Typography align="center" sx={{ opacity: 0.7, mt: 4 }}>
        సరిపోయే అక్షరాలు లేవు
      </Typography>
    );
  }

  return (
    <Stack spacing={3}>
      {/* 🔢 COUNTS */}
      <Box display="flex" gap={1} justifyContent="center">
        <Chip label={`🔤 మొత్తం: ${filtered.length}`} />
        <Chip
          label={`📄 పేజీ: ${page} / ${pageCount}`}
          color="primary"
        />
      </Box>

      {/* 🔍 SEARCH */}
      <TextField
        size="small"
        placeholder="అక్షరం లేదా పదం వెతకండి…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1); // reset page on search
        }}
      />

      {/* 📜 LIST (each card has Share + Sound) */}
      <Stack spacing={3}>
        {visible.map((a) => (
          <AksharaPosterCard
            key={a.id}
            akshara={a}
            enableRead={true}
          />
        ))}
      </Stack>

      {/* 🔢 PAGINATION NUMBERS */}
      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Stack>
  );
}