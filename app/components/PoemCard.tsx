"use client";

import React, { useRef, useState, useMemo } from "react";
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

// Same warm cream editorial palette as PoemCardNew.tsx / ShareButtons.tsx.
// Hardcoded (not theme.palette.*) on purpose: the poster capture must look
// identical regardless of the app's light/dark mode or user theme settings.
const POSTER_COLOR = {
  bg: "#F7F2EA",
  ink: "#2B2620",
  inkMuted: "#6B6258",
  accent: "#2B2620",
  bronze: "#8B6F47",
  hairline: "#E4DACB",
};

// Default illustration, used when the author isn't in KAVI_IMAGE_MAP below.
const DEFAULT_KAVI_IMAGE_SRC = "/CartoonStyle.png";

// Per-author illustration lookup. Add one entry per poet whose name should
// get its own cartoon instead of the shared default. The key must match the
// `authors` string exactly as passed into <PoemCard authors={...} />
// (see AUTHORS in PoemList.tsx). Save each PNG under /public with any name
// you like, and point to it here.
const KAVI_IMAGE_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "/MiriaPen.jpg",
  // "మరో కవి పేరు": "/AnotherPoet.png",
};

// Small-caps footer tagline + URL — same as PoemCardNew.tsx. Adjust to your
// actual site name/URL.
const SITE_TAGLINE = "చదవండి · వినండి · పంచుకోండి";
const SITE_URL = "https://ratnalabala.vercel.app";

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

  // Pick the illustration based on the author. If `authors` is an array
  // (multiple poets), this checks each name in turn and uses the first
  // match found in KAVI_IMAGE_MAP; falls back to the default cartoon.
  const kaviImageSrc = useMemo(() => {
    const names = Array.isArray(authors)
      ? authors
      : authors
      ? [authors]
      : [];

    for (const name of names) {
      if (KAVI_IMAGE_MAP[name.trim()]) {
        return KAVI_IMAGE_MAP[name.trim()];
      }
    }

    return DEFAULT_KAVI_IMAGE_SRC;
  }, [authors]);

  // Split into individual lines, same as PoemCardNew.tsx — each line gets
  // its own data-poster-line element so ShareButtons.tsx's onclone can size
  // them independently for the exported poster, and so a wrapped line never
  // shares wrap-flow with the next logical line.
  const contentLines = useMemo(
    () =>
      poem.content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [poem.content]
  );

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

        {/* ── Poem body — this is the exact area html2canvas captures for
            the share/poster image. Styled with fixed cream/ink tokens
            (not theme.palette.*) so the exported poster looks identical
            regardless of the app's light/dark mode. Same structure as
            PoemCardNew.tsx: title -> hairline -> centered illustration ->
            poem lines -> author -> hairline -> tagline/URL footer. ── */}
        <Box ref={poemRef} data-poster-root lang="te" sx={{
          textAlign: "center",
          bgcolor: POSTER_COLOR.bg,
          borderRadius: "12px",
          p: { xs: 2, sm: 3 },
        }}>

          <Box data-poster-body sx={{ p: { xs: 2, sm: 3 } }}>

            <Typography data-poster-title sx={{
              fontWeight: 600,
              color: POSTER_COLOR.accent,
              mb: 2,
              fontFamily: "'Noto Serif Telugu', serif",
              letterSpacing: 0.5,
              lineHeight: 1.4,
              fontSize: { xs: "1.15rem", sm: "1.35rem", md: "1.5rem" },
            }}>
              {poem.title}
            </Typography>

            <Box sx={{
              width: 40, height: 1, bgcolor: POSTER_COLOR.hairline,
              mx: "auto", mb: { xs: 2.5, sm: 3 },
            }} />

            {/* Centered illustration — picked per-author via kaviImageSrc */}
            <Box
              component="img"
              data-poster-image
              src={kaviImageSrc}
              alt={authorText || poem.title}
              sx={{
                width: "auto",
                height: { xs: 96, sm: 120, md: 140 },
                display: "block",
                mx: "auto",
                mb: { xs: 2.5, sm: 3 },
              }}
            />

            {/* Poem lines — single centered column */}
            <Box>
              {contentLines.map((line, i) => (
                <Typography
                  key={i}
                  data-poster-line
                  sx={{
                    fontSize: { xs: "1.05rem", sm: "1.18rem", md: "1.25rem" },
                    lineHeight: { xs: 1.9, sm: 1.9, md: 2.1 },
                    color: POSTER_COLOR.ink,
                    fontFamily: "'Noto Serif Telugu', serif",
                    mb: i === contentLines.length - 1 ? 0 : { xs: 0.5, sm: 0.75, md: 1 },
                    overflowWrap: "break-word",
                  }}
                >
                  {line}
                </Typography>
              ))}
            </Box>

            {authorText && (
              <Typography sx={{
                mt: { xs: 2.5, sm: 3 },
                fontWeight: 500,
                fontSize: { xs: "0.82rem", sm: "0.88rem" },
                color: POSTER_COLOR.inkMuted,
              }}>
                — {authorText}
              </Typography>
            )}

            {/* data-poster-hide: internal nav label, not for the export */}
            {poetryName && (
              <Typography data-poster-hide variant="caption" sx={{
                display: "block", mt: 0.5, letterSpacing: 1,
                fontWeight: 700,
                color: POSTER_COLOR.bronze,
              }}>
                {poetryName}
              </Typography>
            )}

            {/* data-poster-footer: small-caps tagline + URL. Only meant to
                stand out in the exported poster, kept subtle in-app. */}
            <Box
              data-poster-footer
              sx={{
                mt: { xs: 3, sm: 3.5 },
                pt: { xs: 1.5, sm: 2 },
                borderTop: `1px solid ${POSTER_COLOR.hairline}`,
              }}
            >
              <Typography sx={{
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                fontWeight: 700,
                letterSpacing: 1.5,
                color: POSTER_COLOR.ink,
                textTransform: "uppercase",
                mb: 0.5,
              }}>
                {SITE_TAGLINE}
              </Typography>
              <Typography sx={{
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                color: POSTER_COLOR.inkMuted,
              }}>
                {SITE_URL}
              </Typography>
            </Box>

          </Box>
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