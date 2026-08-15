"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import SkipPreviousRoundedIcon from "@mui/icons-material/SkipPreviousRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type VoiceOption = "mohan" | "shruti" | "google" | "svara-male" | "svara-female";
type MusicOption = "none" | "guitar" | "tabla" | "drums" | "flute" | "veena";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Shruti)",
  google: "🔊 Google TTS",
  "svara-male": "🤖 Svara మగ",
  "svara-female": "🤖 Svara స్త్రీ",
};

// Drop your own royalty-free loop files at these paths (public/audio/...).
// Swap or add more any time — "none" just plays the voice with silence
// underneath, same as today.
const MUSIC_TRACKS: Record<MusicOption, { label: string; src: string | null }> = {
  none: { label: "🔇 సంగీతం లేదు", src: null },
  guitar: { label: "🎸 గిటార్ లూప్", src: "/audio/bg-music-guitar-loop.wav" },
  tabla: { label: "🥁 తబలా లూప్", src: "/audio/bg-music-tabla-loop.wav" },
  drums: { label: "🪘 డ్రమ్స్ లూప్", src: "/audio/bg-music-drums-loop.wav" },
  flute: { label: "🎶 వేణువు లూప్", src: "/audio/bg-music-flute-loop.wav" },
  veena: { label: "🎻 వీణ లూప్", src: "/audio/bg-music-veena-loop.wav" },
};

const BG_VOLUME_DEFAULT = 0.18;

// Resolves a VoiceOption into the { source, voice } shape the shared
// /api/tts contract expects — same helper duplicated in TeluguVoice.tsx
// and PoemCard.tsx, kept consistent across all three.
function resolveTtsParams(voice: VoiceOption): { source: "edge" | "google" | "svara"; gender: "male" | "female" } {
  if (voice === "google") return { source: "google", gender: "male" };
  if (voice === "svara-male") return { source: "svara", gender: "male" };
  if (voice === "svara-female") return { source: "svara", gender: "female" };
  return { source: "edge", gender: voice === "shruti" ? "female" : "male" };
}

type Props = {
  poems: Poem[];
  /** Optional: start on a specific poem (e.g. the one the user clicked). */
  startIndex?: number;
};

/**
 * PoemRadio — a self-contained "own private FM station" player.
 *
 * One card, one big play button. Under the hood it:
 *  1. Fetches TTS audio for the current poem from /api/tts (same route
 *     your bulk export already uses).
 *  2. Plays it through a hidden <audio> element.
 *  3. Simultaneously loops a background music bed at low volume through
 *     a second hidden <audio> element (no offline mixing needed for
 *     *live* playback — that's only necessary when exporting a single
 *     downloadable file, which DownloadAllVoices.tsx already handles).
 *  4. Auto-advances to the next poem when the voice track ends, forever,
 *     like a real station — until the person hits pause.
 */
export default function PoemRadio({ poems, startIndex = 0 }: Props) {
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(poems.length - 1, 0)));
  const [playing, setPlaying] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<VoiceOption>("mohan");
  const [musicChoice, setMusicChoice] = useState<MusicOption>("guitar");
  const [bgVolume, setBgVolume] = useState(BG_VOLUME_DEFAULT);
  const [shuffle, setShuffle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const indexRef = useRef(index);
  indexRef.current = index;

  const poem = poems[index];

  const pickIndex = useCallback(
    (dir: 1 | -1) => {
      if (poems.length <= 1) return 0;
      if (shuffle) {
        let next = indexRef.current;
        while (next === indexRef.current) next = Math.floor(Math.random() * poems.length);
        return next;
      }
      return (indexRef.current + dir + poems.length) % poems.length;
    },
    [poems.length, shuffle]
  );

  // ---- fetch + play a given poem index ----
  const loadAndPlay = useCallback(
    async (i: number, voice: VoiceOption, music: MusicOption, volume: number) => {
      if (!poems[i]) return;
      const requestId = ++requestIdRef.current;
      setLoadingVoice(true);
      setError(null);

      voiceAudioRef.current?.pause();
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }

      try {
        const text = `${poems[i].title}. ${poems[i].content}`;
        const { source, gender } = resolveTtsParams(voice);
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, source, voice: gender }),
        });
        if (!res.ok) throw new Error("TTS failed");
        const blob = await res.blob();

        // a newer request started while this one was in flight — drop it
        if (requestId !== requestIdRef.current) return;

        const url = URL.createObjectURL(blob);
        currentUrlRef.current = url;

        if (voiceAudioRef.current) {
          voiceAudioRef.current.src = url;
          await voiceAudioRef.current.play();
        }

        if (bgAudioRef.current) {
          const track = MUSIC_TRACKS[music];
          if (track.src) {
            if (bgAudioRef.current.src !== new URL(track.src, window.location.href).href) {
              bgAudioRef.current.src = track.src;
              bgAudioRef.current.loop = true;
            }
            bgAudioRef.current.volume = volume;
            await bgAudioRef.current.play().catch(() => {});
          } else {
            bgAudioRef.current.pause();
          }
        }

        setPlaying(true);
      } catch {
        if (requestId === requestIdRef.current) {
          setError("ఈ పద్యం వాయిస్ తయారు కాలేదు — తర్వాతిదానికి వెళ్తోంది.");
          const next = pickIndex(1);
          setIndex(next);
          loadAndPlayRef.current?.(next, voice, music, volume);
        }
      } finally {
        if (requestId === requestIdRef.current) setLoadingVoice(false);
      }
    },
    [poems, pickIndex]
  );

  // ref indirection so the retry-on-failure call above can call the
  // latest loadAndPlay without creating a circular dependency
  const loadAndPlayRef = useRef(loadAndPlay);
  useEffect(() => {
    loadAndPlayRef.current = loadAndPlay;
  }, [loadAndPlay]);

  // ---- auto-advance when the current voice track finishes ----
  useEffect(() => {
    const el = voiceAudioRef.current;
    if (!el) return;
    const onEnded = () => {
      const next = pickIndex(1);
      setIndex(next);
      loadAndPlayRef.current?.(next, voiceChoice, musicChoice, bgVolume);
    };
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [pickIndex, voiceChoice, musicChoice, bgVolume]);

  // ---- live volume slider ----
  useEffect(() => {
    if (bgAudioRef.current) bgAudioRef.current.volume = bgVolume;
  }, [bgVolume]);

  // ---- cleanup on unmount ----
  useEffect(() => {
    return () => {
      voiceAudioRef.current?.pause();
      bgAudioRef.current?.pause();
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
    };
  }, []);

  const goNext = () => {
    const next = pickIndex(1);
    setIndex(next);
    loadAndPlay(next, voiceChoice, musicChoice, bgVolume);
  };

  const goPrev = () => {
    const prev = pickIndex(-1);
    setIndex(prev);
    loadAndPlay(prev, voiceChoice, musicChoice, bgVolume);
  };

  const togglePlay = () => {
    if (playing) {
      voiceAudioRef.current?.pause();
      bgAudioRef.current?.pause();
      setPlaying(false);
      return;
    }
    if (voiceAudioRef.current?.src) {
      voiceAudioRef.current.play();
      if (musicChoice !== "none") bgAudioRef.current?.play().catch(() => {});
      setPlaying(true);
    } else {
      loadAndPlay(index, voiceChoice, musicChoice, bgVolume);
    }
  };

  // switching voice mid-broadcast re-fetches the current poem in the new voice
  const handleVoiceChange = (v: VoiceOption) => {
    setVoiceChoice(v);
    if (playing) loadAndPlay(index, v, musicChoice, bgVolume);
  };

  // switching music swaps the bed live without interrupting narration
  const handleMusicChange = (m: MusicOption) => {
    setMusicChoice(m);
    const track = MUSIC_TRACKS[m];
    if (!bgAudioRef.current) return;
    if (!track.src) {
      bgAudioRef.current.pause();
      return;
    }
    bgAudioRef.current.src = track.src;
    bgAudioRef.current.loop = true;
    bgAudioRef.current.volume = bgVolume;
    if (playing) bgAudioRef.current.play().catch(() => {});
  };

  if (poems.length === 0 || !poem) return null;

  return (
    <Card
      elevation={8}
      sx={{
        borderRadius: 4,
        mb: 4,
        overflow: "hidden",
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)",
        color: "#fff",
        position: "relative",
      }}
    >
      {/* subtle animated glow while on air */}
      {playing && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            boxShadow: "inset 0 0 40px rgba(37,99,235,0.35)",
            animation: "radioGlow 2.4s ease-in-out infinite",
            "@keyframes radioGlow": {
              "0%,100%": { opacity: 0.5 },
              "50%": { opacity: 1 },
            },
          }}
        />
      )}

      <CardContent sx={{ position: "relative" }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <Chip
            icon={
              <GraphicEqRoundedIcon
                sx={{ color: playing ? "#4ade80 !important" : "#94a3b8 !important" }}
              />
            }
            label={playing ? "🔴 ON AIR" : "నిలిపివేయబడింది"}
            size="small"
            sx={{
              bgcolor: playing ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 700,
            }}
          />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {index + 1} / {poems.length}
          </Typography>
          {shuffle && (
            <Chip
              label="షఫుల్"
              size="small"
              sx={{ bgcolor: "rgba(74,222,128,0.15)", color: "#4ade80", fontWeight: 700 }}
            />
          )}
        </Stack>

        <Typography variant="h5" fontWeight={800} noWrap title={poem.title}>
          {poem.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ opacity: 0.6, mt: 0.5, height: 20, overflow: "hidden" }}
        >
          {playing ? "ప్రసారంలో ఉంది…" : "ప్లే నొక్కి వినడం మొదలుపెట్టండి"}
        </Typography>

        {loadingVoice && <LinearProgress sx={{ mt: 1.5, borderRadius: 2 }} />}
        {error && (
          <Typography variant="body2" sx={{ color: "#fca5a5", mt: 1 }}>
            {error}
          </Typography>
        )}

        {/* transport controls */}
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" my={2.5}>
          <IconButton onClick={goPrev} sx={{ color: "#fff" }} aria-label="వెనుకకు">
            <SkipPreviousRoundedIcon fontSize="large" />
          </IconButton>

          <IconButton
            onClick={togglePlay}
            sx={{
              bgcolor: "#2563eb",
              color: "#fff",
              width: 68,
              height: 68,
              boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
            aria-label={playing ? "పాజ్" : "ప్లే"}
          >
            {playing ? <PauseRoundedIcon fontSize="large" /> : <PlayArrowRoundedIcon fontSize="large" />}
          </IconButton>

          <IconButton onClick={goNext} sx={{ color: "#fff" }} aria-label="ముందుకు">
            <SkipNextRoundedIcon fontSize="large" />
          </IconButton>

          <IconButton
            onClick={() => setShuffle((s) => !s)}
            sx={{ color: shuffle ? "#4ade80" : "#94a3b8", ml: 1 }}
            aria-label="షఫుల్ టోగుల్"
          >
            <ShuffleRoundedIcon />
          </IconButton>
        </Stack>

        {/* voice + music selectors */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ color: "#cbd5e1" }}>స్వరం</InputLabel>
            <Select
              value={voiceChoice}
              label="స్వరం"
              onChange={(e) => handleVoiceChange(e.target.value as VoiceOption)}
              sx={{
                color: "#fff",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
              }}
            >
              {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                <MenuItem key={v} value={v}>
                  {VOICE_LABELS[v]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ color: "#cbd5e1" }}>నేపథ్య సంగీతం</InputLabel>
            <Select
              value={musicChoice}
              label="నేపథ్య సంగీతం"
              onChange={(e) => handleMusicChange(e.target.value as MusicOption)}
              sx={{
                color: "#fff",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
              }}
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
          <Box sx={{ mt: 2, px: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
              సంగీతం వాల్యూమ్
            </Typography>
            <Slider
              size="small"
              value={bgVolume}
              min={0}
              max={0.5}
              step={0.02}
              onChange={(_, v) => setBgVolume(v as number)}
              sx={{ color: "#4ade80" }}
            />
          </Box>
        )}
      </CardContent>

      {/* hidden native audio elements — these actually play the sound */}
      <audio ref={voiceAudioRef} style={{ display: "none" }} />
      <audio ref={bgAudioRef} style={{ display: "none" }} />
    </Card>
  );
}