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

    const canvas = await html2canvas(targetRef.current, {
      scale: window.devicePixelRatio || 2,
      backgroundColor: "#ffffff",
      width: 360,
      windowWidth: 360,
      scrollY: -window.scrollY,
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
        title: "పద్యాలవాల",
        text: "📜 తెలుగు పద్యం",
      });
    } else {
      downloadPng();
    }
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
      <IconButton color="success" onClick={shareImage}>
        <WhatsAppIcon />
      </IconButton>
      <IconButton color="primary" onClick={shareImage}>
        <TelegramIcon />
      </IconButton>
      <IconButton color="secondary" onClick={downloadPng}>
        <DownloadIcon />
      </IconButton>
    </Stack>
  );
}
