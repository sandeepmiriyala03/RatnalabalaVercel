"use client";

import React, { useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import ShareButtons from "@/app/components/ShareBar";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Props = {
  poem: Poem;
  ready: boolean;
  speak: (text: string) => void;
  stopSpeech: () => void;
};

export default function PoemCard({
  poem,
  ready,
  speak,
  stopSpeech,
}: Props) {
  const poemRef = useRef<HTMLDivElement>(null);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent
        sx={{
          fontFamily: "var(--telugu-font-family)",
          fontSize: "var(--telugu-font-size)",
        }}
      >
        {/* 🖼 IMAGE CAPTURE AREA */}
        <Box
          ref={poemRef}
          sx={{
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 4 },
          }}
        >
          {/* 🔸 TITLE – CENTER */}
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1.3em",
              letterSpacing: "0.04em",
              mb: 2,
            }}
          >
            {poem.title}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 📜 POEM CONTENT – EXACT LINES (NO EXTRA BREAKS) */}
          <Typography
            sx={{
              whiteSpace: "pre-line", // keeps exactly 4 lines if present
              lineHeight: 2,
              textAlign: "center",
              fontSize: "1em",
            }}
          >
            {poem.content}
          </Typography>

          {/* ✍️ WRITER NAME – SINGLE LINE ONLY */}
          <Typography
            sx={{
              mt: 2.5,
              textAlign: "right",
              fontWeight: 500,
              fontSize: "0.9em",
              whiteSpace: "nowrap",   // ✅ NEVER wrap
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            — మిరియాల వెంకటరత్నం
          </Typography>

          {/* 🧾 FOOTER – ONE LINE, TRUE CENTER */}
          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop: "1px solid #ddd",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.8em",
                fontWeight: 600,
                opacity: 0.85,
                whiteSpace: "nowrap", // ✅ ALWAYS single line
              }}
            >
              రత్నాలబాల 
            </Typography>
          </Box>
        </Box>

        {/* 🎛 CONTROLS (OUTSIDE IMAGE) */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box>
            <IconButton
              onClick={() => speak(poem.content)}
              disabled={!ready}
              aria-label="పద్యాన్ని వినండి"
            >
              <VolumeUpIcon color="primary" />
            </IconButton>

            <IconButton
              onClick={stopSpeech}
              disabled={!ready}
              aria-label="ఆపండి"
            >
              <StopCircleIcon color="error" />
            </IconButton>
          </Box>

          <ShareButtons targetRef={poemRef} />
        </Box>
      </CardContent>
    </Card>
  );
}
/* ---------- Speech Synthesis Notes ----------