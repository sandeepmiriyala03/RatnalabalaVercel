"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Slider,
  Button,
  Typography,
  Stack,
  Menu,
} from "@mui/material";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

/* =========================
   TYPES
========================= */

type FontKey = "gurajada" | "ntr" | "ramaneeya" | "veturi";
type CanvasSize = "a4" | "square";

/* =========================
   UI FONT METADATA (CSS)
========================= */

const FONTS = [
  { key: "gurajada", label: "గురజాడ", className: "chitramala-font-gurajada" },
  { key: "ntr", label: "ఎన్‌టిఆర్", className: "chitramala-font-ntr" },
  { key: "ramaneeya", label: "రమణీయ", className: "chitramala-font-ramaneeya" },
  { key: "veturi", label: "వేటూరి", className: "chitramala-font-veturi" },
];

/*
  🔤 Mapping UI font choice → actual .ttf font files.
  These files live in /public/fonts and are NEVER
  downloaded as standalone files to the user's machine.
*/
const FONT_FILES: Record<FontKey, { name: string; file: string }> = {
  gurajada: { name: "Gurajada", file: "/fonts/Gurajada-Regular.ttf" },
  ntr: { name: "NTR", file: "/fonts/NTR-Regular.ttf" },
  ramaneeya: { name: "Ramaneeya", file: "/fonts/Ramaneeya-Regular.ttf" },
  veturi: { name: "Veturi", file: "/fonts/Veturi-Regular.ttf" },
};

const CANVAS = {
  a4: { label: "A4 (Print)", aspect: "210 / 297" },
  square: { label: "Square (Social)", aspect: "1 / 1" },
};

/* =========================
   FONT LOADER (MEMORY FILE)
========================= */

/*
  Loads a .ttf font into BROWSER MEMORY ONLY.
  - Fetches from /public/fonts
  - Converts to Base64
  - Exists only in RAM
  - Never written to disk
*/
async function loadFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
}

/* =========================
   COMPONENT
========================= */

export default function KhatiMala() {
  const previewRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [fontKey, setFontKey] = useState<FontKey>("gurajada");
  const [fontSize, setFontSize] = useState(22);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>("a4");

  const [menuPos, setMenuPos] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const activeFont =
    FONTS.find(f => f.key === fontKey)?.className ??
    "chitramala-font-gurajada";

  const activeFontLabel =
    FONTS.find(f => f.key === fontKey)?.label ?? "";

  /* =========================
     ACTIONS
  ========================= */

  const resetForm = () => {
    setTitle("");
    setText("");
    setFontKey("gurajada");
    setFontSize(22);
    setCanvasSize("a4");
  };

  /* =========================
     🖼 PDF – IMAGE (EXACT DESIGN)
     HTML → PNG → PDF
     - Visual fidelity 100%
     - Text not selectable
  ========================= */
  const downloadPDFImage = async () => {
    if (!previewRef.current) return;

    const dataUrl = await toPng(previewRef.current, {
      pixelRatio: 3,
      backgroundColor: "#ffffff",
    });

    const pdf =
      canvasSize === "a4"
        ? new jsPDF("p", "mm", "a4")
        : new jsPDF("p", "px", [800, 800]);

    if (canvasSize === "a4") {
      pdf.addImage(dataUrl, "PNG", 10, 10, 190, 0);
    } else {
      pdf.addImage(dataUrl, "PNG", 0, 0, 800, 800);
    }

    pdf.save("khati-mala-design.pdf");
  };

  /* =========================
     🔤 PDF – TEXT WITH EMBEDDED FONT
     MEMORY FILE → jsPDF VFS → PDF
  ========================= */
  const downloadPDFText = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const fontInfo = FONT_FILES[fontKey];

    /*
      1️⃣ Load .ttf into browser memory (RAM)
    */
    const base64Font = await loadFontAsBase64(fontInfo.file);

    /*
      2️⃣ Add font to jsPDF Virtual File System (VFS)
         This is an IN-MEMORY file only.
    */
    pdf.addFileToVFS(`${fontInfo.name}.ttf`, base64Font);

    /*
      3️⃣ Register font → becomes part of PDF binary
    */
    pdf.addFont(`${fontInfo.name}.ttf`, fontInfo.name, "normal");
    pdf.setFont(fontInfo.name);
    pdf.setFontSize(fontSize);

    let y = 30;
    const marginX = 20;

    if (title) {
      pdf.text(title, marginX, y);
      y += 12;
    }

    const lines = pdf.splitTextToSize(text || "", 170);
    pdf.text(lines, marginX, y, { lineHeightFactor: 1.6 });

    /*
      4️⃣ Save PDF
         - Font embedded
         - No .ttf saved to disk
         - Fully portable PDF
    */
    pdf.save("khati-mala-text.pdf");
  };

  /* =========================
     📝 WORD EXPORT (TEXT ONLY)
     Uses system Telugu fonts
  ========================= */
  const downloadWord = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            },
          },
          children: [
            new Paragraph({ text: title }),
            ...text.split("\n").map(line => new Paragraph({ text: line })),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "khati-mala.docx");
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ mouseX: e.clientX + 2, mouseY: e.clientY - 6 });
  };

  const closeMenu = () => setMenuPos(null);

  /* =========================
     RENDER
  ========================= */

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" mb={2}>
          ఖతి మాల – సరళ ఎడిటర్
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* LEFT – INPUT */}
          <Box>
            <TextField
              fullWidth
              label="శీర్షిక"
              value={title}
              onChange={e => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={8}
              label="తెలుగు పాఠ్యం"
              value={text}
              onChange={e => setText(e.target.value)}
            />

            <Box sx={{ mt: 2 }}>
              <Typography>ఫాంట్</Typography>
              <Select
                fullWidth
                value={fontKey}
                onChange={e => setFontKey(e.target.value as FontKey)}
              >
                {FONTS.map(f => (
                  <MenuItem key={f.key} value={f.key}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography>ఫాంట్ సైజ్</Typography>
              <Slider
                min={16}
                max={40}
                value={fontSize}
                onChange={(_, v) => setFontSize(v as number)}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography>పరిమాణం</Typography>
              <Select
                fullWidth
                value={canvasSize}
                onChange={e => setCanvasSize(e.target.value as CanvasSize)}
              >
                {Object.entries(CANVAS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>
                    {v.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={resetForm}>
                Clear
              </Button>
              <Button variant="contained" onClick={downloadWord}>
                Word
              </Button>
            </Stack>
          </Box>

          {/* RIGHT – PREVIEW */}
          <Box
            ref={previewRef}
            onContextMenu={handleContextMenu}
            className={activeFont}
            sx={{
              aspectRatio: CANVAS[canvasSize].aspect,
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 3,
              fontSize: `${fontSize}px`,
              lineHeight: 1.8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              bgcolor: "#fff",
              cursor: "context-menu",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <span>{title || "శీర్షిక"}</span>
              <span style={{ opacity: 0.6 }}>{activeFontLabel}</span>
            </Box>

            <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>
              {text || "ఇక్కడ మీ పాఠ్యం ప్రదర్శించబడుతుంది"}
            </div>

            <Box sx={{ textAlign: "center", opacity: 0.4 }}>
              ఖతి మాల
            </Box>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ mt: 1, opacity: 0.6 }}>
          Preview పై right-click చేసి PDF ఎంపిక చేయండి
        </Typography>

        {/* RIGHT-CLICK CONTEXT MENU */}
        <Menu
          open={menuPos !== null}
          onClose={closeMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            menuPos ? { top: menuPos.mouseY, left: menuPos.mouseX } : undefined
          }
        >
          <MenuItem
            onClick={() => {
              closeMenu();
              downloadPDFImage();
            }}
          >
            🖼 PDF (Exact Design)
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              downloadPDFText();
            }}
          >
            🔤 PDF (Text – Embedded Font)
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              resetForm();
            }}
          >
            🧹 Clear
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}
