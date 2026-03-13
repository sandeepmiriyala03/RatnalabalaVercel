"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Divider,
  Button, Stack, Collapse, Paper,
  alpha, useTheme, useMediaQuery, Tooltip,
  Fab, Zoom, Chip
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice from "@/app/components/TeluguVoice";

interface Poem { title: string; content: string; slug?: string; }

type Props = {
  poem: Poem;
  enableRead?: boolean;
  authors?: string | string[];
  poetryName?: string;
};

export default function PoemCardNew({ poem, enableRead = true, authors, poetryName }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const poemRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const authorText = Array.isArray(authors) ? authors.join(", ") : authors;
  const teluguVoiceText = `${poem.title}\n${poem.content}`.trim();

  useEffect(() => { return () => window.speechSynthesis.cancel(); }, []);

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
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: 4, sm: 4 },
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 2px 16px ${alpha(theme.palette.common.black, 0.06)}`,
        overflow: "visible",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: `0 6px 28px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, "&:last-child": { pb: { xs: 2, sm: 3, md: 4 } } }}>

        {/* ── Poem content ── */}
        <Box ref={poemRef} sx={{ textAlign: "center" }}>

          {/* Title */}
          <Typography
            component="h2"
            sx={{
              fontWeight: 800,
              color: "primary.main",
              mb: 1.5,
              fontFamily: "'Noto Serif Telugu', serif",
              lineHeight: 1.4,
              fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" },
            }}
          >
            {poem.title}
          </Typography>

          {/* Decorative divider */}
          <Box sx={{
            width: 36, height: 3, bgcolor: "secondary.light",
            mx: "auto", mb: { xs: 2.5, sm: 3 }, borderRadius: "2px",
          }} />

          {/* Poem body */}
          <Typography
            sx={{
              whiteSpace: "pre-line",
              fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.28rem" },
              lineHeight: { xs: 2.5, sm: 2.3 },
              color: "text.primary",
              fontFamily: "'Noto Serif Telugu', serif",
              textAlign: "center",
              // Better readability on small screens
              px: { xs: 0.5, sm: 2 },
            }}
          >
            {poem.content}
          </Typography>

          {/* Author */}
          {(authorText || poetryName) && (
            <Box sx={{ mt: { xs: 3, sm: 4 }, pb: 0.5 }}>
              {authorText && (
                <Typography sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  color: "text.secondary",
                }}>
                  — {authorText}
                </Typography>
              )}
              {poetryName && (
                <Typography variant="caption" sx={{
                  display: "block", mt: 0.5, letterSpacing: 1,
                  fontWeight: 700,
                  color: alpha(theme.palette.text.secondary, 0.5),
                }}>
                  {poetryName}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: { xs: 2.5, sm: 3 }, borderStyle: "dashed" }} />

        {/* ── Action bar ── */}
        <Box>
          {/* Mobile: stacked layout, Tablet+: row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 2 }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >

            {/* ── Listen button — large on mobile ── */}
            {enableRead && (
              <Button
                fullWidth={isMobile}
                onClick={isSpeaking ? stop : speak}
                variant={isSpeaking ? "outlined" : "contained"}
                color={isSpeaking ? "error" : "primary"}
                startIcon={
                  isSpeaking
                    ? <StopRoundedIcon />
                    : isSpeaking
                    ? <GraphicEqRoundedIcon />
                    : <VolumeUpRoundedIcon />
                }
                sx={{
                  borderRadius: 3,
                  px: { xs: 3, sm: 2.5 },
                  py: { xs: 1.5, sm: 1.25 },
                  minHeight: { xs: 52, sm: 44 },
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: { xs: "0.95rem", sm: "0.875rem" },
                  // Active animation
                  ...(isSpeaking && {
                    animation: "pulse 1.5s ease-in-out infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.7 },
                    },
                  }),
                  "&:active": { transform: "scale(0.97)" },
                  transition: "all 0.15s",
                }}
              >
                {isSpeaking ? "వినడం ఆపండి" : "పద్యాన్ని వినండి"}
              </Button>
            )}

            {/* ── Right side: Share + AI Tools ── */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ width: { xs: "100%", sm: "auto" } }}
              alignItems="center"
            >
              {/* Share buttons — takes remaining space on mobile */}
              <Box sx={{ flex: { xs: 1, sm: "unset" } }}>
                <ShareButtons targetRef={poemRef} />
              </Box>

              {/* AI Tools toggle — prominent on mobile */}
              <Button
                variant={voiceOpen ? "contained" : "outlined"}
                color="secondary"
                startIcon={<AutoAwesomeRoundedIcon />}
                endIcon={voiceOpen
                  ? <KeyboardArrowUpRoundedIcon />
                  : <KeyboardArrowDownRoundedIcon />
                }
                onClick={() => setVoiceOpen(!voiceOpen)}
                sx={{
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  px: { xs: 2, sm: 2 },
                  py: { xs: 1.5, sm: 1.25 },
                  minHeight: { xs: 52, sm: 44 },
                  fontSize: { xs: "0.9rem", sm: "0.875rem" },
                  flex: { xs: 1, sm: "unset" },
                  transition: "all 0.2s",
                  "&:active": { transform: "scale(0.97)" },
                  // Subtle glow when open
                  ...(voiceOpen && {
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.2)}`,
                  }),
                  ...(!voiceOpen && {
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                  }),
                }}
              >
                AI సాధనాలు
              </Button>
            </Stack>
          </Stack>

          {/* ── AI Tools panel ── */}
          <Collapse in={voiceOpen} timeout={350} unmountOnExit>
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.default, 0.7),
                border: `1.5px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                backdropFilter: "blur(8px)",
              }}
            >
              {/* Panel header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <AutoAwesomeRoundedIcon
                  fontSize="small"
                  sx={{ color: "secondary.main" }}
                />
                <Typography fontWeight={700} fontSize={13} color="secondary.main">
                  ధ్వని · కళ · వీడియో సాధనాలు
                </Typography>
              </Box>

              <TeluguVoice initialText={teluguVoiceText} />
            </Paper>
          </Collapse>
        </Box>

      </CardContent>
    </Card>
  );
}