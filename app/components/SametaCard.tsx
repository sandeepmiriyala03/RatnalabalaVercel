"use client";

import React, { useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";

import ShareButtons from "@/app/components/ShareBar";
import type { Sameta } from "@/app/types/sametalu";

type Props = {
  sameta: Sameta;
  enableRead?: boolean;
};

const SametaCard: React.FC<Props> = ({
  sameta,
  enableRead = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  /* 🔊 Speak */
  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sameta.text);
    utterance.lang = "te-IN";
    utterance.rate = 0.8;

    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang === "te-IN");

    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent>
        <Box ref={ref} data-poster-root>
          <Typography
            sx={{
              textAlign: "center",
              lineHeight: 2,
              fontSize: "1.05rem",
            }}
          >
            {sameta.text}
          </Typography>
        </Box>

        {/* Controls */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {enableRead && (
            <Box>
              <IconButton onClick={speak}>
                <VolumeUpIcon color="primary" />
              </IconButton>
              <IconButton onClick={stop}>
                <StopCircleIcon color="error" />
              </IconButton>
            </Box>
          )}

          <ShareButtons targetRef={ref} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SametaCard;
