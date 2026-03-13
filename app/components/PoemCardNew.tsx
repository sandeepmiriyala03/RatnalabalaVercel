"use client";

import React, { useRef, useState, useEffect } from "react";
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
  useTheme,
  useMediaQuery
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const poemRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const authorText = Array.isArray(authors) ? authors.join(", ") : authors;
  const teluguVoiceText = `${poem.title}\n${poem.content}`.trim();

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const speak = async () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    stopRef.current = false;
    setIsSpeaking(true);

    const lines = [poem.title, ...poem.content.split("\n")].map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (stopRef.current) break;
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.lang = "te-IN";
        utterance.rate = 0.85;
        const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("te"));
        if (voice) utterance.voice = voice;
        utterance.onend = () => resolve();
        utterance.onerror = () => { setIsSpeaking(false); resolve(); };
        window.speechSynthesis.speak(utterance);
      });
    }
    setIsSpeaking(false);
  };

  const stop = () => {
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: isMobile ? 5 : 4, // Softer corners for mobile
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
        overflow: "visible",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        {/* Header Section */}
        <Box ref={poemRef} sx={{ textAlign: "center" }}>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{
              fontWeight: 800,
              color: "primary.main",
              mb: 1.5,
              fontFamily: "'Noto Serif Telugu', serif",
              lineHeight: 1.4
            }}
          >
            {poem.title}
          </Typography>
          
          <Box sx={{ width: 40, height: 4, bgcolor: "secondary.light", mx: "auto", mb: 3, borderRadius: "2px" }} />

          <Typography
            sx={{
              whiteSpace: "pre-line",
              fontSize: { xs: "1.15rem", sm: "1.25rem" },
              lineHeight: isMobile ? 2.4 : 2.2, // Extra space for mobile readability
              color: "text.primary",
              fontFamily: "'Noto Serif Telugu', serif",
              textAlign: "center"
            }}
          >
            {poem.content}
          </Typography>

          {(authorText || poetryName) && (
            <Box sx={{ mt: 4, pb: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.secondary" }}>
                — {authorText}
              </Typography>
              {poetryName && (
                <Typography variant="caption" sx={{ display: "block", mt: 0.5, letterSpacing: 1, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.5) }}>
                  {poetryName}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3, borderStyle: "dashed" }} />

        {/* Mobile-Optimized Action Bar */}
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={2} 
          alignItems="center" 
          justifyContent="space-between"
        >
          {/* Audio Controls - Full width on mobile for easier tapping */}
          {enableRead && (
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.04), 
                p: 0.75, 
                borderRadius: 12 
              }}
            >
              <Button
                fullWidth={isMobile}
                startIcon={isSpeaking ? <StopCircleRoundedIcon /> : <VolumeUpRoundedIcon />}
                onClick={isSpeaking ? stop : speak}
                variant={isSpeaking ? "outlined" : "contained"}
                color={isSpeaking ? "error" : "primary"}
                sx={{ 
                  borderRadius: 10, 
                  px: 3, 
                  py: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: isSpeaking ? "none" : 2
                }}
              >
                {isSpeaking ? "వినడం ఆపండి" : "పద్యాన్ని వినండి"}
              </Button>
            </Stack>
          )}

          {/* Social and AI Tools */}
          <Stack direction="row" spacing={1} sx={{ width: isMobile ? "100%" : "auto" }}>
            <Box sx={{ flexGrow: isMobile ? 1 : 0 }}>
                <ShareButtons targetRef={poemRef} />
            </Box>
            
            <Button
              variant={voiceOpen ? "contained" : "outlined"} 
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setVoiceOpen(!voiceOpen)}
              fullWidth={isMobile}
              sx={{
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                flexGrow: 1,
                transition: "all 0.2s",
                "&:active": { transform: "scale(0.96)" }, // Haptic feel
                ...(!voiceOpen && {
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    border: 'none',
                })
              }}
            >
              AI సాధనాలు
            </Button>
          </Stack>
        </Stack>

        <Collapse in={voiceOpen} timeout={400} unmountOnExit>
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.default, 0.8),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <TeluguVoice initialText={teluguVoiceText} />
          </Paper>
        </Collapse>
      </CardContent>
    </Card>
  );
}