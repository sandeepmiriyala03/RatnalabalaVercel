"use client";

import { Button } from "@mui/material";
import jsPDF from "jspdf";

async function loadFont(url: string) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
}

export default function AksharaPdfDownload({
  data,
  fontName,
  fontFile
}: any) {

  const downloadPDF = async () => {

    const pdf = new jsPDF();

    const base64 = await loadFont(fontFile);

    pdf.addFileToVFS(`${fontName}.ttf`, base64);
    pdf.addFont(`${fontName}.ttf`, fontName, "normal");

    pdf.setFont(fontName);

    pdf.setFontSize(22);
    pdf.text("తెలుగు అక్షరమాల", 70, 20);

    let y = 40;

    data.forEach((a: any) => {

      pdf.setFontSize(28);
      pdf.text(a.letter, 20, y);

      pdf.setFontSize(18);
      pdf.text(a.word || "", 40, y);

      y += 18;

      if (y > 280) {
        pdf.addPage();
        y = 20;
      }

    });

    pdf.save("telugu-aksharamala.pdf");

  };

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={downloadPDF}
    >
      PDF Download
    </Button>
  );
}