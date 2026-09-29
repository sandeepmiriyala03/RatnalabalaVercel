"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import {
  MAX_RECORDING_MS,
  canRecordAudio,
  clearAllRecordings,
  deleteRecording,
  getFamilyVoiceName,
  getRecording,
  listRecordedLetters,
  pickRecordingMimeType,
  requestPersistentStorage,
  saveRecording,
  setFamilyVoiceName,
} from "@/lib/family-voice";
import { track } from "@/lib/track";

/* ================= TYPES / CONSTANTS ================= */

type LetterItem = { id: string; letter: string; word?: string };

type Message = { kind: "error" | "info" | "success"; text: string } | null;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Optional: open on this letter (e.g. the card the user was looking at). */
  startLetter?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "/api";
const MIN_RECORDING_MS = 500;

const MSG = {
  unsupported: "ఈ బ్రౌజర్‌లో రికార్డింగ్ సాధ్యం కాదు. Chrome లేదా Safari తాజా వెర్షన్ వాడండి.",
  denied: "మైక్రోఫోన్ అనుమతి లేదు. అడ్రస్ బార్‌లోని 🔒 గుర్తు నొక్కి, మైక్రోఫోన్‌ను 'అనుమతించు' చేయండి.",
  noMic: "మైక్రోఫోన్ కనిపించలేదు. ఇయర్‌ఫోన్ లేదా మైక్ కనెక్ట్ చేసి మళ్ళీ ప్రయత్నించండి.",
  micBusy: "మైక్రోఫోన్‌ని వేరే యాప్ వాడుతోంది. ఆ యాప్ మూసి మళ్ళీ ప్రయత్నించండి.",
  tooShort: "రికార్డింగ్ చాలా చిన్నది. రికార్డ్ నొక్కి, అక్షరం, పదం చెప్పి, ఆపండి.",
  saveFailed: "సేవ్ కాలేదు. ఫోన్‌లో స్థలం సరిపోయిందో చూసి మళ్ళీ ప్రయత్నించండి.",
  playFailed: "ఈ రికార్డింగ్ ప్లే కాలేదు. మళ్ళీ రికార్డ్ చేయండి.",
  lettersFailed: "అక్షరాల జాబితా రాలేదు. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి.",
};

async function fetchAllLetters(): Promise<LetterItem[]> {
  // Two small requests (16 + 36 letters) — each stays under the API's page-size limit.
  const types = ["swaralu", "vyanjanalu"];
  const pages = await Promise.all(
    types.map(async (type) => {
      const params = new URLSearchParams({ type, page: "1", page_size: "50" });
      const res = await fetch(`${API_BASE}/aksharamala?${params}`);
      if (!res.ok) throw new Error(`Letters ${res.status}`);
      const data = await res.json();
      return (data.items || []) as LetterItem[];
    })
  );
  return pages.flat();
}

function formatSeconds(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `0:${String(s).padStart(2, "0")}`;
}

/* ================= COMPONENT ================= */

export default function FamilyVoiceRecorder({ open, onClose, startLetter }: Props) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [lettersState, setLettersState] = useState<"loading" | "ready" | "error">("loading");
  const [index, setIndex] = useState(0);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<"idle" | "recording" | "saving">("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const meterRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const current = letters[index];
  const isRecording = phase === "recording";
  const currentRecorded = current ? recorded.has(current.letter) : false;
  const recordedCount = letters.filter((l) => recorded.has(l.letter)).length;

  /* ---------- load data when opened ---------- */

  const refreshRecorded = useCallback(async () => {
    setRecorded(new Set(await listRecordedLetters()));
  }, []);

  const loadLetters = useCallback(async () => {
    setLettersState("loading");
    try {
      const all = await fetchAllLetters();
      setLetters(all);
      setLettersState(all.length ? "ready" : "error");
    } catch {
      setLettersState("error");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setName(getFamilyVoiceName());
    refreshRecorded();
    if (letters.length === 0) loadLetters();
    requestPersistentStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Jump to the requested letter once the list is loaded
  useEffect(() => {
    if (!open || !startLetter || letters.length === 0) return;
    const i = letters.findIndex((l) => l.letter === startLetter);
    if (i >= 0) setIndex(i);
  }, [open, startLetter, letters]);

  // Keep the current letter visible in the strip
  useEffect(() => {
    if (!current) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    chipRefs.current.get(current.letter)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [current]);

  /* ---------- playback ---------- */

  const stopPlayback = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setPlaying(false);
  }, []);

  const togglePlay = async () => {
    if (playing) {
      stopPlayback();
      return;
    }
    if (!current) return;
    const rec = await getRecording(current.letter);
    if (!rec) return;
    stopPlayback();
    const url = URL.createObjectURL(rec.blob);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => stopPlayback();
    setPlaying(true);
    try {
      await audio.play();
    } catch {
      stopPlayback();
      setMessage({ kind: "error", text: MSG.playFailed });
    }
  };

  /* ---------- recording ---------- */

  const releaseMic = useCallback(() => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    autoStopRef.current = null;
    tickRef.current = null;
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop()); // turns off the mic indicator
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (meterRef.current) meterRef.current.style.transform = "scaleX(0)";
  }, []);

  const startLevelMeter = (stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      audioCtxRef.current = ctx;
      ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.min(1, Math.sqrt(sum / data.length) * 5);
        if (meterRef.current) meterRef.current.style.transform = `scaleX(${level})`;
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      /* the meter is a nice-to-have; recording still works without it */
    }
  };

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
  }, []);

  const startRecording = async () => {
    if (!current || phase !== "idle") return;
    setMessage(null);
    stopPlayback();

    if (!canRecordAudio()) {
      setMessage({ kind: "error", text: MSG.unsupported });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      const errName = (err as DOMException)?.name;
      const text =
        errName === "NotAllowedError" || errName === "SecurityError"
          ? MSG.denied
          : errName === "NotFoundError" || errName === "OverconstrainedError"
            ? MSG.noMic
            : errName === "NotReadableError"
              ? MSG.micBusy
              : MSG.unsupported;
      setMessage({ kind: "error", text });
      return;
    }

    streamRef.current = stream;
    const mimeType = pickRecordingMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      releaseMic();
      setMessage({ kind: "error", text: MSG.unsupported });
      return;
    }

    const letterAtStart = current.letter;
    const startedAt = Date.now();
    chunksRef.current = [];
    discardRef.current = false;
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const durationMs = Date.now() - startedAt;
      releaseMic();
      recorderRef.current = null;

      if (discardRef.current) {
        setPhase("idle");
        return;
      }
      if (durationMs < MIN_RECORDING_MS || chunksRef.current.length === 0) {
        setPhase("idle");
        setMessage({ kind: "error", text: MSG.tooShort });
        return;
      }

      setPhase("saving");
      const type = recorder.mimeType || mimeType || "audio/webm";
      try {
        await saveRecording({
          letter: letterAtStart,
          blob: new Blob(chunksRef.current, { type }),
          mimeType: type,
          durationMs,
          updatedAt: Date.now(),
        });
        await refreshRecorded();
        track("family_record", { letter: letterAtStart });
        setMessage({ kind: "success", text: `"${letterAtStart}" సేవ్ అయింది. ▶ నొక్కి వినండి, లేదా తర్వాతి అక్షరానికి వెళ్ళండి.` });
      } catch {
        setMessage({ kind: "error", text: MSG.saveFailed });
      } finally {
        setPhase("idle");
      }
    };

    recorder.start();
    setPhase("recording");
    setElapsedMs(0);
    tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    autoStopRef.current = setTimeout(() => stopRecording(), MAX_RECORDING_MS);
    startLevelMeter(stream);
  };

  /* ---------- cleanup: closing the dialog or leaving the page ---------- */

  const discardAndRelease = useCallback(() => {
    discardRef.current = true;
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
    else releaseMic();
    stopPlayback();
  }, [releaseMic, stopPlayback]);

  useEffect(() => () => discardAndRelease(), [discardAndRelease]);

  const handleClose = () => {
    discardAndRelease();
    setPhase("idle");
    setMessage(null);
    onClose();
  };

  /* ---------- other actions ---------- */

  const goTo = (i: number) => {
    if (isRecording || i < 0 || i >= letters.length) return;
    stopPlayback();
    setMessage(null);
    setIndex(i);
  };

  const handleDeleteCurrent = async () => {
    if (!current) return;
    stopPlayback();
    await deleteRecording(current.letter);
    await refreshRecorded();
    setMessage({ kind: "info", text: `"${current.letter}" రికార్డింగ్ తొలగించబడింది.` });
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("అన్ని రికార్డింగ్‌లు తొలగించాలా? ఇది తిరిగి రాదు.")) return;
    stopPlayback();
    await clearAllRecordings();
    await refreshRecorded();
    setMessage({ kind: "info", text: "అన్ని రికార్డింగ్‌లు తొలగించబడ్డాయి." });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setFamilyVoiceName(value);
  };

  /* ================= RENDER ================= */

  return (
    <Dialog
      open={open}
      onClose={isRecording ? undefined : handleClose}
      fullScreen={isSmall}
      fullWidth
      maxWidth="sm"
      aria-labelledby="family-voice-title"
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          height: { xs: "100%", sm: "min(760px, 92vh)" },
          borderRadius: { xs: 0, sm: 4 },
          pt: { xs: "env(safe-area-inset-top, 0px)", sm: 0 },
          pb: { xs: "env(safe-area-inset-bottom, 0px)", sm: 0 },
        },
      }}
    >
      {/* HEADER */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="family-voice-title" variant="h6" fontWeight={800} noWrap>
            మీ గొంతుతో అక్షరమాల
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lettersState === "ready" ? `${recordedCount} / ${letters.length} అక్షరాలు రికార్డ్ అయ్యాయి` : " "}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} aria-label="మూసివేయండి" disabled={isRecording}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
      {lettersState === "ready" && (
        <LinearProgress
          variant="determinate"
          value={letters.length ? (recordedCount / letters.length) * 100 : 0}
          color="success"
          sx={{ mx: 2, borderRadius: 2, height: 6 }}
        />
      )}

      {/* BODY */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pt: 2, pb: 2 }}>
        {lettersState === "loading" && (
          <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {lettersState === "error" && (
          <Stack spacing={2} alignItems="center" sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">{MSG.lettersFailed}</Typography>
            <Button variant="contained" onClick={loadLetters} sx={{ textTransform: "none" }}>
              మళ్ళీ ప్రయత్నించండి
            </Button>
          </Stack>
        )}

        {lettersState === "ready" && current && (
          <Stack spacing={2}>
            {/* Whose voice */}
            <TextField
              label="ఎవరి గొంతు?"
              placeholder="అమ్మ, అమ్మమ్మ, నాన్న…"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              size="small"
              fullWidth
              inputProps={{ maxLength: 30 }}
              helperText="రేడియో, కార్డుల్లో ఈ పేరుతో మీ గొంతు కనిపిస్తుంది"
            />

            {/* Letter strip */}
            <Box
              role="tablist"
              aria-label="అక్షరాలు"
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 1,
                scrollbarWidth: "thin",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {letters.map((l, i) => {
                const isCurrent = i === index;
                const isDone = recorded.has(l.letter);
                return (
                  <Box
                    key={l.id}
                    component="button"
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`${l.letter}${isDone ? " (రికార్డ్ అయింది)" : ""}`}
                    ref={(node: HTMLButtonElement | null) => {
                      if (node) chipRefs.current.set(l.letter, node);
                      else chipRefs.current.delete(l.letter);
                    }}
                    onClick={() => goTo(i)}
                    disabled={isRecording}
                    sx={{
                      position: "relative",
                      flex: "0 0 auto",
                      minWidth: 48,
                      height: 48,
                      px: 1,
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: isCurrent ? "primary.main" : "divider",
                      bgcolor: isDone ? "success.light" : "background.paper",
                      color: "text.primary",
                      font: "inherit",
                      fontSize: 20,
                      fontWeight: 800,
                      cursor: "pointer",
                      "&:disabled": { opacity: 0.5, cursor: "default" },
                      "&:focus-visible": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 2 },
                    }}
                  >
                    {l.letter}
                  </Box>
                );
              })}
            </Box>

            {/* Stage + controls: stacked on phones, side by side on short landscape screens */}
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: "minmax(0, 1fr)",
                "@media (orientation: landscape) and (max-height: 520px)": {
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  alignItems: "center",
                },
              }}
            >
              {/* Stage */}
              <Box
                sx={{
                  textAlign: "center",
                  py: { xs: 2, sm: 3 },
                  px: 2,
                  borderRadius: 4,
                  bgcolor: isRecording ? "error.light" : "action.hover",
                  transition: "background-color 0.2s ease",
                  position: "relative",
                }}
              >
                {currentRecorded && !isRecording && (
                  <CheckCircleRoundedIcon
                    color="success"
                    aria-label="రికార్డ్ అయింది"
                    sx={{ position: "absolute", top: 12, right: 12 }}
                  />
                )}
                <Typography
                  component="div"
                  sx={{
                    fontSize: "clamp(64px, min(24vw, 18vh), 150px)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    color: "primary.dark",
                  }}
                >
                  {current.letter}
                </Typography>
                {current.word && current.word !== current.letter && (
                  <Typography sx={{ fontSize: "clamp(22px, 6vw, 34px)", fontWeight: 700 }}>
                    {current.word}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  ఇలా చెప్పండి: &quot;{current.letter}… {current.word || current.letter}&quot;
                </Typography>

                {/* Live voice level while recording */}
                <Box
                  aria-hidden="true"
                  sx={{
                    mt: 2,
                    mx: "auto",
                    height: 8,
                    width: "80%",
                    borderRadius: 4,
                    bgcolor: "rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    visibility: isRecording ? "visible" : "hidden",
                  }}
                >
                  <Box
                    ref={meterRef}
                    sx={{
                      height: "100%",
                      bgcolor: "error.main",
                      transform: "scaleX(0)",
                      transformOrigin: "left center",
                      transition: "transform 80ms linear",
                    }}
                  />
                </Box>
              </Box>

              {/* Controls */}
              <Stack spacing={2} alignItems="center">
                <Stack direction="row" spacing={{ xs: 2, sm: 3 }} alignItems="center" justifyContent="center">
                  <IconButton
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0 || isRecording}
                    aria-label="ముందరి అక్షరం"
                    sx={{ width: 56, height: 56, border: "1px solid", borderColor: "divider" }}
                  >
                    <ChevronLeftRoundedIcon fontSize="large" />
                  </IconButton>

                  {/* The main button */}
                  <Box sx={{ textAlign: "center" }}>
                    <IconButton
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={phase === "saving"}
                      aria-label={isRecording ? "రికార్డింగ్ ఆపండి" : "రికార్డ్ చేయండి"}
                      sx={{
                        width: 88,
                        height: 88,
                        bgcolor: "error.main",
                        color: "#fff",
                        boxShadow: 4,
                        "&:hover": { bgcolor: "error.dark" },
                        "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
                        ...(isRecording && {
                          animation: "recPulse 1.4s ease-in-out infinite",
                          "@keyframes recPulse": {
                            "0%, 100%": { boxShadow: "0 0 0 0 rgba(211,47,47,0.45)" },
                            "50%": { boxShadow: "0 0 0 14px rgba(211,47,47,0)" },
                          },
                          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                        }),
                      }}
                    >
                      {phase === "saving" ? (
                        <CircularProgress size={32} sx={{ color: "#fff" }} />
                      ) : isRecording ? (
                        <StopRoundedIcon sx={{ fontSize: 44 }} />
                      ) : (
                        <MicRoundedIcon sx={{ fontSize: 44 }} />
                      )}
                    </IconButton>
                    <Typography variant="body2" fontWeight={700} sx={{ mt: 0.75 }}>
                      {isRecording
                        ? `ఆపండి · ${formatSeconds(elapsedMs)} / ${formatSeconds(MAX_RECORDING_MS)}`
                        : currentRecorded
                          ? "మళ్ళీ రికార్డ్"
                          : "రికార్డ్"}
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={() => goTo(index + 1)}
                    disabled={index === letters.length - 1 || isRecording}
                    aria-label="తర్వాతి అక్షరం"
                    sx={{
                      width: 56,
                      height: 56,
                      border: "1px solid",
                      borderColor: currentRecorded ? "primary.main" : "divider",
                      bgcolor: currentRecorded ? "primary.main" : "transparent",
                      color: currentRecorded ? "primary.contrastText" : "inherit",
                      "&:hover": { bgcolor: currentRecorded ? "primary.dark" : "action.hover" },
                    }}
                  >
                    <ChevronRightRoundedIcon fontSize="large" />
                  </IconButton>
                </Stack>

                {currentRecorded && !isRecording && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
                    <Button
                      variant="outlined"
                      startIcon={playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
                      onClick={togglePlay}
                      sx={{ minHeight: 44, textTransform: "none", fontWeight: 700 }}
                    >
                      {playing ? "ఆపండి" : "వినండి"}
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={handleDeleteCurrent}
                      sx={{ minHeight: 44, textTransform: "none" }}
                    >
                      తొలగించు
                    </Button>
                  </Stack>
                )}

                {/* Status line — polite live region so screen readers announce it */}
                <Box aria-live="polite" sx={{ minHeight: 24, textAlign: "center", px: 1 }}>
                  {message && (
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        message.kind === "error"
                          ? "error.main"
                          : message.kind === "success"
                            ? "success.dark"
                            : "text.secondary"
                      }
                    >
                      {message.text}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              🔒 రికార్డింగ్‌లు ఈ ఫోన్/కంప్యూటర్‌లోనే ఉంటాయి. ఎక్కడికీ అప్‌లోడ్ అవ్వవు.
            </Typography>
          </Stack>
        )}
      </Box>

      {/* FOOTER */}
      {lettersState === "ready" && recordedCount > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
          <Button color="error" onClick={handleDeleteAll} disabled={isRecording} sx={{ textTransform: "none" }}>
            అన్నీ తొలగించండి
          </Button>
          <Button variant="contained" onClick={handleClose} disabled={isRecording} sx={{ textTransform: "none", fontWeight: 700 }}>
            పూర్తయింది
          </Button>
        </Stack>
      )}
    </Dialog>
  );
}