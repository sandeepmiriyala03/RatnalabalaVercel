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
  const [fontFamily, setFontFamily] =
    useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] =
    useState<number>(DEFAULT_SIZE);

  /* 🔁 Restore saved settings */
  useEffect(() => {
    const saved = localStorage.getItem("teluguFontSettings");
    if (saved) {
      const { family, size } = JSON.parse(saved);
      if (family) setFontFamily(family);
      if (size) setFontSize(size);
    }
  }, []);

  /* ✅ APPLY FONT GLOBALLY */
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--telugu-font-family",
      fontFamily
    );
    root.style.setProperty(
      "--telugu-font-size",
      `${fontSize}rem`
    );

    localStorage.setItem(
      "teluguFontSettings",
      JSON.stringify({ family: fontFamily, size: fontSize })
    );
  }, [fontFamily, fontSize]);

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
