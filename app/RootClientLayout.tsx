"use client";

import { useEffect, useState } from "react";
import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import FloatingAIButton from "@/app/components/FloatingAIButton";
import FontControlsTelugu from "@/app/components/FontSelection";

import { AppBar, Toolbar, Container, Box } from "@mui/material";

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
  | "PottiSreeramulu";

const DEFAULT_FONT: TeluguFont = "Ramaneeya";
const DEFAULT_SIZE = 1;

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [fontFamily, setFontFamily] = useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);

  /* 1️⃣ Mount */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* 2️⃣ Simple analytics */
  useEffect(() => {
    if (!mounted) return;
    fetch("/api/pageview", { method: "POST" }).catch(() => {});
  }, [mounted]);

  /* 3️⃣ Service Worker */
  useEffect(() => {
    if (!mounted || !("serviceWorker" in navigator)) return;

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("✅ SW registered:", reg.scope))
        .catch((err) => console.error("❌ SW failed:", err));
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, [mounted]);

  /* 4️⃣ Restore font settings */
  useEffect(() => {
    if (!mounted) return;

    const saved = localStorage.getItem("teluguFontSettings");
    if (!saved) return;

    try {
      const { family, size } = JSON.parse(saved);
      if (family) setFontFamily(family as TeluguFont);
      if (size) setFontSize(size);
    } catch {
      /* ignore */
    }
  }, [mounted]);

  /* 5️⃣ Apply font settings */
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

  /* ⛔ Prevent hydration mismatch */
  if (!mounted) {
    return <div style={{ minHeight: "100vh", opacity: 0 }} />;
  }

  return (
    <>
      <AppBar position="fixed" color="default">
        <Toolbar>
          <Navbar />
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Container sx={{ mt: 1 }}>
        <FontControlsTelugu
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      </Container>

      <Container sx={{ my: 3 }}>
        <Box sx={{ pb: { xs: 8, md: 0 } }}>
          <ClientWrapper>{children}</ClientWrapper>
        </Box>
      </Container>

      <PwaInstallPrompt />
      <FloatingAIButton />
      <MobileBottomNav />
    </>
  );
}
