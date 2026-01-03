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
  speak: (c: string) => void;
  stopSpeech: () => void;
};

export default function PoemCard({
  poem,
  ready,
  speak,
  stopSpeech,
}: Props) {
  const poemRef = useRef<HTMLDivElement>(null); // ✅ SAFE (top-level)

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 🖼 Capture area */}
        <Box ref={poemRef}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6" fontWeight={500}>
              {poem.title}
            </Typography>

            <Box>
              <IconButton onClick={() => speak(poem.content)} disabled={!ready}>
                <VolumeUpIcon color="primary" />
              </IconButton>
              <IconButton onClick={stopSpeech} disabled={!ready}>
                <StopCircleIcon color="error" />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Typography sx={{ whiteSpace: "pre-line" }}>
            {poem.content}
          </Typography>
        </Box>

        {/* 📤 Share bar */}
        <ShareButtons targetRef={poemRef} />
      </CardContent>
    </Card>
  );
}
