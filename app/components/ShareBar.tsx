"use client";

import React from "react";
import { IconButton, Stack } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

export default function ShareButtons({ targetRef }: Props) {
  const generateImage = async () => {
    if (!targetRef.current) return null;

    // ✅ Wait for fonts (VERY IMPORTANT)
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const size = 1080; // ✅ Perfect for WhatsApp (1:1 HD)

    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      width: size,
      height: size,
      windowWidth: size,
      windowHeight: size,
      useCORS: true,
    });

    return canvas.toDataURL("image/png");
  };

  const downloadPng = async () => {
    const img = await generateImage();
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download = "padya.png";
    link.click();
  };

  const shareImage = async () => {
    const img = await generateImage();
    if (!img) return;

    const blob = await (await fetch(img)).blob();
    const file = new File([blob], "padya.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "రత్నాలబాల",
        text: "📜 తెలుగు పద్యం",
      });
    } else {
      downloadPng();
    }
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
      <IconButton aria-label="WhatsApp Share" color="success" onClick={shareImage}>
        <WhatsAppIcon />
      </IconButton>

      <IconButton aria-label="Telegram Share" color="primary" onClick={shareImage}>
        <TelegramIcon />
      </IconButton>

      <IconButton aria-label="Download Image" color="secondary" onClick={downloadPng}>
        <DownloadIcon />
      </IconButton>
    </Stack>
  );
}
