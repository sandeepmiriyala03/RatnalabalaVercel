"use client";

import React, { useCallback } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

/* Sizes */
// WhatsApp Status is full-screen PORTRAIT (9:16). 1080x1920 is the standard
// WhatsApp/Instagram Story size.
const SOCIAL_WIDTH = 1080;
const SOCIAL_HEIGHT = 1920;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

// Temple teal — same tokens as PoemCardNew.tsx / poemPoster.ts
const POSTER_BG = "#F0F7F5";
const POSTER_BORDER = "#0F4C43";

const CAPTURE_WINDOW_WIDTH = 1280;

export default function ShareButtons({ targetRef }: Props) {

  /* 🔹 Shared Telugu Text */
 const SHARE_TEXT =
    "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
    "   చదవండి – వినండి – పంచుకోండి.\n\n" +
    "🌐 https://ratnalabala.vercel.app/";

  /* 🖼 Generate Image */
  const generateImage = useCallback(
    async (mode: "social" | "a4") => {
      if (!targetRef.current) return null;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const isA4 = mode === "a4";

      const targetWidth = isA4 ? A4_WIDTH : SOCIAL_WIDTH;
      const targetHeight = isA4 ? A4_HEIGHT : SOCIAL_HEIGHT;

      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: POSTER_BG,
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: targetWidth,
        height: targetHeight,
        windowWidth: CAPTURE_WINDOW_WIDTH,

        onclone: (_, doc) => {
          const root = doc.querySelector(
            "[data-poster-root]"
          ) as HTMLElement | null;

          const body = doc.querySelector(
            "[data-poster-body]"
          ) as HTMLElement | null;

          if (!root || !body) return;

          doc.querySelectorAll("[data-poster-hide]").forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });

          // FIX — this is the actual bug behind the giant blank area below
          // short poems. Plain block layout (no flex, no table) just places
          // body at the top of root and stops — it never fills or centers
          // within root's full forced height, so a short poem leaves a huge
          // gap at the bottom of a tall 1080x1920 canvas.
          //
          // display:table + table-cell/vertical-align:middle is the fix.
          // Unlike flexbox (unreliable in html2canvas — this is what caused
          // the earlier "card stuck in the top-left corner" bug), table
          // layout is one of the oldest, most consistently supported CSS
          // features and centers content of ANY height reliably.
          //
          // Root padding is now small and uniform on all sides — this is
          // what makes the bordered card fill almost the entire canvas
          // instead of leaving big asymmetric gaps.
          Object.assign(root.style, {
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            boxSizing: "border-box",
            background: POSTER_BG,
            display: "table",
            padding: isA4 ? "120px" : "32px",
          });

          Object.assign(body.style, {
            display: "table-cell",
            verticalAlign: "middle",
            width: "100%",
            boxSizing: "border-box",
            padding: isA4 ? "120px 100px" : "40px 32px",
            textAlign: "center",
            fontFamily: "var(--telugu-font-family)",
            border: `2px solid ${POSTER_BORDER}`,
            borderRadius: "12px",
          });

          const titleEl = doc.querySelector(
            "[data-poster-title]"
          ) as HTMLElement | null;

          if (titleEl) {
            Object.assign(titleEl.style, {
              fontSize: isA4 ? "92px" : "42px",
              lineHeight: "1.45",
            });
          }

          doc
            .querySelectorAll("[data-poster-line]")
            .forEach((el) => {
              Object.assign((el as HTMLElement).style, {
                fontSize: isA4 ? "68px" : "32px",
                lineHeight: isA4 ? "2.3" : "1.9",
              });
            });

          const imgEl = doc.querySelector(
            "[data-poster-image]"
          ) as HTMLElement | null;

          if (imgEl) {
            Object.assign(imgEl.style, {
              width: isA4 ? "420px" : "240px",
              maxWidth: isA4 ? "420px" : "240px",
              height: "auto",
            });
          }
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
        title: "రత్నాలబాల – పద్యాలవాల – భావాలమాల",
        text: SHARE_TEXT,
      });
    } else {
      download("social");
    }
  };

const shareOnX = async () => {
  const img = await generateImage("social");
  if (!img) return;

  const link = document.createElement("a");
  link.href = img;
  link.download = "telugu-padyam.png";
  link.click();

  const text = encodeURIComponent(
    "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
    "చదవండి – వినండి – పంచుకోండి.\n\n" +
    "🌐 https://ratnalabala.vercel.app/"
  );

  window.open(
    `https://twitter.com/intent/tweet?text=${text}`,
    "_blank",
    "noopener,noreferrer"
  );
};


  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="వాట్సాప్ / టెలిగ్రామ్">
        <IconButton color="success" onClick={share} aria-label="వాట్సాప్‌లో పంచుకోండి">
          <WhatsAppIcon />
        </IconButton>
      </Tooltip>


      <Tooltip title="సోషల్ డౌన్‌లోడ్">
        <IconButton color="secondary" onClick={() => download("social")} aria-label="పోస్టర్ డౌన్‌లోడ్ చేయండి">
          <DownloadIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}