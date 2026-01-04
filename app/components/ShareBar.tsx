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
  const generateImage = useCallback(async () => {
    if (!targetRef.current) return null;

    // ✅ Ensure Telugu fonts are loaded
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // ✅ SOCIAL MEDIA SAFE SIZE (Universal)
    const WIDTH = 1080;
    const HEIGHT = 1080;

    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: "#ffffff",
      width: WIDTH,
      height: HEIGHT,
      scale: Math.min(window.devicePixelRatio || 2, 2),
      useCORS: true,
      scrollX: 0,
      scrollY: 0,

      onclone: (_, clonedDoc) => {
        const root = clonedDoc.querySelector(
          "[data-poster-root]"
        ) as HTMLElement | null;

        const body = clonedDoc.querySelector(
          "[data-poster-body]"
        ) as HTMLElement | null;

        if (!root || !body) return;

        /* 🖼 Poster canvas */
        Object.assign(root.style, {
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#ffffff",
          padding: "0",
          boxSizing: "border-box",
          position: "relative", // important safety fix
          boxShadow: "none",
        });

        /* 📜 Compact poster content */
        Object.assign(body.style, {
          width: "100%",
          maxWidth: "760px",
          padding: "64px 56px",
          boxSizing: "border-box",
          textAlign: "center",
          fontFamily: "var(--telugu-font-family)",
        });

        /* 🔸 Title */
        body.querySelectorAll("[data-poster-title]").forEach(el => {
          Object.assign((el as HTMLElement).style, {
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "12px",
          });
        });

        /* 📜 Poem (main focus – 4 lines) */
        body.querySelectorAll("[data-poster-poem]").forEach(el => {
          Object.assign((el as HTMLElement).style, {
            fontSize: "32px",
            lineHeight: "1.85",
            margin: "36px 0",
            whiteSpace: "pre-line",
          });
        });

        /* ✍️ Author */
        body.querySelectorAll("[data-poster-author]").forEach(el => {
          Object.assign((el as HTMLElement).style, {
            fontSize: "22px",
            marginTop: "18px",
            textAlign: "right",
          });
        });

        /* 🧾 Footer */
        body.querySelectorAll("[data-poster-footer]").forEach(el => {
          Object.assign((el as HTMLElement).style, {
            fontSize: "20px",
            opacity: "0.8",
            marginTop: "28px",
          });
        });
      },
    });

    return canvas.toDataURL("image/png");
  }, [targetRef]);

  const downloadPng = async () => {
    const img = await generateImage();
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download = "telugu-padyam.png";
    link.click();
  };

  const shareImage = async () => {
    const img = await generateImage();
    if (!img) return;

    const blob = await (await fetch(img)).blob();
    const file = new File([blob], "telugu-padyam.png", {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "తెలుగు పద్యం",
        text: "📜 నాలుగు పంక్తుల తెలుగు పద్యం",
      });
    } else {
      downloadPng();
    }
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <IconButton
        aria-label="వాట్సాప్‌లో పంచుకోండి"
        color="success"
        onClick={shareImage}
      >
        <WhatsAppIcon />
      </IconButton>

      <IconButton
        aria-label="టెలిగ్రామ్‌లో పంచుకోండి"
        color="primary"
        onClick={shareImage}
      >
        <TelegramIcon />
      </IconButton>

      <IconButton
        aria-label="డౌన్‌లోడ్ చేయండి"
        color="secondary"
        onClick={downloadPng}
      >
        <DownloadIcon />
      </IconButton>
    </Stack>
  );
}
