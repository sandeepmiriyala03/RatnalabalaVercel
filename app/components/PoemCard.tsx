"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Box, Typography, Card, CardContent, Divider,
  Button, Stack, Collapse, TextField,
  Select, MenuItem, FormControl, InputLabel,
  Slider, LinearProgress, CircularProgress,
  alpha, useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import VolumeUpRoundedIcon        from "@mui/icons-material/VolumeUpRounded";
import VolumeDownRoundedIcon      from "@mui/icons-material/VolumeDownRounded";
import MovieRoundedIcon           from "@mui/icons-material/MovieRounded";
import AutoAwesomeRoundedIcon     from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon      from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon      from "@mui/icons-material/ExpandLessRounded";
import TuneRoundedIcon            from "@mui/icons-material/TuneRounded";
import QuestionAnswerRoundedIcon  from "@mui/icons-material/QuestionAnswerRounded";
import SendRoundedIcon            from "@mui/icons-material/SendRounded";

import ShareButtons from "@/app/components/ShareBar";
import TeluguVoice  from "@/app/components/TeluguVoice";

/* ------------------------------------------------------------------ */
/* Poster (exported image / video) — colours must stay light & fixed   */
/* ------------------------------------------------------------------ */

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
  "డాక్టర్ మిరియాల రామకృష్ణ": "/MiriaPen.jpg",
};

const KAVI_FOCAL_MAP: Record<string, string> = {
  "డాక్టర్ మిరియాల రామకృష్ణ": "50% 15%",
};
const DEFAULT_FOCAL_POINT = "50% 20%";

const SITE_TAGLINE = "చదవండి · వినండి · పంచుకోండి";
const SITE_URL = "https://ratnalabala.vercel.app";

/* ------------------------------------------------------------------ */
/* Voice + music options                                               */
/* ------------------------------------------------------------------ */

type VoiceOption = "mohan" | "shruti" | "google" | "svara-male" | "svara-female";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Shruti)",
  google: "🔊 Google TTS",
  "svara-male": "🤖 Svara మగ",
  "svara-female": "🤖 Svara స్త్రీ",
};

// Short names for the one-line settings summary.
const VOICE_SHORT: Record<VoiceOption, string> = {
  mohan: "మగ స్వరం",
  shruti: "స్త్రీ స్వరం",
  google: "Google",
  "svara-male": "Svara మగ",
  "svara-female": "Svara స్త్రీ",
};

type MusicOption = "none" | "guitar" | "tabla" | "drums" | "flute" | "veena";

const MUSIC_TRACKS: Record<MusicOption, { label: string; short: string; src: string | null }> = {
  none:   { label: "🔇 సంగీతం లేదు", short: "సంగీతం లేదు", src: null },
  guitar: { label: "🎸 గిటార్",       short: "గిటార్",       src: "/audio/bg-music-guitar-loop.wav" },
  tabla:  { label: "🥁 తబలా",        short: "తబలా",        src: "/audio/bg-music-tabla-loop.wav" },
  drums:  { label: "🪘 డ్రమ్స్",      short: "డ్రమ్స్",      src: "/audio/bg-music-drums-loop.wav" },
  flute:  { label: "🎶 వేణువు",       short: "వేణువు",       src: "/audio/bg-music-flute-loop.wav" },
  veena:  { label: "🎻 వీణ",         short: "వీణ",         src: "/audio/bg-music-veena-loop.wav" },
};

const BG_MUSIC_VOLUME_DEFAULT = 0.18;

/* ------------------------------------------------------------------ */
/* Ask-AI — same feature as PoemCardNew.tsx                            */
/* ------------------------------------------------------------------ */

// Auto-filled into the question box the moment the AI panel opens, so
// the person can just tap send immediately. They can still edit or clear it.
const DEFAULT_AI_QUESTION = "ఈ పద్యం భావం ఏమిటి? సులభంగా వివరించండి.";

// Asks the Groq-backed poem-ai endpoint a question about THIS specific
// poem. The backend reads the real .md file itself (by collection +
// filename), so the answer is grounded in the actual poem text on disk.
async function askPoemAI(
  collection: string,
  filename: string,
  question: string
): Promise<string> {
  const res = await fetch("/api/main?endpoint=poem-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection, filename, question }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || "సమాధానం రాలేదు — మళ్ళీ ప్రయత్నించండి.");
  }

  return data.answer as string;
}

/* ------------------------------------------------------------------ */
/* Shared helpers (duplicated in PoemCardNew.tsx on purpose — the two  */
/* card components are separate self-contained files, so "వినండి",     */
/* the video export and the AI tools panel narrate the same text)      */
/* ------------------------------------------------------------------ */

// Title, poem content and, when an author is known, a closing credit line.
function buildNarrationText(title: string, content: string, authorText?: string): string {
  const base = `${title}. ${content}`;
  const author = authorText?.trim();
  return author ? `${base} ఈ పద్యం రాసినవారు ${author}.` : base;
}

// VoiceOption -> the { source, gender } shape the shared /api/tts contract expects.
function resolveTtsParams(voice: VoiceOption): { source: "edge" | "google" | "svara"; gender: "male" | "female" } {
  if (voice === "google") return { source: "google", gender: "male" };
  if (voice === "svara-male") return { source: "svara", gender: "male" };
  if (voice === "svara-female") return { source: "svara", gender: "female" };
  return { source: "edge", gender: voice === "shruti" ? "female" : "male" };
}

async function fetchTtsAudio(text: string, voice: VoiceOption): Promise<Blob> {
  const { source, gender } = resolveTtsParams(voice);
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, voice: gender }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`TTS request failed: ${res.status} ${errText}`);
  }

  return res.blob();
}

function SpeakingBars() {
  return (
    <span aria-hidden style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 14, width: 14 }}>
      {[3, 6, 4, 7, 2].map((h, i) => (
        <span
          key={i}
          className="speakbar"
          style={{
            width: 2, height: h, borderRadius: 1,
            background: "currentColor", display: "inline-block",
            animation: `speakbar 0.9s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes speakbar{0%{transform:scaleY(0.4)}100%{transform:scaleY(1.4)}}
        @media (prefers-reduced-motion: reduce){.speakbar{animation:none!important}}
      `}</style>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface Poem {
  title: string;
  content: string;
  slug?: string;
  // Needed for the AI assistant — /api/main?endpoint=poem-ai reads the
  // poem's actual .md file server-side by collection + filename, so both
  // must be present. Optional: the AI button simply doesn't render if
  // either is missing.
  filename?: string;
  collection?: string;
}

type Props = {
  poem:        Poem;
  ready:       boolean;
  speak:       (text: string) => void;
  stopSpeech:  () => void;
  authors?:    string | string[];
  poetryName?: string;
  /** Optional — if every poem in this list is from the SAME collection, pass
   * it once here instead of on every poem. poem.collection wins if both
   * are present (correct for merged "all collections" views). */
  collection?: string;
};

const FOREST_GREEN = "#1a3d2b";
const FOREST_MID   = "#2d6a4f";

export default function PoemCard({
  poem, ready, speak, stopSpeech, authors, poetryName,
  collection: collectionProp,
}: Props) {
  const theme = useTheme();
  const uid   = useId();

  const poemRef          = useRef<HTMLDivElement>(null);
  const audioElRef       = useRef<HTMLAudioElement | null>(null);
  const bgMusicElRef     = useRef<HTMLAudioElement | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoAudioCtxRef = useRef<AudioContext | null>(null);

  // Bumped on every play / stop so a slow TTS response can't start playing
  // after the reader already pressed "ఆపండి".
  const speakSessionRef       = useRef(0);
  const fallbackTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browserSpeechActiveRef = useRef(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen,    setToolsOpen]    = useState(false);
  const [aiOpen,       setAiOpen]       = useState(false);
  const [aiQuestion,   setAiQuestion]   = useState("");
  const [aiAnswer,     setAiAnswer]     = useState<string | null>(null);
  const [aiError,      setAiError]      = useState<string | null>(null);
  const [aiLoading,    setAiLoading]    = useState(false);

  // poem.collection wins over the prop (see Props). The AI button and panel
  // only render when this poem can actually be looked up by collection + filename.
  const collection = poem.collection ?? collectionProp;
  const canAskAI = Boolean(collection && poem.filename);

  // The moment the AI panel opens, drop the default question into the box.
  // Only fills when empty, so reopening never stomps on the person's own text.
  useEffect(() => {
    if (aiOpen && canAskAI && !aiQuestion.trim()) {
      setAiQuestion(DEFAULT_AI_QUESTION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiOpen, canAskAI]);

  // Reset the Q&A state when the poem changes, so a stale answer from a
  // previous poem can never show under a new one.
  useEffect(() => {
    setAiQuestion("");
    setAiAnswer(null);
    setAiError(null);
    setAiLoading(false);
  }, [poem.slug, poem.filename, collection]);

  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceChoice,  setVoiceChoice]  = useState<VoiceOption>("mohan");
  const [musicChoice,  setMusicChoice]  = useState<MusicOption>("guitar");
  const [musicVolume,  setMusicVolume]  = useState(BG_MUSIC_VOLUME_DEFAULT);

  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoError,  setVideoError]  = useState<string | null>(null);

  const authorText = Array.isArray(authors) ? authors.join(", ") : authors;

  const voiceText = useMemo(
    () => buildNarrationText(poem.title, poem.content, authorText),
    [poem.title, poem.content, authorText]
  );

  const kaviImageSrc = useMemo(() => {
    const names = Array.isArray(authors) ? authors : authors ? [authors] : [];
    for (const name of names) {
      if (KAVI_IMAGE_MAP[name.trim()]) return KAVI_IMAGE_MAP[name.trim()];
    }
    return DEFAULT_KAVI_IMAGE_SRC;
  }, [authors]);

  const kaviFocalPoint = useMemo(() => {
    const names = Array.isArray(authors) ? authors : authors ? [authors] : [];
    for (const name of names) {
      if (KAVI_FOCAL_MAP[name.trim()]) return KAVI_FOCAL_MAP[name.trim()];
    }
    return DEFAULT_FOCAL_POINT;
  }, [authors]);

  const contentLines = useMemo(
    () => poem.content.split("\n").map((line) => line.trim()).filter(Boolean),
    [poem.content]
  );

  const settingsSummary = `${VOICE_SHORT[voiceChoice]} · ${MUSIC_TRACKS[musicChoice].short}`;

  /* ---------------------------- audio ---------------------------- */

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

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

  const handleSpeak = async () => {
    const session = ++speakSessionRef.current;
    setIsSpeaking(true);
    setIsGenerating(true);

    try {
      const blob = await fetchTtsAudio(voiceText, voiceChoice);
      if (session !== speakSessionRef.current) return; // stopped while loading

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
        browserSpeechActiveRef.current = true;
        speak(voiceText);
      };

      startBgMusicIfEnabled();
      await audio.play();
    } catch {
      if (session !== speakSessionRef.current) return;
      setIsGenerating(false);
      startBgMusicIfEnabled();
      browserSpeechActiveRef.current = true;
      speak(voiceText);
      clearFallbackTimer();
      fallbackTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
        stopBgMusic();
        browserSpeechActiveRef.current = false;
      }, 60_000);
    }
  };

  const handleStop = () => {
    speakSessionRef.current += 1;
    clearFallbackTimer();
    setIsSpeaking(false);
    setIsGenerating(false);

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current = null;
    }

    stopBgMusic();
    browserSpeechActiveRef.current = false;
    stopSpeech();
  };

  // Leaving the page / unmounting the card must not leave audio playing.
  useEffect(() => {
    return () => {
      speakSessionRef.current += 1;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      audioElRef.current?.pause();
      bgMusicElRef.current?.pause();
      if (browserSpeechActiveRef.current) stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoiceChange = (event: SelectChangeEvent<VoiceOption>) => {
    if (isSpeaking) handleStop();
    setVoiceChoice(event.target.value as VoiceOption);
  };

  const handleMusicChange = (event: SelectChangeEvent<MusicOption>) => {
    const next = event.target.value as MusicOption;
    setMusicChoice(next);
    if (isSpeaking) {
      stopBgMusic();
      // startBgMusicIfEnabled reads musicChoice from the closure, so start the
      // new track directly here instead of waiting for the next render.
      const track = MUSIC_TRACKS[next];
      if (track.src) {
        const bg = new Audio(track.src);
        bg.loop = true;
        bg.volume = musicVolume;
        bgMusicElRef.current = bg;
        bg.play().catch(() => { bgMusicElRef.current = null; });
      }
    }
  };

  /* ---------------------------- ask AI ---------------------------- */

  const handleAskAI = async () => {
    const trimmed = aiQuestion.trim();
    if (!trimmed || !collection || !poem.filename) return;

    setAiLoading(true);
    setAiError(null);
    setAiAnswer(null);

    try {
      const answer = await askPoemAI(collection, poem.filename, trimmed);
      setAiAnswer(answer);
    } catch (err: any) {
      setAiError(err.message || "ఏదో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuestionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Enter submits, Shift+Enter still allows a newline in the question.
    // (Enter that only confirms a Telugu keyboard composition is ignored.)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!aiLoading) handleAskAI();
    }
  };

  /* ---------------------------- video ---------------------------- */

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
        musicSource.connect(musicGain);
        musicGain.connect(dest);
        musicGain.connect(audioCtx.destination);
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

  /* ---------------------------- styles ---------------------------- */

  const focusRing = {
    "&:focus-visible": {
      outline: `2px solid ${FOREST_MID}`,
      outlineOffset: 2,
    },
  };

  const listenLabel = isGenerating ? "తయారవుతోంది…" : isSpeaking ? "ఆపండి" : "వినండి";

  const listenIcon = isGenerating
    ? <CircularProgress size={18} color="inherit" thickness={5} />
    : isSpeaking
    ? <SpeakingBars />
    : <VolumeUpRoundedIcon />;

  const quietButtonSx = {
    borderRadius: "10px",
    minHeight: 46,
    textTransform: "none" as const,
    fontWeight: 600,
    fontSize: { xs: "0.92rem", sm: "0.88rem" },
    borderColor: alpha(FOREST_GREEN, 0.28),
    color: FOREST_GREEN,
    "&:hover": {
      borderColor: alpha(FOREST_GREEN, 0.6),
      background: alpha(FOREST_GREEN, 0.05),
    },
    "&:active": { transform: "scale(0.98)" },
    transition: "background 0.15s, border-color 0.15s, transform 0.15s",
    ...focusRing,
  };

  /* ----------------------------- render ----------------------------- */

  return (
    <Card
      component="article"
      elevation={0}
      sx={{
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: "18px", sm: "16px" },
        background: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 2px 16px ${alpha(theme.palette.common.black, 0.05)}`,
        overflow: "visible",
      }}
    >
      <CardContent sx={{
        p: { xs: "16px 14px", sm: "24px 24px 20px" },
        "&:last-child": { pb: { xs: "16px", sm: "20px" } },
      }}>

        {/* ============ POSTER — captured for share image + video ============ */}
        <Box ref={poemRef} data-poster-root lang="te" sx={{
          textAlign: "center",
          bgcolor: POSTER_COLOR.bg,
          borderRadius: "12px",
          p: { xs: 2, sm: 3 },
        }}>

          <Box data-poster-body sx={{ p: { xs: 2, sm: 3 } }}>

            <Typography component="h2" data-poster-title sx={{
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

            <Box data-poster-divider sx={{
              width: 40, height: 1, bgcolor: POSTER_COLOR.hairline,
              mx: "auto", mb: { xs: 2.5, sm: 3 },
            }} />

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
              <Typography data-poster-author sx={{
                mt: { xs: 2.5, sm: 3 },
                fontWeight: 500,
                fontSize: { xs: "0.82rem", sm: "0.88rem" },
                color: POSTER_COLOR.inkMuted,
              }}>
                — {authorText}
              </Typography>
            )}

            {poetryName && (
              <Typography data-poster-hide variant="caption" sx={{
                display: "block", mt: 0.5, letterSpacing: 1,
                fontWeight: 700,
                color: POSTER_COLOR.bronze,
              }}>
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
              <Typography sx={{
                fontSize: { xs: "0.68rem", sm: "0.72rem" },
                fontWeight: 700,
                letterSpacing: 1.5,
                color: POSTER_COLOR.ink,
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

        {/* ============ CONTROLS ============ */}
        <Stack spacing={1.25} sx={{ mt: { xs: 2, sm: 2.5 } }}>

          {/* 1 — Primary: listen + share */}
          <Stack direction="row" spacing={1} alignItems="stretch">
            <Button
              onClick={isSpeaking || isGenerating ? handleStop : handleSpeak}
              disabled={!ready}
              variant="contained"
              disableElevation
              startIcon={listenIcon}
              aria-label={isSpeaking || isGenerating ? "ఆపండి" : "పద్యం వినండి"}
              sx={{
                flex: 1,
                borderRadius: "12px",
                minHeight: 52,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1rem",
                background: isSpeaking || isGenerating
                  ? alpha(theme.palette.error.main, 0.1)
                  : !ready
                  ? undefined
                  : `linear-gradient(135deg, ${FOREST_MID}, ${FOREST_GREEN})`,
                color: isSpeaking || isGenerating ? "error.main" : "white",
                border: isSpeaking || isGenerating
                  ? `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`
                  : "1.5px solid transparent",
                "&:hover": {
                  background: isSpeaking || isGenerating
                    ? alpha(theme.palette.error.main, 0.16)
                    : `linear-gradient(135deg, ${FOREST_MID}, ${FOREST_GREEN})`,
                },
                "&:active": { transform: "scale(0.98)" },
                transition: "background 0.15s, transform 0.15s",
                ...focusRing,
              }}
            >
              {listenLabel}
            </Button>

            <Box sx={{ flex: "0 0 auto", display: "flex", alignItems: "stretch" }}>
              <ShareButtons targetRef={poemRef} />
            </Box>
          </Stack>

          {/* 2 — Voice & music, collapsed, with a one-line summary of the current choice */}
          <Button
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
            aria-controls={`${uid}-settings`}
            variant="text"
            fullWidth
            sx={{
              justifyContent: "space-between",
              borderRadius: "10px",
              px: 1.5,
              py: 0.9,
              minHeight: 44,
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.85rem",
              "&:hover": { background: alpha(FOREST_GREEN, 0.05) },
              ...focusRing,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <TuneRoundedIcon sx={{ fontSize: 18, flexShrink: 0 }} />
              <Typography component="span" noWrap sx={{ fontSize: "inherit" }}>
                స్వరం, సంగీతం: <b style={{ fontWeight: 600 }}>{settingsSummary}</b>
              </Typography>
            </Box>
            {settingsOpen
              ? <ExpandLessRoundedIcon fontSize="small" />
              : <ExpandMoreRoundedIcon fontSize="small" />}
          </Button>

          <Collapse in={settingsOpen} timeout={240} unmountOnExit>
            <Box
              id={`${uid}-settings`}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                background: alpha(theme.palette.background.default, 0.6),
                border: `1px solid ${alpha(theme.palette.divider, 0.18)}`,
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <FormControl size="small" fullWidth>
                  <InputLabel id={`${uid}-voice-label`}>స్వరం</InputLabel>
                  <Select
                    labelId={`${uid}-voice-label`}
                    label="స్వరం"
                    value={voiceChoice}
                    onChange={handleVoiceChange}
                  >
                    {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                      <MenuItem key={v} value={v}>{VOICE_LABELS[v]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel id={`${uid}-music-label`}>నేపథ్య సంగీతం</InputLabel>
                  <Select
                    labelId={`${uid}-music-label`}
                    label="నేపథ్య సంగీతం"
                    value={musicChoice}
                    onChange={handleMusicChange}
                  >
                    {(Object.keys(MUSIC_TRACKS) as MusicOption[]).map((m) => (
                      <MenuItem key={m} value={m}>{MUSIC_TRACKS[m].label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {musicChoice !== "none" && (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5, px: 0.5 }}>
                  <VolumeDownRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                  <Slider
                    size="small"
                    aria-label="సంగీతం వాల్యూమ్"
                    value={musicVolume}
                    min={0}
                    max={0.5}
                    step={0.02}
                    onChange={(_, v) => {
                      const vol = v as number;
                      setMusicVolume(vol);
                      if (bgMusicElRef.current) bgMusicElRef.current.volume = vol;
                    }}
                    sx={{ color: FOREST_MID }}
                  />
                  <VolumeUpRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                </Stack>
              )}
            </Box>
          </Collapse>

          {/* 3 — Secondary actions */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              onClick={handleDownloadVideo}
              disabled={isRenderingVideo}
              variant="outlined"
              fullWidth
              startIcon={
                isRenderingVideo
                  ? <CircularProgress size={16} color="inherit" thickness={5} />
                  : <MovieRoundedIcon fontSize="small" />
              }
              sx={quietButtonSx}
            >
              {isRenderingVideo ? (videoStatus ?? "వీడియో తయారవుతోంది…") : "వీడియోగా డౌన్‌లోడ్ చేయండి"}
            </Button>

            {canAskAI && (
              <Button
                onClick={() => setAiOpen((v) => !v)}
                aria-expanded={aiOpen}
                aria-controls={`${uid}-ai`}
                variant="outlined"
                fullWidth
                color="secondary"
                startIcon={<QuestionAnswerRoundedIcon fontSize="small" />}
                endIcon={aiOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                sx={{
                  ...quietButtonSx,
                  color: "secondary.main",
                  borderColor: alpha(theme.palette.secondary.main, 0.5),
                  "&:hover": {
                    borderColor: "secondary.main",
                    background: alpha(theme.palette.secondary.main, 0.06),
                  },
                }}
              >
                పద్యం గురించి అడగండి (AI)
              </Button>
            )}
          </Stack>

          {isRenderingVideo && (
            <LinearProgress
              aria-label="వీడియో తయారీ"
              sx={{
                borderRadius: 4,
                height: 4,
                bgcolor: alpha(FOREST_GREEN, 0.1),
                "& .MuiLinearProgress-bar": { bgcolor: FOREST_MID },
              }}
            />
          )}

          <Box role="status" aria-live="polite">
            {videoError && (
              <Typography variant="caption" color="error" sx={{ px: 0.5, display: "block" }}>
                {videoError}
              </Typography>
            )}
          </Box>

          {/* AI Panel — Q&A assistant about this poem */}
          {canAskAI && (
            <Collapse in={aiOpen} timeout={320} unmountOnExit>
              <Box
                id={`${uid}-ai`}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: "12px",
                  background: alpha(theme.palette.background.default, 0.6),
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <QuestionAnswerRoundedIcon sx={{ fontSize: 15, color: "secondary.main" }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "secondary.main" }}>
                    పద్యం గురించి అడగండి
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    maxRows={4}
                    placeholder="ఈ పద్యం భావం ఏమిటి? ఏదైనా ప్రశ్న అడగండి…"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={handleQuestionKeyDown}
                    disabled={aiLoading}
                  />
                  <Button
                    onClick={handleAskAI}
                    disabled={aiLoading || !aiQuestion.trim()}
                    variant="contained"
                    color="secondary"
                    sx={{ minWidth: 44, height: 40, px: 1.5 }}
                    aria-label="ప్రశ్న పంపండి"
                  >
                    {aiLoading ? (
                      <CircularProgress size={18} sx={{ color: "#fff" }} />
                    ) : (
                      <SendRoundedIcon fontSize="small" />
                    )}
                  </Button>
                </Stack>

                {aiError && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                    {aiError}
                  </Typography>
                )}

                {aiAnswer && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: "10px",
                      background: alpha(theme.palette.secondary.main, 0.08),
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {aiAnswer}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          )}

          {/* 4 — Extra tool, kept quiet */}
          <Divider sx={{ borderStyle: "dashed", borderColor: alpha(theme.palette.divider, 0.5) }} />

          <Button
            onClick={() => setToolsOpen((v) => !v)}
            aria-expanded={toolsOpen}
            aria-controls={`${uid}-tools`}
            variant="text"
            color="secondary"
            fullWidth
            startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
            endIcon={toolsOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
            sx={{
              justifyContent: "space-between",
              borderRadius: "10px",
              px: 1.5,
              minHeight: 44,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              ...focusRing,
            }}
          >
            <span>ధ్వనికళాదర్శి మాల</span>
          </Button>

          <Collapse in={toolsOpen} timeout={240} unmountOnExit>
            <Box
              id={`${uid}-tools`}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                background: alpha(theme.palette.background.default, 0.6),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              }}
            >
              <TeluguVoice initialText={voiceText} />
            </Box>
          </Collapse>

        </Stack>
      </CardContent>
    </Card>
  );
}