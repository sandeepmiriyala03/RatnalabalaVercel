import React from "react";
import { IconButton, Stack } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLDivElement | null>;
};

export default function ShareButtons({ targetRef }: Props) {

  const generateImage = async () => {
    if (!targetRef.current) return null;

    const element = targetRef.current;

    const canvas = await html2canvas(element, {
      scale: window.devicePixelRatio || 2,
      backgroundColor: "#ffffff",
      width: 360,              // ✅ mobile-friendly width
      windowWidth: 360,
      scrollY: -window.scrollY,
      useCORS: true,
    });

    return canvas.toDataURL("image/png");
  };

  const downloadPng = async () => {
    const img = await generateImage();
    if (!img) return;
    const link = document.createElement("a");
    link.href = img;
    link.download = "mantra.png";
    link.click();
  };

  const shareTo = async () => {
    const img = await generateImage();
    if (!img) return;

    const blob = await (await fetch(img)).blob();
    const file = new File([blob], "mantra.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Mantra",
        text: "🙏 Vedic Mantra",
      });
    } else {
      downloadPng(); // fallback for desktop
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="center"
      sx={{ my: 2, flexWrap: "wrap" }}
    >
      <IconButton color="success" onClick={shareTo}>
        <WhatsAppIcon />
      </IconButton>

      <IconButton color="primary" onClick={shareTo}>
        <TelegramIcon />
      </IconButton>

      <IconButton color="secondary" onClick={downloadPng}>
        <DownloadIcon />
      </IconButton>
    </Stack>
  );
}
