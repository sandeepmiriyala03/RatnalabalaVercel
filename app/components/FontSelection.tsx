// AGENTS.md → see "FontControlsTelugu Component Rules"
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Paper,
  Slider,
  Tooltip,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import type { TeluguFont } from "@/app/types/fonts";
import { useDeviceFontBounds } from "./useDeviceFontBounds"; // adjust path to wherever you place the hook file

type Props = {
  fontFamily: TeluguFont;
  setFontFamily: React.Dispatch<React.SetStateAction<TeluguFont>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
};

const TELUGU_FONTS: { label: string; value: TeluguFont }[] = [
  { label: "గురజాడ", value: "Gurajada" },
  { label: "ఎన్‌టిఆర్", value: "NTR" },
  { label: "రమణీయ", value: "Ramaneeya" },
  { label: "వేటూరి", value: "Veturi" },
  { label: "సిరివెన్నెల", value: "Sirivennela" },
  { label: "చతుర (Thin)", value: "Chathura-Thin" },
  { label: "చతుర (Light)", value: "Chathura-Light" },
  { label: "చతుర (Regular)", value: "Chathura-Regular" },
  { label: "చతుర (Bold)", value: "Chathura-Bold" },
  { label: "చతుర (ExtraBold)", value: "Chathura-ExtraBold" },
  { label: "రామరాజ", value: "Ramaraja" },
  { label: "రవి ప్రకాష్", value: "RaviPrakash" },
  { label: "తెనాలి రామకృష్ణ", value: "TenaliRamakrishna" },
  { label: "తిమ్మన", value: "Timmana" },
  { label: "టానా", value: "TANA" },
  { label: "గిడుగు", value: "Gidugu" },
  { label: "గిడుగు (ఇటాలిక్)", value: "Gidugu-Italic" },
  { label: "లక్కిరెడ్డి", value: "LakkiReddy" },
  { label: "నందకం", value: "Nandakam" },
  { label: "నందకం (ఇటాలిక్)", value: "Nandakam-Italic" },
  { label: "పెద్దన", value: "Peddana" },
  { label: "పురుషోత్తమ", value: "Purushothamaa" },
  { label: "పురుషోత్తమ (ఇటాలిక్)", value: "Purushothamaa-Italic" },
  { label: "రామభద్ర", value: "Ramabhadra" },
  { label: "రామభద్ర (ఇటాలిక్)", value: "Ramabhadra-Italic" },
  { label: "శ్రీ కృష్ణదేవరాయ", value: "SreeKrushnadevaraya" },
  { label: "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", value: "SreeKrushnadevaraya-Italic" },
  { label: "సురన్న (Regular)", value: "Suranna-Regular" },
  { label: "సురన్న (Bold)", value: "Suranna-Bold" },
  { label: "సురన్న (Italic)", value: "Suranna-Italic" },
  { label: "సురన్న (Bold Italic)", value: "Suranna-BoldItalic" },
  { label: "సురవరం", value: "Suravaram" },
  { label: "సురవరం (ఇటాలిక్)", value: "Suravaram-Italic" },
  { label: "పొన్నల", value: "Ponnala-Regular" },
  { label: "అన్నమయ్య", value: "Annamayya" },
  { label: "అన్నమయ్య (Bold)", value: "Annamayya-Bold" },
  { label: "అన్నమయ్య (Italic)", value: "Annamayya-Italic" },
  { label: "అన్నమయ్య (Bold Italic)", value: "Annamayya-BoldItalic" },
  { label: "ధూర్జటి", value: "Dhurjati" },
  { label: "ధూర్జటి (ఇటాలిక్)", value: "Dhurjati-Italic" },
  { label: "జిమ్స్", value: "JIMS" },
  { label: "జిమ్స్ (ఇటాలిక్)", value: "JIMS-Italic" },
  { label: "కనకదుర్గ", value: "KanakaDurga" },
  { label: "కనకదుర్గ (ఇటాలిక్)", value: "KanakaDurga-Italic" },
  { label: "మండలి (Regular)", value: "Mandali-Regular" },
  { label: "మండలి (Bold)", value: "Mandali-Bold" },
  { label: "మండలి (Italic)", value: "Mandali-Italic" },
  { label: "మండలి (Bold Italic)", value: "Mandali-BoldItalic" },

  { label: "పొట్టి శ్రీరాములు", value: "PottiSreeramulu" },

  { label: "తిరొ సుందర తెలుగు", value: "TiroSundaraTelugu-Regular" },
];

export default function FontControlsTelugu({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
}: Props) {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const { min, max } = useDeviceFontBounds();
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--telugu-font-size",
      `${fontSize}rem`
    );
  }, [fontSize]);

  // If the device bounds change (resize/rotate) and the current value
  // now falls outside the new min/max, clamp it back into range instead
  // of silently leaving it stuck at an out-of-bounds number.
  useEffect(() => {
    if (fontSize < min) setFontSize(min);
    if (fontSize > max) setFontSize(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  /* ⚡ Load time — scoped to this component only */
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;

      const time = nav
        ? Math.round(nav.loadEventEnd - nav.startTime)
        : Math.round(performance.now());

      setLoadTime(time);
    };

    if (document.readyState === "complete") {
      measure();
    } else {
      window.addEventListener("load", measure);
      return () => window.removeEventListener("load", measure);
    }
  }, []);

  const getSpeedColor = (ms: number) => {
    if (ms < 800) return "#22c55e";
    if (ms < 2000) return "#eab308";
    return "#ef4444";
  };

  const STEP = 0.1;

  const increase = () =>
    setFontSize((v) => Math.min(max, +(v + STEP).toFixed(2)));

  const decrease = () =>
    setFontSize((v) => Math.max(min, +(v - STEP).toFixed(2)));

  const restoreDefaults = () => {
    setFontFamily("Gurajada");
    setFontSize(1.0);
    setSnackbarOpen(true);
  };

  const isAtMin = fontSize <= min;
  const isAtMax = fontSize >= max;
  const isDefault = fontFamily === "Gurajada" && fontSize === 1.0;

  // Show size relative to the default (1.0) as a percentage — easier
  // to read at a glance than a raw multiplier like "1.4".
  const sizePercent = Math.round(fontSize * 100);

  // Telugu label for whichever font is currently selected, used in
  // the confirmation message so people can see exactly what got
  // applied instead of a generic "settings applied" message.
  const currentFontLabel =
    TELUGU_FONTS.find((f) => f.value === fontFamily)?.label ?? fontFamily;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: "12px",
          borderColor: "var(--border, #e4dacb)",
          backgroundColor: "var(--surface, #f7f2ea)",
        }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={2.5}
        >
          {/* 🔤 Font Selector */}
          <Box display="flex" alignItems="center" gap={1} flex={1.2} minWidth={0}>
            <Typography sx={{ fontSize: "0.9rem", whiteSpace: "nowrap", fontWeight: 600 }}>
              తెలుగు ఫాంట్
            </Typography>

            <Select
              size="small"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as TeluguFont)}
              sx={{
                minWidth: 180,
                flex: 1,
                height: 36,
                fontFamily: `${fontFamily}, system-ui`,
                backgroundColor: "var(--surface-elevated, #fff)",
              }}
            >
              {TELUGU_FONTS.map((f) => (
                <MenuItem
                  key={f.value}
                  value={f.value}
                  sx={{ fontFamily: `${f.value}, system-ui` }}
                >
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* 🔠 Font Size — clearer +/- controls with a slider for fine control */}
          <Box
            display="flex"
            flexDirection="column"
            gap={0.5}
            flex={1}
            minWidth={{ xs: "100%", md: 220 }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                అక్షర సైజ్
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--primary, #8b3a1f)",
                  minWidth: 42,
                  textAlign: "right",
                }}
              >
                {sizePercent}%
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="చిన్నదిగా చేయండి">
                <span>
                  <IconButton
                    size="small"
                    onClick={decrease}
                    disabled={isAtMin}
                    aria-label="Decrease font size"
                    sx={{
                      border: "1px solid",
                      borderColor: "var(--border, #e4dacb)",
                      width: 32,
                      height: 32,
                      fontSize: "0.8rem",
                      "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
                    }}
                  >
                    అ
                  </IconButton>
                </span>
              </Tooltip>

              <Slider
                size="small"
                value={fontSize}
                min={min}
                max={max}
                step={STEP}
                onChange={(_, v) => setFontSize(v as number)}
                aria-label="Font size"
                sx={{
                  color: "var(--primary, #8b3a1f)",
                  mx: 0.5,
                }}
              />

              <Tooltip title="పెద్దదిగా చేయండి">
                <span>
                  <IconButton
                    size="small"
                    onClick={increase}
                    disabled={isAtMax}
                    aria-label="Increase font size"
                    sx={{
                      border: "1px solid",
                      borderColor: "var(--border, #e4dacb)",
                      width: 32,
                      height: 32,
                      fontSize: "1.15rem",
                      "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
                    }}
                  >
                    అ
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* ♻️ Reset */}
          <Button
            variant="outlined"
            size="small"
            onClick={restoreDefaults}
            disabled={isDefault}
            startIcon={<RestartAltIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              whiteSpace: "nowrap",
              borderColor: "var(--primary, #8b3a1f)",
              color: "var(--primary, #8b3a1f)",
              "&:hover": {
                borderColor: "var(--primary, #8b3a1f)",
                backgroundColor: "rgba(139, 58, 31, 0.08)",
              },
            }}
          >
            డిఫాల్ట్
          </Button>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 1.5 }}>
          ప్రస్తుతం <strong>{TELUGU_FONTS.length}</strong> తెలుగు ఫాంట్లు సపోర్ట్ చేయబడుతున్నాయి.
        </Typography>
      </Paper>

      {/* ⚡ Load time — shown right after font family/size controls */}
      {loadTime !== null && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 1,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.4,
              px: 1,
              py: 0.3,
              borderRadius: "999px",
              border: "1px solid",
              borderColor: `${getSpeedColor(loadTime)}55`,
              backgroundColor: `${getSpeedColor(loadTime)}14`,
            }}
          >
            <BoltIcon sx={{ fontSize: 13, color: getSpeedColor(loadTime) }} />
            <Typography
              variant="caption"
              sx={{ fontSize: "0.7rem", color: "text.secondary" }}
            >
              పేజీ లోడ్ సమయం: {(loadTime / 1000).toFixed(2)}s
            </Typography>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={10000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          icon={<RestartAltIcon fontSize="small" />}
          sx={{
            backgroundColor: "var(--primary, #8b3a1f)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "10px",
            "& .MuiAlert-icon": { color: "#fff" },
          }}
        >
          <strong>{currentFontLabel}</strong> ఫాంట్ ({sizePercent}%) వర్తించబడింది!
        </Alert>
      </Snackbar>
    </>
  );
}