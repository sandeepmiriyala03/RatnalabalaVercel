"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Button,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { toPng } from "html-to-image";

/* =========================
   🎨 THEMES
========================= */

type ThemeKey =
  | "classicWhite"
  | "softIvory"
  | "lightGrey"
  | "skyMist"
  | "sageGreen";

const THEMES: Record<
  ThemeKey,
  { label: string; bg: string; text: string; border: string }
> = {
  classicWhite: { label: "క్లాసిక్ తెలుపు", bg: "#fff", text: "#000", border: "#e0e0e0" },
  softIvory: { label: "సాఫ్ట్ ఐవరీ", bg: "#fffdf5", text: "#1a1a1a", border: "#e6e2d8" },
  lightGrey: { label: "లైట్ గ్రే", bg: "#f5f5f5", text: "#111", border: "#dcdcdc" },
  skyMist: { label: "ఆకాశ మబ్బు", bg: "#f2f8ff", text: "#0f172a", border: "#dbeafe" },
  sageGreen: { label: "సేజ్ గ్రీన్", bg: "#f3f7f4", text: "#102a1f", border: "#d1e2d8" },
};

/* =========================
   🔤 FONT LIST
========================= */

export type FontKey =
  | "gurajada"
  | "ntr"
  | "ramaneeya"
  | "veturi"
  | "sirivennela"
  | "chathura-thin"
  | "chathura-light"
  | "chathura-regular"
  | "chathura-bold"
  | "chathura-extrabold"
  | "ramaraja"
  | "raviprakash"
  | "tenaliramakrishna"
  | "timmana"
  | "tana"
  | "ponnala-regular"
  | "gidugu"
  | "gidugu-italic"
  | "lakkireddy"
  | "nandakam"
  | "nandakam-italic"
  | "peddana"
  | "purushothamaa"
  | "purushothamaa-italic"
  | "ramabhadra"
  | "ramabhadra-italic"
  | "sreekrushnadevaraya"
  | "sreekrushnadevaraya-italic"
  | "suranna-regular"
  | "suranna-bold"
  | "suranna-italic"
  | "suranna-bolditalic"
  | "suravaram"
  | "suravaram-italic"
  | "annamayya"
  | "annamayya-bold"
  | "annamayya-italic"
  | "annamayya-bolditalic"
  | "dhurjati"
  | "dhurjati-italic"
  | "jims"
  | "jims-italic"
  | "kanakadurga"
  | "kanakadurga-italic"
  | "mandali-regular"
  | "mandali-bold"
  | "mandali-italic"
  | "mandali-bolditalic"
  | "pottisreeramulu";

const FONTS: { key: FontKey; label: string; className: string }[] = [
  { key: "gurajada", label: "గురజాడ", className: "chitramala-font-gurajada" },
  { key: "ntr", label: "ఎన్‌టిఆర్", className: "chitramala-font-ntr" },
  { key: "ramaneeya", label: "రమణీయ", className: "chitramala-font-ramaneeya" },
  { key: "veturi", label: "వేటూరి", className: "chitramala-font-veturi" },
  { key: "sirivennela", label: "సిరివెన్నెల", className: "chitramala-font-sirivennela" },
  { key: "annamayya", label: "అన్నమయ్య", className: "chitramala-font-annamayya" },
  { key: "mandali-regular", label: "మండలి", className: "chitramala-font-mandali" },
  { key: "peddana", label: "పెద్దన", className: "chitramala-font-peddana" },
  { key: "sreekrushnadevaraya", label: "శ్రీకృష్ణదేవరాయ", className: "chitramala-font-sreekrushnadevaraya" },
  { key: "pottisreeramulu", label: "పొట్టి శ్రీరాములు", className: "chitramala-font-pottisreeramulu" },
];

/* =========================
   🌸 SWARAMALA COMPONENT
========================= */

export default function Swaramala() {
  const posterRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState("");
  const [fontKey, setFontKey] = useState<FontKey>("gurajada");
  const [themeKey, setThemeKey] = useState<ThemeKey>("classicWhite");
  const [fontScale, setFontScale] = useState(1);
  const [listening, setListening] = useState(false);

  const theme = THEMES[themeKey];

  /* =========================
     🎤 SPEECH → TEXT (TELUGU)
  ========================= */

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      : null;

  const recognition = useMemo(() => {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = "te-IN";
    r.interimResults = false;
    r.continuous = false;
    return r;
  }, [SpeechRecognition]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript.trim();
      setText(prev => (prev ? prev + " " : "") + spoken);
    };

    recognition.onend = () => setListening(false);
  }, [recognition]);

  const startVoice = () => {
    if (!recognition) return alert("ఈ బ్రౌజర్‌లో స్వరమాల పనిచేయదు");
    setListening(true);
    recognition.start();
  };

  const stopVoice = () => {
    recognition?.stop();
    setListening(false);
  };

  /* =========================
     🔊 TEXT → SPEECH
  ========================= */

  const speak = () => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "te-IN";
    window.speechSynthesis.speak(u);
  };

  const stopSpeak = () => window.speechSynthesis.cancel();

  /* =========================
     ⬇️ DOWNLOAD POSTER
  ========================= */

  const download = async () => {
    if (!posterRef.current) return;
    await document.fonts.ready;
    const url = await toPng(posterRef.current, {
      pixelRatio: 2,
      backgroundColor: theme.bg,
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = "swaramala-poster.png";
    a.click();
  };

  const reset = () => {
    setText("");
    setFontKey("gurajada");
    setThemeKey("classicWhite");
    setFontScale(1);
  };

  const activeFontClass =
    FONTS.find(f => f.key === fontKey)?.className ??
    "chitramala-font-gurajada";

  return (
    <Card>
      <CardContent>
        <Typography fontWeight={700} mb={1}>
          🎙️ స్వరమాల — మాటలతో అక్షరాలు
        </Typography>

        {/* ✍️ TEXT INPUT */}
        <TextField
          multiline
          minRows={4}
          fullWidth
          placeholder="తెలుగులో మాట్లాడండి లేదా టైప్ చేయండి…"
          value={text}
          onChange={e => setText(e.target.value)}
        />

        {/* 🎛 CONTROLS */}
        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
          <Button
            startIcon={<MicIcon />}
            color={listening ? "error" : "primary"}
            onClick={startVoice}
          >
            మాట్లాడండి
          </Button>

          <IconButton onClick={stopVoice}>
            <StopCircleIcon />
          </IconButton>

          <Select
            size="small"
            value={fontKey}
            onChange={e => setFontKey(e.target.value as FontKey)}
          >
            {FONTS.map(f => (
              <MenuItem key={f.key} value={f.key}>
                {f.label}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={themeKey}
            onChange={e => setThemeKey(e.target.value as ThemeKey)}
          >
            {Object.entries(THEMES).map(([k, t]) => (
              <MenuItem key={k} value={k}>
                {t.label}
              </MenuItem>
            ))}
          </Select>

          <Box sx={{ width: 120 }}>
            <Slider
              min={0.8}
              max={1.6}
              step={0.1}
              value={fontScale}
              onChange={(_, v) => setFontScale(v as number)}
            />
          </Box>

          <Button startIcon={<RestartAltIcon />} onClick={reset}>
            Reset
          </Button>
        </Box>

        {/* 🖼 POSTER */}
        <Box
          ref={posterRef}
          className={activeFontClass}
          sx={{
            mt: 3,
            p: 3,
            textAlign: "center",
            whiteSpace: "pre-line",
            lineHeight: 1.9,
            fontSize: `${fontScale}rem`,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 2,
          }}
        >
          {text || "మీ స్వరమాల పద్యం ఇక్కడ కనిపిస్తుంది"}
        </Box>

        {/* 🔊 / ⬇️ */}
        <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "center" }}>
          <IconButton onClick={speak}>
            <VolumeUpIcon />
          </IconButton>
          <IconButton onClick={stopSpeak}>
            <StopCircleIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={download}
          >
            డౌన్‌లోడ్
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
