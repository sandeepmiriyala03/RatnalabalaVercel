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
    <Box sx={{ py: 4 }}>
      <Typography align="center" fontSize="2rem" fontWeight={800}>
        తెలుగు శతకాలు
      </Typography>

      <Typography align="center" sx={{ mb: 4, opacity: 0.8 }}>
        మీకు నచ్చిన శతకాన్ని ఎంచుకోండి
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        sx={{ mb: 4 }}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
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
          onClick={() => setSelectedKey(DEFAULT_POETRY_KEY)}
        >
          డీఫాల్ట్
        </Button>
      </Stack>

      <PoemListByKey
        apiKey={selected.key}
        poetryName={selected.label}
        authors={selected.authors}
      />
    </Box>
  );
}
