"use client";

import { useEffect, useState, useRef } from "react";
import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";

import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import FloatingAIButton from "@/app/components/FloatingAIButton";
import FontControlsTelugu from "@/app/components/FontSelection";
import CookieConsentBanner, { getCookieConsent } from "@/app/components/CookieConsentBanner";
import { cacheAllPoems } from "@/lib/cachePoems";
import { Container, Box, Typography, Button, Collapse } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import HeadphonesRoundedIcon from "@mui/icons-material/HeadphonesRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import AudioPlayer from "@/app/components/AudioPlayer";
import MusicPlayer from "@/app/components/MusicPlayer";
import DownloadRingtones from "@/app/components/DownloadRingtones";
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
  | "TiroSundaraTelugu-Regular"  
  | "NATS"
  | "NATS-Italic"
  ;


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

  /* 🔽 Accordion state: only ONE of "intro" / "ringtones" can be open
     at a time. Both start closed (null) on every mount/page load so
     the page never opens tall by default. */
  const [openSection, setOpenSection] = useState<"intro" | "ringtones" | null>(null);

  const toggleSection = (section: "intro" | "ringtones") => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

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
useEffect(() => {
  if (!mounted) return;
  if (getCookieConsent() !== "accepted") return;
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

      </div>
    );
  }

  return (
    <>
    
      <Navbar />

      <Container sx={{ mt: 1 }}>
        <FontControlsTelugu
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Button
              onClick={() => toggleSection("intro")}
              size="small"
              startIcon={<HeadphonesRoundedIcon fontSize="small" />}
              endIcon={
                openSection === "intro" ? (
                  <ExpandLessRoundedIcon fontSize="small" />
                ) : (
                  <ExpandMoreRoundedIcon fontSize="small" />
                )
              }
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

            <Button
              onClick={() => toggleSection("ringtones")}
              size="small"
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              endIcon={
                openSection === "ringtones" ? (
                  <ExpandLessRoundedIcon fontSize="small" />
                ) : (
                  <ExpandMoreRoundedIcon fontSize="small" />
                )
              }
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
              రింగ్‌టోన్‌లు డౌన్‌లోడ్ చేయండి
            </Button>
          </Box>

          {/* Intro audio panel */}
          <Collapse in={openSection === "intro"} timeout={240} unmountOnExit>
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
                ఈ వెబ్‌సైట్ గురించి తెలుసుకోవడానికి ఈ ఆడియో వినండి.
              </Typography>
            </Box>
          </Collapse>

          {/* Ringtones panel */}
          <Collapse in={openSection === "ringtones"} timeout={240} unmountOnExit>
            <Box
              sx={{
                mt: 1.5,
                mx: "auto",
                maxWidth: 420,
                p: 2,
                borderRadius: "var(--radius)",
                border: "1.5px solid var(--border-strong)",
                bgcolor: "var(--surface-elevated)",
              }}
            >
              <DownloadRingtones />
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
      <MusicPlayer />
      <FloatingAIButton />
      <CookieConsentBanner />

    </>
  );
}