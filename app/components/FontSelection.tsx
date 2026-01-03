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

// Make sure these names match your @font-face font-family values in globals.css
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

// Device-wise min/max bounds
function getDeviceBounds() {
  if (typeof window === "undefined") {
    return { min: 1.0, max: 2.0 };
  }
  const w = window.innerWidth;
  if (w < 960) {
    // mobile + tablet
    return { min: 0.9, max: 1.8 };
  }
  // desktop
  return { min: 1.0, max: 2.0 };
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

  const increase = () =>
    setFontSize((current) => +(Math.min(max, current + 0.2).toFixed(2)));

  const decrease = () =>
    setFontSize((current) => +(Math.max(min, current - 0.2).toFixed(2)));

  const restoreDefaults = () => {
    const defaultSize = 1.0;
    const defaultFont = "Gurajada";

    setFontFamily(defaultFont);
    setFontSize(defaultSize);
    onApply(defaultFont, defaultSize);
    setSnackbarOpen(true);
  };

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
        {/* Font Selector */}
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          <Typography sx={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
            తెలుగు ఫాంట్
          </Typography>

          <Select
            size="small"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as string)}
            sx={{
              minWidth: 150,
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

        {/* Font Size */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>
            సైజ్
          </Typography>

          <IconButton
            size="small"
            onClick={decrease}
            sx={{
              border: "1px solid #ccc",
              width: 30,
              height: 30,
              fontSize: "0.8rem",
            }}
          >
            అ
          </IconButton>

          <Typography>{fontSize.toFixed(1)}</Typography>

          <IconButton
            size="small"
            onClick={increase}
            sx={{
              border: "1px solid #ccc",
              width: 30,
              height: 30,
              fontSize: "1.2rem",
            }}
          >
            అ
          </IconButton>
        </Box>

        {/* Buttons */}
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
              ":hover": { borderColor: "#0f766e", color: "#0f766e" },
            }}
            onClick={restoreDefaults}
          >
            డిఫాల్ట్
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" variant="filled">
          సెట్టింగులు సేవ్ అయ్యాయి!
        </Alert>
      </Snackbar>
    </>
  );
}
