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
import DownloadIcon from "@mui/icons-material/Download";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { toPng } from "html-to-image";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material";
import TeluguVoice from "@/app/components/TeluguVoice";
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

  /* =========================
     🆕 Newly Added (1/19/2026)
     ========================= */

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

  { key: "chathura-thin", label: "చతుర (Thin)", className: "chitramala-font-chathura-thin" },
  { key: "chathura-light", label: "చతుర (Light)", className: "chitramala-font-chathura-light" },
  { key: "chathura-regular", label: "చతుర (Regular)", className: "chitramala-font-chathura-regular" },
  { key: "chathura-bold", label: "చతుర (Bold)", className: "chitramala-font-chathura-bold" },
  { key: "chathura-extrabold", label: "చతుర (ExtraBold)", className: "chitramala-font-chathura-extrabold" },

  { key: "ramaraja", label: "రామరాజ", className: "chitramala-font-ramaraja" },
  { key: "raviprakash", label: "రవి ప్రకాష్", className: "chitramala-font-raviprakash" },
  { key: "tenaliramakrishna", label: "తెనాలి రామకృష్ణ", className: "chitramala-font-tenali" },
  { key: "timmana", label: "తిమ్మన", className: "chitramala-font-timmana" },
  { key: "tana", label: "టానా", className: "chitramala-font-tana" },
  { key: "ponnala-regular", label: "పొన్నల", className: "chitramala-font-ponnala" },

  { key: "gidugu", label: "గిడుగు", className: "chitramala-font-gidugu" },
  { key: "gidugu-italic", label: "గిడుగు (ఇటాలిక్)", className: "chitramala-font-gidugu-italic" },

  { key: "lakkireddy", label: "లక్కిరెడ్డి", className: "chitramala-font-lakkireddy" },

  { key: "nandakam", label: "నందకం", className: "chitramala-font-nandakam" },
  { key: "nandakam-italic", label: "నందకం (ఇటాలిక్)", className: "chitramala-font-nandakam-italic" },

  { key: "peddana", label: "పెద్దన", className: "chitramala-font-peddana" },

  { key: "purushothamaa", label: "పురుషోత్తమ", className: "chitramala-font-purushothamaa" },
  { key: "purushothamaa-italic", label: "పురుషోత్తమ (ఇటాలిక్)", className: "chitramala-font-purushothamaa-italic" },

  { key: "ramabhadra", label: "రామభద్ర", className: "chitramala-font-ramabhadra" },
  { key: "ramabhadra-italic", label: "రామభద్ర (ఇటాలిక్)", className: "chitramala-font-ramabhadra-italic" },

  { key: "sreekrushnadevaraya", label: "శ్రీ కృష్ణదేవరాయ", className: "chitramala-font-sreekrushnadevaraya" },
  { key: "sreekrushnadevaraya-italic", label: "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", className: "chitramala-font-sreekrushnadevaraya-italic" },

  { key: "suranna-regular", label: "సురన్న (Regular)", className: "chitramala-font-suranna" },
  { key: "suranna-bold", label: "సురన్న (Bold)", className: "chitramala-font-suranna-bold" },
  { key: "suranna-italic", label: "సురన్న (Italic)", className: "chitramala-font-suranna-italic" },
  { key: "suranna-bolditalic", label: "సురన్న (Bold Italic)", className: "chitramala-font-suranna-bolditalic" },

  { key: "suravaram", label: "సురవరం", className: "chitramala-font-suravaram" },
  { key: "suravaram-italic", label: "సురవరం (ఇటాలిక్)", className: "chitramala-font-suravaram-italic" },


{ key: "annamayya", label: "అన్నమయ్య", className: "chitramala-font-annamayya" },
{ key: "annamayya-bold", label: "అన్నమయ్య (Bold)", className: "chitramala-font-annamayya-bold" },
{ key: "annamayya-italic", label: "అన్నమయ్య (ఇటాలిక్)", className: "chitramala-font-annamayya-italic" },
{ key: "annamayya-bolditalic", label: "అన్నమయ్య (Bold Italic)", className: "chitramala-font-annamayya-bolditalic" },

{ key: "dhurjati", label: "ధూర్జటి", className: "chitramala-font-dhurjati" },
{ key: "dhurjati-italic", label: "ధూర్జటి (ఇటాలిక్)", className: "chitramala-font-dhurjati-italic" },

{ key: "jims", label: "జిమ్స్", className: "chitramala-font-jims" },
{ key: "jims-italic", label: "జిమ్స్ (ఇటాలిక్)", className: "chitramala-font-jims-italic" },

{ key: "kanakadurga", label: "కనకదుర్గ", className: "chitramala-font-kanakadurgA" },
{ key: "kanakadurga-italic", label: "కనకదుర్గ (ఇటాలిక్)", className: "chitramala-font-kanakadurgA-italic" },

{ key: "mandali-regular", label: "మండలి (Regular)", className: "chitramala-font-mandali" },
{ key: "mandali-bold", label: "మండలి (Bold)", className: "chitramala-font-mandali-bold" },
{ key: "mandali-italic", label: "మండలి (Italic)", className: "chitramala-font-mandali-italic" },
{ key: "mandali-bolditalic", label: "మండలి (Bold Italic)", className: "chitramala-font-mandali-bolditalic" },

{ key: "pottisreeramulu", label: "పొట్టి శ్రీరాములు", className: "chitramala-font-pottisreeramulu" },

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
  const [voiceOpen, setVoiceOpen] = useState(false);
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
const voiceText = `${title ?? ""}. ${poemText}`;
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

<Button
  fullWidth
  variant="outlined"
  onClick={() => setVoiceOpen(v => !v)}
  startIcon={<AutoAwesomeRoundedIcon />}
  endIcon={
    voiceOpen
      ? <ExpandLessRoundedIcon />
      : <ExpandMoreRoundedIcon />
  }
  sx={{
    mt: 2,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    borderColor: "#d1d5db"
  }}
>
  ✨ AI సాధనలు
</Button>

<Collapse in={voiceOpen} timeout={300} unmountOnExit>
  <Box
    sx={{
      mt: 2,
      p: 2,
      borderRadius: 2,
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
    }}
  >
    <Typography
      sx={{
        fontSize: "0.85rem",
        fontWeight: 700,
        mb: 1,
      }}
    >
      ధ్వని · కళ · వీడియో
    </Typography>

    <TeluguVoice initialText={voiceText} />
  </Box>
</Collapse>
      </CardContent>
    </Card>
  );
}
