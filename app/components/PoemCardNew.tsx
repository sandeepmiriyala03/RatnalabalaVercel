"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Stack,
  Collapse,
  alpha,
  useTheme,
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
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

// REDESIGNED — warm cream / editorial palette, replacing the temple-teal
// scheme. No hard border box; the poster reads as one calm, open page
// rather than a bordered card.
const POSTER_COLOR = {
  bg: "#F7F2EA",       // warm cream — matches the reference mood board
  ink: "#2B2620",       // near-black warm charcoal — primary text
  inkMuted: "#6B6258",  // softer charcoal — secondary text (author line)
  accent: "#2B2620",    // title color — same ink, no teal accent anymore
  bronze: "#8B6F47",    // small caps footer label
  hairline: "#E4DACB",  // faint divider line, not a heavy border
};

// Default illustration, used when the author isn't in KAVI_IMAGE_MAP below.
const DEFAULT_KAVI_IMAGE_SRC = "/CartoonStyle.png";

// Per-author illustration lookup — same mechanism as PoemCard.tsx. Add one
// entry per poet whose name should get its own cartoon instead of the
// shared default. The key must match the `authors` string passed into
// <PoemCardNew authors={...} /> exactly. Save each PNG under /public with
// any filename you like, and point to it here.
const KAVI_IMAGE_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "/MiriyalaRamakrishna.png",
  // "మరో కవి పేరు": "/AnotherPoet.png",
  // Add more poets and their illustrations here as needed.
  "శ్రీ ప్రసాదరావు మిరియాల గారు": "/Prasad.jpeg"
};

// Small-caps footer tagline + URL, matching the reference's
// "DISCOVER. READ. INSPIRE." + domain treatment. Adjust the copy/URL to
// your actual site name.
const SITE_TAGLINE = "చదవండి · వినండి · పంచుకోండి";
const SITE_URL = "https://ratnalabala.vercel.app/";

/* 🔊 Speaking Animation */
function SpeakingBars() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 1.5,
        height: 14,
        width: 14,
      }}
    >
      {[3, 6, 4, 7, 2].map((h, i) => (
        <span
          key={i}
          style={{
            width: 2,
            height: h,
            borderRadius: 1,
            background: "currentColor",
            display: "inline-block",
            animation: `speakbar 0.9s ease-in-out ${
              i * 0.12
            }s infinite alternate`,
          }}
        />
      ))}

      <style>
        {`
          @keyframes speakbar {
            0% { transform: scaleY(0.4); }
            100% { transform: scaleY(1.4); }
          }
        `}
      </style>
    </span>
  );
}

export default function PoemCardNew({
  poem,
  enableRead = true,
  authors,
  poetryName,
}: Props) {

  const theme = useTheme();

  const poemRef = useRef<HTMLDivElement | null>(null);

  const stopRef = useRef(false);

  const [voiceOpen, setVoiceOpen] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  const voiceText = `${poem.title}\n${poem.content}`.trim();

  // Pick the illustration based on the author. If `authors` is an array
  // (multiple poets), this checks each name in turn and uses the first
  // match found in KAVI_IMAGE_MAP; falls back to the default cartoon.
  const kaviImageSrc = useMemo(() => {
    const names = Array.isArray(authors)
      ? authors
      : authors
      ? [authors]
      : [];

    // Trim BOTH the incoming author name and the map's own keys — a stray
    // leading/trailing space in KAVI_IMAGE_MAP (easy to introduce by
    // accident when editing) would otherwise silently fail to match.
    for (const name of names) {
      const normalized = name.trim();
      const matchKey = Object.keys(KAVI_IMAGE_MAP).find(
        (k) => k.trim() === normalized
      );
      if (matchKey) {
        return KAVI_IMAGE_MAP[matchKey];
      }
    }

    return DEFAULT_KAVI_IMAGE_SRC;
  }, [authors]);

  const contentLines = useMemo(
    () =>
      poem.content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [poem.content]
  );

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  /* 🔊 Read poem */
  const speak = async () => {

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    stopRef.current = false;

    setIsSpeaking(true);

    const lines = [
      poem.title,
      ...poem.content.split("\n"),
    ]
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {

      if (stopRef.current) break;

      await new Promise<void>((resolve) => {

        const utterance =
          new SpeechSynthesisUtterance(line);

        utterance.lang = "te-IN";

        utterance.rate = 0.85;

        const teluguVoice =
          window.speechSynthesis
            .getVoices()
            .find((voice) =>
              voice.lang.startsWith("te")
            );

        if (teluguVoice) {
          utterance.voice = teluguVoice;
        }

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

  /* ⛔ Stop reading */
  const stop = () => {

    stopRef.current = true;

    window.speechSynthesis.cancel();

    setIsSpeaking(false);
  };

  const forestGreen = "#1a3d2b";

  const forestMid = "#2d6a4f";

  return (
    <Card
      elevation={0}
      sx={{
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: "18px", sm: "16px" },
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(
          theme.palette.divider,
          0.12
        )}`,
        boxShadow: `0 2px 16px ${alpha(
          theme.palette.common.black,
          0.05
        )}`,
        overflow: "visible",
      }}
    >
      <CardContent
        sx={{
          p: { xs: "20px 16px", sm: "28px 28px 24px" },
          "&:last-child": {
            pb: { xs: "20px", sm: "24px" },
          },
        }}
      >

        {/* 📝 Poem — this is the exact area html2canvas captures for the
            share/poster image. Single-column, borderless, cream editorial
            layout: title -> hairline divider -> centered illustration ->
            poem lines -> author -> small-caps tagline/URL footer. */}
        <Box
          ref={poemRef}
          data-poster-root
          lang="te"
          sx={{
            textAlign: "center",
            bgcolor: POSTER_COLOR.bg,
            borderRadius: "12px",
            p: { xs: 2, sm: 3 },
          }}
        >

          <Box
            data-poster-body
            sx={{
              p: { xs: 2, sm: 3 },
            }}
          >

            {/* data-poster-title */}
            <Typography
              data-poster-title
              sx={{
                fontWeight: 600,
                color: POSTER_COLOR.accent,
                mb: 2,
                fontFamily: "'Noto Serif Telugu', serif",
                letterSpacing: 0.5,
                lineHeight: 1.4,
                fontSize: {
                  xs: "1.15rem",
                  sm: "1.35rem",
                  md: "1.5rem",
                },
              }}
            >
              {poem.title}
            </Typography>

            <Box
              sx={{
                width: 40,
                height: 1,
                bgcolor: POSTER_COLOR.hairline,
                mx: "auto",
                mb: { xs: 2.5, sm: 3 },
              }}
            />

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
                    fontSize: {
                      xs: "1rem",
                      sm: "1.1rem",
                      md: "1.2rem",
                    },
                    lineHeight: {
                      xs: 1.85,
                      sm: 1.9,
                      md: 2.1,
                    },
                    color: POSTER_COLOR.ink,
                    fontFamily: "'Noto Serif Telugu', serif",
                    mb:
                      i === contentLines.length - 1
                        ? 0
                        : { xs: 0.5, sm: 0.75, md: 1 },
                    overflowWrap: "break-word",
                  }}
                >
                  {line}
                </Typography>
              ))}
            </Box>

            {authorText && (
              <Typography
                sx={{
                  mt: { xs: 2.5, sm: 3 },
                  fontWeight: 500,
                  fontSize: { xs: "0.82rem", sm: "0.88rem" },
                  color: POSTER_COLOR.inkMuted,
                }}
              >
                — {authorText}
              </Typography>
            )}

            {/* data-poster-hide: internal nav label, not for the export */}
            {poetryName && (
              <Typography
                data-poster-hide
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.5,
                  letterSpacing: 1,
                  fontWeight: 700,
                  color: POSTER_COLOR.bronze,
                }}
              >
                {poetryName}
              </Typography>
            )}

            {/* data-poster-footer: small-caps tagline + URL, matching the
                reference's "DISCOVER. READ. INSPIRE." treatment. Only meant
                to appear in the exported poster — kept subtle here so it
                doesn't compete with the live in-app card. */}
            <Box
              data-poster-footer
              sx={{
                mt: { xs: 3, sm: 3.5 },
                pt: { xs: 1.5, sm: 2 },
                borderTop: `1px solid ${POSTER_COLOR.hairline}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "0.68rem", sm: "0.72rem" },
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: POSTER_COLOR.ink,
                  textTransform: "uppercase",
                  mb: 0.5,
                }}
              >
                {SITE_TAGLINE}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "0.68rem", sm: "0.72rem" },
                  color: POSTER_COLOR.inkMuted,
                }}
              >
                {SITE_URL}
              </Typography>
            </Box>

          </Box>
        </Box>

        {/* Divider */}
        <Divider
          sx={{
            my: { xs: 2, sm: 2.5 },
            borderStyle: "dashed",
            borderColor: alpha(
              theme.palette.divider,
              0.5
            ),
          }}
        />

        {/* Buttons */}
        <Stack direction="column" spacing={1.25}>

          <Stack direction="row" spacing={1}>

            {enableRead && (
              <Button
                onClick={
                  isSpeaking ? stop : speak
                }
                variant="contained"
                disableElevation
                startIcon={
                  isSpeaking
                    ? <SpeakingBars />
                    : <VolumeUpRoundedIcon />
                }
                aria-label={isSpeaking ? "పద్యం చదవడం ఆపండి" : "పద్యం వినండి"}
                sx={{
                  flex: 1,
                  borderRadius: "10px",
                  py: { xs: 1.4, sm: 1.2 },
                  textTransform: "none",
                  fontWeight: 700,
                  background: isSpeaking
                    ? alpha(
                        theme.palette.error.main,
                        0.1
                      )
                    : `linear-gradient(
                        135deg,
                        ${forestMid},
                        ${forestGreen}
                      )`,
                  color: isSpeaking
                    ? "error.main"
                    : "white",
                }}
              >
                {isSpeaking
                  ? "ఆపండి"
                  : "వినండి"}
              </Button>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <ShareButtons
                targetRef={poemRef}
              />
            </Box>

          </Stack>

          {/* AI Tools */}
          <Button
            onClick={() =>
              setVoiceOpen((v) => !v)
            }
            variant="outlined"
            fullWidth
            startIcon={
              <AutoAwesomeRoundedIcon />
            }
            endIcon={
              voiceOpen
                ? <ExpandLessRoundedIcon />
                : <ExpandMoreRoundedIcon />
            }
            aria-expanded={voiceOpen}
            sx={{
              borderRadius: "10px",
              py: { xs: 1.4, sm: 1.2 },
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            AI సాధనాలు — ధ్వని · కళ · వీడియో
          </Button>

        </Stack>

        {/* AI Panel */}
        <Collapse
          in={voiceOpen}
          timeout={320}
          unmountOnExit
        >
          <Box
            sx={{
              mt: 2,
              p: { xs: 1.5, sm: 2 },
              borderRadius: "12px",
              background: alpha(
                theme.palette.background.default,
                0.6
              ),
              border: `1px solid ${alpha(
                theme.palette.secondary.main,
                0.2
              )}`,
            }}
          >

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1.5,
              }}
            >
              <AutoAwesomeRoundedIcon
                sx={{
                  fontSize: 15,
                  color: "secondary.main",
                }}
              />

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "secondary.main",
                }}
              >
                ధ్వని · కళ · వీడియో
              </Typography>
            </Box>

            <TeluguVoice
              initialText={voiceText}
            />

          </Box>
        </Collapse>

      </CardContent>
    </Card>
  );
}