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
  /* 🌐 Global Telugu Font State */
  const [fontFamily, setFontFamily] = useState("Gurajada");
  const [fontSize, setFontSize] = useState(1.0);

  /* 🔧 Apply font globally */
  const applyFontSettings = (family: string, size: number) => {
    document.documentElement.style.setProperty(
      "--telugu-font-family",
      family
    );
    document.documentElement.style.setProperty(
      "--telugu-font-size",
      `${size}rem`
    );

    localStorage.setItem(
      "teluguFontSettings",
      JSON.stringify({ family, size })
    );
  };

  /* 🔁 Restore saved settings */
  useEffect(() => {
    const saved = localStorage.getItem("teluguFontSettings");
    if (saved) {
      const { family, size } = JSON.parse(saved);
      setFontFamily(family);
      setFontSize(size);
      applyFontSettings(family, size);
    } else {
      applyFontSettings(fontFamily, fontSize);
    }
  }, []);

  return (
    <html lang="te">
      <body>
        {/* 🔝 Top AppBar */}
        <AppBar position="fixed" color="default" elevation={2}>
          <Toolbar>
            <Navbar />
          </Toolbar>
        </AppBar>

        <Toolbar />

        {/* 🎛 Global Font Controls */}
        <Container sx={{ mt: 1 }}>
          <FontControlsTelugu
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            onApply={applyFontSettings}
          />
        </Container>

        {/* 🧱 Main Content */}
        <Container sx={{ my: 3 }}>
          <Box sx={{ pb: { xs: 8, md: 0 } }}>
            <ClientWrapper>{children}</ClientWrapper>
          </Box>
        </Container>

        {/* 📱 Utilities */}
        <MobileBottomNav />
        <PwaInstallPrompt />
        <FloatingAIButton />
      </body>
    </html>
  );
}
