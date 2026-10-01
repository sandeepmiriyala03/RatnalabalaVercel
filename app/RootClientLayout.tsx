"use client";

import { useEffect, useRef, useState } from "react";
import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";

import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import ReadingActivityTracker from "@/app/components/ReadingActivityTracker";
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
import type { TeluguFont } from "@/app/types/fonts";

// One list of font names for the whole app (it lives in app/types/fonts.ts).
// Re-exported so existing `import { TeluguFont } from ".../RootClientLayout"` keeps working.
export type { TeluguFont };

// MUST match DEFAULT_FONT / DEFAULT_SIZE in FontControlsTelugu and in the
// Python font API — otherwise the page opens on one "default" and the
// "డిఫాల్ట్" button restores another. (This used to be "Ramaneeya".)
const DEFAULT_FONT: TeluguFont = "Dhurjati";
const DEFAULT_SIZE = 1.0;

// Marks that the poems were already copied into IndexedDB, so they aren't
// downloaded again on every visit. Bump the version when the poems change.
const CACHE_VERSION_KEY = "bhavalamala_cache_v1";

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  // Fonts: FontControlsTelugu is the ONLY place that decides and applies
  // them (agent, device, CSS variables). The layout just holds the state.
  const [fontFamily, setFontFamily] = useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);

  // Only ONE of "intro" / "ringtones" open at a time; both start closed
  const [openSection, setOpenSection] = useState<"intro" | "ringtones" | null>(null);
  const toggleSection = (section: "intro" | "ringtones") =>
    setOpenSection((prev) => (prev === section ? null : section));

  /* 1. Copy all poems into IndexedDB once — when the browser is idle,
        so it never slows down the first page the visitor opens. */
  const bootstrapRef = useRef(false);
  useEffect(() => {
    if (bootstrapRef.current) return; // React StrictMode runs effects twice in dev
    bootstrapRef.current = true;

    let cancelled = false;

    const bootstrap = async () => {
      try {
        if (localStorage.getItem(CACHE_VERSION_KEY) === "done") return;
      } catch {
        // storage blocked (private mode) — still try; IndexedDB may work
      }

      try {
        const res = await fetch("/api/shatakamu?key=all");
        if (!res.ok) throw new Error(`API failed: ${res.status}`);
        const data = await res.json();
        if (cancelled || !data?.success || !Array.isArray(data.poems)) return;

        await cacheAllPoems(data.poems);
        try {
          localStorage.setItem(CACHE_VERSION_KEY, "done");
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error("IndexedDB bootstrap failed:", err);
        bootstrapRef.current = false; // allow a retry on the next mount
      }
    };

    // requestIdleCallback isn't in Safari — fall back to a short delay
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = w.requestIdleCallback
      ? w.requestIdleCallback(() => void bootstrap(), { timeout: 5000 })
      : window.setTimeout(() => void bootstrap(), 2000);

    return () => {
      cancelled = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  /* 2. Page view — only with cookie consent */
  useEffect(() => {
    if (getCookieConsent() !== "accepted") return;
    fetch("/api/pageview", { method: "POST" }).catch(() => {});
  }, []);

  /* 3. Service worker — production only. In development Serwist is disabled,
        but an old public/sw.js from an earlier build could still be
        registered here and serve stale files during development. */
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  // Rendered on the server too (no "mounted" gate any more): search engines,
  // link previews and slow phones get real HTML instead of a blank page.
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
          <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
            <Button
              onClick={() => toggleSection("intro")}
              size="small"
              aria-expanded={openSection === "intro"}
              aria-controls="intro-audio-panel"
              startIcon={<HeadphonesRoundedIcon fontSize="small" />}
              endIcon={
                openSection === "intro" ? (
                  <ExpandLessRoundedIcon fontSize="small" />
                ) : (
                  <ExpandMoreRoundedIcon fontSize="small" />
                )
              }
              sx={sectionButtonSx}
            >
              రత్నాలబాల పరిచయ ఆడియో
            </Button>

            <Button
              onClick={() => toggleSection("ringtones")}
              size="small"
              aria-expanded={openSection === "ringtones"}
              aria-controls="ringtones-panel"
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              endIcon={
                openSection === "ringtones" ? (
                  <ExpandLessRoundedIcon fontSize="small" />
                ) : (
                  <ExpandMoreRoundedIcon fontSize="small" />
                )
              }
              sx={sectionButtonSx}
            >
              రింగ్‌టోన్‌లు డౌన్‌లోడ్ చేయండి
            </Button>
          </Box>

          {/* Intro audio panel */}
          <Collapse in={openSection === "intro"} timeout={240} unmountOnExit>
            <Box id="intro-audio-panel" sx={{ ...panelSx, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <AudioPlayer src="/audio/Intro.m4a" />
              <Typography variant="caption" sx={{ color: "var(--muted-text)" }}>
                ఈ వెబ్‌సైట్ గురించి తెలుసుకోవడానికి ఈ ఆడియో వినండి.
              </Typography>
            </Box>
          </Collapse>

          {/* Ringtones panel */}
          <Collapse in={openSection === "ringtones"} timeout={240} unmountOnExit>
            <Box id="ringtones-panel" sx={panelSx}>
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
      <ReadingActivityTracker />
      <MusicPlayer />
      <FloatingAIButton />
      <CookieConsentBanner />
    </>
  );
}

/* ---------- styles ---------- */

const sectionButtonSx = {
  textTransform: "none",
  fontWeight: 700,
  color: "var(--primary)",
  borderRadius: "999px",
  px: 2,
  minHeight: 40,
  "&:hover": { bgcolor: "var(--surface)" },
  "&:focus-visible": { outline: "3px solid var(--primary)", outlineOffset: "4px" },
} as const;

const panelSx = {
  mt: 1.5,
  mx: "auto",
  maxWidth: 420,
  p: 2,
  borderRadius: "var(--radius)",
  border: "1.5px solid var(--border-strong)",
  bgcolor: "var(--surface-elevated)",
} as const;