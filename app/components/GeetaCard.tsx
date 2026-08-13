// app/components/GeetaCard.tsx
"use client";

import { useState, useRef } from "react";
import { Paper, Typography, Stack, Divider, IconButton, Chip, Box } from "@mui/material";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice from "@/app/components/TeluguVoice";

interface GeetaCardProps {
  verse: number;
  sloka: string;
  meaning: string;
  chapterLabel?: string;
  authors?: string | string[];
}

export default function GeetaCard({ verse, sloka, meaning, chapterLabel, authors }: GeetaCardProps) {
  const [speaking, setSpeaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const authorsText = Array.isArray(authors) ? authors.join(", ") : authors;

  // Same narration-text pattern as PoemCard's buildNarrationText —
  // combining sloka + meaning into one string for both the quick
  // speechSynthesis button AND TeluguVoice's video generation.
  const narrationText = `${sloka} ${meaning}`.replace(/\n/g, " ");

  const speak = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = "te-IN";
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // ⚠️ ASSUMPTION — matching the earlier project note that TeluguVoice
  // accepts an `initialText` prop (used the same way in PoemCard).
  // If TeluguVoice's actual current signature also needs a language
  // config object (like the TEL config from earlier in this project)
  // or other required props, this will need adjusting — paste
  // TeluguVoice.tsx's current prop interface if this errors, and I'll
  // fix it precisely instead of guessing again.
  const shareTitle = `గీతామాల — శ్లోకం ${verse}${chapterLabel ? ` (${chapterLabel})` : ""}`;

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2,
        borderRadius: 3,
        borderLeft: "4px solid #14532D",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* ── Header — verse number + chapter context + listen button ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`శ్లోకం ${verse}`}
            size="small"
            sx={{ fontWeight: 700, bgcolor: "#14532D14", color: "#14532D" }}
          />
          {chapterLabel && (
            <Typography variant="caption" color="text.secondary">
              {chapterLabel}
            </Typography>
          )}
        </Stack>

        <IconButton
          size="small"
          onClick={speaking ? stop : speak}
          sx={{ color: "#14532D" }}
          aria-label={speaking ? "ఆపు" : "వినండి"}
        >
          {speaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
        </IconButton>
      </Stack>

      {/* ── Shareable content block — wrapped in cardRef so
          ShareButtons captures exactly this section (sloka +
          meaning) as the poster image, not the whole card including
          buttons/controls. ── */}
      <Box ref={cardRef}>
        {/* ── Sloka — Sanskrit, prominent, own visual block ── */}
        <Typography
          sx={{
            whiteSpace: "pre-line",
            fontWeight: 600,
            fontSize: "1.05rem",
            color: "#1E293B",
            lineHeight: 1.9,
            mb: 1.5,
          }}
        >
          {sloka}
        </Typography>

        <Divider sx={{ mb: 1.5 }} />

        {/* ── Meaning — Telugu, separate section, own visual identity ── */}
        <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          అర్థం
        </Typography>
        <Typography sx={{ color: "text.secondary", lineHeight: 1.7 }}>{meaning}</Typography>

        {authorsText && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}>
            — {authorsText}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* ── TeluguVoice — video generation, same initialText pattern
          as PoemCard used it. If your actual TeluguVoice needs
          additional required props (language config, isEnding, etc.),
          add them here — paste the component's current interface and
          I'll wire it exactly, rather than guessing further. ── */}
      <Box sx={{ mb: 2 }}>
        <TeluguVoice initialText={narrationText} />
      </Box>

      {/* ── ShareButtons — NOW includes targetRef, confirmed required
          from the actual ShareBar.tsx source (line 26:
          `if (!targetRef.current) return null`). This was the real
          bug — targetRef was missing entirely before. ── */}
      <ShareButtons targetRef={cardRef} title={shareTitle} text={narrationText} />
    </Paper>
  );
}