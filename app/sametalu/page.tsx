"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Chip,
  Divider,
} from "@mui/material";

import SametaluList from "@/app/components/SametaluList";
import {
  SAMETALU_GROUPS,
  DEFAULT_LETTER,
  TeluguLetter,
} from "@/app/types/sametalu";

export default function SametaluPage() {
  const [letter, setLetter] =
    useState<TeluguLetter>(DEFAULT_LETTER);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      {/* 🌼 Title */}
      <Typography align="center" fontSize="2rem" fontWeight={900}>
        📜 సామెతల మాల
      </Typography>

      <Typography align="center" sx={{ opacity: 0.8, mb: 3 }}>
        అక్షరాల వారీగా తెలుగు సామెతలు
      </Typography>

      {/* 🧠 Info */}
      <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
        <Chip label="📚 తెలుగు సామెతలు" variant="outlined" />
        <Chip label="🔤 అక్షర క్రమం" variant="outlined" />
      </Stack>

      {/* 🎛 Dropdown */}
      <FormControl size="small" sx={{ minWidth: 200, mx: "auto", display: "block" }}>
        అక్షర క్రమం
        <Select
          value={letter}
          onChange={(e) =>
            setLetter(e.target.value as TeluguLetter)
          }
        >
          {SAMETALU_GROUPS.map((g) => (
            <MenuItem key={g.key} value={g.key}>
              {g.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      {/* 📜 List */}
      <SametaluList letter={letter} />
    </Box>
  );
}
