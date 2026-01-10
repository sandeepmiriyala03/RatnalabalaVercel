"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Button,
  MenuItem,
  Select,
  Slider,
} from "@mui/material";
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
  classicWhite: {
    label: "క్లాసిక్ తెలుపు",
    bg: "#ffffff",
    text: "#000000",
    border: "#e0e0e0",
  },
  softIvory: {
    label: "సాఫ్ట్ ఐవరీ",
    bg: "#fffdf5",
    text: "#1a1a1a",
    border: "#e6e2d8",
  },
  lightGrey: {
    label: "లైట్ గ్రే",
    bg: "#f5f5f5",
    text: "#111111",
    border: "#dcdcdc",
  },
  skyMist: {
    label: "ఆకాశ మబ్బు",
    bg: "#f2f8ff",
    text: "#0f172a",
    border: "#dbeafe",
  },
  sageGreen: {
    label: "సేజ్ గ్రీన్",
    bg: "#f3f7f4",
    text: "#102a1f",
    border: "#d1e2d8",
  },
};

/* =========================
   🔤 FONT CLASSES (CSS)
   ========================= */

type FontKey =
  | "gurajada"
  | "ntr"
  | "veturi"
  | "sirivennela"
  | "chathura-regular"
  | "chathura-bold"
  | "ramaneeya"
  | "ramaraja"
  | "raviprakash"
  | "tana"
  | "tenali"
  | "timmana"
  | "ponnala";

const FONTS: { key: FontKey; label: string; className: string }[] =
  [
    { key: "gurajada", label: "Gurajada", className: "chitramala-font-gurajada" },
    { key: "ntr", label: "NTR", className: "chitramala-font-ntr" },
    { key: "veturi", label: "Veturi", className: "chitramala-font-veturi" },
    { key: "sirivennela", label: "Sirivennela", className: "chitramala-font-sirivennela" },
    { key: "chathura-regular", label: "Chathura Regular", className: "chitramala-font-chathura-regular" },
    { key: "chathura-bold", label: "Chathura Bold", className: "chitramala-font-chathura-bold" },
    { key: "ramaneeya", label: "Ramaneeya", className: "chitramala-font-ramaneeya" },
    { key: "ramaraja", label: "Ramaraja", className: "chitramala-font-ramaraja" },
    { key: "raviprakash", label: "RaviPrakash", className: "chitramala-font-raviprakash" },
    { key: "tana", label: "TANA", className: "chitramala-font-tana" },
    { key: "tenali", label: "Tenali Ramakrishna", className: "chitramala-font-tenali" },
    { key: "timmana", label: "Timmana", className: "chitramala-font-timmana" },
    { key: "ponnala", label: "Ponnala", className: "chitramala-font-ponnala" },
  ];

/* =========================
   📦 PROPS
   ========================= */

type Props = {
  title?: string;
  poet?: string;
  lines: string[];
  enableRead?: boolean;
};

export default function ChitramalaPreviewCard({
  title,
  poet,
  lines,
  enableRead = true,
}: Props) {
  const posterRef = useRef<HTMLDivElement>(null);

  const [fontKey, setFontKey] = useState<FontKey>("gurajada");
  const [themeKey, setThemeKey] =
    useState<ThemeKey>("classicWhite");

  const [fontScale, setFontScale] = useState<number>(1);

  const theme = THEMES[themeKey];

  /* ✅ clean poem lines */
  const poemText = useMemo(
    () => lines.map(l => l.trim()).filter(Boolean).join("\n"),
    [lines]
  );

  const activeFontClass =
    FONTS.find(f => f.key === fontKey)?.className ??
    "chitramala-font-gurajada";

  /* 🔄 Reset style */
  const resetStyle = () => {
    setFontKey("gurajada");
    setThemeKey("classicWhite");
    setFontScale(1);
  };

  /* 🔊 Speech */
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      `${title ?? ""}. ${poemText}`
    );
    u.lang = "te-IN";
    window.speechSynthesis.speak(u);
  };

  const stop = () => window.speechSynthesis.cancel();

  /* ⬇️ Download image */
  const download = async () => {
    if (!posterRef.current) return;
    await document.fonts.ready;

    const url = await toPng(posterRef.current, {
      pixelRatio: 2,
      backgroundColor: theme.bg,
    });

    const a = document.createElement("a");
    a.href = url;
    a.download = "chitramala-poster.png";
    a.click();
  };

  return (
    <Card>
      <CardContent>
        {/* 🔧 CONTROLS */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Select
            size="small"
            value={fontKey}
            onChange={(e) =>
              setFontKey(e.target.value as FontKey)
            }
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
            onChange={(e) =>
              setThemeKey(e.target.value as ThemeKey)
            }
          >
            {Object.entries(THEMES).map(([k, t]) => (
              <MenuItem key={k} value={k}>
                {t.label}
              </MenuItem>
            ))}
          </Select>

          {/* 🔠 Font Size Slider */}
          <Box sx={{ width: 120 }}>
            <Slider
              min={0.8}
              max={1.6}
              step={0.1}
              value={fontScale}
              onChange={(_, v) =>
                setFontScale(v as number)
              }
            />
          </Box>

          <Button
            startIcon={<RestartAltIcon />}
            onClick={resetStyle}
          >
            Reset
          </Button>
        </Box>

        {/* 🖼 RESPONSIVE POSTER */}
        <Box
          ref={posterRef}
          className={activeFontClass}
          sx={{
            width: {
              xs: "100%",
              sm: 420,
              md: 520,
              lg: 640,
            },
            mx: "auto",
            aspectRatio: {
              xs: "4 / 5",
              sm: "3 / 4",
              md: "1 / 1",
            },
            px: { xs: 2, sm: 3 },
            py: { xs: 3, sm: 4 },
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 2,
            fontSize: `${fontScale}rem`,
            lineHeight: 1.9,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "center",
          }}
        >
          {title && (
            <div style={{ fontWeight: 700 }}>
              {title}
            </div>
          )}

          <div style={{ whiteSpace: "pre-line" }}>
            {poemText || "(పద్యం ఇవ్వబడలేదు)"}
          </div>

          {poet && (
            <div style={{ textAlign: "right" }}>
              — {poet}
            </div>
          )}

          <div style={{ fontWeight: 600 }}>
            చిత్రమాల పద్య యంత్రం
          </div>
        </Box>

        {/* 🎛 ACTIONS */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 2,
            justifyContent: "center",
          }}
        >
          {enableRead && (
            <>
              <IconButton onClick={speak}>
                <VolumeUpIcon />
              </IconButton>
              <IconButton onClick={stop}>
                <StopCircleIcon />
              </IconButton>
            </>
          )}

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
