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
import ShareIcon from "@mui/icons-material/Share";

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

        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >

          <Tooltip title="పద్యాన్ని వినండి">

            <IconButton
              color="primary"
              onClick={() => speak(`${poem.title}. ${poem.content}`)}
              disabled={!ready}
            >
              <VolumeUpIcon />
            </IconButton>

          </Tooltip>

          <Tooltip title="ఆపండి">

            <IconButton
              color="error"
              onClick={stopSpeech}
              disabled={!ready}
            >
              <StopCircleIcon />
            </IconButton>

          </Tooltip>

        </Stack>

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

        {/* AI MEDIA GENERATOR */}

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