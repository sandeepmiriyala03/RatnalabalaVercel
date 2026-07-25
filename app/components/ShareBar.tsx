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

const CAPTURE_SCALE = 2;

export default function ShareButtons({ targetRef }: Props) {

  /* 🔹 Shared Telugu Text */
 const SHARE_TEXT =
    "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
    "   చదవండి – వినండి – పంచుకోండి.\n\n" +
    "🌐 https://ratnalabala.vercel.app/";

  /* 🖼 Generate Image
     ROOT-CAUSE FIX for the persistent left/right margin bug — html2canvas's
     `onclone` callback mutates a HIDDEN iframe clone before capture, but in
     practice the final canvas dimensions kept tracking the LIVE card's
     actual on-page (responsive) width, not the width we set inside
     onclone. Result: no matter what CONTENT_WIDTH we set, the canvas
     stayed sized to the wide live card, leaving blank cream on both sides.

     FIX: skip onclone entirely. Clone the poster into a REAL DOM node,
     attach it (off-screen) to the actual document, apply every fixed style
     directly to that real node, let the browser do a real layout pass,
     then run html2canvas on that node with zero ambiguity — the captured
     canvas can only ever be exactly as wide as the node we built. This
     also makes the export independent of the live card's current
     responsive breakpoint, so it's consistent across phone/tablet/desktop
     by construction, not by trying to out-guess html2canvas's internals. */
  const generateImage = useCallback(
    async (mode: "social" | "a4") => {
      if (!targetRef.current) return null;

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const isA4 = mode === "a4";
      const CONTENT_WIDTH = isA4 ? 1400 : 600;

      // 1. Clone the live poster DOM — already has the real title, image,
      // poem lines, author, footer baked in, we just need to re-style it.
      const clone = targetRef.current.cloneNode(true) as HTMLElement;

      // 2. Force fixed, non-responsive layout directly on the REAL clone.
      // Inline styles here always beat MUI's class-based responsive
      // styles, and because this node is genuinely attached to the
      // document (not a foreign iframe), stylesheets/fonts are guaranteed
      // identical to the live page — no clone-document quirks possible.
      Object.assign(clone.style, {
        position: "fixed",
        left: "-99999px",
        top: "0",
        width: `${CONTENT_WIDTH}px`,
        boxSizing: "border-box",
        background: POSTER_BG,
        padding: isA4 ? "20px" : "8px",
        margin: "0",
        display: "block",
        zIndex: "-1",
      });

      clone.querySelectorAll("[data-poster-hide]").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      const body = clone.querySelector(
        "[data-poster-body]"
      ) as HTMLElement | null;

      if (body) {
        Object.assign(body.style, {
          width: "100%",
          boxSizing: "border-box",
          padding: isA4 ? "32px 36px" : "10px 12px",
          textAlign: "center",
          fontFamily: "var(--telugu-font-family)",
          border: "none",
          margin: "0",
        });
      }

      const titleEl = clone.querySelector(
        "[data-poster-title]"
      ) as HTMLElement | null;

      if (titleEl) {
        Object.assign(titleEl.style, {
          fontSize: isA4 ? "72px" : "40px",
          lineHeight: "1.4",
          marginBottom: isA4 ? "16px" : "10px",
        });
      }

      const dividerEl = clone.querySelector(
        "[data-poster-divider]"
      ) as HTMLElement | null;

      if (dividerEl) {
        Object.assign(dividerEl.style, {
          marginBottom: isA4 ? "24px" : "14px",
        });
      }

      clone.querySelectorAll("[data-poster-line]").forEach((el) => {
        Object.assign((el as HTMLElement).style, {
          fontSize: isA4 ? "52px" : "30px",
          lineHeight: isA4 ? "1.9" : "1.75",
        });
      });

      // Close-up illustration crop — data-poster-image is the circular
      // WRAPPER (see PoemCard.tsx), not the raw <img>. The inner
      // <img data-poster-image-inner> keeps its width:100%/height:100%/
      // object-fit:cover from PoemCard.tsx and fills whatever size we set
      // here automatically.
      const imgWrapEl = clone.querySelector(
        "[data-poster-image]"
      ) as HTMLElement | null;

      if (imgWrapEl) {
        const size = isA4 ? "300px" : "200px";
        Object.assign(imgWrapEl.style, {
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          margin: isA4 ? "0 auto 26px" : "0 auto 16px",
          border: `1px solid ${POSTER_HAIRLINE}`,
        });
      }

      const authorEl = clone.querySelector(
        "[data-poster-author]"
      ) as HTMLElement | null;

      if (authorEl) {
        Object.assign(authorEl.style, {
          fontSize: isA4 ? "26px" : "16px",
          fontWeight: "500",
          marginTop: isA4 ? "20px" : "12px",
        });
      }

      const footerEl = clone.querySelector(
        "[data-poster-footer]"
      ) as HTMLElement | null;

      if (footerEl) {
        Object.assign(footerEl.style, {
          borderTop: `1px solid ${POSTER_HAIRLINE}`,
          marginTop: isA4 ? "26px" : "14px",
          paddingTop: isA4 ? "20px" : "10px",
        });

        footerEl.querySelectorAll("p").forEach((p, i) => {
          Object.assign((p as HTMLElement).style, {
            fontSize: isA4
              ? (i === 0 ? "22px" : "20px")
              : (i === 0 ? "13px" : "12px"),
            margin: i === 0 ? "0 0 4px 0" : "0",
          });
        });
      }

      // Full-width footer illustration — lock its size for export the
      // same way every other poster element is locked, so it can't drift
      // by device/breakpoint.
      const footerImgEl = clone.querySelector(
        "[data-poster-footer-image]"
      ) as HTMLElement | null;

      if (footerImgEl) {
        Object.assign(footerImgEl.style, {
          maxWidth: isA4 ? "760px" : "460px",
          marginTop: isA4 ? "28px" : "16px",
        });
      }

      // 3. Attach the real, fully-styled clone to the document so the
      // browser lays it out for real — this is what makes its measured
      // size 100% predictable.
      document.body.appendChild(clone);

      // Let the browser paint the clone (and let cloned <img> tags resolve
      // from cache) before html2canvas measures/captures it.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const clonedImgs = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        clonedImgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );

      let contentCanvas: HTMLCanvasElement;
      try {
        contentCanvas = await html2canvas(clone, {
          backgroundColor: POSTER_BG,
          scale: CAPTURE_SCALE,
          useCORS: true,
        });
      } finally {
        // Always clean up the off-screen clone, even if capture fails.
        document.body.removeChild(clone);
      }

      // Composite the natural-size capture onto a canvas sized to the
      // CONTENT itself, plus a small fixed margin — not a huge fixed
      // 1080x1920/A4 frame. Content size/font sizes are untouched — only
      // the surrounding canvas shrinks to match, so there's no wasted
      // space on any device.
      const MARGIN = (isA4 ? 30 : 10) * CAPTURE_SCALE;

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