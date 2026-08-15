// GeetaCardVerseSections.tsx
//
// Renders sloka + meaning (always visible), with word-by-word meaning
// and commentary as collapsible sections below — collapsed by default
// so casual readers get a clean card, and study-focused readers can
// expand either or both independently.

"use client";

import React, { useState } from "react";
import { Box, Typography, Collapse, Button } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";

type Props = {
  sloka: string;
  meaning: string; // te_translation
  w2wMeaning?: string;
  commentary?: string;
};

export default function GeetaCardVerseSections({
  sloka,
  meaning,
  w2wMeaning,
  commentary,
}: Props) {
  const [w2wOpen, setW2wOpen] = useState(false);
  const [commentaryOpen, setCommentaryOpen] = useState(false);

  return (
    <Box>
      {/* ── SLOKA — always visible ── */}
      <Typography
        sx={{
          fontFamily: "var(--font-noto-serif-telugu, 'Noto Serif Telugu'), serif",
          fontSize: "1.1rem",
          lineHeight: 1.9,
          whiteSpace: "pre-line",
          mb: 2,
        }}
      >
        {sloka}
      </Typography>

      {/* ── MEANING (te_translation) — always visible, primary ── */}
      <Typography sx={{ color: "text.secondary", mb: 2, lineHeight: 1.7 }}>
        {meaning}
      </Typography>

      {/* ── TOGGLE BUTTONS ── */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
        {w2wMeaning && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setW2wOpen((v) => !v)}
            startIcon={<MenuBookRoundedIcon fontSize="small" />}
            endIcon={
              w2wOpen ? (
                <ExpandLessRoundedIcon fontSize="small" />
              ) : (
                <ExpandMoreRoundedIcon fontSize="small" />
              )
            }
            sx={{
              textTransform: "none",
              borderColor: "var(--border, #e4dacb)",
              color: "var(--primary, #8b3a1f)",
              "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
            }}
          >
            పద పద అర్థం
          </Button>
        )}

        {commentary && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCommentaryOpen((v) => !v)}
            startIcon={<AutoStoriesRoundedIcon fontSize="small" />}
            endIcon={
              commentaryOpen ? (
                <ExpandLessRoundedIcon fontSize="small" />
              ) : (
                <ExpandMoreRoundedIcon fontSize="small" />
              )
            }
            sx={{
              textTransform: "none",
              borderColor: "var(--border, #e4dacb)",
              color: "var(--primary, #8b3a1f)",
              "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
            }}
          >
            వ్యాఖ్యానం
          </Button>
        )}
      </Box>

      {/* ── WORD-BY-WORD MEANING — collapsible ── */}
      {w2wMeaning && (
        <Collapse in={w2wOpen} timeout={250} unmountOnExit>
          <Box
            sx={{
              mt: 1,
              mb: 2,
              p: 1.5,
              borderRadius: "8px",
              backgroundColor: "var(--surface, #f7f2ea)",
              border: "1px solid var(--border, #e4dacb)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--primary, #8b3a1f)", display: "block", mb: 0.5 }}>
              పద పద అర్థం
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.8 }}>
              {w2wMeaning}
            </Typography>
          </Box>
        </Collapse>
      )}

      {/* ── COMMENTARY — collapsible, separate from w2w ── */}
      {commentary && (
        <Collapse in={commentaryOpen} timeout={250} unmountOnExit>
          <Box
            sx={{
              mt: 1,
              mb: 2,
              p: 1.5,
              borderRadius: "8px",
              backgroundColor: "var(--surface, #f7f2ea)",
              border: "1px solid var(--border, #e4dacb)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--primary, #8b3a1f)", display: "block", mb: 0.5 }}>
              వ్యాఖ్యానం
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              {commentary}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}