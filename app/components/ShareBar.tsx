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

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const WIDTH = 1080;
    const HEIGHT = 1350; // ⭐ Best poster ratio

    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: "#ffffff",
      width: WIDTH,
      height: HEIGHT,
      scale: window.devicePixelRatio || 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      letterRendering: true,

      onclone: (_, clonedRoot) => {
        const root = clonedRoot.querySelector(
          "[data-poster-root]"
        ) as HTMLElement | null;

        if (!root) return;

        /* 🖼 Poster base */
        Object.assign(root.style, {
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          padding: "120px 100px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
          textAlign: "center",
          fontFamily: "'Noto Serif Telugu', serif",
        });

        /* 🔸 Title */
        const title = root.querySelector("[data-poster-title]") as HTMLElement;
        if (title) {
          Object.assign(title.style, {
            fontSize: "44px",
            fontWeight: "700",
            marginBottom: "20px",
          });
        }

        /* 📜 Poem (FOCUS AREA – 4 lines) */
        const poem = root.querySelector("[data-poster-poem]") as HTMLElement;
        if (poem) {
          Object.assign(poem.style, {
            fontSize: "38px",
            lineHeight: "1.9",
            margin: "60px 0",
            whiteSpace: "pre-line",
          });
        }

        /* ✍️ Author */
        const author = root.querySelector("[data-poster-author]") as HTMLElement;
        if (author) {
          Object.assign(author.style, {
            fontSize: "26px",
            marginTop: "30px",
            textAlign: "right",
          });
        }

        /* 🧾 Footer */
        const footer = root.querySelector("[data-poster-footer]") as HTMLElement;
        if (footer) {
          Object.assign(footer.style, {
            fontSize: "24px",
            opacity: "0.85",
            marginTop: "40px",
          });
        }

        // ❌ Remove shadows / borders
        root.style.boxShadow = "none";
      },
    });

    return canvas.toDataURL("image/png");
  }, [targetRef]);

  const downloadPng = async () => {
    const img = await generateImage();
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download = "telugu-padyam-poster.png";
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
