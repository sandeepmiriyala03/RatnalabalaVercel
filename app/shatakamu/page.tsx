"use client";

import React, { useState } from "react";
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

  const selected = POETRY_COLLECTIONS.find(
    (p) => p.key === selectedKey
  )!;

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: 2, maxWidth: 1100, mx: "auto" }}>
      {/* 🌺 Title */}
      <Typography
        align="center"
        fontSize={{ xs: "1.6rem", md: "2.2rem" }}
        fontWeight={900}
      >
        తెలుగు శతకాలు
      </Typography>

      {/* 🌼 Tagline */}
      <Typography
        align="center"
        sx={{ mt: 1, mb: 2, opacity: 0.85 }}
      >
        📖 చదవండి &nbsp;–&nbsp; 🎧 వినండి &nbsp;–&nbsp; 📤 పంచుకోండి
      </Typography>

      {/* 🧠 Platform description */}
      <Typography
        align="center"
        sx={{
          maxWidth: 700,
          mx: "auto",
          mb: 4,
          fontSize: "0.95rem",
          opacity: 0.75,
        }}
      >
        రత్నాలబాల అనేది కృత్రిమ మేధ (AI) సహాయంతో రూపొందించిన తెలుగు శతకాల
        డిజిటల్ వేదిక. సంప్రదాయ సాహిత్యాన్ని ఆధునిక సాంకేతికతతో
        చదవడానికి, వినడానికి, పంచుకోవడానికి ఇది సహాయపడుతుంది.
      </Typography>

      {/* 🎛 Controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <Select
            value={selectedKey}
            onChange={(e) =>
              setSelectedKey(e.target.value as PoetryKey)
            }
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
          label={`📚 మొత్తం పద్యాలు: ${selected.totalPoems}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`✍️ కవి: ${
            Array.isArray(selected.authors)
              ? selected.authors.join(", ")
              : selected.authors
          }`}
          variant="outlined"
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 📜 Poems */}
      <PoemListByKey
        apiKey={selected.key}
        poetryName={selected.label}
        authors={selected.authors}
      />
    </Box>
  );
}
