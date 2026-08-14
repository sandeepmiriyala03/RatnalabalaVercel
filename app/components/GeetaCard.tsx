"use client";
import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Stack,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  alpha,
  useTheme,
} from "@mui/material";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice from "@/app/components/TeluguVoice";

interface GeetaCardProps {
  verse: number;
  sloka: string;
  meaning: string;
  chapterLabel?: string;
  authors?: string | string[];
  poetryName?: string;
}

// Identical poster palette to PoemCardNew.tsx — hardcoded on purpose so
// the poster/video capture looks the same regardless of app theme.
const POSTER_COLOR = {
  bg: "#F7F2EA",
  ink: "#2B2620",
  inkMuted: "#6B6258",
  accent: "#2B2620",
  bronze: "#8B6F47",
  hairline: "#E4DACB",
};

const DEFAULT_KAVI_IMAGE_SRC = "/GeethaMain.png";
const KAVI_IMAGE_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "/MiriyalaRamakrishna.png",
  "శ్రీ ప్రసాదరావు మిరియాల గారు": "/Prasad.jpeg",
};

const KAVI_FOCAL_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "50% 15%",
  "శ్రీ ప్రసాదరావు మిరియాల గారు": "50% 15%",
};
const DEFAULT_FOCAL_POINT = "50% 20%";

const SITE_TAGLINE = "చదవండి · వినండి · పంచుకోండి";
const SITE_URL = "https://ratnalabala.vercel.app/";

// Same voice/music option sets as PoemCardNew.tsx, kept in sync
// deliberately so switching between poem cards and Geeta cards never
// feels like a different app.
type VoiceOption = "mohan" | "shruti" | "google";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Shruti)",
  google: "🔊 Google TTS",
};

type MusicOption = "none" | "guitar" | "tabla" | "drums" | "flute" | "veena";

const MUSIC_TRACKS: Record<MusicOption, { label: string; src: string | null }> = {
  none: { label: "🔇 సంగీతం లేదు", src: null },
  guitar: { label: "🎸 గిటార్", src: "/audio/bg-music-guitar-loop.wav" },
  tabla: { label: "🥁 తబలా", src: "/audio/bg-music-tabla-loop.wav" },
  drums: { label: "🪘 డ్రమ్స్", src: "/audio/bg-music-drums-loop.wav" },
  flute: { label: "🎶 వేణువు", src: "/audio/bg-music-flute-loop.wav" },
  veena: { label: "🎻 వీణ", src: "/audio/bg-music-veena-loop.wav" },
};

const BG_MUSIC_VOLUME_DEFAULT = 0.18;

// Builds the exact text sent to TTS — sloka, meaning, and, when a
// commentator/author is known, a closing credit line. Mirrors
// buildNarrationText in PoemCardNew.tsx, adapted for verse content.
function buildNarrationText(sloka: string, meaning: string, authorText?: string): string {
  const base = `${sloka} ${meaning}`.replace(/\n/g, " ").trim();
  const author = authorText?.trim();
  return author ? `${base} ఈ శ్లోకం రచించినవారు ${author}.` : base;
}

// POST with a JSON body — same contract as PoemCardNew.tsx's fetchTtsAudio.
async function fetchTtsAudio(text: string, voice: VoiceOption): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source: voice === "google" ? "google" : "edge",
      voice: voice === "shruti" ? "female" : "male",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`TTS request failed: ${res.status} ${errText}`);
  }

  return res.blob();
}

/* 🔊 Speaking Animation — identical to PoemCardNew.tsx */
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
            animation: `speakbar 0.9s ease-in-out ${i * 0.12}s infinite alternate`,
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

export default function GeetaCard({
  verse,
  sloka,
  meaning,
  chapterLabel,
  authors,
  poetryName,
}: GeetaCardProps) {
  const theme = useTheme();

  const posterRef = useRef<HTMLDivElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicElRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);

  const [voiceOpen, setVoiceOpen] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<VoiceOption>("mohan");
  const [musicChoice, setMusicChoice] = useState<MusicOption>("guitar");
  const [musicVolume, setMusicVolume] = useState(BG_MUSIC_VOLUME_DEFAULT);

  const authorText = Array.isArray(authors) ? authors.join(", ") : authors;

  const posterTitle = `శ్లోకం ${verse}`;

  const voiceText = useMemo(
    () => buildNarrationText(sloka, meaning, authorText),
    [sloka, meaning, authorText]
  );

  const kaviImageSrc = useMemo(() => {
    const names = Array.isArray(authors) ? authors : authors ? [authors] : [];

    for (const name of names) {
      const normalized = name.trim();
      const matchKey = Object.keys(KAVI_IMAGE_MAP).find((k) => k.trim() === normalized);
      if (matchKey) {
        return KAVI_IMAGE_MAP[matchKey];
      }
    }

    return DEFAULT_KAVI_IMAGE_SRC;
  }, [authors]);

  const kaviFocalPoint = useMemo(() => {
    const names = Array.isArray(authors) ? authors : authors ? [authors] : [];

    for (const name of names) {
      const normalized = name.trim();
      const matchKey = Object.keys(KAVI_FOCAL_MAP).find((k) => k.trim() === normalized);
      if (matchKey) {
        return KAVI_FOCAL_MAP[matchKey];
      }
    }

    return DEFAULT_FOCAL_POINT;
  }, [authors]);

  const slokaLines = useMemo(
    () =>
      sloka
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [sloka]
  );

  // Speaker-tag lines (e.g. "సంజయ ఉవాచ ।") can appear anywhere in the
  // sloka block — at the top (verse 1, 2, 24, 47) or mid-block (verse
  // 21, 25, 28). Pulled out so they render as a small caption above the
  // sloka rather than blending into the bold verse text.
  const { speakerTags, slokaBodyLines } = useMemo(() => {
    const tags: string[] = [];
    const body: string[] = [];
    for (const line of slokaLines) {
      if (line.includes("ఉవాచ")) {
        tags.push(line);
      } else {
        body.push(line);
      }
    }
    return { speakerTags: tags, slokaBodyLines: body };
  }, [slokaLines]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const forestGreen = "#1a3d2b";
  const forestMid = "#2d6a4f";

  const stopBgMusic = () => {
    if (bgMusicElRef.current) {
      bgMusicElRef.current.pause();
      bgMusicElRef.current.currentTime = 0;
      bgMusicElRef.current = null;
    }
  };

  const startBgMusicIfEnabled = () => {
    const track = MUSIC_TRACKS[musicChoice];
    if (!track.src) return;
    const bg = new Audio(track.src);
    bg.loop = true;
    bg.volume = musicVolume;
    bgMusicElRef.current = bg;
    bg.play().catch(() => {
      bgMusicElRef.current = null;
    });
  };

  /* 🔊 Browser fallback — line-by-line, used only if live /api/tts fails. */
  const browserSpeakFallback = async () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    stopRef.current = false;

    const author = authorText?.trim();
    const lines = [
      posterTitle,
      ...sloka.split("\n"),
      "అర్థం",
      ...meaning.split("\n"),
      ...(author ? [`ఈ శ్లోకం రచించినవారు ${author}.`] : []),
    ]
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (stopRef.current) break;

      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.lang = "te-IN";
        utterance.rate = 0.85;

        const teluguVoice = window.speechSynthesis
          .getVoices()
          .find((voice) => voice.lang.startsWith("te"));

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
    stopBgMusic();
  };

  /* 🔊 Read verse — tries live /api/tts first, falls back to browser voice. */
  const speak = async () => {
    setIsSpeaking(true);
    setIsGenerating(true);
    stopRef.current = false;

    try {
      const blob = await fetchTtsAudio(voiceText, voiceChoice);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioElRef.current = audio;
      setIsGenerating(false);

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioElRef.current = null;
        stopBgMusic();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        audioElRef.current = null;
        stopBgMusic();
        browserSpeakFallback();
      };

      startBgMusicIfEnabled();
      await audio.play();
    } catch {
      setIsGenerating(false);
      startBgMusicIfEnabled();
      await browserSpeakFallback();
    }
  };

  const stop = () => {
    stopRef.current = true;
    setIsGenerating(false);

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }

    stopBgMusic();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleVoiceChange = (event: any) => {
    if (isSpeaking) stop();
    setVoiceChoice(event.target.value as VoiceOption);
  };

  const handleMusicChange = (event: any) => {
    const next = event.target.value as MusicOption;
    setMusicChoice(next);
    if (isSpeaking) {
      stopBgMusic();
      startBgMusicIfEnabled();
    }
  };

  const shareTitle = `గీతామాల  శ్లోకం ${verse}${chapterLabel ? ` (${chapterLabel})` : ""}`;

  return (
    <Card
      elevation={0}
      sx={{
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: "18px", sm: "16px" },
        background: theme.palette.background.paper,
        borderLeft: "4px solid #14532D",
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 2px 16px ${alpha(theme.palette.common.black, 0.05)}`,
        overflow: "visible",
      }}
    >
      <CardContent
        sx={{
          p: { xs: "20px 16px", sm: "28px 28px 24px" },
          "&:last-child": { pb: { xs: "20px", sm: "24px" } },
        }}
      >
        {/* 📝 Poster — captured by ShareButtons */}
        <Box
          ref={posterRef}
          data-poster-root
          lang="te"
          sx={{
            textAlign: "center",
            bgcolor: POSTER_COLOR.bg,
            borderRadius: "12px",
            p: { xs: 2, sm: 3 },
          }}
        >
          <Box data-poster-body sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label={posterTitle}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#14532D14", color: "#14532D" }}
              />
            </Stack>

            {chapterLabel && (
              <Typography
                data-poster-title
                sx={{
                  fontWeight: 600,
                  color: POSTER_COLOR.accent,
                  mb: 2,
                  fontFamily: "'Noto Serif Telugu', serif",
                  letterSpacing: 0.5,
                  lineHeight: 1.4,
                  fontSize: { xs: "1.05rem", sm: "1.2rem", md: "1.3rem" },
                }}
              >
                {chapterLabel}
              </Typography>
            )}

            <Box
              data-poster-divider
              sx={{
                width: 40,
                height: 1,
                bgcolor: POSTER_COLOR.hairline,
                mx: "auto",
                mb: { xs: 2.5, sm: 3 },
              }}
            />

            <Box
              data-poster-image
              sx={{
                width: { xs: 140, sm: 170, md: 190 },
                height: { xs: 140, sm: 170, md: 190 },
                borderRadius: "50%",
                overflow: "hidden",
                mx: "auto",
                mb: { xs: 2.5, sm: 3 },
                border: `1px solid ${POSTER_COLOR.hairline}`,
              }}
            >
              <Box
                component="img"
                data-poster-image-inner
                src={kaviImageSrc}
                alt={authorText || posterTitle}
                crossOrigin="anonymous"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: kaviFocalPoint,
                  display: "block",
                }}
              />
            </Box>

            {/* Speaker tag(s) — e.g. "సంజయ ఉవాచ ।" — set apart as a small
                italic caption, same visual family as the అర్థం label,
                so they read as a stage direction rather than verse text. */}
            {speakerTags.length > 0 && (
              <Typography
                data-poster-speaker
                sx={{
                  fontStyle: "italic",
                  fontSize: { xs: "0.78rem", sm: "0.82rem" },
                  color: POSTER_COLOR.inkMuted,
                  fontFamily: "'Noto Serif Telugu', serif",
                  mb: 1,
                }}
              >
                {speakerTags.join(" · ")}
              </Typography>
            )}

            {/* Sloka — Sanskrit, own visual block */}
            <Box sx={{ mb: 1.5 }}>
              {slokaBodyLines.map((line, i) => (
                <Typography
                  key={i}
                  data-poster-line
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                    lineHeight: { xs: 1.85, sm: 1.9, md: 2.1 },
                    color: POSTER_COLOR.ink,
                    fontFamily: "'Noto Serif Telugu', serif",
                    mb: i === slokaBodyLines.length - 1 ? 0 : { xs: 0.5, sm: 0.75, md: 1 },
                    overflowWrap: "break-word",
                  }}
                >
                  {line}
                </Typography>
              ))}
            </Box>

            <Divider sx={{ my: 1.5, borderColor: POSTER_COLOR.hairline }} />

            {/* Meaning — Telugu, separate section */}
            <Typography
              variant="overline"
              sx={{ display: "block", mb: 0.5, color: POSTER_COLOR.inkMuted, letterSpacing: 1.5 }}
            >
              అర్థం
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "0.95rem", sm: "1rem" },
                lineHeight: 1.8,
                color: POSTER_COLOR.inkMuted,
                fontFamily: "'Noto Serif Telugu', serif",
                overflowWrap: "break-word",
              }}
            >
              {meaning}
            </Typography>

            {authorText && (
              <Typography
                data-poster-author
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
              <Typography sx={{ fontSize: { xs: "0.68rem", sm: "0.72rem" }, color: POSTER_COLOR.inkMuted }}>
                {SITE_URL}
              </Typography>

              <Box
                component="img"
                data-poster-footer-image
                src="/cartoonkids1.png"
                alt=""
                crossOrigin="anonymous"
                sx={{
                  width: "100%",
                  maxWidth: 460,
                  height: "auto",
                  display: "block",
                  mx: "auto",
                  mt: { xs: 2, sm: 2.5 },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider
          sx={{
            my: { xs: 2, sm: 2.5 },
            borderStyle: "dashed",
            borderColor: alpha(theme.palette.divider, 0.5),
          }}
        />

        <Stack direction="column" spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <FormControl size="small" fullWidth>
              <InputLabel id={`voice-select-geeta-${verse}`}>స్వరం ఎంచుకోండి</InputLabel>
              <Select
                labelId={`voice-select-geeta-${verse}`}
                label="స్వరం ఎంచుకోండి"
                value={voiceChoice}
                onChange={handleVoiceChange}
              >
                {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                  <MenuItem key={v} value={v}>
                    {VOICE_LABELS[v]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id={`music-select-geeta-${verse}`}>నేపథ్య సంగీతం</InputLabel>
              <Select
                labelId={`music-select-geeta-${verse}`}
                label="నేపథ్య సంగీతం"
                value={musicChoice}
                onChange={handleMusicChange}
              >
                {(Object.keys(MUSIC_TRACKS) as MusicOption[]).map((m) => (
                  <MenuItem key={m} value={m}>
                    {MUSIC_TRACKS[m].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {musicChoice !== "none" && (
            <Box sx={{ px: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                సంగీతం వాల్యూమ్
              </Typography>
              <Slider
                size="small"
                value={musicVolume}
                min={0}
                max={0.5}
                step={0.02}
                onChange={(_, v) => {
                  const vol = v as number;
                  setMusicVolume(vol);
                  if (bgMusicElRef.current) bgMusicElRef.current.volume = vol;
                }}
              />
            </Box>
          )}

          <Stack direction="row" spacing={1}>
            <Button
              onClick={isSpeaking ? stop : speak}
              variant="contained"
              disableElevation
              startIcon={isSpeaking ? <SpeakingBars /> : <VolumeUpRoundedIcon />}
              aria-label={isSpeaking ? "శ్లోకం చదవడం ఆపండి" : "శ్లోకం వినండి"}
              sx={{
                flex: 1,
                borderRadius: "10px",
                py: { xs: 1.4, sm: 1.2 },
                textTransform: "none",
                fontWeight: 700,
                background: isSpeaking
                  ? alpha(theme.palette.error.main, 0.1)
                  : `linear-gradient(135deg, ${forestMid}, ${forestGreen})`,
                color: isSpeaking ? "error.main" : "white",
              }}
            >
              {isSpeaking ? "ఆపండి" : isGenerating ? "తయారవుతోంది…" : "వినండి"}
            </Button>

            <Box sx={{ display: "flex", alignItems: "stretch" }}>
              <ShareButtons targetRef={posterRef} title={shareTitle} text={voiceText} />
            </Box>
          </Stack>

          <Button
            onClick={() => setVoiceOpen((v) => !v)}
            variant="outlined"
            fullWidth
            startIcon={<AutoAwesomeRoundedIcon />}
            endIcon={voiceOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            aria-expanded={voiceOpen}
            sx={{ borderRadius: "10px", py: { xs: 1.4, sm: 1.2 }, textTransform: "none", fontWeight: 700 }}
          >
            ధ్వనికళాదర్శి మాల
          </Button>
        </Stack>

        <Collapse in={voiceOpen} timeout={320} unmountOnExit>
          <Box
            sx={{
              mt: 2,
              p: { xs: 1.5, sm: 2 },
              borderRadius: "12px",
              background: alpha(theme.palette.background.default, 0.6),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 15, color: "secondary.main" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "secondary.main" }}>
                ధ్వనికళాదర్శి మాల
              </Typography>
            </Box>

            <TeluguVoice initialText={voiceText} />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}