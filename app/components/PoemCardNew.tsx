"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  IconButton,
  Button,
  Stack,
  Collapse,
  Tooltip
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice from "@/app/components/TeluguVoice";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Props = {
  poem: Poem;
  enableRead?: boolean;
  authors?: string | string[];
  poetryName?: string;
};

export default function PoemCardNew({
  poem,
  enableRead = true,
  authors,
  poetryName,
}: Props) {

  const poemRef = useRef<HTMLDivElement>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  const teluguVoiceText = `${poem.title}\n${poem.content}`.trim();

  /* 🔊 line-by-line reading */

  const speak = async () => {

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const lines = [
      poem.title,
      ...poem.content.split("\n")
    ].map(l => l.trim()).filter(Boolean);

    for (const line of lines) {

      await new Promise<void>((resolve) => {

        const utterance = new SpeechSynthesisUtterance(line);

        utterance.lang = "te-IN";
        utterance.rate = 0.85;

        const voice = window.speechSynthesis
          .getVoices()
          .find(v => v.lang === "te-IN" || v.lang === "te");

        if (voice) utterance.voice = voice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);

      });

    }

  };

  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (

    <Card
      elevation={3}
      sx={{
        mb: 3,
        borderRadius: 3,
        transition: "0.25s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 6
        }
      }}
    >

      <CardContent>

        {/* POEM */}

        <Box
          ref={poemRef}
          sx={{
            px: { xs: 1, sm: 3 },
            py: { xs: 2, sm: 3 }
          }}
        >

          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "1.15rem", sm: "1.3rem" },
              mb: 2
            }}
          >
            {poem.title}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography
            sx={{
              whiteSpace: "pre-line",
              textAlign: "center",
              fontSize: { xs: "1rem", sm: "1.05rem" },
              lineHeight: 1.9
            }}
          >
            {poem.content}
          </Typography>

          {authorText && (

            <Typography
              sx={{
                mt: 2,
                textAlign: "right",
                fontSize: "0.9em",
                opacity: 0.8
              }}
            >
              — {authorText}
            </Typography>

          )}

          {poetryName && (

            <Typography
              sx={{
                mt: 3,
                textAlign: "center",
                fontSize: "0.85em",
                fontWeight: 600,
                opacity: 0.7
              }}
            >
              {poetryName}
            </Typography>

          )}

        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ACTION BAR */}

        {enableRead && (

          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mb: 2 }}
          >

            <Tooltip title="పద్యాన్ని వినండి">

              <IconButton
                color="primary"
                onClick={speak}
              >
                <VolumeUpIcon />
              </IconButton>

            </Tooltip>

            <Tooltip title="ఆపండి">

              <IconButton
                color="error"
                onClick={stop}
              >
                <StopCircleIcon />
              </IconButton>

            </Tooltip>

          </Stack>

        )}

        {/* SHARE */}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 2
          }}
        >
          <ShareButtons targetRef={poemRef} />
        </Box>

        {/* ధ్వనిమాల · కళామాల · దర్శనమాల */}

        <Box sx={{ mt: 2 }}>

          <Button
            fullWidth
            size="large"
            variant={voiceOpen ? "contained" : "outlined"}
            startIcon={<GraphicEqIcon />}
            onClick={() => setVoiceOpen(!voiceOpen)}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              py: 1.2
            }}
          >

            {voiceOpen
              ? "ధ్వనిమాల · కళామాల · దర్శనమాల దాచు"
              : "ధ్వనిమాల · కళామాల · దర్శనమాల"}

          </Button>

          <Collapse
            in={voiceOpen}
            timeout={300}
            unmountOnExit
          >

            <Box
              sx={{
                mt: 2,
                borderRadius: 3,
                border: "1px solid #6ee7b7",
                overflow: "hidden"
              }}
            >

              <TeluguVoice initialText={teluguVoiceText} />

            </Box>

          </Collapse>

        </Box>

      </CardContent>

    </Card>

  );

}