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

const POSTER_COLOR = {
  bg: "#F0F7F5",       // page/card background — text 15.0:1 against ink
  ink: "#0F241F",      // primary text
  inkMuted: "#3D5A54", // secondary text (author line)
  accent: "#0F4C43",   // title / divider bar — 9.1:1 on bg
  bronze: "#8A5A2B",   // poetryName label (decorative accent)
  border: "#0F4C43",
};

// CHANGE THIS if you save the cartoon under a different filename in /public.
const KAVI_IMAGE_SRC = "/CartoonStyle.png";

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

  // FIX: split the poem into its individual lines ONCE, up front, instead of
  // relying on a single Typography with whiteSpace:"pre-line". Rendering
  // each line as its own block guarantees a logical line never shares
  // wrap-flow with the next one.
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
            share/poster image, so it's styled with fixed Temple teal colors
            rather than theme.palette.* to keep the exported poster consistent
            regardless of the app's light/dark mode.

            LAYOUT: title (full width, centered) -> two-column table row
            (poem text left, kavi illustration right) -> footer (kavi name,
            centered). Built with a real <table> rather than flex/grid —
            html2canvas has unreliable flexbox/grid support, but renders
            table layout faithfully, which matters because this exact DOM
            is what gets captured for the shareable poster. */}
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
              border: `2px solid ${POSTER_COLOR.border}`,
              borderRadius: "10px",
              p: { xs: 2, sm: 3 },
            }}
          >

            {/* data-poster-title: lets ShareButtons.tsx apply poster-only
                font sizes in html2canvas's onclone, independent of these
                live/responsive rem values (which are tuned for in-app
                reading on screen, not for a poster viewed at a glance). */}
            <Typography
              data-poster-title
              sx={{
                fontWeight: 800,
                color: POSTER_COLOR.accent,
                mb: 1.5,
                fontFamily: "'Noto Serif Telugu', serif",
                lineHeight: 1.45,
                fontSize: {
                  xs: "1.1rem",
                  sm: "1.3rem",
                  md: "1.45rem",
                },
              }}
            >
              {poem.title}
            </Typography>

            <Box
              sx={{
                width: 32,
                height: 3,
                bgcolor: POSTER_COLOR.accent,
                mx: "auto",
                mb: { xs: 2, sm: 2.5 },
                borderRadius: 2,
              }}
            />

            {/* Two-column table: poem text left, kavi illustration right */}
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <Box component="tbody">
                <Box component="tr">
                  <Box
                    component="td"
                    sx={{
                      width: "70%",
                      verticalAlign: "middle",
                      textAlign: { xs: "left", sm: "left", md: "center" },
                      pr: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {contentLines.map((line, i) => (
                      <Typography
                        key={i}
                        data-poster-line
                        sx={{
                          fontSize: {
                            xs: "1.05rem",
                            sm: "1.18rem",
                            md: "1.25rem",
                          },
                          lineHeight: {
                            xs: 1.9,
                            sm: 1.85,
                            md: 2.3,
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

                  <Box
                    component="td"
                    sx={{
                      width: "30%",
                      verticalAlign: "middle",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      component="img"
                      data-poster-image
                      src={KAVI_IMAGE_SRC}
                      alt={authorText || poem.title}
                      sx={{
                        width: "100%",
                        maxWidth: { xs: 72, sm: 96, md: 120 },
                        height: "auto",
                        display: "block",
                        mx: "auto",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {(authorText || poetryName) && (
              <Box
                sx={{
                  mt: { xs: 2.5, sm: 3.5 },
                  textAlign: "center",
                }}
              >

                {authorText && (
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: {
                        xs: "0.82rem",
                        sm: "0.88rem",
                      },
                      color: POSTER_COLOR.inkMuted,
                    }}
                  >
                    — {authorText}
                  </Typography>
                )}

                {/* data-poster-hide: this is a site-navigation style label
                    ("📊 అన్ని శతకాలు" etc.), not poem content — it belongs on
                    the live card but not baked into a shareable image.
                    ShareButtons.tsx's onclone hides any element with this
                    attribute during export only. */}
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
              </Box>
            )}

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
            ✨ AI సాధనాలు — ధ్వని · కళ · వీడియో
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