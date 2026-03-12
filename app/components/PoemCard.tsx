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
  Collapse
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import LinkIcon from "@mui/icons-material/Link";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice from "@/app/components/TeluguVoice";

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
  authors?: string | string[];
  poetryName?: string;
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
  const [voiceOpen, setVoiceOpen] = useState(false);

  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  const teluguVoiceText = `${poem.title}\n${poem.content}`.trim();

  const callAPI = async (url: string) => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poem: poem.content }),
      });
    } catch {}
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>

        {/* ───── POEM ───── */}

        <Box
          ref={poemRef}
          sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 4 } }}
        >

          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: "1.3em",
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
              fontSize: "1.05em",
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
                fontSize: "0.9em"
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
                fontWeight: 600
              }}
            >
              {poetryName}
            </Typography>
          )}

        </Box>

        {/* ───── AUDIO CONTROLS ───── */}

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>

          <IconButton
            onClick={() => speak(`${poem.title}. ${poem.content}`)}
            disabled={!ready}
          >
            <VolumeUpIcon color="primary" />
          </IconButton>

          <IconButton
            onClick={stopSpeech}
            disabled={!ready}
          >
            <StopCircleIcon color="error" />
          </IconButton>

        </Stack>

        {/* ───── SHARE ───── */}

        <Box sx={{ mt: 2 }}>
          <ShareButtons targetRef={poemRef} />
        </Box>

        {/* ───── TELUGU VOICE ───── */}

        <Box sx={{ mt: 3 }}>

          <Button
            fullWidth
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

          <Collapse in={voiceOpen} timeout={300} unmountOnExit>

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