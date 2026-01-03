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
  // 🔒 Only THIS ref is captured as image
  const poemRef = useRef<HTMLDivElement>(null);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 🖼 IMAGE CAPTURE AREA (PURE CONTENT ONLY) */}
        <Box ref={poemRef}>
          {/* Title */}
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            {poem.title}
          </Typography>

          <Divider sx={{ mb: 1 }} />

          {/* Poem Content */}
          <Typography
            sx={{
              whiteSpace: "pre-line",
              lineHeight: 1.8,
              fontSize: "1rem",
            }}
          >
            {poem.content}
          </Typography>

          {/* 🧾 IMAGE FOOTER (PERFECT ALIGNMENT) */}
          <Box
            sx={{
              mt: 4,
              pt: 2,
              borderTop: "1px solid #ddd",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              fontSize: "0.8rem",
              color: "#444",
            }}
          >
            {/* Left */}
            <Typography sx={{ justifySelf: "start", fontWeight: 500 }}>
              మిరియాల వెంకటరత్నం
            </Typography>

            {/* Center (TRUE CENTER) */}
            <Typography
              sx={{
                justifySelf: "center",
                fontWeight: 600,
                whiteSpace: "nowrap",
                opacity: 0.85,
              }}
            >
              రత్నాలబాల · పద్యాలవాల · భావాలమాల
            </Typography>

            {/* Right spacer */}
            <Box />
          </Box>
        </Box>

        {/* 🎛 UI CONTROLS (NOT IN IMAGE) */}
        <Box
          sx={{
            mt: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {/* Speak / Stop */}
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

          {/* Share */}
          <ShareButtons targetRef={poemRef} />
        </Box>
      </CardContent>
    </Card>
  );
}
