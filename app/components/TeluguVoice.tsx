"use client";

import * as Mp4Muxer from "mp4-muxer";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, LinearProgress, Chip, Stack, Paper,
  IconButton, Collapse, Alert, useTheme, useMediaQuery, alpha
} from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import VideoFileRoundedIcon from "@mui/icons-material/VideoFileRounded";
import AudioFileRoundedIcon from "@mui/icons-material/AudioFileRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TwitterIcon from "@mui/icons-material/Twitter";

/* ─── Fonts ─────────────────────────────────────────────────────── */
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+Telugu:wght@400;700&display=swap";
const TELUGU_FONT = "'Noto Serif Telugu'";

const TEL_CONFIG = {
  label: "Telugu",
  flag: "🌺",
  webSpeechLang: "te-IN",
  googleTTSCode: "te",
  bgColor: "#2d6a4f",
  sampleText: "నమస్కారం! నేను AksharaTantra.",
};

const MAX_CHARS = 1000;

const VIDEO_PROFILES = {
  mobile:    { W: 540,  H: 960,  fps: 30, label: "Mobile",        icon: <PhoneAndroidRoundedIcon fontSize="small" /> },
  whatsapp:  { W: 720,  H: 1280, fps: 30, label: "WhatsApp",      icon: <WhatsAppIcon fontSize="small" /> },
  instagram: { W: 720,  H: 1280, fps: 30, label: "Instagram",     icon: <InstagramIcon fontSize="small" /> },
  youtube:   { W: 1080, H: 1920, fps: 30, label: "YouTube Shorts",icon: <YouTubeIcon fontSize="small" /> },
  twitter:   { W: 720,  H: 1280, fps: 30, label: "X / Twitter",   icon: <TwitterIcon fontSize="small" /> },
} as const;

type ProfileKey = keyof typeof VIDEO_PROFILES;

/* ─── Audio helpers ──────────────────────────────────────────────── */
async function proxyTTS(text: string, langCode: string) {
  const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/api/tts returned ${res.status}`);
  const mp3Buf = await res.arrayBuffer();
  const ACtx = window.AudioContext || (window as any).webkitAudioContext;
  const tmp = new ACtx();
  const decoded = await tmp.decodeAudioData(mp3Buf.slice(0));
  const audioFloat = decoded.getChannelData(0);
  const sampleRate = decoded.sampleRate;
  await tmp.close();
  return { audioFloat, sampleRate, blob: new Blob([mp3Buf], { type: "audio/mpeg" }) };
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices();
    if (v.length) { resolve(v); return; }
    const fn = () => {
      speechSynthesis.removeEventListener("voiceschanged", fn);
      resolve(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener("voiceschanged", fn);
    setTimeout(() => { speechSynthesis.removeEventListener("voiceschanged", fn); resolve([]); }, 2000);
  });
}

async function speakWebSpeech(text: string, lang: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    await new Promise<void>(async (resolve) => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang = lang;
      const voices = await waitForVoices();
      const v = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split("-")[0]));
      if (v) u.voice = v;
      u.rate = 0.85;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }
}

let _actx: AudioContext | null = null;
function getACtx() {
  const C = window.AudioContext || (window as any).webkitAudioContext;
  if (!_actx || _actx.state === "closed") _actx = new C();
  return _actx;
}
async function playF32(af: Float32Array, sr: number) {
  const ctx = getACtx();
  if (ctx.state === "suspended") await ctx.resume();
  const buf = ctx.createBuffer(1, af.length, sr);
  buf.copyToChannel(new Float32Array(af), 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  return new Promise<void>((res) => { src.onended = () => res(); });
}

/* ─── Canvas draw ────────────────────────────────────────────────── */
function drawSlide(ctx: CanvasRenderingContext2D, W: number, H: number, text: string) {
  const { bgColor, flag, label } = TEL_CONFIG;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, bgColor);
  g.addColorStop(1, "#0a0a1a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(0, 0, W, H * 0.12);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `bold ${Math.floor(W / 28)}px 'Inter',sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("✍️ స్వరమాల", W / 2, H * 0.065);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  const badgeW = 140, badgeH = 32, bx = (W - badgeW) / 2, by = H * 0.085;
  ctx.beginPath();
  ctx.roundRect(bx, by, badgeW, badgeH, 16);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `500 ${Math.floor(W / 36)}px 'Inter',sans-serif`;
  ctx.fillText(`${flag} ${label}`, W / 2, by + badgeH * 0.68);
  const fs = Math.max(20, Math.floor(W / 17));
  ctx.font = `bold ${fs}px ${TELUGU_FONT}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 8;
  const mw = W - 100;
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > mw && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const maxLines = 8;
  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) displayLines[maxLines - 1] += "…";
  const lh = fs * 1.65;
  let y = H / 2 - (displayLines.length * lh) / 2 + fs * 0.4;
  for (const l of displayLines) { ctx.fillText(l, W / 2, y); y += lh; }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(0, H * 0.92, W, H * 0.08);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `400 ${Math.floor(W / 44)}px 'Inter',sans-serif`;
  ctx.fillText("🇮🇳 Indic AI", W / 2, H * 0.965);
}

/* ─── Video generation ───────────────────────────────────────────── */
async function makeVideo(
  text: string, af: Float32Array, sr: number,
  profile: ProfileKey, canvas: HTMLCanvasElement, hasAudio: boolean
): Promise<Blob> {
  const { W, H, fps } = VIDEO_PROFILES[profile];
  canvas.width = W; canvas.height = H;
  const ctx2d = canvas.getContext("2d", { alpha: false })!;
  const duration = hasAudio ? af.length / sr : 5;
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H },
    ...(hasAudio ? { audio: { codec: "aac", numberOfChannels: 1, sampleRate: sr } } : {}),
    fastStart: "fragmented",
  });
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder:", e),
  });
  videoEncoder.configure({ codec: "avc1.4D401F", width: W, height: H, bitrate: 2_000_000 });
  let audioEncoder: AudioEncoder | null = null;
  if (hasAudio) {
    try {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.warn("AudioEncoder:", e),
      });
      audioEncoder.configure({ codec: "mp4a.40.2", numberOfChannels: 1, sampleRate: sr, bitrate: 128000 });
      const audioBuffer = new Float32Array(af.buffer as ArrayBuffer);
      const ad = new AudioData({ format: "f32", sampleRate: sr, numberOfFrames: af.length, numberOfChannels: 1, timestamp: 0, data: audioBuffer });
      audioEncoder.encode(ad);
      ad.close();
    } catch (e) { console.warn("AudioEncoder failed:", e); audioEncoder = null; }
  }
  const totalFrames = Math.ceil(duration * fps);
  for (let i = 0; i < totalFrames; i++) {
    const timestamp = Math.round((i * 1_000_000) / fps);
    drawSlide(ctx2d, W, H, text);
    const frame = new VideoFrame(canvas, { timestamp, duration: Math.round(1_000_000 / fps) });
    videoEncoder.encode(frame);
    frame.close();
    if (i % 30 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  try { if (videoEncoder.state !== "closed") await videoEncoder.flush(); } catch {}
  try { if (videoEncoder.state !== "closed") videoEncoder.close(); } catch {}
  if (audioEncoder) {
    try { if (audioEncoder.state === "configured") await audioEncoder.flush(); } catch {}
    try { if (audioEncoder.state !== "closed") audioEncoder.close(); } catch {}
  }
  muxer.finalize();
  const { buffer } = muxer.target as Mp4Muxer.ArrayBufferTarget;
  return new Blob([buffer], { type: "video/mp4" });
}

export interface TeluguVoiceProps { initialText?: string; }

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function TeluguVoice({ initialText }: TeluguVoiceProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [text, setText] = useState(initialText ?? TEL_CONFIG.sampleText);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [profile, setProfile] = useState<ProfileKey>("mobile");
  const [mounted, setMounted] = useState(false);
  const [audioUrl, setAudioUrl_] = useState<string | null>(null);
  const [vidUrl, setVidUrl_] = useState<string | null>(null);
  const [af, setAf] = useState<Float32Array | null>(null);
  const [sr, setSr] = useState(22050);
  const [slideReady, setSlideReady] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevAudio = useRef<string | null>(null);
  const prevVid = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (initialText !== undefined) {
      setText(initialText);
      setAudioUrl_(null); setVidUrl_(null); setAf(null);
      setSlideReady(false); setStatus(""); setError("");
    }
  }, [initialText]);

  useEffect(() => () => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    if (prevVid.current) URL.revokeObjectURL(prevVid.current);
  }, []);

  const setAudioUrl = useCallback((u: string | null) => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    prevAudio.current = u; setAudioUrl_(u);
  }, []);

  const setVidUrl = useCallback((u: string | null) => {
    if (prevVid.current) URL.revokeObjectURL(prevVid.current);
    prevVid.current = u; setVidUrl_(u);
  }, []);

  const downloadSlide = () => {
    if (!canvasRef.current) return;
    const { W, H } = VIDEO_PROFILES[profile];
    const c = canvasRef.current;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d", { alpha: false })!;
    drawSlide(ctx, W, H, text);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `telugu_slide_${Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const generate = async () => {
    if (!text.trim() || loading) return;
    const AT = text;
    setLoading(true); setAudioUrl(null); setVidUrl(null); setAf(null);
    setSlideReady(false); setStatus(""); setError(""); setProgress(10);

    try {
      let audioF!: Float32Array;
      let audioSr = 22050;
      let audioBlob: Blob | null = null;
      let hasAudio = false;

      try {
        setStatus("తెలుగు ధ్వని తయారవుతోంది…");
        setProgress(30);
        const r = await proxyTTS(AT, TEL_CONFIG.googleTTSCode);
        audioF = r.audioFloat; audioSr = r.sampleRate; audioBlob = r.blob; hasAudio = true;
        setStatus("ధ్వని సిద్ధం ✅");
        setProgress(55);
      } catch (e) {
        console.warn("Proxy TTS failed:", e);
        setStatus("ఆఫ్‌లైన్ వాయిస్ ఉపయోగిస్తున్నాం…");
        await speakWebSpeech(AT, TEL_CONFIG.webSpeechLang);
        audioSr = 22050; audioF = new Float32Array(audioSr * 5);
        setProgress(55);
      }

      if (audioBlob) { setAf(audioF); setSr(audioSr); setAudioUrl(URL.createObjectURL(audioBlob)); }
      else { setAf(audioF); setSr(audioSr); }

      if (canvasRef.current) {
        const { W, H } = VIDEO_PROFILES[profile];
        canvasRef.current.width = W; canvasRef.current.height = H;
        drawSlide(canvasRef.current.getContext("2d", { alpha: false })!, W, H, AT);
        setSlideReady(true);
      }

      if (canvasRef.current) {
        setStatus("వీడియో రెండర్ అవుతోంది…");
        setProgress(75);
        try {
          const vb = await makeVideo(AT, audioF, audioSr, profile, canvasRef.current, hasAudio);
          setVidUrl(URL.createObjectURL(vb));
          setStatus(hasAudio ? "సిద్ధం! డౌన్‌లోడ్ చేయండి 🎉" : "వీడియో సిద్ధం");
          setProgress(100);
        } catch (e: any) {
          setError("వీడియో విఫలమైంది: " + e?.message);
          setProgress(100);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? "Error");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const over = text.length > MAX_CHARS;
  const canGo = !loading && !!text.trim() && !over;
  const charsLeft = MAX_CHARS - text.length;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_LINK} rel="stylesheet" />
      <canvas ref={canvasRef} style={{ position: "fixed", top: "-9999px", left: "-9999px" }} />

      <Box sx={{ fontFamily: "'Inter',sans-serif" }}>

        {/* Info banner */}
        <Box sx={{
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "1.5px solid #86efac",
          borderRadius: 3, p: 2, mb: 2,
          display: "flex", gap: 1.5, alignItems: "flex-start",
        }}>
          <Typography fontSize={20} lineHeight={1}>🇮🇳</Typography>
          <Typography fontSize={12} color="#166534" lineHeight={1.8}>
            Google ధ్వని సాంకేతికత ద్వారా తెలుగు టెక్స్ట్‌ని{" "}
            <strong>MP3 ధ్వని</strong> మరియు <strong>MP4 వీడియో</strong>గా మారుస్తాం.
            ఇంటర్నెట్ అవసరం.
          </Typography>
        </Box>

        {/* Text area */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth multiline rows={isMobile ? 3 : 4}
            value={text}
            onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
            disabled={loading}
            placeholder="తెలుగు వచనం ఇక్కడ టైప్ చేయండి…"
            error={over}
            helperText={
              <Box component="span" sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>{over ? "అక్షర పరిమితి మించింది" : " "}</span>
                <span style={{ color: charsLeft <= 50 ? (charsLeft <= 0 ? "#ef4444" : "#f59e0b") : "#9ca3af" }}>
                  {text.length}/{MAX_CHARS}
                </span>
              </Box>
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                fontSize: 17,
                lineHeight: 1.9,
                fontFamily: TELUGU_FONT,
                background: alpha(theme.palette.background.paper, 0.8),
              },
              "& .MuiFormHelperText-root": { mx: 0 },
            }}
          />
        </Box>

        {/* Video format — mobile-friendly chip row */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={700} letterSpacing={0.8}
            textTransform="uppercase" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            వీడియో ఫార్మాట్
          </Typography>
          <Box sx={{
            display: "flex", gap: 1, flexWrap: "wrap",
            // On mobile: scrollable row instead of wrapping
            ...(isMobile && { flexWrap: "nowrap", overflowX: "auto", pb: 0.5,
              "&::-webkit-scrollbar": { display: "none" } }),
          }}>
            {(Object.entries(VIDEO_PROFILES) as [ProfileKey, typeof VIDEO_PROFILES[ProfileKey]][]).map(([key, val]) => (
              <Chip
                key={key}
                icon={val.icon as any}
                label={val.label}
                onClick={() => !loading && setProfile(key)}
                variant={profile === key ? "filled" : "outlined"}
                color={profile === key ? "success" : "default"}
                disabled={loading}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 600,
                  fontSize: 12,
                  height: 36,
                  flexShrink: 0,
                  cursor: "pointer",
                  "& .MuiChip-icon": { fontSize: 16 },
                  ...(profile === key && { boxShadow: "0 2px 8px rgba(45,106,79,0.3)" }),
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Generate button — large, thumb-friendly */}
        <Button
          fullWidth
          size="large"
          onClick={generate}
          disabled={!canGo}
          startIcon={<MicRoundedIcon />}
          sx={{
            borderRadius: 3,
            py: isMobile ? 2 : 1.75,
            fontSize: isMobile ? 15 : 14,
            fontWeight: 700,
            mb: 1.5,
            minHeight: isMobile ? 56 : 50,
            background: canGo
              ? "linear-gradient(135deg, #2d6a4f, #1b4332)"
              : undefined,
            boxShadow: canGo ? "0 4px 20px rgba(45,106,79,.35)" : "none",
            textTransform: "none",
            letterSpacing: 0.3,
            "&:active": { transform: "scale(0.98)" },
          }}
          variant={canGo ? "contained" : "outlined"}
        >
          {loading ? status || "తయారవుతోంది…" : "ధ్వని + కళ + వీడియో సృష్టించండి"}
        </Button>

        {/* Progress bar */}
        {loading && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ borderRadius: 2, mb: 1.5, height: 6,
              backgroundColor: alpha("#2d6a4f", 0.15),
              "& .MuiLinearProgress-bar": { backgroundColor: "#2d6a4f", borderRadius: 2 },
            }}
          />
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" icon={<ErrorRoundedIcon />} sx={{ borderRadius: 2.5, mb: 1.5, fontSize: 13 }}>
            {error}
          </Alert>
        )}

        {/* Done status */}
        {status && !loading && !error && (
          <Alert severity="success" icon={<CheckCircleRoundedIcon />}
            sx={{ borderRadius: 2.5, mb: 1.5, fontSize: 13, fontWeight: 500 }}>
            {status}
          </Alert>
        )}

        {/* ── Downloads ── */}
        {(audioUrl || vidUrl || slideReady) && (
          <Box sx={{
            background: "linear-gradient(135deg, #fafafe, #f0fdf4)",
            border: "1.5px solid #86efac", borderRadius: 3, p: 2, mt: 1,
          }}>
            <Typography fontWeight={700} fontSize={14} color="#2d6a4f" mb={2}>
              📥 డౌన్‌లోడ్‌లు
            </Typography>

            {/* Audio */}
            {audioUrl && (
              <Box mb={2.5}>
                <Typography fontWeight={600} fontSize={13} color="text.primary" mb={1}
                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <AudioFileRoundedIcon fontSize="small" color="primary" />
                  ధ్వనిమాల (MP3)
                </Typography>
                <audio controls src={audioUrl}
                  style={{ width: "100%", borderRadius: 10, marginBottom: 10 }}
                  preload="auto"
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button size="small" variant="contained" startIcon={<PlayArrowRoundedIcon />}
                    onClick={() => af && playF32(af, sr)}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600,
                      minHeight: 40, flex: isMobile ? 1 : "unset" }}>
                    Play
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />}
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = audioUrl!; a.download = `telugu_audio_${Date.now()}.mp3`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    }}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600,
                      minHeight: 40, flex: isMobile ? 1 : "unset" }}>
                    MP3 డౌన్‌లోడ్
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Video */}
            {vidUrl && (
              <Box mb={2.5}>
                <Typography fontWeight={600} fontSize={13} color="text.primary" mb={1}
                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <VideoFileRoundedIcon fontSize="small" color="error" />
                  దర్శనమాల (MP4)
                </Typography>
                <Box sx={{ borderRadius: 2.5, overflow: "hidden", mb: 1.5,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
                  <video controls playsInline src={vidUrl}
                    style={{ width: "100%", display: "block" }} />
                </Box>
                <Button fullWidth variant="contained" color="success"
                  startIcon={<DownloadRoundedIcon />}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = vidUrl!; a.download = `telugu_video_${Date.now()}.mp4`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }}
                  sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700,
                    minHeight: 48, fontSize: 14 }}>
                  MP4 వీడియో డౌన్‌లోడ్
                </Button>
              </Box>
            )}

            {/* Image slide */}
            {slideReady && (
              <Box>
                <Typography fontWeight={600} fontSize={13} color="text.primary" mb={1}
                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <ImageRoundedIcon fontSize="small" color="secondary" />
                  కళామాల (PNG)
                </Typography>
                <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 2.5, p: 1.5, mb: 1.5,
                  display: "flex", justifyContent: "center" }}>
                  <canvas
                    ref={(node) => {
                      if (!node || !text) return;
                      const PW = 200, PH = 356;
                      node.width = PW; node.height = PH;
                      drawSlide(node.getContext("2d")!, PW, PH, text);
                    }}
                    style={{ width: 160, borderRadius: 8,
                      border: "1px solid #e5e7eb", display: "block" }}
                  />
                </Box>
                <Button fullWidth variant="outlined" color="secondary"
                  startIcon={<DownloadRoundedIcon />}
                  onClick={downloadSlide}
                  sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700,
                    minHeight: 48, fontSize: 14 }}>
                  PNG డౌన్‌లోడ్ ({VIDEO_PROFILES[profile].W}×{VIDEO_PROFILES[profile].H})
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  );
}