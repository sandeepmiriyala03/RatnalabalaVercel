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
import type { TeluguFont } from "@/app/types/fonts"; // ✅ FIXED

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
  { label: "చతుర (Regular)", value: "Chathura-Regular" },
  { label: "చతుర (Bold)", value: "Chathura-Bold" },
  { label: "రామరాజ", value: "Ramaraja" },
  { label: "రవి ప్రకాష్", value: "RaviPrakash" },
  { label: "తెనాలి రామకృష్ణ", value: "TenaliRamakrishna" },
  { label: "తిమ్మన", value: "Timmana" },
  { label: "టానా", value: "TANA" },
  { label: "పొన్నల", value: "Ponnala-Regular" },
];

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

  const increase = () =>
    setFontSize((v) => Math.min(max, +(v + 0.2).toFixed(2)));

  const decrease = () =>
    setFontSize((v) => Math.max(min, +(v - 0.2).toFixed(2)));

  const restoreDefaults = () => {
    setFontFamily("Gurajada");
    setFontSize(1.0);
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
            onChange={(e) =>
              setFontFamily(e.target.value as TeluguFont)
            }
            sx={{
              minWidth: 180,
              height: 34,
              fontFamily: `${fontFamily}, system-ui`,
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

        {/* ♻️ Reset */}
        <Button
          variant="outlined"
          size="small"
          onClick={restoreDefaults}
          sx={{ textTransform: "none" }}
        >
          డిఫాల్ట్
        </Button>
      </Box>

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
