"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import GeetaListByChapter from "@/app/components/GeetaListByChapter";

import {
  GEETA_CHAPTERS,
  DEFAULT_CHAPTER_KEY,
} from "@/types/geeta";

const GEETA_AUTHORS = "శ్రీ వ్యాస మహర్షి గారు";

export default function GeetaPage() {
  const [selectedKey, setSelectedKey] = useState<number>(DEFAULT_CHAPTER_KEY);

  /* ✅ Safe selected chapter */
  const selected =
    GEETA_CHAPTERS.find((c) => c.key === selectedKey) ?? GEETA_CHAPTERS[0];

  /* 📊 Platform totals */
  const totalChapters = useMemo(() => GEETA_CHAPTERS.length, []);

  const totalVersesAll = useMemo(
    () => GEETA_CHAPTERS.reduce((sum, c) => sum + (c.totalVerses ?? 0), 0),
    []
  );

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: 2, maxWidth: 1100, mx: "auto" }}>
      {/* 🌺 Title */}
      <Typography
        variant="h3"
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center",
        }}
      >
        గీతామాల
      </Typography>

      {/* 🌼 Tagline */}
      <Typography align="center" sx={{ mt: 1, mb: 2, opacity: 0.85 }}>
        📖 చదవండి &nbsp;–&nbsp; 🎧 వినండి &nbsp;–&nbsp; 📤 పంచుకోండి
      </Typography>

      {/* 🧠 Description */}
      <Typography
        align="center"
        sx={{
          maxWidth: 720,
          mx: "auto",
          mb: 3,
          fontSize: "0.95rem",
          opacity: 0.75,
        }}
      >
        గీతామాల అనేది భగవద్గీత యొక్క 18 అధ్యాయాలను, ప్రతి శ్లోకాన్ని
        తెలుగు అర్థంతో సహా చదవడానికి, వినడానికి వీలుగా రూపొందించిన
        డిజిటల్ వేదిక. సంప్రదాయ సాహిత్యాన్ని ఆధునిక సాంకేతికతతో
        అందరికీ చేరువ చేసే ప్రయత్నం.
      </Typography>

      {/* 📈 Platform Summary */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Chip label={`📚 అధ్యాయాలు: ${totalChapters}`} variant="outlined" />
        <Chip
          label={`🧮 మొత్తం శ్లోకాలు: ${totalVersesAll}`}
          color="success"
          variant="outlined"
        />
        <Chip label="✨ సంప్రదాయం × సాంకేతికత" variant="outlined" />
      </Stack>

      {/* 🎛 Controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <Typography sx={{ fontSize: "0.8rem", mb: 0.5, opacity: 0.8 }}>
            అధ్యాయం ఎంచుకోండి
          </Typography>

          <Select
            value={selectedKey}
            onChange={(e) => setSelectedKey(Number(e.target.value))}
            aria-label="అధ్యాయం ఎంచుకోండి"
          >
            {GEETA_CHAPTERS.map((c) => (
              <MenuItem key={c.key} value={c.key}>
                {c.key}. {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          disabled={selectedKey === DEFAULT_CHAPTER_KEY}
          onClick={() => setSelectedKey(DEFAULT_CHAPTER_KEY)}
        >
          డీఫాల్ట్
        </Button>
      </Stack>

      {/* 📊 Selected Info */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Chip
          label={`📘 ఈ అధ్యాయంలో శ్లోకాలు: ${selected.totalVerses}`}
          color="primary"
          variant="outlined"
        />
        <Chip label={`📖 ${selected.label}`} variant="outlined" />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 📜 Verses List — GeetaListByChapter, PoemListByKey pattern నే
          అనుసరించి: search, PoemRadio, bulk export tools, pagination
          అన్నీ ఇందులో ఉన్నాయి */}
      <GeetaListByChapter
        chapter={selected.key}
        poetryName={selected.label}
        authors={GEETA_AUTHORS}
      />
    </Box>
  );
}