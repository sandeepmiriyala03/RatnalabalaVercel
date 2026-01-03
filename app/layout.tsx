"use client";

import { useEffect, useState } from "react";
import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import FloatingAIButton from "@/app/components/FloatingAIButton";
import FontControlsTelugu from "@/app/components/FontSelection";

import { AppBar, Toolbar, Container, Box } from "@mui/material";

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontFamily, setFontFamily] = useState("Gurajada");
  const [fontSize, setFontSize] = useState(1);

  /* 🔁 Restore saved */
  useEffect(() => {
    const saved = localStorage.getItem("teluguFontSettings");
    if (saved) {
      const { family, size } = JSON.parse(saved);
      setFontFamily(family);
      setFontSize(size);
    }
  }, []);

  /* ✅ APPLY FONT — SINGLE SOURCE OF TRUTH */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--telugu-font-family",
      `"${fontFamily}"`
    );
    document.documentElement.style.setProperty(
      "--telugu-font-size",
      `${fontSize}rem`
    );

    localStorage.setItem(
      "teluguFontSettings",
      JSON.stringify({ family: fontFamily, size: fontSize })
    );
  }, [fontFamily, fontSize]);

  return (
    <html lang="te">
      <body>
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

        <MobileBottomNav />
        <PwaInstallPrompt />
        <FloatingAIButton />
      </body>
    </html>
  );
}
