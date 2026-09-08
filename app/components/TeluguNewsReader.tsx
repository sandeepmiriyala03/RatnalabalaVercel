"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

type VoiceOption =
  | "sarvam-te-female"
  | "sarvam-te-male"
  | "te-IN-ShrutiNeural"
  | "te-IN-MohanNeural"
  | "browser-native";

const VOICE_LABELS: Record<VoiceOption, string> = {
  "sarvam-te-female": "🇮🇳 Sarvam AI — స్త్రీ స్వరం",
  "sarvam-te-male": "🇮🇳 Sarvam AI — మగ స్వరం",
  "te-IN-ShrutiNeural": "🎙️ Edge TTS — Shruti (స్త్రీ)",
  "te-IN-MohanNeural": "🎙️ Edge TTS — Mohan (మగ)",
  "browser-native": "📱 బ్రౌజర్ వాయిస్ (ఆఫ్‌లైన్)",
};

// Telugu Unicode block + sentence punctuation + Telugu danda marks + whitespace.
// Mirrors the server-side sanitizer in api/tts-news/index.py — kept in
// sync deliberately; the server re-applies this regardless, this copy
// exists purely so the UI can show an accurate character count and
// avoid sending obvious junk over the wire.
const TELUGU_SANITIZE_RE = /[^\u0C00-\u0C7F.?,!\u0964\u0965\s]/g;

function sanitizeTelugu(input: string): string {
  return input.replace(TELUGU_SANITIZE_RE, " ").replace(/\s+/g, " ").trim();
}

export default function TeluguNewsReader() {
  const [rawText, setRawText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [voice, setVoice] = useState<VoiceOption>("te-IN-ShrutiNeural");
  const [speed, setSpeed] = useState(1.0);

  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanText = sanitizeTelugu(rawText);
  const isBrowserVoice = voice === "browser-native";
  const busy = fetchingUrl || parsingFile || synthesizing || downloading;

  /* ───────── URL fetch ───────── */
  const handleFetchUrl = async () => {
    if (!articleUrl.trim()) return;
    setFetchingUrl(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "ఆర్టికల్ తీసుకురాలేకపోయాం.");
      setRawText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
    } catch (e: any) {
      setError(e.message || "ఆర్టికల్ తీసుకురాలేకపోయాం.");
    } finally {
      setFetchingUrl(false);
    }
  };

  /* ───────── file upload (.txt / .pdf) ───────── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setParsingFile(true);

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setRawText((prev) => (prev ? `${prev}\n\n${text}` : text));
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/extract-pdf", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "PDF parse failed");
        setRawText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
      } else {
        throw new Error(".txt లేదా .pdf ఫైల్ మాత్రమే అనుమతించబడుతుంది.");
      }
    } catch (e: any) {
      setError(e.message || "ఫైల్ చదవలేకపోయాం.");
    } finally {
      setParsingFile(false);
    }
  };

  /* ───────── canvas visualizer ───────── */
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(data);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const step = Math.max(1, Math.floor(bufferLength / barCount));
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = data[i * step] || 0;
        const barHeight = (value / 255) * height;
        ctx.fillStyle = `hsl(${210 + (value / 255) * 60}, 90%, 55%)`;
        ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
      }
    };

    render();
  }, []);

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const setupVisualizer = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    }

    if (ctx.state === "suspended") ctx.resume();
    drawVisualizer();
  }, [drawVisualizer]);

  /* ───────── synthesize (server voices) ───────── */
  const synthesize = async (): Promise<Blob | null> => {
    if (!cleanText) {
      setError("దయచేసి తెలుగు టెక్స్ట్ నమోదు చేయండి.");
      return null;
    }
    setSynthesizing(true);
    setError(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice, speed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "వాయిస్ తయారు కాలేదు.");
      }
      const blob = await res.blob();
      audioBlobRef.current = blob;
      return blob;
    } catch (e: any) {
      setError(e.message || "వాయిస్ తయారు కాలేదు.");
      return null;
    } finally {
      setSynthesizing(false);
    }
  };

  /* ───────── play / pause ───────── */
  const handlePlay = async () => {
    if (isBrowserVoice) {
      if (playing) {
        window.speechSynthesis.cancel();
        setPlaying(false);
        return;
      }
      if (!cleanText) {
        setError("దయచేసి తెలుగు టెక్స్ట్ నమోదు చేయండి.");
        return;
      }
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = "te-IN";
      utter.rate = speed;
      utter.onend = () => setPlaying(false);
      utter.onerror = () => setPlaying(false);
      window.speechSynthesis.speak(utter);
      setPlaying(true);
      return;
    }

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    if (audioUrlRef.current && audioRef.current) {
      setupVisualizer();
      await audioRef.current.play();
      setPlaying(true);
      return;
    }

    const blob = await synthesize();
    if (!blob || !audioRef.current) return;

    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = URL.createObjectURL(blob);
    audioRef.current.src = audioUrlRef.current;

    setupVisualizer();
    await audioRef.current.play();
    setPlaying(true);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      setPlaying(false);
      stopVisualizer();
    };
    const onPause = () => stopVisualizer();
    el.addEventListener("ended", onEnded);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  // Changing the voice invalidates any cached audio so Play always
  // reflects the currently selected voice rather than replaying stale audio.
  useEffect(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      audioBlobRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
    setPlaying(false);
  }, [voice]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ───────── download mp3 ───────── */
  const handleDownload = async () => {
    if (isBrowserVoice) {
      setError("బ్రౌజర్ వాయిస్‌ను MP3‌గా డౌన్‌లోడ్ చేయలేం — వేరే వాయిస్ ఎంచుకోండి.");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const blob = audioBlobRef.current || (await synthesize());
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      a.href = url;
      a.download = `telugu_news_${stamp}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const charCount = cleanText.length;

  return (
    <Card elevation={6} sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          తెలుగు న్యూస్ రీడర్ 📰🔊
        </Typography>

        {/* URL fetch */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="న్యూస్ ఆర్టికల్ లింక్ పేస్ట్ చేయండి…"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={fetchingUrl ? <CircularProgress size={16} /> : <LinkRoundedIcon />}
            onClick={handleFetchUrl}
            disabled={busy || !articleUrl.trim()}
            sx={{ whiteSpace: "nowrap" }}
          >
            తీసుకురా
          </Button>
        </Stack>

        {/* text box */}
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={14}
          placeholder="ఇక్కడ న్యూస్ ఆర్టికల్ పేస్ట్ చేయండి లేదా టైప్ చేయండి…"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          sx={{ mb: 1 }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {charCount} అక్షరాలు (శుద్ధి చేసిన తెలుగు టెక్స్ట్)
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              component="label"
              startIcon={parsingFile ? <CircularProgress size={14} /> : <UploadFileRoundedIcon />}
              disabled={busy}
            >
              ఫైల్ అప్‌లోడ్
              <input
                type="file"
                hidden
                accept=".txt,.pdf,text/plain,application/pdf"
                onChange={handleFileChange}
              />
            </Button>
            <IconButton size="small" onClick={() => setRawText("")} disabled={!rawText || busy}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {error && (
          <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* voice + speed */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>వాయిస్</InputLabel>
            <Select
              label="వాయిస్"
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceOption)}
            >
              {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                <MenuItem key={v} value={v}>
                  {VOICE_LABELS[v]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ width: "100%", px: { sm: 1 } }}>
            <Typography variant="caption" color="text.secondary">
              వేగం: {speed.toFixed(2)}x
            </Typography>
            <Slider
              size="small"
              value={speed}
              min={0.5}
              max={2.0}
              step={0.05}
              onChange={(_, v) => setSpeed(v as number)}
            />
          </Box>
        </Stack>

        {(synthesizing || downloading) && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

        {/* visualizer */}
        <Box
          sx={{
            bgcolor: "#0f172a",
            borderRadius: 2,
            p: 1,
            mb: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={80}
            style={{ width: "100%", maxWidth: 480 }}
          />
        </Box>

        {/* controls */}
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <IconButton
            onClick={handlePlay}
            disabled={synthesizing || (!cleanText && !audioUrlRef.current)}
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              width: 60,
              height: 60,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {synthesizing ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : playing ? (
              <PauseRoundedIcon />
            ) : (
              <PlayArrowRoundedIcon />
            )}
          </IconButton>

          <Button
            variant="outlined"
            startIcon={downloading ? <CircularProgress size={16} /> : <DownloadRoundedIcon />}
            onClick={handleDownload}
            disabled={downloading || !cleanText || isBrowserVoice}
          >
            MP3 డౌన్‌లోడ్
          </Button>
        </Stack>

        {isBrowserVoice && (
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            sx={{ mt: 1.5, color: "text.secondary" }}
          >
            బ్రౌజర్ వాయిస్ ఆఫ్‌లైన్‌లో పని చేస్తుంది కానీ MP3‌గా డౌన్‌లోడ్ చేయలేం.
          </Typography>
        )}

        <audio ref={audioRef} style={{ display: "none" }} />
      </CardContent>
    </Card>
  );
}