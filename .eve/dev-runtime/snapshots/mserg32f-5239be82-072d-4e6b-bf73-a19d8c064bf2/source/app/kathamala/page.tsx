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
import storiesData from "@/data/kids_stories_te.json";
import StoryListByAge from "@/app/components/StoryListByAge";
import { AGE_GROUPS,DEFAULT_AGE_KEY,AgeKey} from "@/app/types/kathamala";
export default function KathamalaPage() {
    const [selectedAge, setSelectedAge] =useState<AgeKey>(DEFAULT_AGE_KEY);
    const stories = storiesData.stories;
  /* 📊 Totals */
  const totalStories = stories.length;
  const totalByAge = useMemo(() => {
    return stories.reduce<Record<string, number>>((acc, s) => {
      acc[s.age_group] = (acc[s.age_group] ?? 0) + 1;
      return acc;
    }, {});
  }, [stories]);

  const displayTotal =
    selectedAge === "all"
      ? totalStories
      : totalByAge[selectedAge] ?? 0;

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: 2, maxWidth: 1100, mx: "auto" }}>
      {/* 🌙 Title */}
       <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            letterSpacing: "-0.5px",
            background: "linear-gradient(90deg, #0f172a, #2563eb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",       fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
             textAlign: "center",  // ✅ Centers the text
          }}
        >
         కథామాల
      </Typography>
      {/* 🌼 Tagline */}
      <Typography align="center" sx={{ mt: 1, mb: 2, opacity: 0.85 }}>
        📖 చదవండి &nbsp;–&nbsp; 🎧 వినండి &nbsp;–&nbsp; 🌱 నేర్చుకోండి
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
        కథామాల అనేది పిల్లల కోసం రూపొందించిన సరళమైన తెలుగు కథల సమాహారం.
        ఈ కథలు నైతిక విలువలను నేర్పుతూ, చదవడానికి మరియు వినడానికి
        అనుకూలంగా రూపొందించబడ్డాయి.
      </Typography>

      {/* 📈 Platform Summary */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Chip
          label={`📚 మొత్తం కథలు: ${totalStories}`}
          variant="outlined"
        />
        <Chip
          label={`👶 వయస్సు గుంపులు: ${AGE_GROUPS.length - 1}`}
          color="success"
          variant="outlined"
        />
        <Chip label="✨ పిల్లలు × తెలుగు × AI" variant="outlined" />
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
            వయస్సు గుంపు ఎంచుకోండి
          </Typography>

          <Select
            value={selectedAge}
            onChange={(e) =>
              setSelectedAge(e.target.value as AgeKey)
            }
            aria-label="వయస్సు గుంపు ఎంచుకోండి"
          >
            {AGE_GROUPS.map((g) => (
              <MenuItem key={g.key} value={g.key}>
                {g.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          disabled={selectedAge === DEFAULT_AGE_KEY}
          onClick={() => setSelectedAge(DEFAULT_AGE_KEY)}
        >
          అన్నీ చూపించు
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
          label={`📘 చూపిస్తున్న కథలు: ${displayTotal}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`🎯 ఎంపిక చేసిన వయస్సు: ${
            AGE_GROUPS.find((g) => g.key === selectedAge)?.label
          }`}
          variant="outlined"
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 📖 Stories List */}
      <StoryListByAge ageKey={selectedAge} />
    </Box>
  );
}
