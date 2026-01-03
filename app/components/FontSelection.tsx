"use client";

import React from "react";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

type Props = {
  fontFamily: string;
  setFontFamily: React.Dispatch<React.SetStateAction<string>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  onApply: (family: string, size: number) => void;
};

/* 🔤 Telugu Fonts */
const TELUGU_FONTS = [
  { label: "ఎన్‌టిఆర్", value: "NTR", family: "NTR" },
  { label: "గురజాడ", value: "Gurajada", family: "Gurajada" },

  { label: "చతుర (Regular)", value: "Chathura-Regular", family: "Chathura-Regular" },
  { label: "చతుర (Light)", value: "Chathura-Light", family: "Chathura-Light" },
  { label: "చతుర (Bold)", value: "Chathura-Bold", family: "Chathura-Bold" },
  { label: "చతుర (ExtraBold)", value: "Chathura-ExtraBold", family: "Chathura-ExtraBold" },

  { label: "రామరాజ", value: "Ramaraja", family: "Ramaraja" },
  { label: "రవి ప్రకాష్", value: "RaviPrakash", family: "RaviPrakash" },
  { label: "తెనాలి రామకృష్ణ", value: "TenaliRamakrishna", family: "TenaliRamakrishna" },
  { label: "తిమ్మన", value: "Timmana", family: "Timmana" },
  { label: "వేటూరి", value: "Veturi", family: "Veturi" },
  { label: "సిరివెన్నెల", value: "Sirivennela", family: "Sirivennela" },
  { label: "రమణీయ", value: "Ramaneeya", family: "Ramaneeya" },
  { label: "టానా", value: "TANA", family: "TANA" },
];

/* 📱 Device bounds */
function getDeviceBounds() {
  if (typeof window === "undefined") return { min: 1.0, max: 2.0 };
  return window.innerWidth < 960
    ? { min: 0.9, max: 1.8 }
    : { min: 1.0, max: 2.0 };
}

export default function FontControlsTelugu({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  onApply,
}: Props) {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const { min, max } = getDeviceBounds();

  /* 🔺 Increase size (LIVE APPLY) */
  const increase = () =>
    setFontSize((current) => {
      const next = +(Math.min(max, current + 0.2).toFixed(2));
      onApply(fontFamily, next);
      return next;
    });

  /* 🔻 Decrease size (LIVE APPLY) */
  const decrease = () =>
    setFontSize((current) => {
      const next = +(Math.max(min, current - 0.2).toFixed(2));
      onApply(fontFamily, next);
      return next;
    });

  /* ♻️ Restore defaults */
  const restoreDefaults = () => {
    const defaultFont = "Gurajada";
    const defaultSize = 1.0;

    setFontFamily(defaultFont);
    setFontSize(defaultSize);
    onApply(defaultFont, defaultSize);
    setSnackbarOpen(true);
  };

  /* 💾 Save (explicit) */
  const saveFontSettings = () => {
    onApply(fontFamily, fontSize);
    setSnackbarOpen(true);
  };

  return (
    <>
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        sx={{ width: "100%", p: 1 }}
      >
        {/* 🔤 Font Selector */}
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          <Typography sx={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
            తెలుగు ఫాంట్
          </Typography>

          <Select
            size="small"
            value={fontFamily}
            onChange={(e) => {
              const family = e.target.value as string;
              setFontFamily(family);
              onApply(family, fontSize); // ✅ APPLY IMMEDIATELY
            }}
            sx={{
              minWidth: 160,
              fontFamily,
              height: 34,
            }}
          >
            {TELUGU_FONTS.map((f) => (
              <MenuItem
                key={f.value}
                value={f.value}
                sx={{ fontFamily: f.family }}
              >
                {f.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* 🔠 Font Size */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: "0.9rem" }}>సైజ్</Typography>

          <IconButton
            size="small"
            onClick={decrease}
            sx={{ border: "1px solid #ccc", width: 30, height: 30 }}
          >
            అ
          </IconButton>

          <Typography>{fontSize.toFixed(1)}</Typography>

          <IconButton
            size="small"
            onClick={increase}
            sx={{ border: "1px solid #ccc", width: 30, height: 30 }}
          >
            అ
          </IconButton>
        </Box>

        {/* 🔘 Actions */}
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            size="small"
            sx={{
              backgroundColor: "#0d9488",
              ":hover": { backgroundColor: "#0f766e" },
              textTransform: "none",
            }}
            onClick={saveFontSettings}
          >
            సేవ్
          </Button>

          <Button
            variant="outlined"
            size="small"
            sx={{
              color: "#0d9488",
              borderColor: "#0d9488",
              textTransform: "none",
            }}
            onClick={restoreDefaults}
          >
            డిఫాల్ట్
          </Button>
        </Box>
      </Box>

      {/* ✅ Feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" variant="filled">
          సెట్టింగులు అమలయ్యాయి!
        </Alert>
      </Snackbar>
    </>
  );
}
/* ---------- Initial Load ---------- */
/* ---------- Debounced Preview ---------- */
/* ---------- Apply & Save ---------- */
/* ---------- Reset ---------- */