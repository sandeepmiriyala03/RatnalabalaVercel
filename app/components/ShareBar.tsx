"use client";

import React, { useCallback } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

/* Sizes */
const SOCIAL_SIZE = 1080;          // Instagram / WhatsApp
const A4_WIDTH = 2480;             // 300 DPI
const A4_HEIGHT = 3508;

export default function ShareButtons({ targetRef }: Props) {
  const generateImage = useCallback(
    async (mode: "social" | "a4") => {
      if (!targetRef.current) return null;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const isA4 = mode === "a4";

      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,

        onclone: (_, doc) => {
          const root = doc.querySelector(
            "[data-poster-root]"
          ) as HTMLElement | null;

          const body = doc.querySelector(
            "[data-poster-body]"
          ) as HTMLElement | null;

          if (!root || !body) return;

          /* 🖼 FULL CANVAS */
          Object.assign(root.style, {
            width: isA4 ? `${A4_WIDTH}px` : `${SOCIAL_SIZE}px`,
            height: isA4 ? `${A4_HEIGHT}px` : `${SOCIAL_SIZE}px`,
            margin: "0",
            padding: "0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#ffffff",
          });

          /* 📜 BODY */
          Object.assign(body.style, {
            width: "100%",
            height: "100%",
            maxWidth: isA4 ? "1800px" : "900px",
            padding: isA4 ? "200px 180px" : "80px 72px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "center",
            fontFamily: "var(--telugu-font-family)",
          });

          /* 🔸 TITLE */
          body.querySelectorAll("[data-poster-title]").forEach(el => {
            Object.assign((el as HTMLElement).style, {
              fontSize: isA4 ? "96px" : "42px",
              fontWeight: "700",
              marginBottom: isA4 ? "48px" : "24px",
            });
          });

          /* 📜 POEM */
          body.querySelectorAll("[data-poster-poem]").forEach(el => {
            Object.assign((el as HTMLElement).style, {
              fontSize: isA4 ? "72px" : "34px",
              lineHeight: "1.9",
              margin: isA4 ? "64px 0" : "32px 0",
              whiteSpace: "pre-line",
            });
          });

          /* ✍️ AUTHOR */
          body.querySelectorAll("[data-poster-author]").forEach(el => {
            Object.assign((el as HTMLElement).style, {
              fontSize: isA4 ? "44px" : "22px",
              alignSelf: "flex-end",
              marginTop: isA4 ? "48px" : "24px",
            });
          });

          /* 🧾 FOOTER */
          body.querySelectorAll("[data-poster-footer]").forEach(el => {
            Object.assign((el as HTMLElement).style, {
              fontSize: isA4 ? "38px" : "20px",
              opacity: "0.85",
              marginTop: isA4 ? "72px" : "48px",
            });
          });
        },
      });

      return canvas.toDataURL("image/png");
    },
    [targetRef]
  );

  /* ⬇️ Download */
  const download = async (mode: "social" | "a4") => {
    const img = await generateImage(mode);
    if (!img) return;

    const link = document.createElement("a");
    link.href = img;
    link.download =
      mode === "a4" ? "telugu-padyam-A4.png" : "telugu-padyam.png";
    link.click();
  };

  /* 📤 Share (social only) */
  const share = async () => {
    const img = await generateImage("social");
    if (!img) return;

    const blob = await (await fetch(img)).blob();
    const file = new File([blob], "telugu-padyam.png", {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "తెలుగు పద్యం",
      });
    } else {
      download("social");
    }
  };

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="వాట్సాప్ / టెలిగ్రామ్">
        <IconButton color="success" onClick={share}>
          <WhatsAppIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="సోషల్ డౌన్‌లోడ్">
        <IconButton color="secondary" onClick={() => download("social")}>
          <DownloadIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="A4 ప్రింట్">
        <IconButton color="primary" onClick={() => download("a4")}>
          <PrintIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
