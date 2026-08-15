"use client";

import * as Mp4Muxer from "mp4-muxer";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme, useMediaQuery } from "@mui/material";

/* ── telugu font ─────────────────────────────────────────────── */
const TELUGU_FONT = "'Noto Serif Telugu','Noto Serif',Georgia,serif";

/* ── config ──────────────────────────────────────────────────── */
const TEL = {
  label: "తెలుగు", flag: "🌺",
  webSpeechLang: "te-IN",
  bgColor: "#FFEFC7",
  sampleText: "నమస్కారం పిల్లలూ! ఇప్పుడు మీ కథ లేదా పద్యం వినిపిస్తాను.",
};
const MAX = 1000;

// Closing line shown + spoken at the end of every poem/video — Sri
// Krishnadevaraya's centuries-old, widely-quoted line celebrating Telugu.
const CLOSING_LINE = "దేశ భాషలందు తెలుగు లెస్స";

const PROFILES = {
  mobile:    { W: 540,  H: 960,  fps: 30, label: "Mobile" },
  whatsapp:  { W: 720,  H: 1280, fps: 30, label: "WhatsApp" },
  instagram: { W: 720,  H: 1280, fps: 30, label: "Instagram" },
  youtube:   { W: 1080, H: 1920, fps: 30, label: "YouTube" },
  twitter:   { W: 720,  H: 1280, fps: 30, label: "X / Twitter" },
} as const;
type PK = keyof typeof PROFILES;

// Voice choice — same /api/tts contract as PoemCard.tsx and
// PoemRadio.tsx (source: "edge" | "google" | "svara", voice: "male" |
// "female"), extended here with the two Svara options.
type VoiceOption = "mohan" | "shruti" | "google" | "svara-male" | "svara-female";
const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం",
  shruti: "👩 స్త్రీ స్వరం",
  google: "🔊 Google TTS",
  "svara-male": "🤖 Svara మగ",
  "svara-female": "🤖 Svara స్త్రీ",
};

// Background music — same genre set used across the app.
type MusicOption = "none" | "guitar" | "tabla" | "drums" | "flute" | "veena";
const MUSIC_TRACKS: Record<MusicOption, { label: string; src: string | null }> = {
  none:   { label: "🔇 సంగీతం లేదు", src: null },
  guitar: { label: "🎸 గిటార్",       src: "/audio/bg-music-guitar-loop.wav" },
  tabla:  { label: "🥁 తబలా",        src: "/audio/bg-music-tabla-loop.wav" },
  drums:  { label: "🪘 డ్రమ్స్",      src: "/audio/bg-music-drums-loop.wav" },
  flute:  { label: "🎶 వేణువు",       src: "/audio/bg-music-flute-loop.wav" },
  veena:  { label: "🎻 వీణ",         src: "/audio/bg-music-veena-loop.wav" },
};
const MUSIC_VOLUME_DEFAULT = 0.18;

// The scene shown "talking" in the video — a group of children walking
// hand-in-hand, drawn edge-to-edge (contain-fit, not cropped) so the
// whole group stays visible. Save the uploaded image into /public with
// this exact filename.
const TALKING_CHARACTER_SRC = "/cartoonkids1.png";

// This scene has SEVERAL faces side by side rather than one portrait, so
// instead of a single mouth anchor, this is a small mouth per child —
// all animated together off the same volume-driven openness value, so
// the whole group appears to recite the poem in unison. Each entry is a
// fraction (0..1) of the drawn image's bounding box: x = mouth center
// left-to-right, y = mouth center top-to-bottom, w/h = mouth size.
//
// These seven positions are estimated from the source image and are a
// starting point, not exact — open kids-walking-group.png in any image
// editor, hover over each child's mouth, and adjust the x/y fractions
// (pixel position ÷ image width or height) until they land precisely.
const GROUP_MOUTH_ANCHORS: { x: number; y: number; w: number; h: number }[] = [
  { x: 0.075, y: 0.235, w: 0.028, h: 0.020 }, // leftmost boy (waving)
  { x: 0.205, y: 0.205, w: 0.028, h: 0.020 }, // curly-haired boy
  { x: 0.335, y: 0.250, w: 0.024, h: 0.018 }, // girl in dress
  { x: 0.465, y: 0.230, w: 0.024, h: 0.018 }, // girl, center-left
  { x: 0.585, y: 0.240, w: 0.024, h: 0.018 }, // boy, center-right
  { x: 0.720, y: 0.195, w: 0.028, h: 0.020 }, // girl with hands raised
  { x: 0.855, y: 0.220, w: 0.024, h: 0.018 }, // girl with bun, rightmost
];

/* ── inline SVG icons (no external dep) ─────────────────────── */
const Ic = {
  mic: (c="currentColor") => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={c}>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  ),
  dl: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
    </svg>
  ),
  play: (c="currentColor") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={c}><path d="M8 5v14l11-7z"/></svg>
  ),
  stop: (c="currentColor") => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={c}><rect x="6" y="6" width="12" height="12"/></svg>
  ),
  audio: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563eb">
      <path d="M12 3v9.28A4 4 0 1014 16V7h4V3h-6zm-2 16a2 2 0 110-4 2 2 0 010 4z"/>
    </svg>
  ),
  video: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#dc2626">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  ),
  img: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#7c3aed">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>
  ),
  info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginTop:1}}>
      <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2"/>
      <path d="M12 7v5m0 4h.01" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ok: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginTop:1}}>
      <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2"/>
      <path d="M8 12l3 3 5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  err: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,marginTop:1}}>
      <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
      <path d="M12 7v5m0 4h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* platform icons ──────────────────────────────────────────────── */
const PlatformIcon = ({ k }: { k: PK }) => {
  const icons: Record<PK, React.ReactNode> = {
    mobile: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="2" width="10" height="20" rx="2"/></svg>,
    whatsapp: <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.5 2h-11A3.5 3.5 0 003 5.5v13A3.5 3.5 0 006.5 22h11a3.5 3.5 0 003.5-3.5v-13A3.5 3.5 0 0017.5 2z"/><path d="M12 7c-2.76 0-5 2.24-5 5 0 .89.24 1.73.65 2.45L7 17l2.64-.64A5 5 0 0012 17c2.76 0 5-2.24 5-5s-2.24-5-5-5zm2.5 7.27c-.1.28-.58.52-.8.54-.2.02-.21.15-1.33-.29a5.1 5.1 0 01-2.04-1.82c-.23-.32-.47-.85-.47-1.28 0-.43.19-.64.26-.73.07-.09.15-.11.2-.11h.14c.06 0 .13.01.2.15l.27.68c.03.09.01.19-.04.27l-.12.17c-.05.07-.1.15-.04.28.19.4.5.75.87 1.02.35.26.75.44 1.17.53.12.03.21-.01.29-.09l.2-.25c.08-.1.18-.12.27-.08l.84.4c.1.05.17.1.17.23 0 .13-.05.38-.14.57z" fill="white"/></svg>,
    instagram: <svg width="13" height="13" viewBox="0 0 24 24"><defs><linearGradient id="ig2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#e6683c"/><stop offset="100%" stopColor="#dc2743"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig2)"/><circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="white"/></svg>,
    youtube: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.8 5 12 5 12 5s-4.8 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.9C6.8 19 12 19 12 19s4.8 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l6 3-6 3z" fill="#FF0000"/></svg>,
    twitter: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>,
  };
  return <>{icons[k]}</>;
};

/* ── audio helpers ───────────────────────────────────────────── */

// POST body (not GET query params) — matches the shared /api/tts contract
// used by PoemCard.tsx and PoemRadio.tsx. Telugu text explodes in size
// once URL-encoded, which breaks GET-based calls on longer poems.
// Resolves a VoiceOption into the { source, voice } shape the shared
// /api/tts contract expects (same contract as PoemCard.tsx/PoemRadio.tsx).
function resolveTtsParams(voice: VoiceOption): { source: "edge" | "google" | "svara"; gender: "male" | "female" } {
  if (voice === "google") return { source: "google", gender: "male" };
  if (voice === "svara-male") return { source: "svara", gender: "male" };
  if (voice === "svara-female") return { source: "svara", gender: "female" };
  return { source: "edge", gender: voice === "shruti" ? "female" : "male" };
}

async function fetchTtsFloat(text: string, voice: VoiceOption) {
  const { source, gender } = resolveTtsParams(voice);
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source, voice: gender }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const buf = await res.arrayBuffer();
  const C = window.AudioContext || (window as any).webkitAudioContext;
  const tmp = new C();
  const dec = await tmp.decodeAudioData(buf.slice(0));
  const af = dec.getChannelData(0);
  const sr = dec.sampleRate;
  await tmp.close();
  return { audioFloat: af, sampleRate: sr, blob: new Blob([buf], { type: "audio/mpeg" }) };
}

// Mixes narration with a looped background track entirely client-side via
// OfflineAudioContext, returning a single Float32Array at the narration's
// sample rate/duration — ready to feed straight into the video encoder.
// If the browser can't load/decode the music (missing file, offline,
// codec issue), this quietly falls back to narration-only rather than
// failing the whole video.
async function mixWithMusicFloat32(
  narrationFloat: Float32Array,
  sr: number,
  musicSrc: string,
  volume: number
): Promise<Float32Array> {
  try {
    const res = await fetch(musicSrc);
    const musicBuf = await res.arrayBuffer();
    const C = window.AudioContext || (window as any).webkitAudioContext;
    const tmpCtx = new C();
    const musicDecoded = await tmpCtx.decodeAudioData(musicBuf.slice(0));
    await tmpCtx.close();

    const offline = new OfflineAudioContext(1, narrationFloat.length, sr);

    const narrationBuffer = offline.createBuffer(1, narrationFloat.length, sr);
    narrationBuffer.copyToChannel(new Float32Array(narrationFloat), 0);
    const narrSource = offline.createBufferSource();
    narrSource.buffer = narrationBuffer;
    narrSource.connect(offline.destination);
    narrSource.start(0);

    const musicSource = offline.createBufferSource();
    musicSource.buffer = musicDecoded; // Web Audio resamples automatically if rates differ
    musicSource.loop = true;
    const gain = offline.createGain();
    gain.gain.value = volume;
    musicSource.connect(gain).connect(offline.destination);
    musicSource.start(0);

    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } catch {
    return narrationFloat;
  }
}

function waitVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(res => {
    const v = speechSynthesis.getVoices();
    if (v.length) { res(v); return; }
    const fn = () => { speechSynthesis.removeEventListener("voiceschanged", fn); res(speechSynthesis.getVoices()); };
    speechSynthesis.addEventListener("voiceschanged", fn);
    setTimeout(() => { speechSynthesis.removeEventListener("voiceschanged", fn); res([]); }, 2000);
  });
}
async function speakWS(text: string, lang: string) {
  for (const line of text.split("\n").map(l => l.trim()).filter(Boolean)) {
    await new Promise<void>(async res => {
      const u = new SpeechSynthesisUtterance(line);
      u.lang = lang;
      const vv = await waitVoices();
      const v = vv.find(v => v.lang === lang) || vv.find(v => v.lang.startsWith(lang.split("-")[0]));
      if (v) u.voice = v;
      u.rate = 0.85; u.onend = () => res(); u.onerror = () => res();
      speechSynthesis.speak(u);
    });
  }
}

let _ctx: AudioContext | null = null;
function getCtx() {
  const C = window.AudioContext || (window as any).webkitAudioContext;
  if (!_ctx || _ctx.state === "closed") _ctx = new C();
  return _ctx;
}
async function playF32(af: Float32Array, sr: number) {
  const ctx = getCtx();
  if (ctx.state === "suspended") await ctx.resume();
  const buf = ctx.createBuffer(1, af.length, sr);
  buf.copyToChannel(new Float32Array(af), 0);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.connect(ctx.destination); src.start(0);
  return new Promise<void>(res => { src.onended = () => res(); });
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // graceful fallback — caller draws without it
    img.src = src;
  });
}

/* ── small decorative Indian flag (simplified, not exact official
   proportions — a stylized tricolor + wheel, drawn purely with canvas
   primitives for a festive header touch). Centered at (cx, topY), width
   w, using a standard ~3:2 flag aspect ratio. */
function drawIndianFlag(ctx: CanvasRenderingContext2D, cx: number, topY: number, w: number) {
  const h = w * (2 / 3);
  const x = cx - w / 2;
  const bandH = h / 3;

  // pole
  ctx.fillStyle = "rgba(120,90,50,0.9)";
  ctx.fillRect(x - 4, topY - 4, 4, h + 10);

  ctx.fillStyle = "#FF9933"; ctx.fillRect(x, topY, w, bandH);
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x, topY + bandH, w, bandH);
  ctx.fillStyle = "#138808"; ctx.fillRect(x, topY + bandH * 2, w, bandH);

  // simple chakra: navy circle outline + spokes, centered in the white band
  const ccx = x + w / 2;
  const ccy = topY + bandH * 1.5;
  const r = bandH * 0.32;
  ctx.strokeStyle = "#000080";
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.beginPath(); ctx.arc(ccx, ccy, r, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const ang = (Math.PI * 2 * i) / 24;
    ctx.beginPath();
    ctx.moveTo(ccx, ccy);
    ctx.lineTo(ccx + Math.cos(ang) * r, ccy + Math.sin(ang) * r);
    ctx.stroke();
  }

  // thin outline around the whole flag
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, topY, w, h);
}

/* ── canvas draw: talking character frame ───────────────────────
   Draws the character once per video frame. mouthOpen (0..1) comes from
   the narration's volume envelope at that instant — this is what makes
   the mouth appear to move in sync with speech, without true phoneme-
   level lip sync (that needs a GPU model; see chat notes). blink and
   bobOffset add small idle-life touches so the character doesn't look
   frozen between words. isEnding switches the caption panel to the
   closing tagline card for the final stretch of the video. */
function drawTalkingFrame(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  text: string,
  charImg: HTMLImageElement | null,
  mouthOpen: number,
  blink: boolean,
  tSec: number,
  isEnding: boolean = false
) {
  // ── Bright, sunny kids-theme background — sky blue fading into a warm
  // cream, with a soft sun and a grass strip at the base, echoing the
  // daytime outdoor scene in the walking-kids illustration.
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#8ECBEA");
  g.addColorStop(0.55, "#CFE9F5");
  g.addColorStop(1, "#FFEFC7");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // a couple of small twinkling stars for extra sparkle
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  const starPositions = [[W * 0.12, H * 0.08], [W * 0.65, H * 0.05]];
  for (const [sx, sy] of starPositions) {
    const twinkle = 0.5 + 0.5 * Math.sin(tSec * 3 + sx);
    ctx.globalAlpha = 0.4 + 0.5 * twinkle;
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // soft sun in the corner
  ctx.beginPath();
  ctx.arc(W * 0.86, H * 0.09, W * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,214,102,0.85)";
  ctx.fill();

  // grass strip along the bottom, tying the frame to the scene's ground
  const grassH = H * 0.05;
  ctx.fillStyle = "#8FC96B";
  ctx.fillRect(0, H - grassH, W, grassH);
  ctx.fillStyle = "#7AB85A";
  ctx.fillRect(0, H - grassH, W, grassH * 0.35);

  ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(0, 0, W, H * 0.1);

  // ── Indian flag header — sits above the label pill, above the kids
  // scene ("cartoon kids below Indian flag").
  drawIndianFlag(ctx, W / 2, H * 0.018, W * 0.16);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(43,38,32,0.55)";
  ctx.font = `bold ${Math.floor(W/28)}px sans-serif`;
  ctx.fillText("✍️ స్వరమాల", W/2, H*0.135);
  const bW=140,bH=30,bx=(W-bW)/2,by=H*0.153;
  ctx.fillStyle="#FF8A5B"; ctx.beginPath(); ctx.roundRect(bx,by,bW,bH,15); ctx.fill();
  ctx.fillStyle="#ffffff"; ctx.font=`600 ${Math.floor(W/37)}px sans-serif`;
  ctx.fillText(`${TEL.flag} ${TEL.label}`, W/2, by+bH*0.7);

  // ── Group scene stage: a wide rounded panel, contain-fit (not cropped)
  // so all seven children stay fully visible — a circular crop like a
  // single-portrait avatar would slice off most of the group.
  const stageW = W * 0.92;
  const imgAspect = charImg ? charImg.width / charImg.height : 2.04; // fallback matches source art
  const stageH = stageW / imgAspect;
  const stageX = (W - stageW) / 2;
  const bob = Math.sin(tSec * 2) * (stageH * 0.01); // gentle idle bob
  const stageY = H * 0.2 + bob;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(stageX, stageY, stageW, stageH, 16);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.clip();

  if (charImg) {
    // contain-fit: whole image visible, letterboxed inside the stage if
    // its aspect ratio doesn't exactly match.
    const scale = Math.min(stageW / charImg.width, stageH / charImg.height);
    const dw = charImg.width * scale;
    const dh = charImg.height * scale;
    const dx = stageX + (stageW - dw) / 2;
    const dy = stageY + (stageH - dh) / 2;
    ctx.drawImage(charImg, dx, dy, dw, dh);

    // One small mouth per child, all animated off the same volume-driven
    // openness value — reads as the whole group reciting together. Held
    // closed during the closing tagline card, since nobody's "speaking"
    // the sign-off line visually at that point.
    if (!isEnding) {
      ctx.fillStyle = "rgba(60,20,20,0.85)";
      for (const a of GROUP_MOUTH_ANCHORS) {
        const mx = dx + dw * a.x;
        const my = dy + dh * a.y;
        const mw = dw * a.w;
        const mh = Math.max(dh * a.h * mouthOpen, dh * 0.004);
        ctx.beginPath();
        ctx.ellipse(mx, my, mw / 2, mh / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Blinking is skipped for the multi-face scene — seven simultaneous
    // blinks reads as flickering rather than lifelike; the mouth motion
    // alone is enough to sell "talking" here.
  } else {
    // Scene image missing/failed to load — fall back to a plain panel
    // rather than breaking the render.
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(stageX, stageY, stageW, stageH);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.roundRect(stageX, stageY, stageW, stageH, 16);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const textTop = stageY + stageH + H * 0.03;
  const availableH = H * 0.94 - textTop;

  if (isEnding) {
    // ── Closing tagline card — a distinct, larger, tricolor-accented
    // panel shown for the last stretch of every video, instead of the
    // normal poem-text caption.
    const cardH = availableH;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.roundRect(40, textTop, W - 80, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = "#FF9933";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, textTop, W - 80, cardH, 18);
    ctx.stroke();

    const closingFs = Math.max(20, Math.floor(W / 15));
    ctx.font = `bold ${closingFs}px ${TELUGU_FONT}`;
    ctx.fillStyle = "#0B5D2E";
    const midY = textTop + cardH / 2;
    ctx.fillText(CLOSING_LINE, W / 2, midY - closingFs * 0.15);

    ctx.font = `500 ${Math.floor(W / 34)}px sans-serif`;
    ctx.fillStyle = "#8B6F47";
    ctx.fillText("🇮🇳", W / 2, midY + closingFs * 0.85);
  } else {
    // ── Poem text, in the lower half below the scene. A soft white
    // panel sits behind the text so it stays readable regardless of
    // what's directly behind it (sky, grass, or the scene edge).
    const fs = Math.max(18, Math.floor(W / 20));
    const mwText = W - 100;
    const words = text.split(" ");
    const lines: string[] = [];
    ctx.font = `bold ${fs}px ${TELUGU_FONT}`;
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > mwText && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    const maxLines = Math.max(2, Math.floor(availableH / (fs * 1.6)));
    const dls = lines.slice(0, maxLines);
    if (lines.length > maxLines) dls[dls.length - 1] += "…";
    const lh = fs * 1.6;

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.roundRect(50, textTop - fs * 0.3, W - 100, dls.length * lh + fs * 0.4, 14);
    ctx.fill();

    ctx.fillStyle = "#2B2620";
    let y = textTop + lh * 0.6;
    for (const l of dls) { ctx.fillText(l, W/2, y); y += lh; }
  }

  ctx.fillStyle = "rgba(139,111,71,0.9)"; ctx.font = `400 ${Math.floor(W/45)}px sans-serif`;
  ctx.fillText("రత్నాలబాల -జ్ఞానమాల", W/2, H - grassH - H*0.015);
}

/* Still-frame version, used for the static PNG export and the small
   thumbnail preview — same visual, character with mouth closed, no
   blink, so the PNG matches the video's look. */
function drawSlide(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, charImg: HTMLImageElement | null) {
  drawTalkingFrame(ctx, W, H, text, charImg, 0, false, 0, false);
}

/* ── video ───────────────────────────────────────────────────── */
async function makeVideo(
  text: string, af: Float32Array, sr: number, pk: PK,
  canvas: HTMLCanvasElement, hasAudio: boolean, charImg: HTMLImageElement | null
): Promise<Blob> {
  const {W,H,fps}=PROFILES[pk];
  canvas.width=W; canvas.height=H;
  const c2=canvas.getContext("2d",{alpha:false})!;
  const dur=hasAudio?af.length/sr:5;
  const muxer=new Mp4Muxer.Muxer({
    target:new Mp4Muxer.ArrayBufferTarget(),
    video:{codec:"avc",width:W,height:H},
    ...(hasAudio?{audio:{codec:"aac",numberOfChannels:1,sampleRate:sr}}:{}),
    fastStart:"fragmented",
  });
  const ve=new VideoEncoder({output:(c,m)=>muxer.addVideoChunk(c,m),error:e=>console.error(e)});
  ve.configure({codec:"avc1.4D401F",width:W,height:H,bitrate:2_000_000});
  let ae:AudioEncoder|null=null;
  if(hasAudio){
    try{
      ae=new AudioEncoder({output:(c,m)=>muxer.addAudioChunk(c,m),error:e=>console.warn(e)});
      ae.configure({codec:"mp4a.40.2",numberOfChannels:1,sampleRate:sr,bitrate:128000});
      const ad=new AudioData({format:"f32",sampleRate:sr,numberOfFrames:af.length,numberOfChannels:1,timestamp:0,data:new Float32Array(af.buffer as ArrayBuffer)});
      ae.encode(ad); ad.close();
    }catch{ae=null;}
  }

  const total=Math.ceil(dur*fps);
  const samplesPerFrame = Math.max(1, Math.floor(sr / fps));
  let smoothedOpen = 0;
  const blinkCycleFrames = fps * 4; // roughly one blink every 4 seconds

  // Last ~2.5 seconds of every video switch to the closing tagline card,
  // capped so a very short clip doesn't spend its entire duration on it.
  const closingFrames = Math.min(Math.round(fps * 2.5), Math.floor(total * 0.4));

  for(let i=0;i<total;i++){
    const ts=Math.round((i*1_000_000)/fps);

    // Mouth openness for this frame, from the narration's RMS volume in
    // the sample window covering this frame — smoothed across frames so
    // the mouth doesn't flap on every tiny sample-level fluctuation.
    let rawOpen = 0;
    if (hasAudio) {
      const start = i * samplesPerFrame;
      const end = Math.min(start + samplesPerFrame, af.length);
      if (end > start) {
        let sumSq = 0;
        for (let s = start; s < end; s++) sumSq += af[s] * af[s];
        const rms = Math.sqrt(sumSq / (end - start));
        rawOpen = Math.min(1, rms * 6.5); // gain tuned for typical TTS levels
      }
    }
    smoothedOpen = smoothedOpen * 0.55 + rawOpen * 0.45;

    const blinkFrame = i % blinkCycleFrames;
    const blink = blinkFrame >= blinkCycleFrames - 4; // ~4-frame blink
    const isEnding = i >= total - closingFrames;

    drawTalkingFrame(c2, W, H, text, charImg, smoothedOpen, blink, i / fps, isEnding);

    const f=new VideoFrame(canvas,{timestamp:ts,duration:Math.round(1_000_000/fps)});
    ve.encode(f); f.close();
    if(i%30===0)await new Promise(r=>setTimeout(r,0));
  }
  try{if(ve.state!=="closed")await ve.flush();}catch{}
  try{if(ve.state!=="closed")ve.close();}catch{}
  if(ae){
    try{if((ae as any).state==="configured")await ae.flush();}catch{}
    try{if((ae as any).state!=="closed")ae.close();}catch{}
  }
  muxer.finalize();
  const {buffer}=muxer.target as Mp4Muxer.ArrayBufferTarget;
  return new Blob([buffer],{type:"video/mp4"});
}

function dlFile(url:string,name:string){
  const a=document.createElement("a"); a.href=url; a.download=name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ═══════════════════════════════════════════════════════════════
   SHARED STYLE TOKENS
═══════════════════════════════════════════════════════════════ */
const C = {
  forest: "#1a3d2b",
  forestMid: "#2d6a4f",
  white: "#ffffff",
  surface: "#f8faf9",
  border: "#ddeee4",
  borderDark: "#c3d9cc",
  textPrimary: "#0d1f18",
  textMuted: "#6b7280",
  textHint: "#9ca3af",
  successBg: "#f0fdf4",
  successBorder: "#86efac",
  successText: "#166534",
  errorBg: "#fef2f2",
  errorBorder: "#fca5a5",
  errorText: "#991b1b",
  audioBg: "#eff6ff",
  videoBg: "#fef2f2",
  imgBg: "#f5f3ff",
};

const s = {
  card: {background:C.white,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"} as React.CSSProperties,
  surface: {background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:"12px 14px"} as React.CSSProperties,
  label: {fontSize:11,fontWeight:600,letterSpacing:"0.7px",textTransform:"uppercase" as const,color:C.textMuted,display:"block",marginBottom:8},
  select: {width:"100%",height:44,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.white,color:C.textPrimary,fontSize:14,fontWeight:600,padding:"0 12px",fontFamily:"inherit",outline:"none",cursor:"pointer"} as React.CSSProperties,
  btnPrimary: {width:"100%",minHeight:54,borderRadius:14,background:`linear-gradient(135deg, ${C.forestMid}, ${C.forest})`,color:C.white,border:"none",fontSize:15,fontWeight:700,display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,gap:9,cursor:"pointer",boxShadow:"0 4px 20px rgba(26,61,43,0.3)",WebkitTapHighlightColor:"transparent",letterSpacing:0.2,fontFamily:"inherit"} as React.CSSProperties,
  btnGhost: {width:"100%",minHeight:46,borderRadius:10,background:C.white,color:C.forest,border:`1.5px solid ${C.borderDark}`,fontSize:14,fontWeight:600,display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,gap:7,cursor:"pointer",WebkitTapHighlightColor:"transparent",fontFamily:"inherit"} as React.CSSProperties,
  btnSolid: {width:"100%",minHeight:46,borderRadius:10,background:C.forest,color:C.white,border:"none",fontSize:14,fontWeight:600,display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,gap:7,cursor:"pointer",boxShadow:"0 3px 12px rgba(26,61,43,0.25)",WebkitTapHighlightColor:"transparent",fontFamily:"inherit"} as React.CSSProperties,
  btnSm: {flex:1,minHeight:42,borderRadius:8,fontSize:13,fontWeight:600,display:"flex" as const,alignItems:"center" as const,justifyContent:"center" as const,gap:6,cursor:"pointer",WebkitTapHighlightColor:"transparent",fontFamily:"inherit",border:"none"} as React.CSSProperties,
  iconBadge: (bg:string) => ({width:30,height:30,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0} as React.CSSProperties),
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
export interface TeluguVoiceProps { initialText?: string; }

export default function TeluguVoice({ initialText }: TeluguVoiceProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [text, setText] = useState(initialText ?? TEL.sampleText);
  const [loading, setLoading] = useState(false);
  const [pct, setPct] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [profile, setProfile] = useState<PK>("mobile");
  const [voiceChoice, setVoiceChoice] = useState<VoiceOption>("mohan");
  const [musicChoice, setMusicChoice] = useState<MusicOption>("guitar");
  const [mounted, setMounted] = useState(false);
  const [audioUrl, setAudioUrl_] = useState<string|null>(null);
  const [vidUrl, setVidUrl_] = useState<string|null>(null);
  const [af, setAf] = useState<Float32Array|null>(null);
  const [sr, setSr] = useState(22050);
  const [slideReady, setSlideReady] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charImgRef = useRef<HTMLImageElement | null>(null);
  const prevAudio = useRef<string|null>(null);
  const prevVid = useRef<string|null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    // Preload the character image once — reused for every generate() call
    // and for the still-thumbnail preview below.
    loadImage(TALKING_CHARACTER_SRC).then(img => { charImgRef.current = img; });
  }, []);
  useEffect(() => {
    if (initialText != null) {
      setText(initialText); setAudioUrl_(null); setVidUrl_(null); setAf(null);
      setSlideReady(false); setStatusMsg(""); setError("");
    }
  }, [initialText]);
  useEffect(() => () => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    if (prevVid.current) URL.revokeObjectURL(prevVid.current);
  }, []);

  const setAudioUrl = useCallback((u:string|null) => {
    if (prevAudio.current) URL.revokeObjectURL(prevAudio.current);
    prevAudio.current = u; setAudioUrl_(u);
  }, []);
  const setVidUrl = useCallback((u:string|null) => {
    if (prevVid.current) URL.revokeObjectURL(prevVid.current);
    prevVid.current = u; setVidUrl_(u);
  }, []);

  const dlSlide = () => {
    if (!canvasRef.current) return;
    const {W,H} = PROFILES[profile];
    const c = canvasRef.current; c.width=W; c.height=H;
    drawSlide(c.getContext("2d",{alpha:false})!, W, H, text, charImgRef.current);
    dlFile(c.toDataURL("image/png"), `telugu_slide_${Date.now()}.png`);
  };

  const handlePlay = async () => {
    if (!af) return; setPlaying(true);
    await playF32(af, sr); setPlaying(false);
  };

  const generate = async () => {
    if (!text.trim() || loading) return;
    const AT = text;
    // Spoken narration includes the closing tagline at the end, matching
    // what the video's closing card shows for the final stretch.
    const narrationText = `${AT} ${CLOSING_LINE}.`;
    setLoading(true); setAudioUrl(null); setVidUrl(null); setAf(null);
    setSlideReady(false); setStatusMsg(""); setError(""); setPct(10);
    try {
      let audioF!: Float32Array; let audioSr=22050;
      let audioBlob:Blob|null=null; let hasAudio=false;
      try {
        setStatusMsg("తెలుగు ధ్వని తయారవుతోంది…"); setPct(25);
        const r = await fetchTtsFloat(narrationText, voiceChoice);
        audioF=r.audioFloat; audioSr=r.sampleRate; audioBlob=r.blob; hasAudio=true;
        setStatusMsg("ధ్వని సిద్ధం ✅"); setPct(45);
      } catch {
        setStatusMsg("ఆఫ్‌లైన్ వాయిస్ ఉపయోగిస్తున్నాం…");
        await speakWS(narrationText, TEL.webSpeechLang);
        audioSr=22050; audioF=new Float32Array(audioSr*5); setPct(45);
      }

      // Mix in background music (client-side, no server round trip) before
      // encoding — the played-back audio preview stays narration-only
      // (audioBlob), but the video's embedded audio includes the mix.
      let videoAudioF = audioF;
      if (hasAudio && MUSIC_TRACKS[musicChoice].src) {
        setStatusMsg("సంగీతం కలుపుతోంది…"); setPct(55);
        videoAudioF = await mixWithMusicFloat32(audioF, audioSr, MUSIC_TRACKS[musicChoice].src!, MUSIC_VOLUME_DEFAULT);
      }

      if (audioBlob) { setAf(audioF); setSr(audioSr); setAudioUrl(URL.createObjectURL(audioBlob)); }
      else { setAf(audioF); setSr(audioSr); }

      if (canvasRef.current) {
        const {W,H}=PROFILES[profile];
        canvasRef.current.width=W; canvasRef.current.height=H;
        drawSlide(canvasRef.current.getContext("2d",{alpha:false})!, W, H, AT, charImgRef.current);
        setSlideReady(true);
      }
      if (canvasRef.current) {
        setStatusMsg("వీడియో రెండర్ అవుతోంది (మాట్లాడే బొమ్మతో)…"); setPct(75);
        try {
          // The video draws the ORIGINAL poem text (AT) throughout, then
          // automatically swaps to the closing tagline card for the last
          // stretch — see makeVideo's isEnding logic.
          const vb = await makeVideo(AT, videoAudioF, audioSr, profile, canvasRef.current, hasAudio, charImgRef.current);
          setVidUrl(URL.createObjectURL(vb));
          setStatusMsg(hasAudio ? "సిద్ధం! డౌన్‌లోడ్ చేయండి 🎉" : "వీడియో సిద్ధం ✅");
          setPct(100);
        } catch (e:any) { setError("వీడియో విఫలమైంది: "+e?.message); setPct(100); }
      }
    } catch(e:any) { setError(e?.message??"Error"); setPct(0); }
    finally { setLoading(false); }
  };

  if (!mounted) return null;

  const over = text.length > MAX;
  const canGo = !loading && !!text.trim() && !over;
  const charsLeft = MAX - text.length;
  const hasOutput = audioUrl || vidUrl || slideReady;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Telugu:wght@400;700&display=swap" rel="stylesheet" />
      <canvas ref={canvasRef} style={{position:"fixed",top:-9999,left:-9999}} />

      <div style={{fontFamily:"system-ui,-apple-system,sans-serif",display:"flex",flexDirection:"column",gap:14}}>

        {/* ── Info banner ── */}
        <div style={{background:C.successBg,border:`1px solid ${C.successBorder}`,borderRadius:10,padding:"10px 12px",display:"flex",gap:9,alignItems:"flex-start"}}>
          {Ic.info()}
          <p style={{fontSize:12,color:C.successText,margin:0,lineHeight:1.7}}>
            తెలుగు టెక్స్ట్‌ని ఎంచుకున్న స్వరం + సంగీతంతో <strong>MP3 + MP4 (మాట్లాడే బొమ్మతో) + PNG</strong>గా మారుస్తాం.
          </p>
        </div>

        {/* ── Text area ── */}
        <div>
          <span style={s.label}>తెలుగు వచనం</span>
          <div style={{position:"relative"}}>
            <textarea
              rows={isMobile ? 3 : 4}
              value={text}
              disabled={loading}
              placeholder="తెలుగు వచనం ఇక్కడ టైప్ చేయండి…"
              onChange={e => { if (e.target.value.length <= MAX) setText(e.target.value); }}
              style={{
                width:"100%", boxSizing:"border-box",
                border:`1.5px solid ${over?"#ef4444":C.border}`,
                borderRadius:12, padding:"13px 13px 36px",
                fontSize:17, lineHeight:1.9,
                fontFamily:TELUGU_FONT, color:C.textPrimary,
                background:C.white, resize:"vertical",
                outline:"none", WebkitAppearance:"none",
                transition:"border-color 0.15s",
              }}
            />
            <span style={{
              position:"absolute",bottom:10,right:12,
              fontSize:11,fontWeight:600,pointerEvents:"none",
              color:charsLeft<=0?"#ef4444":charsLeft<=50?"#f59e0b":C.textHint,
            }}>{text.length}/{MAX}</span>
          </div>
          {over && <p style={{color:"#ef4444",fontSize:12,margin:"4px 0 0"}}>అక్షర పరిమితి మించింది</p>}
        </div>

        {/* ── Voice + music selectors ── */}
        <div style={{display:"flex",gap:10,flexWrap: isMobile ? "wrap" : "nowrap"}}>
          <div style={{flex:1,minWidth:140}}>
            <span style={s.label}>స్వరం</span>
            <select
              style={s.select}
              value={voiceChoice}
              disabled={loading}
              onChange={e => setVoiceChoice(e.target.value as VoiceOption)}
            >
              {(Object.keys(VOICE_LABELS) as VoiceOption[]).map(v => (
                <option key={v} value={v}>{VOICE_LABELS[v]}</option>
              ))}
            </select>
          </div>
          <div style={{flex:1,minWidth:140}}>
            <span style={s.label}>నేపథ్య సంగీతం</span>
            <select
              style={s.select}
              value={musicChoice}
              disabled={loading}
              onChange={e => setMusicChoice(e.target.value as MusicOption)}
            >
              {(Object.keys(MUSIC_TRACKS) as MusicOption[]).map(m => (
                <option key={m} value={m}>{MUSIC_TRACKS[m].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Format chips ── */}
        <div>
          <span style={s.label}>వీడియో ఫార్మాట్</span>
          <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch" as any,scrollbarWidth:"none" as any}}>
            {(Object.entries(PROFILES) as [PK,any][]).map(([k,v]) => {
              const active = profile === k;
              return (
                <button key={k} onClick={() => !loading && setProfile(k)} disabled={loading}
                  style={{
                    display:"inline-flex",alignItems:"center",gap:6,
                    padding:"0 14px",height:38,borderRadius:100,
                    fontSize:13,fontWeight:600,cursor:"pointer",
                    flexShrink:0,border:"none",
                    background:active?C.forest:C.white,
                    color:active?C.white:C.textMuted,
                    outline:`1.5px solid ${active?C.forest:C.border}`,
                    boxShadow:active?"0 3px 10px rgba(26,61,43,0.25)":"none",
                    transition:"all 0.15s",
                    WebkitTapHighlightColor:"transparent",
                    fontFamily:"inherit",
                  }}>
                  <PlatformIcon k={k} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Generate button ── */}
        <button style={{
          ...s.btnPrimary,
          ...((!canGo)&&{background:"#e5e7eb",color:C.textHint,boxShadow:"none",cursor:"not-allowed"}),
        }} onClick={generate} disabled={!canGo}>
          {loading ? (
            <span style={{display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=>(
                <span key={i} style={{
                  width:7,height:7,borderRadius:"50%",background:"white",
                  display:"inline-block",
                  animation:`tvbounce 1.2s ease-in-out ${i*0.15}s infinite`,
                }}/>
              ))}
              <style>{`@keyframes tvbounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
            </span>
          ) : (
            <>{Ic.mic("white")} మాట్లాడే బొమ్మ వీడియో సృష్టించండి</>
          )}
        </button>

        {/* ── Progress ── */}
        {loading && (
          <div>
            <div style={{width:"100%",height:5,background:"#d1fae5",borderRadius:100,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.forestMid},${C.forest})`,borderRadius:100,transition:"width 0.4s ease"}}/>
            </div>
            {statusMsg && <p style={{fontSize:12,color:C.textMuted,margin:"5px 0 0"}}>{statusMsg}</p>}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{background:C.errorBg,border:`1px solid ${C.errorBorder}`,borderRadius:10,padding:"10px 12px",display:"flex",gap:9,alignItems:"flex-start"}}>
            {Ic.err()}
            <p style={{fontSize:13,color:C.errorText,margin:0,lineHeight:1.6}}>{error}</p>
          </div>
        )}

        {/* ── Success ── */}
        {statusMsg && !loading && !error && (
          <div style={{background:C.successBg,border:`1px solid ${C.successBorder}`,borderRadius:10,padding:"10px 12px",display:"flex",gap:9,alignItems:"flex-start"}}>
            {Ic.ok()}
            <p style={{fontSize:13,color:C.successText,margin:0,lineHeight:1.6,fontWeight:500}}>{statusMsg}</p>
          </div>
        )}

        {/* ══ Downloads card ══ */}
        {hasOutput && (
          <div style={s.card}>
            <div style={{padding:"11px 14px",background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
              {Ic.dl(C.textMuted,15)}
              <span style={{fontSize:13,fontWeight:600,color:C.textPrimary}}>డౌన్‌లోడ్‌లు</span>
            </div>

            {audioUrl && (
              <div style={{padding:"14px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={s.iconBadge(C.audioBg)}>{Ic.audio()}</div>
                  <span style={{fontSize:13,fontWeight:600,color:C.textPrimary}}>ధ్వనిమాల (MP3)</span>
                </div>
                <audio controls src={audioUrl} preload="auto"
                  style={{width:"100%",display:"block",borderRadius:8,marginBottom:10}} />
                <div style={{display:"flex",gap:8}}>
                  <button style={{...s.btnSm,background:C.forest,color:C.white,boxShadow:"0 2px 8px rgba(26,61,43,0.2)"}}
                    onClick={handlePlay} disabled={playing}>
                    {playing?Ic.stop("white"):Ic.play("white")}
                    {playing?"ఆపు":"Play"}
                  </button>
                  <button style={{...s.btnSm,background:C.surface,color:C.forest,border:`1.5px solid ${C.border}`}}
                    onClick={()=>dlFile(audioUrl!,`telugu_audio_${Date.now()}.mp3`)}>
                    {Ic.dl(C.forest,14)}
                    MP3
                  </button>
                </div>
              </div>
            )}

            {vidUrl && (
              <div style={{padding:"14px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={s.iconBadge(C.videoBg)}>{Ic.video()}</div>
                  <span style={{fontSize:13,fontWeight:600,color:C.textPrimary}}>దర్శనమాల (MP4 · మాట్లాడే బొమ్మ)</span>
                </div>
                <div style={{borderRadius:12,overflow:"hidden",marginBottom:10,boxShadow:"0 4px 14px rgba(0,0,0,0.12)"}}>
                  <video controls playsInline src={vidUrl} style={{width:"100%",display:"block"}} />
                </div>
                <button style={s.btnSolid}
                  onClick={()=>dlFile(vidUrl!,`telugu_video_${Date.now()}.mp4`)}>
                  {Ic.dl("white",16)}
                  MP4 వీడియో డౌన్‌లోడ్
                </button>
              </div>
            )}

            {slideReady && (
              <div style={{padding:"14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={s.iconBadge(C.imgBg)}>{Ic.img()}</div>
                  <span style={{fontSize:13,fontWeight:600,color:C.textPrimary}}>కళామాల (PNG)</span>
                </div>
                <div style={{background:C.surface,borderRadius:10,padding:14,display:"flex",gap:14,alignItems:"center",marginBottom:10}}>
                  <canvas
                    ref={node=>{
                      if(!node||!text)return;
                      node.width=180; node.height=320;
                      drawSlide(node.getContext("2d")!, 180, 320, text, charImgRef.current);
                    }}
                    style={{width:60,borderRadius:6,border:`1px solid ${C.border}`,flexShrink:0,display:"block"}}
                  />
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:C.textPrimary,margin:"0 0 3px"}}>{PROFILES[profile].W} × {PROFILES[profile].H}</p>
                    <p style={{fontSize:12,color:C.textMuted,margin:0}}>{PROFILES[profile].label} format · PNG</p>
                  </div>
                </div>
                <button style={s.btnGhost} onClick={dlSlide}>
                  {Ic.dl(C.forest,16)}
                  PNG డౌన్‌లోడ్
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}