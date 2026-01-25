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
import type { KathamalaStory } from "@/app/types/kathamala"; 
type Props = {
  story: KathamalaStory;

  /* 🔊 Read options */
  enableRead?: boolean;

  /* Optional footer label */
  seriesName?: string;
};

const StoryCard: React.FC<Props> = ({
  story,
  enableRead = true,
  seriesName = "కథామాల ",

}) => {
  const storyRef = useRef<HTMLDivElement>(null);

  /* 🔊 Speech handlers */
  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const fullText = `${story.title}. ${story.story_text.join(" ")}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
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
        {/* 🖼 Story root (for share image) */}
        <Box
          ref={storyRef}
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
            {story.title}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 📜 Story content */}
          <Box sx={{ textAlign: "center" }}>
            {story.story_text.map((line, idx) => (
              <Typography
                key={idx}
                sx={{
                  lineHeight: 2,
                  fontSize: { xs: "0.95em", sm: "1.05em" },
                }}
              >
                {line}
              </Typography>
            ))}
          </Box>

          {/* 🌼 Moral */}
          <Typography
            sx={{
              mt: 3,
              textAlign: "center",
              fontWeight: 600,
              fontSize: "0.95em",
              color: "success.main",
            }}
          >
            🌼 సందేశం: {story.moral}
          </Typography>

          {/* 🧾 Footer */}
          {seriesName && (
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
                {seriesName}
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
                aria-label="కథ వినండి"
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
          <ShareButtons targetRef={storyRef} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StoryCard;
