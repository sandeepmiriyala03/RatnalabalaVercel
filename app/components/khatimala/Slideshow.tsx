"use client";

/* ═══════════════════════════════════════════════════════════════
   స్లైడ్ షో — పూర్తి తెర, మీ సంగీతంతో
   • తనంతట తానే మారుతుంది (N సెకన్లు) లేదా మీరు నొక్కినప్పుడు
   • ← → బాణాలు, Space, Esc · ఫోన్‌లో ఎడమ/కుడి స్వైప్
   • తెర ఆరిపోకుండా (Wake Lock) — ఉన్న బ్రౌజర్లలో
   • iPhone లో "పూర్తి తెర" API లేదు → మొత్తం పేజీపై పరుచుకుంటుంది
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import MusicOffRoundedIcon from "@mui/icons-material/MusicOffRounded";
import { paintPage, type Layout } from "./engine";
import type { Project } from "./model";

type Props = {
  layout: Layout;
  project: Project;
  start: number;
  musicUrl: string | null;
  /** false = just look at pages (no timer) */
  autoplay: boolean;
  onClose: () => void;
};

type WakeLock = { release: () => Promise<void> };

export default function Slideshow({ layout, project, start, musicUrl, autoplay, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(Math.min(start, layout.pages.length - 1));
  const [playing, setPlaying] = useState(autoplay && project.show.seconds > 0);
  const [musicOn, setMusicOn] = useState(!!musicUrl);
  const [controls, setControls] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [anim, setAnim] = useState(0);
  const n = layout.pages.length;
  const { seconds, transition, loop } = project.show;
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const fsEntered = useRef(false);

  const go = useCallback(
    (d: number) => {
      setIndex((i) => {
        const next = i + d;
        if (next >= n) return loop ? 0 : i;
        if (next < 0) return loop ? n - 1 : 0;
        return next;
      });
      setAnim((a) => a + 1);
    },
    [n, loop]
  );

  /* full screen + keep screen awake */
  useEffect(() => {
    const el = root.current;
    let lock: WakeLock | null = null;
    el?.requestFullscreen?.().catch(() => {});
    (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } }).wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    const onFs = () => {
      if (!document.fullscreenElement && fsEntered.current) closeRef.current();
      if (document.fullscreenElement) fsEntered.current = true;
    };
    document.addEventListener("fullscreenchange", onFs);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      void lock?.release().catch(() => {});
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  /* music */
  useEffect(() => {
    if (!musicUrl) return;
    const a = new Audio(musicUrl);
    a.loop = true;
    a.volume = 0.8;
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, [musicUrl]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (musicOn && (playing || !autoplay)) void a.play().catch(() => setMusicOn(false));
    else a.pause();
  }, [musicOn, playing, autoplay, musicUrl]);

  /* timer */
  useEffect(() => {
    if (!playing || !seconds) return;
    const t = setTimeout(() => {
      if (!loop && index >= n - 1) setPlaying(false);
      else go(1);
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [playing, seconds, index, go, loop, n]);

  /* size */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* draw */
  useEffect(() => {
    const c = canvas.current;
    if (!c || !size.w) return;
    const k = Math.min(size.w / layout.w, size.h / layout.h);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.style.width = `${layout.w * k}px`;
    c.style.height = `${layout.h * k}px`;
    c.width = Math.round(layout.w * k * dpr);
    c.height = Math.round(layout.h * k * dpr);
    const ctx = c.getContext("2d");
    if (ctx) paintPage(ctx, layout, index, k * dpr, { project });
  }, [index, size, layout, project, anim]);

  /* keys */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "Escape") onClose();
      else return;
      poke();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* controls hide after 4 s while playing */
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poke = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 4000);
  }, []);
  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [poke]);

  /* swipe */
  const touch = useRef<number | null>(null);

  const btn = { width: 56, height: 56, color: "#fff", bgcolor: "rgba(255,255,255,0.14)", "&:hover": { bgcolor: "rgba(255,255,255,0.26)" }, "&:focus-visible": { outline: "3px solid #f6c453" } };
  const animName = transition === "none" ? "none" : `rb-${transition}`;

  return (
    <Box
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="స్లైడ్ షో"
      onMouseMove={poke}
      onClick={poke}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        poke();
      }}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        bgcolor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: controls ? "default" : "none",
        "@keyframes rb-fade": { from: { opacity: 0 }, to: { opacity: 1 } },
        "@keyframes rb-slide": { from: { transform: "translateX(12%)", opacity: 0 }, to: { transform: "none", opacity: 1 } },
        "@keyframes rb-zoom": { from: { transform: "scale(0.88)", opacity: 0 }, to: { transform: "none", opacity: 1 } },
        "@media (prefers-reduced-motion: reduce)": { "& canvas": { animation: "none !important" } },
      }}
    >
      <Box component="canvas" key={anim} ref={canvas} aria-label={`స్లైడ్ ${index + 1} / ${n}`} sx={{ display: "block", animation: `${animName} 0.7s ease both` }} />

      <Box aria-live="polite" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {`స్లైడ్ ${index + 1} / ${n}`}
      </Box>

      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "absolute",
          left: "50%",
          bottom: "max(16px, env(safe-area-inset-bottom))",
          transform: "translateX(-50%)",
          bgcolor: "rgba(0,0,0,0.72)",
          borderRadius: "40px",
          px: 1.5,
          py: 1,
          opacity: controls ? 1 : 0,
          pointerEvents: controls ? "auto" : "none",
          transition: "opacity .3s",
        }}
      >
        <Tooltip title="వెనుక స్లైడ్">
          <IconButton aria-label="వెనుక స్లైడ్" onClick={() => go(-1)} sx={btn}>
            <NavigateBeforeRoundedIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        {seconds > 0 && (
          <Tooltip title={playing ? "ఆపండి" : "ఆటోమేటిక్‌గా నడపండి"}>
            <IconButton aria-label={playing ? "ఆపండి" : "నడపండి"} onClick={() => setPlaying((p) => !p)} sx={btn}>
              {playing ? <PauseRoundedIcon fontSize="large" /> : <PlayArrowRoundedIcon fontSize="large" />}
            </IconButton>
          </Tooltip>
        )}
        <Typography sx={{ color: "#fff", fontWeight: 800, minWidth: 64, textAlign: "center", fontSize: "1.1rem" }}>
          {index + 1} / {n}
        </Typography>
        <Tooltip title="తర్వాతి స్లైడ్">
          <IconButton aria-label="తర్వాతి స్లైడ్" onClick={() => go(1)} sx={btn}>
            <NavigateNextRoundedIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        {musicUrl && (
          <Tooltip title={musicOn ? "సంగీతం ఆపండి" : "సంగీతం వినిపించండి"}>
            <IconButton aria-label={musicOn ? "సంగీతం ఆపండి" : "సంగీతం వినిపించండి"} aria-pressed={musicOn} onClick={() => setMusicOn((m) => !m)} sx={btn}>
              {musicOn ? <MusicNoteRoundedIcon /> : <MusicOffRoundedIcon />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="మూసివేయండి (Esc)">
          <IconButton aria-label="స్లైడ్ షో మూసివేయండి" onClick={onClose} sx={{ ...btn, bgcolor: "rgba(180,35,35,0.85)", "&:hover": { bgcolor: "rgba(180,35,35,1)" } }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
