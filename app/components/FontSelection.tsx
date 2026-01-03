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
};

/* 🔤 Telugu Fonts */
const TELUGU_FONTS = [
  { label: "ఎన్‌టిఆర్", value: "NTR" },
  { label: "గురజాడ", value: "Gurajada" },

  { label: "చతుర (Regular)", value: "Chathura-Regular" },
  { label: "చతుర (Light)", value: "Chathura-Light" },
  { label: "చతుర (Bold)", value: "Chathura-Bold" },
  { label: "చతుర (ExtraBold)", value: "Chathura-ExtraBold" },

  { label: "రామరాజ", value: "Ramaraja" },
  { label: "రవి ప్రకాష్", value: "RaviPrakash" },
  { label: "తెనాలి రామకృష్ణ", value: "TenaliRamakrishna" },
  { label: "తిమ్మన", value: "Timmana" },
  { label: "వేటూరి", value: "Veturi" },
  { label: "సిరివెన్నెల", value: "Sirivennela" },
  { label: "రమణీయ", value: "Ramaneeya" },
  { label: "టానా", value: "TANA" },
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
}: Props) {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const { min, max } = getDeviceBounds();

  /* 🔺 Increase size (LIVE PREVIEW) */
  const increase = () =>
    setFontSize((v) => Math.min(max, +(v + 0.2).toFixed(2)));

  /* 🔻 Decrease size (LIVE PREVIEW) */
  const decrease = () =>
    setFontSize((v) => Math.max(min, +(v - 0.2).toFixed(2)));

  /* 💾 SAVE SETTINGS */
  const saveSettings = () => {
    localStorage.setItem("teluguFontFamily", fontFamily);
    localStorage.setItem("teluguFontSize", String(fontSize));
    setSnackbarOpen(true);
  };

  /* ♻️ RESTORE DEFAULTS */
  const restoreDefaults = () => {
    setFontFamily("Gurajada");
    setFontSize(1.0);
    localStorage.removeItem("teluguFontFamily");
    localStorage.removeItem("teluguFontSize");
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
            onChange={(e) => setFontFamily(e.target.value)}
            sx={{
              minWidth: 170,
              height: 34,
              fontFamily,
            }}
          >
            {TELUGU_FONTS.map((f) => (
              <MenuItem
                key={f.value}
                value={f.value}
                sx={{ fontFamily: f.value }}
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

        {/* 🔘 ACTIONS */}
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            size="small"
            onClick={saveSettings}
            sx={{
              backgroundColor: "#0d9488",
              ":hover": { backgroundColor: "#0f766e" },
              textTransform: "none",
            }}
          >
            సేవ్
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={restoreDefaults}
            sx={{ textTransform: "none" }}
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
