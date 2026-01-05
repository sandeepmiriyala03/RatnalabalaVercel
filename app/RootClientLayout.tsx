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
  | "Chathura-Regular"
  | "Chathura-Bold"
  | "Ramaraja"
  | "RaviPrakash"
  | "TenaliRamakrishna"
  | "Timmana"
  | "Ponnala-Regular"
  | "TANA";

const DEFAULT_FONT: TeluguFont = "Ramaneeya";
const DEFAULT_SIZE = 1;

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false); // ✅ FIX: Hydration protection
  const [fontFamily, setFontFamily] =
    useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] =
    useState<number>(DEFAULT_SIZE);

  /* 🔁 Mount client only */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* 🔁 Restore saved settings (CLIENT ONLY) */
  useEffect(() => {
    if (!mounted) return; // ✅ Skip SSR
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

  /* ✅ APPLY FONT GLOBALLY (CLIENT ONLY) */
  useEffect(() => {
    if (!mounted) return; // ✅ Skip SSR
    const root = document.documentElement;
    root.style.setProperty("--telugu-font-family", fontFamily);
    root.style.setProperty("--telugu-font-size", `${fontSize}rem`);
    localStorage.setItem(
      "teluguFontSettings",
      JSON.stringify({ family: fontFamily, size: fontSize })
    );
  }, [fontFamily, fontSize, mounted]);

  // ✅ SSR-safe render (no hydration mismatch)
  if (!mounted) {
    return (
      <>
        <AppBar position="fixed" color="default">
          <Toolbar>
            <Navbar />
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Container sx={{ mt: 1 }} />
        <Container sx={{ my: 3 }}>
          <Box sx={{ pb: { xs: 8, md: 0 } }}>
            {children}
          </Box>
        </Container>
        <MobileBottomNav />
      </>
    );
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
