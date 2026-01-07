"use client";

import React, { useCallback } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import XIcon from "@mui/icons-material/X";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";

import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

/* Sizes */
const SOCIAL_SIZE = 1080;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

export default function ShareButtons({ targetRef }: Props) {

  /* 🔹 Shared Telugu Text */
  const SHARE_TEXT =
    "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
    "చదవండి – వినండి – పంచుకోండి\n\n" +
    "© సృష్టి : యుక్తిశాల AI\n" +
    "https://ratnalabala.vercel.app";

  /* 🖼 Generate Image */
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

          Object.assign(root.style, {
            width: isA4 ? `${A4_WIDTH}px` : `${SOCIAL_SIZE}px`,
            height: isA4 ? `${A4_HEIGHT}px` : `${SOCIAL_SIZE}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#ffffff",
          });

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

  /* 📤 Share (WhatsApp / Telegram / System Share) */
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
        title: "రత్నాలబాల",
        text: SHARE_TEXT,
      });
    } else {
      download("social");
    }
  };

  /* 🐦 X (Twitter) Share */
  const shareOnX = async () => {
    const img = await generateImage("social");
    if (!img) return;

    // Image download (X web limitation)
    const link = document.createElement("a");
    link.href = img;
    link.download = "telugu-padyam.png";
    link.click();

    const text = encodeURIComponent(SHARE_TEXT);

    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank"
    );
  };

  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="వాట్సాప్ / టెలిగ్రామ్">
        <IconButton color="success" onClick={share}>
          <WhatsAppIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="X (Twitter)">
        <IconButton onClick={shareOnX}>
          <XIcon />
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
