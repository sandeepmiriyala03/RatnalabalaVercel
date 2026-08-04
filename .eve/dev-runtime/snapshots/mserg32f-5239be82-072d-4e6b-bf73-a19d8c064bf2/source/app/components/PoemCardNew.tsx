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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
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

// Same warm cream / editorial palette as PoemCard.tsx / ShareButtons.tsx.
// Hardcoded (not theme.palette.*) on purpose: the poster/video capture must
// look identical regardless of the app's light/dark mode or user theme.
const POSTER_COLOR = {
  bg: "#F7F2EA",
  ink: "#2B2620",
  inkMuted: "#6B6258",
  accent: "#2B2620",
  bronze: "#8B6F47",
  hairline: "#E4DACB",
};

const DEFAULT_KAVI_IMAGE_SRC = "/CartoonStyle.png";
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

// Voice choice — same three options and same /api/tts contract as
// PoemCard.tsx, so the two card variants behave identically.
type VoiceOption = "mohan" | "shruti" | "google";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Shruti)",
  google: "🔊 Google TTS",
};

// Background music — same genre set as PoemCard.tsx / PoemRadio.tsx, kept
// in sync deliberately so switching between card variants never feels
// like a different app.
type MusicOption = "none" | "guitar" | "tabla" | "drums" | "flute" | "veena";

const MUSIC_TRACKS: Record<MusicOption, { label: string; src: string | null }> = {
  none:   { label: "🔇 సంగీతం లేదు",   src: null },
  guitar: { label: "🎸 గిటార్",         src: "/audio/bg-music-guitar-loop.wav" },
  tabla:  { label: "🥁 తబలా",          src: "/audio/bg-music-tabla-loop.wav" },
  drums:  { label: "🪘 డ్రమ్స్",        src: "/audio/bg-music-drums-loop.wav" },
  flute:  { label: "🎶 వేణువు",         src: "/audio/bg-music-flute-loop.wav" },
  veena:  { label: "🎻 వీణ",           src: "/audio/bg-music-veena-loop.wav" },
};

const BG_MUSIC_VOLUME_DEFAULT = 0.18;

// Builds the exact text sent to TTS — title, poem content, and, when an
// author is known, a closing credit line naming them. Duplicated from
// PoemCard.tsx (same as fetchTtsAudio below) since these are separate
// self-contained components — kept identical on purpose so narration
// sounds the same regardless of which card variant is in use.
function buildNarrationText(title: string, content: string, authorText?: string): string {
  const base = `${title}. ${content}`;
  const author = authorText?.trim();
  return author ? `${base} ఈ పద్యం రాసినవారు ${author}.` : base;
}

// POST with a JSON body — Telugu text explodes in size once URL-encoded,
// so a GET query string risks hitting URL-length limits.
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

export default function PoemCardNew({
  poem,
  enableRead = true,
  authors,
  poetryName,
}: Props) {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const poemRef = useRef<HTMLDivElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicElRef = useRef<HTMLAudioElement | null>(null);

  // Video export refs — kept separate from the live-playback refs above so
  // "listen" and "download as video" never fight over the same <audio>
  // element if a person does both back to back.
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoAudioCtxRef = useRef<AudioContext | null>(null);

  const stopRef = useRef(false);

  const [voiceOpen, setVoiceOpen] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<VoiceOption>("mohan");
  const [musicChoice, setMusicChoice] = useState<MusicOption>("guitar");
  const [musicVolume, setMusicVolume] = useState(BG_MUSIC_VOLUME_DEFAULT);

  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const authorText = Array.isArray(authors)
    ? authors.join(", ")
    : authors;

  // Narration text — includes the poet's name at the end when known, so
  // the AI tools panel (TeluguVoice), live "వినండి" playback, browser
  // fallback, and video export all say the same thing: poem, then who
  // wrote it. Identical helper to PoemCard.tsx by design.
  const voiceText = useMemo(
    () => buildNarrationText(poem.title, poem.content, authorText),
    [poem.title, poem.content, authorText]
  );

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

  const kaviFocalPoint = useMemo(() => {
    const names = Array.isArray(authors)
      ? authors
      : authors
      ? [authors]
      : [];

    for (const name of names) {
      const normalized = name.trim();
      const matchKey = Object.keys(KAVI_FOCAL_MAP).find(
        (k) => k.trim() === normalized
      );
      if (matchKey) {
        return KAVI_FOCAL_MAP[matchKey];
      }
    }

    return DEFAULT_FOCAL_POINT;
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
    // Background music failing to load/play is non-critical — the poem
    // narration itself still works fine without it.
    bg.play().catch(() => {
      bgMusicElRef.current = null;
    });
  };

  /* 🔊 Browser fallback — line-by-line SpeechSynthesis reading, used only
     if the live /api/tts generation call fails (network issue, cold
     start, server error). Now includes the author credit as its own
     final line, same content as the live-generated version. */
  const browserSpeakFallback = async () => {

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    stopRef.current = false;

    const author = authorText?.trim();
    const lines = [
      poem.title,
      ...poem.content.split("\n"),
      ...(author ? [`ఈ పద్యం రాసినవారు ${author}.`] : []),
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
    stopBgMusic();
  };

  /* 🔊 Read poem — tries live /api/tts generation first (person's
     selected voice), only falling back to the browser voice above if
     that call itself fails. */
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
      // Live generation failed — fall back to the browser voice.
      setIsGenerating(false);
      startBgMusicIfEnabled();
      await browserSpeakFallback();
    }
  };

  /* ⛔ Stop reading */
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

  // Switching voice mid-playback stops whatever's currently playing —
  // otherwise the old voice keeps going while the dropdown visually shows
  // the new selection, which reads as broken.
  const handleVoiceChange = (event: any) => {
    if (isSpeaking) stop();
    setVoiceChoice(event.target.value as VoiceOption);
  };

  const handleMusicChange = (event: any) => {
    const next = event.target.value as MusicOption;
    setMusicChoice(next);
    // If music is currently playing under a live narration, swap the bed
    // in place rather than requiring a stop/start — same behavior as the
    // PoemRadio station player and PoemCard.tsx.
    if (isSpeaking) {
      stopBgMusic();
      startBgMusicIfEnabled();
    }
  };

  /* ── VIDEO EXPORT ──────────────────────────────────────────────
     Same approach as PoemCard.tsx: html2canvas captures the poster into
     a canvas, canvas.captureStream() turns that into a live video track,
     and the Web Audio API mixes narration + music into a matching audio
     track. MediaRecorder muxes both into a single .webm file. */
  const handleDownloadVideo = async () => {
    if (isRenderingVideo || !poemRef.current) return;

    setIsRenderingVideo(true);
    setVideoError(null);
    setVideoStatus("పోస్టర్ తయారు చేస్తోంది…");

    let audioCtx: AudioContext | null = null;
    let narrationUrl: string | null = null;

    try {
      const html2canvas = (await import("html2canvas")).default;

      const captureCanvas = await html2canvas(poemRef.current, {
        backgroundColor: POSTER_COLOR.bg,
        useCORS: true,
        scale: 2,
        windowWidth: 900,
      });

      setVideoStatus("వాయిస్ తయారు చేస్తోంది…");

      const narrationBlob = await fetchTtsAudio(voiceText, voiceChoice);
      narrationUrl = URL.createObjectURL(narrationBlob);

      const narrationEl = new Audio(narrationUrl);
      narrationEl.crossOrigin = "anonymous";

      const musicTrack = MUSIC_TRACKS[musicChoice];
      const musicEl = musicTrack.src ? new Audio(musicTrack.src) : null;
      if (musicEl) {
        musicEl.loop = true;
        musicEl.crossOrigin = "anonymous";
      }

      await new Promise<void>((resolve, reject) => {
        narrationEl.addEventListener("loadedmetadata", () => resolve(), { once: true });
        narrationEl.addEventListener("error", () => reject(new Error("narration load failed")), { once: true });
      });

      audioCtx = new AudioContext();
      videoAudioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      const narrationSource = audioCtx.createMediaElementSource(narrationEl);
      narrationSource.connect(dest);
      narrationSource.connect(audioCtx.destination);

      if (musicEl) {
        const musicSource = audioCtx.createMediaElementSource(musicEl);
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = musicVolume;
        musicSource.connect(musicGain).connect(dest);
        musicSource.connect(musicGain).connect(audioCtx.destination);
      }

      const videoStream = captureCanvas.captureStream(2);
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      videoRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      setVideoStatus("వీడియో రికార్డ్ అవుతోంది…");

      await new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error("recording failed"));

        recorder.start();
        narrationEl.play().catch(reject);
        musicEl?.play().catch(() => {});

        narrationEl.onended = () => {
          musicEl?.pause();
          recorder.stop();
        };
      });

      const videoBlob = new Blob(chunks, { type: "video/webm" });
      const downloadUrl = URL.createObjectURL(videoBlob);
      const cleanTitle = poem.title.trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 60) || "poem";
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${cleanTitle}.webm`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      setVideoStatus(null);
    } catch (err) {
      console.error("Video export failed:", err);
      setVideoError("వీడియో తయారు చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
      setVideoStatus(null);
    } finally {
      if (narrationUrl) URL.revokeObjectURL(narrationUrl);
      audioCtx?.close().catch(() => {});
      videoAudioCtxRef.current = null;
      videoRecorderRef.current = null;
      setIsRenderingVideo(false);
    }
  };

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

        {/* 📝 Poem — captured by both ShareButtons (poster image) and
            handleDownloadVideo (poster + audio → video). crossOrigin
            hints on images so html2canvas never taints the canvas it
            needs for video capture. */}
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
                alt={authorText || poem.title}
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
              <Typography
                sx={{
                  fontSize: { xs: "0.68rem", sm: "0.72rem" },
                  color: POSTER_COLOR.inkMuted,
                }}
              >
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
            borderColor: alpha(
              theme.palette.divider,
              0.5
            ),
          }}
        />

        <Stack direction="column" spacing={1.25}>

          {/* Voice + music selectors, side by side on larger screens —
              same layout as PoemCard.tsx. */}
          {enableRead && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <FormControl size="small" fullWidth>
                <InputLabel id={`voice-select-new-${poem.slug ?? poem.title}`}>
                  స్వరం ఎంచుకోండి
                </InputLabel>
                <Select
                  labelId={`voice-select-new-${poem.slug ?? poem.title}`}
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
                <InputLabel id={`music-select-new-${poem.slug ?? poem.title}`}>
                  నేపథ్య సంగీతం
                </InputLabel>
                <Select
                  labelId={`music-select-new-${poem.slug ?? poem.title}`}
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
          )}

          {enableRead && musicChoice !== "none" && (
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
                  : isGenerating
                  ? "తయారవుతోంది…"
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

          {/* Video export — full width, same behavior as PoemCard.tsx */}
          {enableRead && (
            <Button
              onClick={handleDownloadVideo}
              disabled={isRenderingVideo}
              variant="outlined"
              fullWidth
              startIcon={<MovieRoundedIcon fontSize="small" />}
              sx={{
                borderRadius: "10px",
                py: { xs: 1.4, sm: 1.2 },
                textTransform: "none",
                fontWeight: 700,
                borderColor: alpha(forestGreen, 0.4),
                color: forestGreen,
                "&:hover": {
                  borderColor: forestGreen,
                  background: alpha(forestGreen, 0.06),
                },
              }}
            >
              {isRenderingVideo ? (videoStatus ?? "వీడియో తయారవుతోంది…") : "వీడియోగా డౌన్‌లోడ్ చేయండి"}
            </Button>
          )}

          {videoError && (
            <Typography variant="caption" color="error" sx={{ px: 0.5 }}>
              {videoError}
            </Typography>
          )}

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
            ధ్వనికళాదర్శి మాల
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
              ధ్వనికళాదర్శి మాల
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