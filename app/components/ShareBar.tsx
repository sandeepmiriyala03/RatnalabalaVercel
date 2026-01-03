"use client";

import React, { useCallback } from "react";
import { IconButton, Stack } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

export default function ShareButtons({ targetRef }: Props) {
  /* 🖼 Generate poster-sized image - TypeScript safe */
  const generateImage = useCallback(async () => {
    if (!targetRef.current) return null;

    // Wait for Telugu fonts
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const isMobile = window.innerWidth < 768;
    const WIDTH = 1080;
    const HEIGHT = isMobile ? 1920 : 1080;

    const canvas = await html2canvas(targetRef.current!, {
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      windowWidth: WIDTH,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        // ✅ TypeScript-safe: clonedElement is HTMLElement
        const content = clonedElement.querySelector('[data-poster-content]');
        if (content instanceof HTMLElement) {
          Object.assign(content.style, {
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 30px',
            boxSizing: 'border-box',
            fontSize: isMobile ? '28px' : '32px',
            lineHeight: '1.4',
            textAlign: 'center',
            overflow: 'hidden',
          });
        }
      }
    });

    return canvas.toDataURL("image/png");
  }, [targetRef]);

  const downloadPng = async () => {
    const img = await generateImage();
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download = "padya-poster.png";
    link.click();
  };

  const shareImage = async () => {
    const img = await generateImage();
    if (!img) return;

    const blob = await (await fetch(img)).blob();
    const file = new File([blob], "padya-poster.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "రత్నాలబాల",
        text: "📜 తెలుగు పద్యం - అందమైన పోస్టర్",
      });
    } else {
      downloadPng();
    }
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
      <IconButton
        aria-label="WhatsApp Share Poster"
        color="success"
        size="large"
        onClick={shareImage}
      >
        <WhatsAppIcon />
      </IconButton>

      <IconButton
        aria-label="Telegram Share Poster"
        color="primary"
        size="large"
        onClick={shareImage}
      >
        <TelegramIcon />
      </IconButton>

      <IconButton
        aria-label="Download Poster"
        color="secondary"
        size="large"
        onClick={downloadPng}
      >
        <DownloadIcon />
      </IconButton>
    </Stack>
  );
}
