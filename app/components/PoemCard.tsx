"use client";

import React, { useRef, useState } from "react";
import {
  Box, Typography, Card, CardContent, Divider,
  Button, Stack, Collapse,
  alpha, useTheme, useMediaQuery,
} from "@mui/material";
import VolumeUpRoundedIcon      from "@mui/icons-material/VolumeUpRounded";

import AutoAwesomeRoundedIcon    from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon     from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon     from "@mui/icons-material/ExpandLessRounded";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice  from "@/app/components/TeluguVoice";

/* ── animated waveform bars shown while speaking ── */
function SpeakingBars() {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 14, width: 14 }}>
      {[3, 6, 4, 7, 2].map((h, i) => (
        <span key={i} style={{
          width: 2, height: h, borderRadius: 1,
          background: "currentColor", display: "inline-block",
          animation: `speakbar 0.9s ease-in-out ${i * 0.12}s infinite alternate`,
        }} />
      ))}
      <style>{`@keyframes speakbar{0%{transform:scaleY(0.4)}100%{transform:scaleY(1.4)}}`}</style>
    </span>
  );
}

/* ── types ── */
interface Poem { title: string; content: string; slug?: string; }

type Props = {
  poem:        Poem;
  ready:       boolean;
  speak:       (text: string) => void;
  stopSpeech:  () => void;
  authors?:    string | string[];
  poetryName?: string;
};

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function PoemCard({
  poem, ready, speak, stopSpeech, authors, poetryName,
}: Props) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const poemRef   = useRef<HTMLDivElement>(null);
  const [voiceOpen,   setVoiceOpen]   = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);

  const authorText  = Array.isArray(authors) ? authors.join(", ") : authors;
  const voiceText   = `${poem.title}\n${poem.content}`.trim();

  /* ── colours ── */
  const forestGreen = "#1a3d2b";
  const forestMid   = "#2d6a4f";

  /* ── speak / stop wrappers (track speaking state locally) ── */
  const handleSpeak = () => {
    setIsSpeaking(true);
    speak(`${poem.title}. ${poem.content}`);
    // reset speaking indicator after a generous timeout as fallback
    const guard = setTimeout(() => setIsSpeaking(false), 60_000);
    return () => clearTimeout(guard);
  };

  const handleStop = () => {
    setIsSpeaking(false);
    stopSpeech();
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: "18px", sm: "16px" },
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 2px 16px ${alpha(theme.palette.common.black, 0.05)}`,
        overflow: "visible",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: `0 6px 28px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <CardContent sx={{
        p: { xs: "20px 16px", sm: "28px 28px 24px" },
        "&:last-child": { pb: { xs: "20px", sm: "24px" } },
      }}>

        {/* ── Poem body ── */}
        <Box ref={poemRef} sx={{ textAlign: "center" }}>

          <Typography sx={{
            fontWeight: 800,
            color: "primary.main",
            mb: 1.5,
            fontFamily: "'Noto Serif Telugu', serif",
            lineHeight: 1.45,
            fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.45rem" },
          }}>
            {poem.title}
          </Typography>

          {/* decorative accent bar */}
          <Box sx={{
            width: 32, height: 3, bgcolor: "secondary.light",
            mx: "auto", mb: { xs: 2, sm: 2.5 }, borderRadius: 2,
          }} />

          <Typography sx={{
            whiteSpace: "pre-line",
            fontSize: { xs: "1.05rem", sm: "1.18rem", md: "1.25rem" },
            lineHeight: { xs: 2.6, sm: 2.3 },
            color: "text.primary",
            fontFamily: "'Noto Serif Telugu', serif",
            px: { xs: 0, sm: 2 },
          }}>
            {poem.content}
          </Typography>

          {(authorText || poetryName) && (
            <Box sx={{ mt: { xs: 2.5, sm: 3.5 } }}>
              {authorText && (
                <Typography sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.82rem", sm: "0.88rem" },
                  color: "text.secondary",
                }}>
                  — {authorText}
                </Typography>
              )}
              {poetryName && (
                <Typography variant="caption" sx={{
                  display: "block", mt: 0.5, letterSpacing: 1,
                  fontWeight: 700,
                  color: alpha(theme.palette.text.secondary, 0.45),
                }}>
                  {poetryName}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* ── Divider ── */}
        <Divider sx={{
          my: { xs: 2, sm: 2.5 },
          borderStyle: "dashed",
          borderColor: alpha(theme.palette.divider, 0.5),
        }} />

        {/* ── Action rows ── */}
        <Stack direction="column" spacing={1.25}>

          {/* Row 1 — Listen (or Stop) + Share */}
          <Stack direction="row" spacing={1}>

            <Button
              onClick={isSpeaking ? handleStop : handleSpeak}
              disabled={!ready}
              variant="contained"
              disableElevation
              startIcon={isSpeaking ? <SpeakingBars /> : <VolumeUpRoundedIcon />}
              sx={{
                flex: 1,
                borderRadius: "10px",
                py: { xs: 1.4, sm: 1.2 },
                minHeight: { xs: 50, sm: 44 },
                textTransform: "none",
                fontWeight: 700,
                fontSize: { xs: "0.9rem", sm: "0.85rem" },
                background: isSpeaking
                  ? alpha(theme.palette.error.main, 0.1)
                  : !ready
                  ? undefined
                  : `linear-gradient(135deg, ${forestMid}, ${forestGreen})`,
                color: isSpeaking ? "error.main" : "white",
                border: isSpeaking
                  ? `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`
                  : "none",
                boxShadow: isSpeaking || !ready ? "none" : "0 3px 12px rgba(26,61,43,0.28)",
                "&:hover": {
                  background: isSpeaking
                    ? alpha(theme.palette.error.main, 0.15)
                    : `linear-gradient(135deg, ${forestMid}, ${forestGreen})`,
                },
                "&:active": { transform: "scale(0.97)" },
                transition: "all 0.15s",
              }}
            >
              {isSpeaking ? "ఆపండి" : "వినండి"}
            </Button>

            <Box sx={{ flex: "0 0 auto", display: "flex", alignItems: "stretch" }}>
              <ShareButtons targetRef={poemRef} />
            </Box>

          </Stack>

          {/* Row 2 — AI Tools full-width */}
          <Button
            onClick={() => setVoiceOpen(v => !v)}
            variant="outlined"
            fullWidth
            startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
            endIcon={
              voiceOpen
                ? <ExpandLessRoundedIcon fontSize="small" />
                : <ExpandMoreRoundedIcon fontSize="small" />
            }
            sx={{
              borderRadius: "10px",
              py: { xs: 1.4, sm: 1.2 },
              minHeight: { xs: 50, sm: 44 },
              textTransform: "none",
              fontWeight: 700,
              fontSize: { xs: "0.92rem", sm: "0.85rem" },
              borderColor: voiceOpen
                ? "secondary.main"
                : alpha(theme.palette.secondary.main, 0.4),
              color: "secondary.main",
              background: voiceOpen
                ? alpha(theme.palette.secondary.main, 0.08)
                : "transparent",
              boxShadow: voiceOpen
                ? `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.12)}`
                : "none",
              justifyContent: "space-between",
              px: 2.5,
              "&:hover": {
                borderColor: "secondary.main",
                background: alpha(theme.palette.secondary.main, 0.06),
              },
              "&:active": { transform: "scale(0.98)" },
              transition: "all 0.15s",
            }}
          >
            <span>✨ AI సాధనాలు — ధ్వని · కళ · వీడియో</span>
          </Button>

        </Stack>

        {/* ── AI panel ── */}
        <Collapse in={voiceOpen} timeout={320} unmountOnExit>
          <Box sx={{
            mt: 2,
            p: { xs: 1.5, sm: 2 },
            borderRadius: "12px",
            background: alpha(theme.palette.background.default, 0.6),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 15, color: "secondary.main" }} />
              <Typography sx={{
                fontSize: 12, fontWeight: 700, color: "secondary.main",
                letterSpacing: 0.5, textTransform: "uppercase",
              }}>
                ధ్వని · కళ · వీడియో
              </Typography>
            </Box>
            <TeluguVoice initialText={voiceText} />
          </Box>
        </Collapse>

      </CardContent>
    </Card>
  );
}