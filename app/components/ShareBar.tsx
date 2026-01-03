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
  /* 🖼 Generate 1:1 WhatsApp-ready image */
  const generateImage = async () => {
    if (!targetRef.current) return null;

    /* ✅ Ensure selected Telugu font is loaded */
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    /* 📱 Device-based output size */
    const isMobile = window.innerWidth < 768;
    const OUTPUT_SIZE = isMobile ? 1080 : 1200;

    /* 1️⃣ Capture ONLY poem content (natural size) */
    const contentCanvas = await html2canvas(targetRef.current, {
      backgroundColor: "#ffffff",
      scale: window.devicePixelRatio || 2,
      useCORS: true,
    });

    /* 2️⃣ Create square canvas */
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = OUTPUT_SIZE;
    finalCanvas.height = OUTPUT_SIZE;

    const ctx = finalCanvas.getContext("2d");
    if (!ctx) return null;

    /* 3️⃣ White background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    /* 4️⃣ Center poem content */
    const x = (OUTPUT_SIZE - contentCanvas.width) / 2;
    const y = (OUTPUT_SIZE - contentCanvas.height) / 2;

    ctx.drawImage(contentCanvas, x, y);

    return finalCanvas.toDataURL("image/png");
  };

  /* ⬇️ Download image */
  const downloadPng = async () => {
    const img = await generateImage();
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download = "padya.png";
    link.click();
  };

  /* 📤 Share image */
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
      <IconButton
        aria-label="WhatsApp Share"
        color="success"
        onClick={shareImage}
      >
        <WhatsAppIcon />
      </IconButton>

      <IconButton
        aria-label="Telegram Share"
        color="primary"
        onClick={shareImage}
      >
        <TelegramIcon />
      </IconButton>

      <IconButton
        aria-label="Download Image"
        color="secondary"
        onClick={downloadPng}
      >
        <DownloadIcon />
      </IconButton>
    </Stack>
  );
}
