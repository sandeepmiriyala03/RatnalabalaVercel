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

  /** 🔮 Future ready */
  authors?: string | string[];     // 👈 supports 1 or many
  poetryName?: string;             // optional collection / flag
};

export default function PoemCard({
  poem,
  ready,
  speak,
  stopSpeech,
  authors,
  poetryName,
}: Props) {
  const poemRef = useRef<HTMLDivElement>(null);

  /** Normalize authors */
  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ lineHeight: 1.8 }}>
        {/* 🖼 IMAGE CAPTURE ROOT */}
        <Box
          ref={poemRef}
          data-poster-root
          sx={{
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 4 },
          }}
        >
          {/* 📜 POSTER BODY */}
          <Box data-poster-body>
           

            {/* 🔸 TITLE */}
            <Typography
              data-poster-title
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

            {/* 📜 POEM CONTENT */}
            <Typography
              data-poster-poem
              sx={{
                whiteSpace: "pre-line",
                lineHeight: 2,
                textAlign: "center",
                fontSize: "1em",
              }}
            >
              {poem.content}
            </Typography>

            {/* ✍️ AUTHOR(S) */}
            {authorText && (
              <Typography
                data-poster-author
                sx={{
                  mt: 2.5,
                  textAlign: "right",
                  fontWeight: 500,
                  fontSize: "0.9em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                — {authorText}
              </Typography>
            )}

            {/* 🧾 FOOTER */}
            {poetryName && (
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
                  data-poster-footer
                  sx={{
                    fontSize: "0.8em",
                    fontWeight: 600,
                    opacity: 0.85,
                    whiteSpace: "nowrap",
                  }}
                >
                  {poetryName}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* 🎛 CONTROLS (NOT CAPTURED) */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          {/* 🔊 Audio Controls */}
          <Box>
            <IconButton
              onClick={() => speak(`${poem.title}. ${poem.content}`)}
              disabled={!ready}
              aria-label="పద్యాన్ని వినండి"
            >
              <VolumeUpIcon color="primary" />
            </IconButton>

            <IconButton
              onClick={stopSpeech}
              disabled={!ready}
              aria-label="పఠనం ఆపండి"
            >
              <StopCircleIcon color="error" />
            </IconButton>
          </Box>

          {/* 📤 Share */}
          <ShareButtons targetRef={poemRef} />
        </Box>
      </CardContent>
    </Card>
  );
}
