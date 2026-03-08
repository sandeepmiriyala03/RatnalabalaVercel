"use client";

import { Button } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =====================
   FONT LOADER
===================== */
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

/* =====================
   IMAGE LOADER
===================== */
async function loadImage(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function AksharaPdfDownload({
  data,
  fontName,
  fontFile
}: any) {

  const downloadPDF = async () => {

    const pdf = new jsPDF("p", "mm", "a4");

    /* load Telugu font */
    const base64 = await loadFont(fontFile);

    pdf.addFileToVFS(`${fontName}.ttf`, base64);
    pdf.addFont(`${fontName}.ttf`, fontName, "normal");
    pdf.setFont(fontName);

    pdf.setFontSize(22);
    pdf.text("తెలుగు అక్షరమాల", 70, 20);

    /* convert images */
    const rows = [];

    for (const a of data) {

      let img = "";

      if (a.image) {
        img = await loadImage(a.image);
      }

      rows.push([
        a.letter,
        a.word || "",
        img
      ]);
    }

    autoTable(pdf, {
      startY: 30,
      head: [["అక్షరం", "పదం", "చిత్రం"]],
      body: rows,

      styles: {
        font: fontName,
        fontSize: 18,
        cellPadding: 4,
        halign: "center",
        valign: "middle"
      },

      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40 }
      },

      didDrawCell: (dataCell: any) => {

        if (dataCell.column.index === 2 && dataCell.cell.raw) {

          pdf.addImage(
            dataCell.cell.raw,
            "JPEG",
            dataCell.cell.x + 2,
            dataCell.cell.y + 2,
            16,
            16
          );

        }

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