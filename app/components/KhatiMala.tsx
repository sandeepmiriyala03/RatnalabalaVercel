"use client";

import React, { useRef, useState,useEffect} from "react";

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

 type FontKey =
  | "gurajada"
  | "ntr"
  | "ramaneeya"
  | "veturi"
  | "sirivennela"

  | "chathura-thin"
  | "chathura-light"
  | "chathura-regular"
  | "chathura-bold"
  | "chathura-extrabold"

  | "ramaraja"
  | "raviprakash"
  | "tenaliramakrishna"
  | "timmana"
  | "tana"
  | "ponnala-regular"

  | "gidugu"
  | "gidugu-italic"

  | "lakkireddy"

  | "nandakam"
  | "nandakam-italic"

  | "peddana"

  | "purushothamaa"
  | "purushothamaa-italic"

  | "ramabhadra"
  | "ramabhadra-italic"

  | "sreekrushnadevaraya"
  | "sreekrushnadevaraya-italic"

  | "suranna-regular"
  | "suranna-bold"
  | "suranna-italic"
  | "suranna-bolditalic"

  | "suravaram"
  | "suravaram-italic"

  /* =========================
     🆕 Newly Added (1/19/2026)
     ========================= */

  | "annamayya"
  | "annamayya-bold"
  | "annamayya-italic"
  | "annamayya-bolditalic"

  | "dhurjati"
  | "dhurjati-italic"

  | "jims"
  | "jims-italic"

  | "kanakadurga"
  | "kanakadurga-italic"

  | "mandali-regular"
  | "mandali-bold"
  | "mandali-italic"
  | "mandali-bolditalic"

  | "pottisreeramulu";
type CanvasSize = "a4" | "square";

/* =========================
   UI FONT METADATA (CSS)
========================= */


const FONTS: { key: FontKey; label: string; className: string }[] = [
  { key: "gurajada", label: "గురజాడ", className: "chitramala-font-gurajada" },
  { key: "ntr", label: "ఎన్‌టిఆర్", className: "chitramala-font-ntr" },
  { key: "ramaneeya", label: "రమణీయ", className: "chitramala-font-ramaneeya" },
  { key: "veturi", label: "వేటూరి", className: "chitramala-font-veturi" },
  { key: "sirivennela", label: "సిరివెన్నెల", className: "chitramala-font-sirivennela" },

  { key: "chathura-thin", label: "చతుర (Thin)", className: "chitramala-font-chathura-thin" },
  { key: "chathura-light", label: "చతుర (Light)", className: "chitramala-font-chathura-light" },
  { key: "chathura-regular", label: "చతుర (Regular)", className: "chitramala-font-chathura-regular" },
  { key: "chathura-bold", label: "చతుర (Bold)", className: "chitramala-font-chathura-bold" },
  { key: "chathura-extrabold", label: "చతుర (ExtraBold)", className: "chitramala-font-chathura-extrabold" },

  { key: "ramaraja", label: "రామరాజ", className: "chitramala-font-ramaraja" },
  { key: "raviprakash", label: "రవి ప్రకాష్", className: "chitramala-font-raviprakash" },
  { key: "tenaliramakrishna", label: "తెనాలి రామకృష్ణ", className: "chitramala-font-tenali" },
  { key: "timmana", label: "తిమ్మన", className: "chitramala-font-timmana" },
  { key: "tana", label: "టానా", className: "chitramala-font-tana" },
  { key: "ponnala-regular", label: "పొన్నల", className: "chitramala-font-ponnala" },

  { key: "gidugu", label: "గిడుగు", className: "chitramala-font-gidugu" },
  { key: "gidugu-italic", label: "గిడుగు (ఇటాలిక్)", className: "chitramala-font-gidugu-italic" },

  { key: "lakkireddy", label: "లక్కిరెడ్డి", className: "chitramala-font-lakkireddy" },

  { key: "nandakam", label: "నందకం", className: "chitramala-font-nandakam" },
  { key: "nandakam-italic", label: "నందకం (ఇటాలిక్)", className: "chitramala-font-nandakam-italic" },

  { key: "peddana", label: "పెద్దన", className: "chitramala-font-peddana" },

  { key: "purushothamaa", label: "పురుషోత్తమ", className: "chitramala-font-purushothamaa" },
  { key: "purushothamaa-italic", label: "పురుషోత్తమ (ఇటాలిక్)", className: "chitramala-font-purushothamaa-italic" },

  { key: "ramabhadra", label: "రామభద్ర", className: "chitramala-font-ramabhadra" },
  { key: "ramabhadra-italic", label: "రామభద్ర (ఇటాలిక్)", className: "chitramala-font-ramabhadra-italic" },

  { key: "sreekrushnadevaraya", label: "శ్రీ కృష్ణదేవరాయ", className: "chitramala-font-sreekrushnadevaraya" },
  { key: "sreekrushnadevaraya-italic", label: "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", className: "chitramala-font-sreekrushnadevaraya-italic" },

  { key: "suranna-regular", label: "సురన్న (Regular)", className: "chitramala-font-suranna" },
  { key: "suranna-bold", label: "సురన్న (Bold)", className: "chitramala-font-suranna-bold" },
  { key: "suranna-italic", label: "సురన్న (Italic)", className: "chitramala-font-suranna-italic" },
  { key: "suranna-bolditalic", label: "సురన్న (Bold Italic)", className: "chitramala-font-suranna-bolditalic" },

  { key: "suravaram", label: "సురవరం", className: "chitramala-font-suravaram" },
  { key: "suravaram-italic", label: "సురవరం (ఇటాలిక్)", className: "chitramala-font-suravaram-italic" },


{ key: "annamayya", label: "అన్నమయ్య", className: "chitramala-font-annamayya" },
{ key: "annamayya-bold", label: "అన్నమయ్య (Bold)", className: "chitramala-font-annamayya-bold" },
{ key: "annamayya-italic", label: "అన్నమయ్య (ఇటాలిక్)", className: "chitramala-font-annamayya-italic" },
{ key: "annamayya-bolditalic", label: "అన్నమయ్య (Bold Italic)", className: "chitramala-font-annamayya-bolditalic" },

{ key: "dhurjati", label: "ధూర్జటి", className: "chitramala-font-dhurjati" },
{ key: "dhurjati-italic", label: "ధూర్జటి (ఇటాలిక్)", className: "chitramala-font-dhurjati-italic" },

{ key: "jims", label: "జిమ్స్", className: "chitramala-font-jims" },
{ key: "jims-italic", label: "జిమ్స్ (ఇటాలిక్)", className: "chitramala-font-jims-italic" },

{ key: "kanakadurga", label: "కనకదుర్గ", className: "chitramala-font-kanakadurgA" },
{ key: "kanakadurga-italic", label: "కనకదుర్గ (ఇటాలిక్)", className: "chitramala-font-kanakadurgA-italic" },

{ key: "mandali-regular", label: "మండలి (Regular)", className: "chitramala-font-mandali" },
{ key: "mandali-bold", label: "మండలి (Bold)", className: "chitramala-font-mandali-bold" },
{ key: "mandali-italic", label: "మండలి (Italic)", className: "chitramala-font-mandali-italic" },
{ key: "mandali-bolditalic", label: "మండలి (Bold Italic)", className: "chitramala-font-mandali-bolditalic" },

{ key: "pottisreeramulu", label: "పొట్టి శ్రీరాములు", className: "chitramala-font-pottisreeramulu" },

];

/*
  🔤 Mapping UI font choice → actual .ttf font files.
  These files live in /public/fonts and are NEVER
  downloaded as standalone files to the user's machine.
*/
const FONT_FILES: Record<FontKey, { name: string; file: string }> = {
  gurajada: { name: "Gurajada", file: "/fonts/Gurajada-Regular.ttf" },
  ntr: { name: "NTR", file: "/fonts/NTR-Regular.ttf" },
  ramaneeya: { name: "Ramaneeya", file: "/fonts/RamaneeyaWin.ttf" },
  veturi: { name: "Veturi", file: "/fonts/Veturi.ttf" },
  sirivennela: { name: "Sirivennela", file: "/fonts/Sirivennela.ttf" },

  "chathura-thin": { name: "ChathuraThin", file: "/fonts/Chathura-Thin.ttf" },
  "chathura-light": { name: "ChathuraLight", file: "/fonts/Chathura-Light.ttf" },
  "chathura-regular": { name: "ChathuraRegular", file: "/fonts/Chathura-Regular.ttf" },
  "chathura-bold": { name: "ChathuraBold", file: "/fonts/Chathura-Bold.ttf" },
  "chathura-extrabold": { name: "ChathuraExtraBold", file: "/fonts/Chathura-ExtraBold.ttf" },

  ramaraja: { name: "Ramaraja", file: "/fonts/Ramaraja-Regular.ttf" },
  raviprakash: { name: "RaviPrakash", file: "/fonts/RaviPrakash.ttf" },
  tenaliramakrishna: {
    name: "TenaliRamakrishna",
    file: "/fonts/TenaliRamakrishna-Regular.ttf",
  },
  timmana: { name: "Timmana", file: "/fonts/TimmanaRegular.ttf" },
  tana: { name: "TANA", file: "/fonts/TANA.ttf" },
  "ponnala-regular": { name: "Ponnala", file: "/fonts/Ponnala-Regular.ttf" },

  gidugu: { name: "Gidugu", file: "/fonts/Gidugu.otf" },
  "gidugu-italic": { name: "GiduguItalic", file: "/fonts/Gidugu-Italic.otf" },

  lakkireddy: { name: "LakkiReddy", file: "/fonts/LakkiReddy.ttf" },

  nandakam: { name: "Nandakam", file: "/fonts/Nandakam.otf" },
  "nandakam-italic": {
    name: "NandakamItalic",
    file: "/fonts/Nandakam-Italic.otf",
  },

  peddana: { name: "Peddana", file: "/fonts/Peddana-Regular.ttf" },

  purushothamaa: { name: "Purushothamaa", file: "/fonts/Purushothamaa.otf" },
  "purushothamaa-italic": {
    name: "PurushothamaaItalic",
    file: "/fonts/Purushothamaa-Italic.otf",
  },

  ramabhadra: { name: "Ramabhadra", file: "/fonts/Ramabhadra.otf" },
  "ramabhadra-italic": {
    name: "RamabhadraItalic",
    file: "/fonts/Ramabhadra-Italic.otf",
  },

  sreekrushnadevaraya: {
    name: "SreeKrushnadevaraya",
    file: "/fonts/Sree Krushnadevaraya.otf",
  },
  "sreekrushnadevaraya-italic": {
    name: "SreeKrushnadevarayaItalic",
    file: "/fonts/Sree Krushnadevaraya-Italic.otf",
  },

  "suranna-regular": {
    name: "Suranna",
    file: "/fonts/Suranna Regular.otf",
  },
  "suranna-bold": {
    name: "SurannaBold",
    file: "/fonts/Suranna Bold.otf",
  },
  "suranna-italic": {
    name: "SurannaItalic",
    file: "/fonts/Suranna-Italic.otf",
  },
  "suranna-bolditalic": {
    name: "SurannaBoldItalic",
    file: "/fonts/Suranna Bold Italic.otf",
  },

  suravaram: { name: "Suravaram", file: "/fonts/Suravaram.otf" },
  "suravaram-italic": {
    name: "SuravaramItalic",
    file: "/fonts/Suravaram-Italic.otf",
  },

  annamayya: { name: "Annamayya", file: "/fonts/Annamayya.otf" },
  "annamayya-bold": {
    name: "AnnamayyaBold",
    file: "/fonts/AnnamayyaBold.otf",
  },
  "annamayya-italic": {
    name: "AnnamayyaItalic",
    file: "/fonts/AnnamayyaItalic.otf",
  },
  "annamayya-bolditalic": {
    name: "AnnamayyaBoldItalic",
    file: "/fonts/AnnamayyaBoldItalic.otf",
  },

  dhurjati: { name: "Dhurjati", file: "/fonts/Dhurjati.otf" },
  "dhurjati-italic": {
    name: "DhurjatiItalic",
    file: "/fonts/Dhurjati-Italic.otf",
  },

  jims: { name: "JIMS", file: "/fonts/JIMS.otf" },
  "jims-italic": { name: "JIMSItalic", file: "/fonts/JIMSItalic.otf" },

  kanakadurga: {
    name: "KanakaDurga",
    file: "/fonts/KanakaDurga.otf",
  },
  "kanakadurga-italic": {
    name: "KanakaDurgaItalic",
    file: "/fonts/KanakaDurga-Italic.otf",
  },

  "mandali-regular": {
    name: "Mandali",
    file: "/fonts/Mandali-Regular.otf",
  },
  "mandali-bold": {
    name: "MandaliBold",
    file: "/fonts/Mandali-Bold.otf",
  },
  "mandali-italic": {
    name: "MandaliItalic",
    file: "/fonts/Mandali-Italic.otf",
  },
  "mandali-bolditalic": {
    name: "MandaliBoldItalic",
    file: "/fonts/Mandali-Bold Italic.otf",
  },

  pottisreeramulu: {
    name: "PottiSreeramulu",
    file: "/fonts/Potti Sreeramulu.otf",
  },
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

const DB_NAME = "ratnalabala-db";
const STORE = "khati-mala";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDraft(data: any) {
  const db = await openDB();
  db.transaction(STORE, "readwrite").objectStore(STORE).put(data, "draft");
}

async function loadDraft(): Promise<any> {
  const db = await openDB();
  return new Promise(resolve => {
    const req = db.transaction(STORE).objectStore(STORE).get("draft");
    req.onsuccess = () => resolve(req.result || null);
  });
}

async function clearDraft() {
  const db = await openDB();
  db.transaction(STORE, "readwrite").objectStore(STORE).delete("draft");
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

  const resetForm = async () => {
  setTitle("");
  setText("");
  setFontKey("gurajada");
  setFontSize(22);
  setCanvasSize("a4");
  await clearDraft();
};

function estimatePdfPages(text: string, fontSize: number) {
  const charsPerPage = Math.floor(1800 * (22 / fontSize));
  return Math.max(1, Math.ceil(text.length / charsPerPage));
}


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

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const imgWidth = pageWidth - margin * 2;

  const img = new Image();
  img.src = dataUrl;
  await new Promise(resolve => (img.onload = resolve));

  const imgHeight = (img.height * imgWidth) / img.width;

  let positionY = margin;
  let remainingHeight = imgHeight;

  // 🔹 First page
  pdf.addImage(dataUrl, "PNG", margin, positionY, imgWidth, imgHeight);
  remainingHeight -= pageHeight;

  // 🔹 Next pages
  while (remainingHeight > 0) {
    positionY = remainingHeight - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", margin, positionY, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
  }

  pdf.save("khati-mala-design.pdf");

  // ✅ Clear IndexedDB + UI
  await clearDraft();
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
const estimatedPages = estimatePdfPages(text, fontSize);

  useEffect(() => {
  saveDraft({
    title,
    text,
    fontKey,
    fontSize,
    canvasSize,
    updatedAt: Date.now(),
  });
}, [title, text, fontKey, fontSize, canvasSize]);

useEffect(() => {
  loadDraft().then(d => {
    if (!d) return;
    setTitle(d.title || "");
    setText(d.text || "");
    setFontKey(d.fontKey || "gurajada");
    setFontSize(d.fontSize || 22);
    setCanvasSize(d.canvasSize || "a4");
  });
}, []);

  /* =========================
     RENDER
  ========================= */

  return (
    
    <Card>
      <CardContent>
        <Typography variant="h6" mb={2}>
          ఖతి మాల 
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
                    <Button variant="contained" color="secondary" onClick={downloadPDFImage}>
        PDF
      </Button>
<Typography variant="caption" sx={{ opacity: 0.6 }}>
  💾 ఆటో సేవ్ — ఈ డివైస్‌లోనే (Offline)
</Typography>


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
    justifyContent: "flex-start", 
    bgcolor: "#fff",
    cursor: "context-menu",
  }}
>
  {/* TITLE */}
  <Typography
    sx={{
      textAlign: "center",
      fontWeight: 600,
      mb: 1,              // 🔑 small controlled gap
    }}
  >
    {title || "శీర్షిక"}
  </Typography>

  {/* BODY */}
  <Box
    sx={{
      whiteSpace: "pre-wrap",
      textAlign: "justify",
      wordBreak: "break-word",
      lineHeight: 1.9,
    }}
  >
    {text ? (
      text
    ) : (
      <Typography component="span" sx={{ opacity: 0.4 }}>
        ఇక్కడ మీ పాఠ్యం ప్రదర్శించబడుతుంది
      </Typography>
    )}
  </Box>
</Box>

        </Box>
    <Typography variant="caption" sx={{ opacity: 0.7 }}>
      📄 అంచనా PDF పేజీలు: <b>{estimatedPages}</b>
    </Typography>

        <Typography variant="caption" sx={{ mt: 1, opacity: 0.6 }}>
          Preview పై right-click చేసి PDF ఎంపిక చేయండి
        </Typography>

        {/* RIGHT-CLICK CONTEXT MENU
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
         */}
      </CardContent>
    </Card>
  );
}
