"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FontControlsTelugu from "./FontSelection";
import ShowHideSection from "./ShowHideSection";
import type { TeluguFont } from "@/app/types/fonts"; // ✅ FIXED

const DEFAULT_FONT: TeluguFont = "Ramaneeya";
const DEFAULT_SIZE = 1.0;

export default function GlobalFontController() {
  const [fontFamily, setFontFamily] = useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);

  /* 🔁 Restore from storage (single source of truth) */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("teluguFontSettings");
    if (saved) {
      const { family, size } = JSON.parse(saved);
      setFontFamily(family);
      setFontSize(size);
    }
  }, []);

  /* ✅ APPLY GLOBAL FONT & SIZE */
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // IMPORTANT: no quotes
    root.style.setProperty("--telugu-font-family", fontFamily);
    root.style.setProperty("--telugu-font-size", `${fontSize}rem`);

    localStorage.setItem(
      "teluguFontSettings",
      JSON.stringify({ family: fontFamily, size: fontSize })
    );
  }, [fontFamily, fontSize]);

  /* ♻️ RESET */
  const handleReset = () => {
    setFontFamily(DEFAULT_FONT);
    setFontSize(DEFAULT_SIZE);
  };
 const TOTAL_TELUGU_FONTS = 53;
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 1 }}>
      {/* ℹ️ Helper */}
      <Typography
        variant="caption"
        sx={{ textAlign: "center", mb: 1, opacity: 0.75 }}
      >
        సౌకర్యవంతమైన తెలుగు పఠనం కోసం ఫాంట్ మరియు అక్షర పరిమాణాన్ని మీకు నచ్చినట్లు మార్చుకోండి.
        <br />
  <strong>  ప్రస్తుతం {TOTAL_TELUGU_FONTS} తెలుగు ఫాంట్లు సపోర్ట్ చేయబడుతున్నాయి.</strong>
      </Typography>

      {/* 🔽 Controls */}
      <ShowHideSection
        id="global-font-controller"
        closedLabel="ఫాంట్ సెట్టింగ్స్"
        openLabel="దాచు"
        defaultOpen={false}
        align="right"
      >
        <Paper elevation={1} sx={{ p: 2, mt: 1, borderRadius: 2 }}>
          <FontControlsTelugu
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        </Paper>
      </ShowHideSection>
    </Box>
  );
}
