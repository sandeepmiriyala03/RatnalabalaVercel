"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FontControlsTelugu from "./FontSelection";
import ShowHideSection from "./ShowHideSection";

const DEFAULT_FONT = "Gurajada";
const DEFAULT_SIZE = 1.0;

export default function GlobalFontController() {
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE);

  const debounceRef = useRef<number | null>(null);

  /* ---------- Apply font settings ---------- */
  const applyFontSettings = useCallback((family: string, size: number) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--mantra-font", family);
    root.style.setProperty("--mantra-size", `${size}rem`);
  }, []);

  /* ---------- Load from localStorage ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedFont =
      localStorage.getItem("mantraFontFamily") || DEFAULT_FONT;
    const savedSize = parseFloat(
      localStorage.getItem("mantraFontSize") || String(DEFAULT_SIZE)
    );

    setFontFamily(savedFont);
    setFontSize(savedSize);
    applyFontSettings(savedFont, savedSize);
  }, [applyFontSettings]);

  /* ---------- Debounced preview ---------- */
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      applyFontSettings(fontFamily, fontSize);
    }, 120);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [fontFamily, fontSize, applyFontSettings]);

  /* ---------- Apply & Save ---------- */
  const handleApply = (family: string, size: number) => {
    setFontFamily(family);
    setFontSize(size);
    applyFontSettings(family, size);

    if (typeof window !== "undefined") {
      localStorage.setItem("mantraFontFamily", family);
      localStorage.setItem("mantraFontSize", String(size));
    }
  };

  /* ---------- Reset ---------- */
  const handleReset = () => {
    setFontFamily(DEFAULT_FONT);
    setFontSize(DEFAULT_SIZE);
    applyFontSettings(DEFAULT_FONT, DEFAULT_SIZE);

    if (typeof window !== "undefined") {
      localStorage.removeItem("mantraFontFamily");
      localStorage.removeItem("mantraFontSize");
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 1 }}>
      {/* 🕉️ Shanti Mantra */}
      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          mb: 1.5,
          opacity: 0.95,
          fontWeight: 500,
          lineHeight: 1.9,
          letterSpacing: "0.04em",
        }}
      >
        ఓం పూర్ణమదః పూర్ణమిదం ।పూర్ణాత్ పూర్ణముదచ్యతే । పూర్ణస్య పూర్ణమాదాయ ।పూర్ణమే వావశిష్యతే ॥
      </Typography>

      {/* ℹ️ Helper */}
      <Typography
        variant="caption"
        sx={{ textAlign: "center", mb: 1, opacity: 0.75 }}
      >
        సౌకర్యవంతమైన తెలుగు పఠనం కోసం ఫాంట్ మరియు అక్షర పరిమాణాన్ని మీకు నచ్చినట్లు మార్చుకోండి.
      </Typography>

      {/* 🔽 Controls */}
      <ShowHideSection
        id="global-font-controller"
        closedLabel="ఫాంట్ సెట్టింగ్స్"
        openLabel="దాచు"
        defaultOpen={false}
        align="right"
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 1,
            borderRadius: 2,
          }}
        >
          <FontControlsTelugu
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            onApply={handleApply}
          />

        </Paper>
      </ShowHideSection>
    </Box>
  );
}
