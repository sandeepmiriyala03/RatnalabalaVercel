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

  /* 🔊 Read options (optional) */
  enableRead?: boolean;

  authors?: string | string[];
  poetryName?: string;
};

const PoemCardNew: React.FC<Props> = ({
  poem,
  enableRead = true,
  authors,
  poetryName,
}) => {
  const poemRef = useRef<HTMLDivElement>(null);

  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  /* 🔊 Speech handlers */
  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `${poem.title}. ${poem.content}`
    );
    utterance.lang = "te-IN";
    utterance.rate = 0.8;

    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang === "te-IN");

    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent>
        {/* 🖼 Poster root */}
        <Box
          ref={poemRef}
          data-poster-root
          sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}
        >
          {/* 🔸 Title */}
          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1.3em",
              mb: 2,
            }}
          >
            {poem.title}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 📜 Poem content */}
          <Typography
            sx={{
              whiteSpace: "pre-line",
              textAlign: "center",
              lineHeight: 2.1,
              fontSize: { xs: "0.95em", sm: "1.05em" },
            }}
          >
            {poem.content}
          </Typography>

          {/* ✍️ Author */}
          {authorText && (
            <Typography
              sx={{
                mt: 2.5,
                textAlign: "right",
                fontSize: "0.9em",
                fontWeight: 500,
              }}
            >
              — {authorText}
            </Typography>
          )}

          {/* 🧾 Footer */}
          {poetryName && (
            <Box
              sx={{
                mt: 4,
                pt: 2,
                borderTop: "1px solid #ddd",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.8em",
                  fontWeight: 600,
                  opacity: 0.85,
                }}
              >
                {poetryName}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 🎛 Controls */}
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
              <IconButton
                onClick={speak}
                aria-label="పద్యాన్ని వినండి"
              >
                <VolumeUpIcon color="primary" />
              </IconButton>

              <IconButton
                onClick={stop}
                aria-label="వినడం ఆపండి"
              >
                <StopCircleIcon color="error" />
              </IconButton>
            </Box>
          )}

          {/* 📤 Share */}
          <ShareButtons targetRef={poemRef} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PoemCardNew;
