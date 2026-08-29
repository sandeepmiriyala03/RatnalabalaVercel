"use client";

import { useEffect, useState, useRef } from "react";
import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";

import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import FloatingAIButton from "@/app/components/FloatingAIButton";
import FontControlsTelugu from "@/app/components/FontSelection";
import { cacheAllPoems } from "@/lib/cachePoems";
import { Container, Box, Typography, Button, Collapse } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import AudioPlayer from "@/app/components/AudioPlayer";
/* 🔤 Allowed Telugu Fonts */
export type TeluguFont =
  | "Gurajada"
  | "NTR"
  | "Ramaneeya"
  | "Veturi"
  | "Sirivennela"

  | "Chathura-Thin"
  | "Chathura-Light"
  | "Chathura-Regular"
  | "Chathura-Bold"
  | "Chathura-ExtraBold"

  | "Ramaraja"
  | "RaviPrakash"
  | "TenaliRamakrishna"
  | "Timmana"
  | "TANA"
  | "Ponnala-Regular"

  | "Gidugu"
  | "Gidugu-Italic"

  | "LakkiReddy"

  | "Nandakam"
  | "Nandakam-Italic"

  | "Peddana"

  | "Purushothamaa"
  | "Purushothamaa-Italic"

  | "Ramabhadra"
  | "Ramabhadra-Italic"

  | "SreeKrushnadevaraya"
  | "SreeKrushnadevaraya-Italic"

  | "Suranna-Regular"
  | "Suranna-Bold"
  | "Suranna-Italic"
  | "Suranna-BoldItalic"

  | "Suravaram"
  | "Suravaram-Italic"
    /* =========================
     🆕 Newly Added Fonts
     ========================= */

  | "Annamayya"
  | "Annamayya-Bold"
  | "Annamayya-Italic"
  | "Annamayya-BoldItalic"

  | "Dhurjati"
  | "Dhurjati-Italic"

  | "JIMS"
  | "JIMS-Italic"

  | "KanakaDurga"
  | "KanakaDurga-Italic"

  | "Mandali-Regular"
  | "Mandali-Bold"
  | "Mandali-Italic"
  | "Mandali-BoldItalic"

  | "PottiSreeramulu"
  | "TiroSundaraTelugu-Regular"  ;


const DEFAULT_FONT: TeluguFont = "Ramaneeya";
const DEFAULT_SIZE = 1;
const CACHE_VERSION_KEY = "bhavalamala_cache_v1";


export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [fontFamily, setFontFamily] = useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);
  const [introOpen, setIntroOpen] = useState(false);
const bootstrapRef = useRef(false);
/* 🔁 1. MOUNT FIRST */
useEffect(() => {
  setMounted(true);
}, []);



  /* 🧠 0. BOOTSTRAP INDEXEDDB (FIRST LOAD ONLY) */
useEffect(() => {
  if (!mounted) return;

  // 🚫 Prevent double execution (StrictMode)
  if (bootstrapRef.current) return;
  bootstrapRef.current = true;

  async function bootstrapIndexedDB() {
    if (localStorage.getItem(CACHE_VERSION_KEY) === "done") {
      console.log("✅ IndexedDB already initialized");
      return;
    }

    try {
      console.log("⏳ Fetching all poems from API...");
      const res = await fetch("/api/shatakamu?key=all");

      if (!res.ok) {
        throw new Error("API failed");
      }

      const data = await res.json();

      if (data.success) {
        console.log("⏳ Writing poems to IndexedDB...");
        await cacheAllPoems(data.poems);
        localStorage.setItem(CACHE_VERSION_KEY, "done");
        console.log("✅ IndexedDB bootstrap completed");
      }
    } catch (err) {
      console.error("❌ IndexedDB bootstrap failed:", err);
      bootstrapRef.current = false; // allow retry
    }
  }

  bootstrapIndexedDB();
}, [mounted]);

  
/* 📊 SIMPLE ANALYTICS (PAGE VIEW) */
useEffect(() => {
  if (!mounted) return;
  fetch("/api/pageview", { method: "POST" }).catch(() => {});
}, [mounted]);

  /* ✅ 2. SERVICE WORKER */
  useEffect(() => {
    if (!mounted || !("serviceWorker" in navigator)) return;

    const handleLoad = () => {
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        console.log("✅ SW registered: ", registration.scope);
      }).catch((error) => {
        console.log("❌ SW registration failed: ", error);
      });
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [mounted]);

  /* 🔁 3. Restore settings */
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("teluguFontSettings");
    if (saved) {
      try {
        const { family, size } = JSON.parse(saved);
        if (family) setFontFamily(family as TeluguFont);
        if (size) setFontSize(size);
      } catch (e) {
        console.warn("Font settings parse error:", e);
      }
    }
  }, [mounted]);

  /* ✅ 4. Apply fonts */
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty("--telugu-font-family", fontFamily);
    root.style.setProperty("--telugu-font-size", `${fontSize}rem`);
    localStorage.setItem(
      "teluguFontSettings",
      JSON.stringify({ family: fontFamily, size: fontSize })
    );
  }, [fontFamily, fontSize, mounted]);

  // ✅ FIXED SSR - SIMPLE LOADING SCREEN (No Client Components)
  if (!mounted) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          padding: '64px 16px', 
          fontFamily: 'system-ui, sans-serif',
          opacity: 0.01 
        }}
      >
        {/* Empty - prevents hydration mismatch */}
      </div>
    );
  }

  return (
    <>
      {/* Navbar renders its own sticky AppBar internally — it was
          previously wrapped in a SECOND AppBar + Toolbar here, which
          nested one <header> inside another and likely caused the
          double-bar/spacing confusion. Rendering it directly fixes
          that; no compensating spacer Toolbar is needed either, since
          "sticky" (unlike "fixed") doesn't remove the bar from
          document flow. */}
      <Navbar />

      <Container sx={{ mt: 1 }}>
        <FontControlsTelugu
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />

        {/* 🔊 Intro Audio — collapsed by default so it doesn't sit open
            and take up space above every single page's content. This is
            still the ONE place this block lives; it must not be
            duplicated inside individual pages (e.g. the homepage's
            RatnalabalaHighlights.tsx). */}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            onClick={() => setIntroOpen(v => !v)}
            size="small"
            startIcon={<HeadphonesRoundedIcon fontSize="small" />}
            endIcon={introOpen ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "var(--primary)",
              borderRadius: "999px",
              px: 2,
              "&:hover": { bgcolor: "var(--surface)" },
              "&:focus-visible": { outline: "3px solid var(--primary)", outlineOffset: "4px" },
            }}
          >
            రత్నాలబాల పరిచయ ఆడియో
          </Button>

          <Collapse in={introOpen} timeout={240} unmountOnExit>
            <Box
              sx={{
                mt: 1.5,
                mx: "auto",
                maxWidth: 420,
                p: 2,
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--border-strong)",
                bgcolor: "var(--surface-elevated)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AudioPlayer src="/audio/Intro.m4a" />
              <Typography variant="caption" sx={{ color: "var(--muted-text)" }}>
                Google NotebookLM సహాయంతో రూపొందించిన పరిచయ ఆడియో
              </Typography>
            </Box>
          </Collapse>
        </Box>

      </Container>

      <Container sx={{ my: 3 }}>
        <Box sx={{ pb: { xs: 8, md: 0 } }}>
          <ClientWrapper>{children}</ClientWrapper>
        </Box>
      </Container>
      <PwaInstallPrompt />
      <FloatingAIButton />

    </>
  );
}