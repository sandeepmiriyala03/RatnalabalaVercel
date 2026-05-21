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
import PoemListByKey from "@/app/components/PoemListByKey";

import {
  POETRY_COLLECTIONS,
  DEFAULT_POETRY_KEY,
  PoetryKey,
} from "@/types/poetry";

export default function PoemsPage() {
  const [selectedKey, setSelectedKey] =
    useState<PoetryKey>(DEFAULT_POETRY_KEY);

  /* ✅ Safe selected collection */
  const selected =
    POETRY_COLLECTIONS.find((p) => p.key === selectedKey) ??
    POETRY_COLLECTIONS.find(
      (p) => p.key === DEFAULT_POETRY_KEY
    )!;

  /* 📊 Platform totals */
  const totalCollections = useMemo(
    () => POETRY_COLLECTIONS.filter((p) => p.key !== "all").length,
    []
  );

  const totalPoemsAll = useMemo(
    () =>
      POETRY_COLLECTIONS.filter((p) => p.key !== "all").reduce(
        (sum, p) => sum + (p.totalPoems ?? 0),
        0
      ),
    []
  );

  /* ✅ Display poems count */
  const displayTotalPoems =
    selected.key === "all"
      ? totalPoemsAll
      : selected.totalPoems;

  const authorsText = Array.isArray(selected.authors)
    ? selected.authors.join(", ")
    : selected.authors;

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: 2, maxWidth: 1100, mx: "auto" }}>
      {/* 🌺 Title */}
        <Typography
                     variant="h3"
              
                     sx={{
                       letterSpacing: "-0.5px",
                       background: "linear-gradient(90deg, #0f172a, #2563eb)",
                       WebkitBackgroundClip: "text",
                       WebkitTextFillColor: "transparent",       fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center",  // ✅ Centers the text
                     }}>
      శతకాలమాల
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
        శతకాలమాల అనేది కృత్రిమ మేధ (AI) సహాయంతో రూపొందించిన తెలుగు శతకాల
        డిజిటల్ వేదిక. సంప్రదాయ సాహిత్యాన్ని ఆధునిక సాంకేతికతతో
        చదవడానికి, వినడానికి, పంచుకోవడానికి ఇది సహాయపడుతుంది.
      </Typography>

      {/* 📈 Platform Summary */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Chip label={`📚 శతకములు: ${totalCollections}`} variant="outlined" />
        <Chip
          label={`🧮 మొత్తం పద్యాలు: ${totalPoemsAll}`}
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
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <Typography sx={{ fontSize: "0.8rem", mb: 0.5, opacity: 0.8 }}>
            శతకము ఎంచుకోండి
          </Typography>

          <Select
            value={selectedKey}
            onChange={(e) =>
              setSelectedKey(e.target.value as PoetryKey)
            }
            aria-label="శతకము ఎంచుకోండి"
          >
            {POETRY_COLLECTIONS.map((p) => (
              <MenuItem key={p.key} value={p.key}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          disabled={selectedKey === DEFAULT_POETRY_KEY}
          onClick={() => setSelectedKey(DEFAULT_POETRY_KEY)}
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
          label={`📘 ఈ శతకంలో పద్యాలు: ${displayTotalPoems}`}
          color="primary"
          variant="outlined"
        />
        <Chip label={`✍️ కవి: ${authorsText}`} variant="outlined" />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 📜 Poems List */}
      <PoemListByKey
        apiKey={selected.key}
        poetryName={selected.label}
        authors={selected.authors}
      />
    </Box>
  );
}
