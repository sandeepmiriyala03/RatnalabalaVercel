"use client";

import * as Mp4Muxer from "mp4-muxer";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Fonts ─────────────────────────────────────────────────────── */
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif+Telugu:wght@400;700&display=swap";
const TELUGU_FONT =
  "'Noto Serif Telugu', 'Noto Serif', Georgia, serif";

/* ─── Telugu config (single language) ───────────────────────────── */
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
  mobile:    { W: 540,  H: 960,  fps: 30 },
  whatsapp:  { W: 720,  H: 1280, fps: 30 },
  instagram: { W: 720,  H: 1280, fps: 30 },
  youtube:   { W: 1080, H: 1920, fps: 30 },
  twitter:   { W: 720,  H: 1280, fps: 30 },
} as const;

type ProfileKey = keyof typeof VIDEO_PROFILES;

/* ─── Audio helpers ──────────────────────────────────────────────── */
async function proxyTTS(
  text: string,
  langCode: string
): Promise<{ audioFloat: Float32Array; sampleRate: number; blob: Blob }> {
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
    setTimeout(() => {
      speechSynthesis.removeEventListener("voiceschanged", fn);
      resolve([]);
    }, 2000);
  });
}

async function speakWebSpeech(text: string, lang: string) {

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {

    await new Promise<void>(async (resolve) => {

      const u = new SpeechSynthesisUtterance(line);
      u.lang = lang;

      const voices = await waitForVoices();

      const v =
        voices.find(v => v.lang === lang) ||
        voices.find(v => v.lang.startsWith(lang.split("-")[0]));

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

  return new Promise<void>((res) => {
    src.onended = () => res();
  });

}
/* ─── Canvas draw ────────────────────────────────────────────────── */
function drawSlide(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  text: string
) {
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
  ctx.fillText("✍️ స్వరమాల ", W / 2, H * 0.065);

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
    if (ctx.measureText(t).width > mw && cur) { lines.push(cur); cur = w; }
    else cur = t;
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
  ctx.fillText("   🇮🇳 Indic AI", W / 2, H * 0.965);
}

/* ─── Video generation ───────────────────────────────────────────── */
async function makeVideo(
  text: string,
  af: Float32Array,
  sr: number,
  profile: ProfileKey,
  canvas: HTMLCanvasElement,
  hasAudio: boolean
): Promise<Blob> {

  const { W, H, fps } = VIDEO_PROFILES[profile];

  canvas.width = W;
  canvas.height = H;

  const ctx2d = canvas.getContext("2d", { alpha: false })!;
  const duration = hasAudio ? af.length / sr : 5;

  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: "avc", width: W, height: H },
    ...(hasAudio
      ? { audio: { codec: "aac", numberOfChannels: 1, sampleRate: sr } }
      : {}),
    fastStart: "fragmented",
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder:", e),
  });

  videoEncoder.configure({
    codec: "avc1.4D401F",
    width: W,
    height: H,
    bitrate: 2_000_000,
  });

  let audioEncoder: AudioEncoder | null = null;

  if (hasAudio) {
    try {

      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.warn("AudioEncoder:", e),
      });

      audioEncoder.configure({
        codec: "mp4a.40.2",
        numberOfChannels: 1,
        sampleRate: sr,
        bitrate: 128000,
      });

      /* FIX: convert to proper ArrayBuffer */
    const audioBuffer = new Float32Array(af.buffer as ArrayBuffer);

      const ad = new AudioData({
        format: "f32",
        sampleRate: sr,
        numberOfFrames: af.length,
        numberOfChannels: 1,
        timestamp: 0,
        data: audioBuffer
      });

      audioEncoder.encode(ad);
      ad.close();

    } catch (e) {
      console.warn("AudioEncoder failed:", e);
      audioEncoder = null;
    }
  }

  const totalFrames = Math.ceil(duration * fps);

  for (let i = 0; i < totalFrames; i++) {

    const timestamp = Math.round((i * 1_000_000) / fps);

    drawSlide(ctx2d, W, H, text);

    const frame = new VideoFrame(canvas, {
      timestamp,
      duration: Math.round(1_000_000 / fps),
    });

    videoEncoder.encode(frame);
    frame.close();

    if (i % 30 === 0)
      await new Promise((r) => setTimeout(r, 0));
  }

  try {
    if (videoEncoder.state !== "closed") await videoEncoder.flush();
  } catch {}

  try {
    if (videoEncoder.state !== "closed") videoEncoder.close();
  } catch {}

  if (audioEncoder) {

    try {
      if (audioEncoder.state === "configured") await audioEncoder.flush();
    } catch {}

    try {
      if (audioEncoder.state !== "closed") audioEncoder.close();
    } catch {}
  }

  muxer.finalize();

  const { buffer } = muxer.target as Mp4Muxer.ArrayBufferTarget;

  return new Blob([buffer], { type: "video/mp4" });

}

/* ─── Props ──────────────────────────────────────────────────────── */
export interface TeluguVoiceProps {
  /** Pre-fill the text area (e.g. a poem passed from PoemCard) */
  initialText?: string;
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT — TeluguVoice
══════════════════════════════════════════════════════════════════ */
export default function TeluguVoice({ initialText }: TeluguVoiceProps) {
  const [text,       setText]       = useState(initialText ?? TEL_CONFIG.sampleText);
  const [loading,    setLoading]    = useState(false);
  const [status,     setStatus]     = useState("Ready");
  const [profile,    setProfile]    = useState<ProfileKey>("mobile");
  const [mounted,    setMounted]    = useState(false);

  const [audioUrl,   setAudioUrl_]  = useState<string | null>(null);
  const [vidUrl,     setVidUrl_]    = useState<string | null>(null);
  const [af,         setAf]         = useState<Float32Array | null>(null);
  const [sr,         setSr]         = useState(22050);
  const [slideReady, setSlideReady] = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const prevAudio   = useRef<string | null>(null);
  const prevVid     = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  /* Sync when parent changes initialText (e.g. poem switch) */
  useEffect(() => {
    if (initialText !== undefined) {
      setText(initialText);
      setAudioUrl_(null);
      setVidUrl_(null);
      setAf(null);
      setSlideReady(false);
      setStatus("Ready");
    }
  }, [initialText]);

  useEffect(() => () => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    if (prevVid.current)   URL.revokeObjectURL(prevVid.current);
  }, []);

  const setAudioUrl = useCallback((u: string | null) => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    prevAudio.current = u;
    setAudioUrl_(u);
  }, []);

  const setVidUrl = useCallback((u: string | null) => {
    if (prevVid.current) URL.revokeObjectURL(prevVid.current);
    prevVid.current = u;
    setVidUrl_(u);
  }, []);

  /* ── Image slide download ── */
  const downloadSlide = () => {
    if (!canvasRef.current) return;
    const { W, H } = VIDEO_PROFILES[profile];
    const c = canvasRef.current;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d", { alpha: false })!;
    drawSlide(ctx, W, H, text);
    const dataUrl = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ratnalabalatelugu_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ── Generate ── */
  const generate = async () => {
    if (!text.trim() || loading) return;
    const AT = text;
    setLoading(true);
    setAudioUrl(null);
    setVidUrl(null);
    setAf(null);
    setSlideReady(false);
    setStatus("Starting…");

    try {
      let audioF!: Float32Array;
      let audioSr = 22050;
      let audioBlob: Blob | null = null;
      let hasAudio = false;

      /* Tier 1 — /api/tts proxy (Google TTS for Telugu) */
      try {
        setStatus("🌐 Fetching Telugu audio…");
        const r = await proxyTTS(AT, TEL_CONFIG.googleTTSCode);
        audioF = r.audioFloat;
        audioSr = r.sampleRate;
        audioBlob = r.blob;
        hasAudio = true;
        setStatus("✅ Telugu audio ready — embedding in video!");
      } catch (e) {
        console.warn("Proxy TTS failed, falling back to Web Speech:", e);
      }

      /* Tier 2 — Web Speech (offline fallback) */
      if (!hasAudio) {
        setStatus("🔊 Speaking in Telugu (offline mode)…");
        await speakWebSpeech(AT, TEL_CONFIG.webSpeechLang);
        audioSr = 22050;
        audioF = new Float32Array(audioSr * 5);
        setStatus("🔊 Spoken aloud — video will have silent track (no internet)");
      }

      if (audioBlob) {
        setAf(audioF);
        setSr(audioSr);
        setAudioUrl(URL.createObjectURL(audioBlob));
      } else {
        setAf(audioF);
        setSr(audioSr);
      }

      /* Pre-render image slide */
      if (canvasRef.current) {
        const { W, H } = VIDEO_PROFILES[profile];
        canvasRef.current.width = W;
        canvasRef.current.height = H;
        drawSlide(canvasRef.current.getContext("2d", { alpha: false })!, W, H, AT);
        setSlideReady(true);
      }

      /* Render video */
      if (canvasRef.current) {
        setStatus("🎬 Rendering video…");
        try {
          const vb = await makeVideo(AT, audioF, audioSr, profile, canvasRef.current, hasAudio);
          setVidUrl(URL.createObjectURL(vb));
          setStatus(
            hasAudio
              ? "🎉 🎉 ధ్వనిమాల, కళామాల, దర్శనమాల సిద్ధంగా ఉన్నాయి — డౌన్‌లోడ్ చేయండి!"
              : "✅ దర్శనమాల సిద్ధంగా ఉన్నాయి"
          );
        } catch (e: any) {
          setStatus("⚠️ Audio ready — video failed: " + e?.message);
        }
      }
    } catch (e: any) {
      setStatus("❌ " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const over  = text.length > MAX_CHARS;
  const canGo = !loading && !!text.trim() && !over;

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_LINK} rel="stylesheet" />

      {/* Hidden canvas for video frames */}
      <canvas ref={canvasRef} style={{ position: "fixed", top: "-9999px", left: "-9999px" }} />

      <div style={{ fontFamily: "'Inter',sans-serif", background: "#f5f6fa", borderRadius: 14, padding: "20px 16px 24px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #6ee7b7", fontSize: 24, marginBottom: 8 }}>
        
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#2d6a4f", marginBottom: 4 }}>
        ధ్వనిమాల · కళామాల · దర్శనమాల
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 12 }}>
            తెలుగు పాఠ్యాన్ని ధ్వని · చిత్రం · వీడియోగా మార్చండి
          </p>
        </div>
{/* ── సమాచారం ── */}
            <div style={{ background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)", border: "1.5px solid #6ee7b7", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🇮🇳</span>
                <p style={{ fontSize: 12, color: "#047857", lineHeight: 1.8, margin: 0 }}>
                మీరు ఇచ్చిన తెలుగు పాఠ్యం <strong>Google ధ్వని సాంకేతికత</strong> ద్వారా
                <strong>ధ్వనిమాలగా</strong> మారుతుంది మరియు అదే ధ్వని
                <strong>దర్శనమాల (MP4 వీడియో)</strong> లో కూడా కలుపబడుతుంది.
                ఆడియోను MP3 రూపంలో కూడా విడిగా డౌన్‌లోడ్ చేసుకోవచ్చు.
                దీనికి ఇంటర్నెట్ అవసరం.
                </p>
            </div>
            </div>

        {/* ── Text area ── */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 6 }}>
            Telugu Text
          </label>
          <div style={{ position: "relative" }}>
            <textarea
              value={text}
              onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
              rows={4}
              disabled={loading}
              placeholder="తెలుగు వచనం ఇక్కడ టైప్ చేయండి…"
              style={{
                width: "100%", padding: "12px 12px 34px", borderRadius: 10,
                background: "#f9fafb", border: `1.5px solid ${over ? "#ef4444" : "#e5e7eb"}`,
                color: "#111827", fontSize: 17, lineHeight: 1.9, resize: "vertical",
                outline: "none", fontFamily: TELUGU_FONT, boxSizing: "border-box",
              }}
            />
            <span style={{
              position: "absolute", bottom: 9, right: 11, fontSize: 11, pointerEvents: "none",
              color: MAX_CHARS - text.length <= 50 ? (MAX_CHARS - text.length <= 0 ? "#ef4444" : "#f59e0b") : "#d1d5db",
            }}>
              {text.length}/{MAX_CHARS}
            </span>
          </div>
          {over && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Character limit reached</p>}
        </div>

        {/* ── Video format ── */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 6 }}>
            Video Format
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as ProfileKey)}
              disabled={loading}
              style={{
                width: "100%", padding: "10px 34px 10px 12px", borderRadius: 10,
                background: "#f9fafb", border: "1.5px solid #e5e7eb", color: "#111827",
                fontSize: 14, fontFamily: "inherit", appearance: "none", cursor: "pointer", outline: "none",
              }}
            >
              <option value="mobile">📱 Mobile (540×960) — Fastest</option>
              <option value="whatsapp">🟢 WhatsApp Status (720×1280)</option>
              <option value="instagram">📸 Instagram Reels (720×1280)</option>
              <option value="youtube">▶️ YouTube Shorts (1080×1920)</option>
              <option value="twitter">🐦 X / Twitter (720×1280)</option>
            </select>
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>▼</span>
          </div>
        </div>

        {/* ── Generate button ── */}
        <button
          onClick={generate}
          disabled={!canGo}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
            fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: canGo ? "pointer" : "not-allowed",
            minHeight: 50, marginBottom: 12,
            background: canGo ? "linear-gradient(135deg,#2d6a4f,#1b4332)" : "#e5e7eb",
            color: canGo ? "#fff" : "#9ca3af",
            boxShadow: canGo ? "0 4px 20px rgba(45,106,79,.35)" : "none",
            transition: "all .15s",
          }}
        >
          {loading ? `⏳ ${status}` : "🎙️ ధ్వనిమాల → కళామాల → దర్శనమాల సృష్టించండి"}
        </button>

        {/* ── Status ── */}
        {status !== "Ready" && !loading && (
          <div style={{ background: "#f0fdf4", border: "1px solid #6ee7b7", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 12, color: "#065f46", fontWeight: 500 }}>
            {status}
          </div>
        )}

        {/* ══ Downloads ══ */}
        {(audioUrl || vidUrl || slideReady) && (
          <div style={{ background: "linear-gradient(135deg,#fafafe,#f0fdf4)", border: "1.5px solid #6ee7b7", borderRadius: 14, padding: "16px" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#2d6a4f", marginBottom: 14 }}>
            📥 ధ్వనిమాల → కళామాల → దర్శనమాల సృష్టి
            </div>

            {/* Audio */}
            {audioUrl && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 7 }}>🎵 ధ్వనిమాల  (MP3)</div>
                <audio controls src={audioUrl} style={{ width: "100%", marginBottom: 8, borderRadius: 8 }} preload="auto" />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => af && playF32(af, sr)}
                    style={btnStyle("#4f46e5")}
                  >
                    ▶️ Play
                  </button>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = audioUrl!;
                      a.download = `telugu_audio_${Date.now()}.mp3`;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    }}
                    style={btnStyle("#374151", true)}
                  >
                    ⬇️ Download MP3
                  </button>
                </div>
              </div>
            )}

            {/* Video */}
            {vidUrl && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 7 }}>🎬 దర్శనమాల </div>
                <video controls playsInline src={vidUrl} style={{ width: "100%", borderRadius: 10, marginBottom: 8 }} />
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = vidUrl!;
                    a.download = `telugu_video_${Date.now()}.mp4`;
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }}
                  style={{ ...btnStyle("#059669"), width: "100%" }}
                >
                  ⬇️ Download MP4 Video
                </button>
              </div>
            )}

            {/* Image slide */}
            {slideReady && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 7 }}>🖼️ Iకళామాల  (PNG)</div>
                <div style={{ background: "#f3f4f6", borderRadius: 10, padding: 8, marginBottom: 8, textAlign: "center" }}>
                  <canvas
                    ref={(node) => {
                      if (!node || !text) return;
                      const PW = 220, PH = 391;
                      node.width = PW; node.height = PH;
                      drawSlide(node.getContext("2d")!, PW, PH, text);
                    }}
                    style={{ width: "100%", maxWidth: 180, borderRadius: 8, display: "inline-block", border: "1px solid #e5e7eb" }}
                  />
                </div>
                <button
                  onClick={downloadSlide}
                  style={{ ...btnStyle("#4f46e5", true, "#eef2ff", "#c7d2fe"), width: "100%" }}
                >
                  🖼️ Download PNG ({VIDEO_PROFILES[profile].W}×{VIDEO_PROFILES[profile].H})
                </button>
                
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}

/* ─── Tiny inline button style helper ───────────────────────────── */
function btnStyle(
  color: string,
  outline = false,
  bgOverride?: string,
  borderOverride?: string
): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, padding: "9px 16px", borderRadius: 9,
    border: outline ? `1.5px solid ${borderOverride ?? color}` : "none",
    fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif",
    cursor: "pointer", minHeight: 40, transition: "all .15s",
    background: outline ? (bgOverride ?? "#fff") : color,
    color: outline ? color : "#fff",
  };
}