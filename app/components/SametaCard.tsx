"use client";

import React, { useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Divider,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";

import ShareButtons from "@/app/components/ShareBar";
import type { Sameta } from "@/app/types/sametalu";

type Props = {
  sameta: Sameta;

  /* 🔠 Letter header card? */
  isHeader?: boolean;

  enableRead?: boolean;
};

const SametaCard: React.FC<Props> = ({
  sameta,
  isHeader = false,
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
        {/* 📜 Content (poster root) */}
        <Box ref={ref} data-poster-root>
          <Typography
            sx={{
              textAlign: "center",
              lineHeight: 2,
              fontSize: isHeader ? "1.4rem" : "1.05rem",
              fontWeight: isHeader ? 800 : 400,
            }}
          >
            {sameta.text}
          </Typography>

          {/* 📌 Footer for image/share */}
          <Divider sx={{ my: 2 }} />

          <Typography
            sx={{
              textAlign: "center",
              fontSize: "0.8rem",
              opacity: 0.75,
              fontWeight: 600,
            }}
          >
            సామెతల మాల
          </Typography>
        </Box>

        {/* 🎛 Controls (skip for header) */}
        {!isHeader && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default SametaCard;
