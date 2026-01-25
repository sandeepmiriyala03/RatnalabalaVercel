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
import type { Sameta } from "@/app/types/sametalu";

type Props = {
  sameta: Sameta;
  enableRead?: boolean;
};

const SametaPosterCard: React.FC<Props> = ({
  sameta,
  enableRead = true,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);

  /* 🔊 Telugu TTS */
  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sameta.text);
    utterance.lang = "te-IN";
    utterance.rate = 0.85;

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
        borderRadius: 3,
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        background: "linear-gradient(135deg,#fffaf0,#fff)",
      }}
    >
      <CardContent>
        {/* 🖼 Poster root */}
        <Box
          ref={posterRef}
          data-poster-root
          sx={{ px: 3, py: 4, textAlign: "center" }}
        >
          {/* 🔰 Heading */}
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 900,
              mb: 2,
            }}
          >
            తెలుగు సామెతలు
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 📜 Sameta text */}
          <Typography
            sx={{
              fontSize: "1.05rem",
              lineHeight: 1.9,
              fontWeight: 500,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {sameta.text}
          </Typography>

          {/* 🧾 Footer */}
          <Divider sx={{ my: 2 }} />

          <Typography
            sx={{
              fontSize: "0.8rem",
              opacity: 0.8,
              fontWeight: 600,
            }}
          >
            📖 చదవచ్చు | 🎧 వినచ్చు | 📤 పంచుకోవచ్చు
          </Typography>
        </Box>

        {/* 🎛 Controls — EXACTLY as you requested */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* 🔊 Read controls */}
          {enableRead && (
            <Box>
              <IconButton onClick={speak} aria-label="సామెత వినండి">
                <VolumeUpIcon color="primary" />
              </IconButton>

              <IconButton onClick={stop} aria-label="వినడం ఆపండి">
                <StopCircleIcon color="error" />
              </IconButton>
            </Box>
          )}

          {/* 📤 Share */}
          <ShareButtons targetRef={posterRef} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SametaPosterCard;
