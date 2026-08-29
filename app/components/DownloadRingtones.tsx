"use client";

import React from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";

/* Assumed filenames based on the existing Style1.mp3 reference in
   MusicPlayer.tsx — update TRACKS below if the real second filename
   differs (e.g. a different number or a descriptive name). */
const TRACKS = [
  { label: "శైలి 1", file: "Style1.mp3" },
  { label: "శైలి 2", file: "style2.mp3" },
];

export default function DownloadRingtones() {
  return (
    <Box
      sx={{
        mt: 3,
        p: 2.5,
        maxWidth: 420,
        mx: "auto",
        bgcolor: "var(--surface-elevated)",
        border: "1.5px solid var(--border-strong)",
        borderRadius: "var(--radius)",
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "1rem",
          color: "var(--foreground)",
          fontFamily: "'Noto Serif Telugu', serif",
          mb: 0.5,
        }}
      >
        🎵 రింగ్‌టోన్‌లు డౌన్‌లోడ్ చేయండి
      </Typography>
      <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-text)", mb: 2 }}>
        మీ ఫోన్ కోసం రత్నాలబాల నేపథ్య సంగీతాన్ని ఉచితంగా డౌన్‌లోడ్ చేసుకోండి.
      </Typography>

      <Stack spacing={1.25}>
        {TRACKS.map((track) => (
          <Stack
            key={track.file}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 1.5, py: 1,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              bgcolor: "var(--surface)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <MusicNoteRoundedIcon sx={{ fontSize: 20, color: "var(--primary)" }} />
              <Typography sx={{ fontSize: "0.95rem", color: "var(--foreground)", fontWeight: 600 }}>
                {track.label}
              </Typography>
            </Stack>

            <Button
              component="a"
              href={`/MusicPlayer/${track.file}`}
              download={track.file}
              size="small"
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "var(--primary)",
                borderRadius: "999px",
                "&:hover": { bgcolor: "var(--surface-elevated)" },
                "&:focus-visible": { outline: "3px solid var(--primary)", outlineOffset: "3px" },
              }}
            >
              డౌన్‌లోడ్
            </Button>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}