"use client";

import React, { useCallback } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

/* Warm cream editorial palette */
const POSTER_BG = "#F7F2EA";
const POSTER_HAIRLINE = "#E4DACB";
const POSTER_INK = "#2B2620";

const CAPTURE_WINDOW_WIDTH = 1280;
const CAPTURE_SCALE = 2;

export default function ShareButtons({ targetRef }: Props) {

  /* 🔹 Shared Telugu Text */
 const SHARE_TEXT =
    "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
    "   చదవండి – వినండి – పంచుకోండి.\n\n" +
    "🌐 https://ratnalabala.vercel.app/";

  /* 🖼 Generate Image
     SIMPLER, MORE RELIABLE APPROACH — instead of forcing html2canvas to
     output a full 1080x1920 (or A4) canvas directly (which repeatedly hit
     html2canvas quirks: top-left cropping, flexbox not centering, content
     tiling/duplicating on tall canvases), we now:
       1. let html2canvas capture the poster at its OWN natural content
          size — this is what html2canvas is actually reliable at.
       2. composite that capture onto a real fixed-size canvas ourselves
          using plain 2D canvas drawImage — deterministic arithmetic, no
          viewport/window quirks at all.
     Long poems get scaled down slightly to fit instead of using a fixed
     font size that's wrong for every poem length; short poems render at
     full, legible size. */
  const generateImage = useCallback(
    async (mode: "social" | "a4") => {
      if (!targetRef.current) return null;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const isA4 = mode === "a4";

      // Content is captured at a fixed, comfortable reading WIDTH — height
      // is left to size naturally to however long the poem is.
      const CONTENT_WIDTH = isA4 ? 1600 : 860;

      const contentCanvas = await html2canvas(targetRef.current, {
        backgroundColor: POSTER_BG,
        scale: CAPTURE_SCALE,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
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

          // No forced height here — root/body just size to their content,
          // which is exactly what html2canvas handles reliably.
          Object.assign(root.style, {
            width: `${CONTENT_WIDTH}px`,
            boxSizing: "border-box",
            background: POSTER_BG,
            display: "block",
          });

          Object.assign(body.style, {
            width: "100%",
            boxSizing: "border-box",
            padding: isA4 ? "56px 64px" : "28px 24px",
            textAlign: "center",
            fontFamily: "var(--telugu-font-family)",
            border: "none",
          });

          const titleEl = doc.querySelector(
            "[data-poster-title]"
          ) as HTMLElement | null;

          if (titleEl) {
            Object.assign(titleEl.style, {
              fontSize: isA4 ? "72px" : "40px",
              lineHeight: "1.4",
            });
          }

          doc
            .querySelectorAll("[data-poster-line]")
            .forEach((el) => {
              Object.assign((el as HTMLElement).style, {
                fontSize: isA4 ? "52px" : "30px",
                lineHeight: isA4 ? "1.9" : "1.75",
              });
            });

          const imgEl = doc.querySelector(
            "[data-poster-image]"
          ) as HTMLElement | null;

          if (imgEl) {
            Object.assign(imgEl.style, {
              height: isA4 ? "280px" : "160px",
              width: "auto",
              maxWidth: "60%",
            });
          }

          const footerEl = doc.querySelector(
            "[data-poster-footer]"
          ) as HTMLElement | null;

          if (footerEl) {
            Object.assign(footerEl.style, {
              borderTop: `1px solid ${POSTER_HAIRLINE}`,
            });

            footerEl.querySelectorAll("p").forEach((p, i) => {
              Object.assign((p as HTMLElement).style, {
                fontSize: isA4
                  ? (i === 0 ? "26px" : "23px")
                  : (i === 0 ? "16px" : "14px"),
              });
            });
          }
        },
      });

      // Composite the natural-size capture onto a canvas sized to the
      // CONTENT itself, plus a small fixed margin — not a huge fixed
      // 1080x1920/A4 frame. That fixed-frame approach was leaving large
      // blank areas above/below (and sometimes side to side) whenever a
      // poem's natural content was shorter than the frame. Content size/
      // font sizes are untouched — only the surrounding canvas shrinks to
      // match, so there's no wasted space on any device.
      const MARGIN = (isA4 ? 60 : 28) * CAPTURE_SCALE;

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = contentCanvas.width + MARGIN * 2;
      finalCanvas.height = contentCanvas.height + MARGIN * 2;

      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = POSTER_BG;
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      ctx.drawImage(contentCanvas, MARGIN, MARGIN);

      return finalCanvas.toDataURL("image/png");
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