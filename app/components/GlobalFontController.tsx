"use client";

import { useEffect, useState } from "react";
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

  /* ✅ APPLY GLOBAL FONT (SINGLE SOURCE OF TRUTH) */
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    root.style.setProperty(
      "--telugu-font-family",
      `"${fontFamily}"`
    );
    root.style.setProperty(
      "--telugu-font-size",
      `${fontSize}rem`
    );

    localStorage.setItem("teluguFontFamily", fontFamily);
    localStorage.setItem("teluguFontSize", String(fontSize));
  }, [fontFamily, fontSize]);

  /* ✅ LOAD FROM STORAGE ON FIRST MOUNT */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedFont =
      localStorage.getItem("teluguFontFamily") || DEFAULT_FONT;
    const savedSize = parseFloat(
      localStorage.getItem("teluguFontSize") || String(DEFAULT_SIZE)
    );

    setFontFamily(savedFont);
    setFontSize(savedSize);
  }, []);

  /* ♻️ RESET */
  const handleReset = () => {
    setFontFamily(DEFAULT_FONT);
    setFontSize(DEFAULT_SIZE);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: 2, py: 1 }}>
      {/* 🕉️ Shanti Mantra */}
      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          mb: 1.5,
          fontWeight: 500,
          lineHeight: 1.9,
          letterSpacing: "0.04em",
        }}
      >
      
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
