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
  Tooltip,
  Paper,
  alpha,
  useTheme
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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
  const theme = useTheme();
  const poemRef = useRef<HTMLDivElement>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const authorText = Array.isArray(authors) ? authors.join(", ") : authors;
  const teluguVoiceText = `${poem.title}\n${poem.content}`.trim();

  const speak = async () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const lines = [poem.title, ...poem.content.split("\n")]
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.lang = "te-IN";
        utterance.rate = 0.85;
        
        const voice = window.speechSynthesis
          .getVoices()
          .find((v) => v.lang === "te-IN" || v.lang === "te");

        if (voice) utterance.voice = voice;
        utterance.onend = () => resolve();
        utterance.onerror = () => {
            setIsSpeaking(false);
            resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    }
    setIsSpeaking(false);
  };

  const stop = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 4,
        borderRadius: 4,
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.1),
        position: "relative",
        overflow: "visible",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.2),
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
        {/* Poem Section */}
        <Box ref={poemRef} sx={{ textAlign: "center" }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 800,
              color: "primary.main",
              mb: 1,
              fontFamily: "'Noto Serif Telugu', serif",
              letterSpacing: "0.5px"
            }}
          >
            {poem.title}
          </Typography>
          
          <Box 
            sx={{ 
                width: 60, 
                height: 3, 
                bgcolor: "secondary.main", 
                mx: "auto", 
                mb: 3, 
                borderRadius: 2,
                opacity: 0.6
            }} 
          />

          <Typography
            sx={{
              whiteSpace: "pre-line",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              lineHeight: 2.2,
              color: "text.primary",
              fontFamily: "'Noto Serif Telugu', serif",
              px: { xs: 1, sm: 4 },
            }}
          >
            {poem.content}
          </Typography>

          {(authorText || poetryName) && (
            <Stack spacing={0.5} sx={{ mt: 4, alignItems: "center" }}>
              {authorText && (
                <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", fontStyle: 'italic' }}>
                  — {authorText}
                </Typography>
              )}
              {poetryName && (
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  {poetryName}
                </Typography>
              )}
            </Stack>
          )}
        </Box>

        <Divider sx={{ my: 4, opacity: 0.5 }} />

        {/* Unified Action Bar */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Audio Controls */}
          {enableRead && (
            <Stack direction="row" spacing={1} sx={{ bgcolor: alpha(theme.palette.action.selected, 0.05), p: 0.5, borderRadius: 10 }}>
              <Tooltip title="పద్యాన్ని వినండి">
                <IconButton
                  onClick={speak}
                  disabled={isSpeaking}
                  sx={{
                    bgcolor: isSpeaking ? "action.disabledBackground" : "primary.main",
                    color: "white",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  <VolumeUpRoundedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="వినడం ఆపండి">
                <IconButton
                  color="error"
                  onClick={stop}
                  disabled={!isSpeaking}
                  sx={{ border: "1px solid", borderColor: "error.light" }}
                >
                  <StopCircleRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {/* Share & Tools */}
          <Stack direction="row" spacing={1.5}>
            <ShareButtons targetRef={poemRef} />
            
            <Button
              variant={voiceOpen ? "contained" : "soft"} // Assuming "soft" or custom color
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setVoiceOpen(!voiceOpen)}
              sx={{
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 700,
                px: 3,
              }}
            >
              AI సాధనాలు
            </Button>
          </Stack>
        </Stack>

        <Collapse in={voiceOpen} timeout={400} unmountOnExit>
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderColor: "divider",
            }}
          >
            <TeluguVoice initialText={teluguVoiceText} />
          </Paper>
        </Collapse>
      </CardContent>
    </Card>
  );
}