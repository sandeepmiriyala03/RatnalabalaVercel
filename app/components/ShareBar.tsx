"use client";

import React, { useCallback } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadIcon from "@mui/icons-material/Download";
import { capturePosterAsDataUrl } from "@/lib/posterExport";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

type OptionalShareProps = {
  title?: string;
  text?: string;
};

export default function ShareButtons({ targetRef, title, text }: Props & OptionalShareProps) {

  /* 🔹 Shared Telugu Text */
  const SHARE_TEXT =
    "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
    "   చదవండి – వినండి – పంచుకోండి.\n\n" +
    "🌐 https://ratnalabala.vercel.app/";

  // Capture logic now lives entirely in posterExport.ts (capturePosterAsDataUrl)
  // — reused unchanged by DownloadAllPosters.tsx for the bulk ZIP export,
  // so both paths can never drift out of sync with each other.
  const generateImage = useCallback(
    async (mode: "social" | "a4") => {
      if (!targetRef.current) return null;
      return capturePosterAsDataUrl(targetRef.current, mode);
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
    const shareTitle = title ?? "రత్నాలబాల – పద్యాలవాల – భావాలమాల";
    const shareText = text ?? SHARE_TEXT;

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: shareTitle,
        text: shareText,
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

    const textToTweet = encodeURIComponent(text ?? (
      "రత్నాలబాల – పద్యాలవాల – భావాలమాల\n" +
      "చదవండి – వినండి – పంచుకోండి.\n\n" +
      "🌐 https://ratnalabala.vercel.app/"
    ));

    window.open(
      `https://twitter.com/intent/tweet?text=${textToTweet}`,
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