"use client";

import html2canvas from "html2canvas";

export const POSTER_BG = "#F7F2EA";
const POSTER_HAIRLINE = "#E4DACB";
const CAPTURE_SCALE = 2;

export async function capturePosterAsDataUrl(
  rootEl: HTMLElement,
  mode: "social" | "a4" = "social"
): Promise<string | null> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const isA4 = mode === "a4";
  const CONTENT_WIDTH = isA4 ? 1400 : 600;

  const clone = rootEl.cloneNode(true) as HTMLElement;

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

  const body = clone.querySelector("[data-poster-body]") as HTMLElement | null;
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

  const titleEl = clone.querySelector("[data-poster-title]") as HTMLElement | null;
  if (titleEl) {
    Object.assign(titleEl.style, {
      fontSize: isA4 ? "72px" : "40px",
      lineHeight: "1.4",
      marginBottom: isA4 ? "16px" : "10px",
    });
  }

  const dividerEl = clone.querySelector("[data-poster-divider]") as HTMLElement | null;
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

  const imgWrapEl = clone.querySelector("[data-poster-image]") as HTMLElement | null;
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

  const authorEl = clone.querySelector("[data-poster-author]") as HTMLElement | null;
  if (authorEl) {
    Object.assign(authorEl.style, {
      fontSize: isA4 ? "26px" : "16px",
      fontWeight: "500",
      marginTop: isA4 ? "20px" : "12px",
    });
  }

  const footerEl = clone.querySelector("[data-poster-footer]") as HTMLElement | null;
  if (footerEl) {
    Object.assign(footerEl.style, {
      borderTop: `1px solid ${POSTER_HAIRLINE}`,
      marginTop: isA4 ? "26px" : "14px",
      paddingTop: isA4 ? "20px" : "10px",
    });

    footerEl.querySelectorAll("p").forEach((p, i) => {
      Object.assign((p as HTMLElement).style, {
        fontSize: isA4 ? (i === 0 ? "22px" : "20px") : (i === 0 ? "13px" : "12px"),
        margin: i === 0 ? "0 0 4px 0" : "0",
      });
    });
  }

  const footerImgEl = clone.querySelector(
    "[data-poster-footer-image]"
  ) as HTMLElement | null;
  if (footerImgEl) {
    Object.assign(footerImgEl.style, {
      maxWidth: isA4 ? "260px" : "190px",
      marginTop: isA4 ? "20px" : "12px",
      opacity: "0.85",
    });
  }

  document.body.appendChild(clone);

  // Let the browser paint the clone before html2canvas measures/captures.
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
    document.body.removeChild(clone);
  }

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
}