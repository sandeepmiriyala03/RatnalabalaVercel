"use client";

import React, { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import Image from "next/image";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  Typography,
  Alert,
  Box,
  Stack,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { FileUploadComponent } from "./FileUploadComponent";
import FileUploadManager from "./FileUploadManager";
import { ActionsComponent } from "./ActionsComponent";
import ErrorMessageComponent from "./ErrorMessageComponent";
import { TeluguOcrExplanation } from "./TeluguOcrExplanation";

/* ================================================================
   CONFIG
================================================================ */

type LangOption = { value: string; label: string };

const TELUGU_LANG: LangOption = { value: "tel", label: "Telugu" };

const MAX_OCR_TIME_MS = 30000;
const MIN_IMAGE_WIDTH = 100;

const TELUGU_FONTS = [
  { label: "Noto Serif Telugu", value: "'Noto Serif Telugu', serif" },
  { label: "Noto Sans Telugu", value: "'Noto Sans Telugu', sans-serif" },
  { label: "Pothana2000", value: "'Pothana2000', serif" },
  { label: "Default Serif", value: "serif" },
];

// The three engines this page can actually invoke. Tesseract and HTR
// run 100% client-side — zero setup, work for every visitor instantly.
// PaddleOCR does NOT run in a browser (it's a Python + PaddlePaddle
// framework tool needing real server/GPU infrastructure), so selecting
// it requires pointing at a self-hosted PaddleOCR HTTP server — see the
// engine description accordion below for what that server needs to do.
type EngineId = "tesseract" | "htr" | "paddleocr";

const ENGINES: { id: EngineId; label: string; ready: boolean }[] = [
  { id: "tesseract", label: "Tesseract.js (బ్రౌజర్‌లోనే, సెటప్ అవసరం లేదు)", ready: true },
  { id: "htr", label: "HTR — Transformers.js/TrOCR (బ్రౌజర్‌లోనే, ~280MB మొదటిసారి)", ready: true },
  { id: "paddleocr", label: "PaddleOCR (సొంత సర్వర్ అవసరం — క్రింద URL ఇవ్వండి)", ready: false },
];

/* ================================================================
   IMAGE HELPERS
================================================================ */

function resizeImageFile(file: File, minWidth: number, maxWidth: number): Promise<Blob | File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = Math.max(img.width, minWidth);
      let height = Math.round((img.height * width) / img.width);
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round((img.height * maxWidth) / img.width);
      }
      if (width === img.width) { resolve(file); return; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context error"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))), file.type || "image/png", 0.85);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

const toBase64 = (file: File | Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

/* ================================================================
   PAGE
================================================================ */

type ActiveTab = "image" | "document";

export default function TeluguOcrPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  const [engine, setEngine] = useState<EngineId>("tesseract");
  const [paddleUrl, setPaddleUrl] = useState("/api/paddleocr");

  const [fontFamily, setFontFamily] = useState(TELUGU_FONTS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(1.6);

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelCache = useRef<any>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    resetTimer();
    timerRef.current = setTimeout(() => {
      cancelFlag.current = true;
      setLoading(false);
      setImageError("OCR సమయం ముగిసింది (30 సెకన్లు)");
      setProgress("");
    }, MAX_OCR_TIME_MS);
  }, [resetTimer]);

  /* ========== FILE CHANGE ========== */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cancelFlag.current = false;
    setImageError("");
    setProgress("");
    setOcrText("");

    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFileUrl(URL.createObjectURL(selected));
  };

  /* ================================================================
     ENGINE 1 — Tesseract.js (Apache 2.0). Runs fully client-side via
     WASM. No install beyond `npm install tesseract.js`.
  ================================================================ */
  const runTesseract = async (target: File | Blob): Promise<string> => {
    const { data } = await Tesseract.recognize(target, TELUGU_LANG.value, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(`Tesseract.js: ${Math.round((m.progress ?? 0) * 100)}%`);
        }
      },
    });
    return (data.text || "").trim();
  };

  /* ================================================================
     ENGINE 2 — HTR via Transformers.js / Xenova TrOCR (MIT). Runs
     fully client-side as an ONNX model. Needs
     `npm install @huggingface/transformers` — sizeable one-time
     model download (~280MB), cached by the browser afterward.
  ================================================================ */
  const runHTR = async (target: File | Blob): Promise<string> => {
    setProgress("HTR మోడల్ లోడ్ అవుతోంది (మొదటిసారి మాత్రమే, ~280MB)...");
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowRemoteModels = true;
    env.useBrowserCache = true;

    if (!modelCache.current) {
      modelCache.current = await pipeline("image-to-text", "Xenova/trocr-base-printed");
    }
    setProgress("HTR గుర్తింపు జరుగుతోంది...");
    const base64 = await toBase64(target);
    const result = await modelCache.current(base64);
    if (Array.isArray(result) && result[0]?.generated_text) return result[0].generated_text.trim();
    if (Array.isArray(result) && result[0]?.text) return result[0].text.trim();
    return "";
  };

  /* ================================================================
     ENGINE 3 — PaddleOCR (Apache 2.0), via a self-hosted HTTP server.
     PaddleOCR is a Python + PaddlePaddle framework tool — it cannot
     run inside a browser tab. This function POSTs the image to
     whatever server URL the person configured; THAT server is
     expected to run PaddleOCR itself and return { "text": "..." }.
     A minimal reference server (FastAPI + paddleocr) would look like:

       from fastapi import FastAPI, File, UploadFile
       from paddleocr import PaddleOCR
       app = FastAPI()
       ocr = PaddleOCR(lang="te")  # or "en", check PaddleOCR's language list
       @app.post("/ocr")
       async def run_ocr(file: UploadFile = File(...)):
           result = ocr.ocr(await file.read())
           text = "\n".join([line[1][0] for block in result for line in block])
           return {"text": text}

     Deploy that anywhere with a GPU (a VPS, a container host, etc.),
     paste its URL below, and this button will actually call it.
  ================================================================ */
  const runPaddleOCR = async (target: File | Blob, serverUrl: string): Promise<string> => {
    if (!serverUrl.trim()) {
      throw new Error("PaddleOCR సర్వర్ URL ఇవ్వలేదు — క్రింద ఫీల్డ్‌లో మీ సొంత PaddleOCR సర్వర్ URL నమోదు చేయండి.");
    }
    setProgress("PaddleOCR సర్వర్‌కు పంపుతోంది...");
    const form = new FormData();
    form.append("file", target instanceof File ? target : new File([target], "image.png"));

    const res = await fetch(serverUrl, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error(`PaddleOCR సర్వర్ లోపం (${res.status}) — సర్వర్ నడుస్తోందా, URL సరైనదా అని తనిఖీ చేయండి.`);
    }
    const data = await res.json();
    return (data.text || "").trim();
  };

  /* ========== OCR RUN ========== */
  const onAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setOcrText("");
    cancelFlag.current = false;
    startTimer();

    try {
      setProgress("చిత్రాన్ని ప్రాసెస్ చేస్తోంది...");
      const processed = (await resizeImageFile(file, MIN_IMAGE_WIDTH, 1200)) as Blob;

      let text = "";
      if (engine === "tesseract") text = await runTesseract(processed);
      else if (engine === "htr") text = await runHTR(processed);
      else text = await runPaddleOCR(processed, paddleUrl);

      if (!cancelFlag.current) {
        text ? setOcrText(text) : setImageError("పాఠ్యం గుర్తించబడలేదు.");
      }
    } catch (err: any) {
      if (!cancelFlag.current) setImageError(err?.message || "OCR విఫలమైంది.");
    } finally {
      setLoading(false);
      resetTimer();
    }
  };

  /* ========== CLEAR ========== */
  const onClear = () => {
    cancelFlag.current = true;
    resetTimer();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setOcrText("");
    setImageError("");
    setProgress("");
  };

  /* ================================================================
     EXPORTS — TXT, Word (.docx), PDF, Image poster (PNG), HTML,
     EPUB, JSON, Copy.
  ================================================================ */

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadText = (content: string, filename: string, type: string) =>
    downloadBlob(new Blob([content], { type }), filename);

  const exportTXT = () => downloadText(ocrText, `lipimala_${Date.now()}.txt`, "text/plain");

  // Word export via the `docx` package (MIT) — a genuine .docx file,
  // not an HTML-renamed-as-.doc trick. `npm install docx` required.
  const exportWord = async () => {
    if (!ocrText) return;
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ children: [new TextRun({ text: "లిపిమాల — OCR ఫలితం", bold: true, size: 32 })] }),
            new Paragraph({ text: "" }),
            ...ocrText.split("\n").map(
              (line) => new Paragraph({ children: [new TextRun({ text: line, size: fontSize * 2 })] })
            ),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `lipimala_${Date.now()}.docx`);
  };

  const exportPDF = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <style>body{font-family:${fontFamily};padding:30px;font-size:${fontSize}px;line-height:${lineSpacing}}</style>
      </head><body><h2>లిపిమాల — OCR</h2><pre style="white-space:pre-wrap">${ocrText}</pre></body></html>`);
    win.document.close();
    win.print();
  };

  const exportImage = () => {
    if (!ocrText) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const maxWidth = 900, padding = 50, titleSize = 28;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const wrap = (t: string) => {
      const words = t.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur + w + " ";
        if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur.trim()); cur = w + " "; }
        else cur = test;
      }
      lines.push(cur.trim());
      return lines;
    };
    const wrapped: string[] = [];
    ocrText.split("\n").forEach((l) => wrapped.push(...wrap(l)));
    const lineH = Math.round(fontSize * lineSpacing);
    canvas.width = maxWidth + padding * 2;
    canvas.height = padding * 2 + titleSize + wrapped.length * lineH + 60;

    ctx.fillStyle = "#fffdf7"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#2f855a"; ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    ctx.fillStyle = "#0d47a1"; ctx.font = `bold ${titleSize}px ${fontFamily}`; ctx.textAlign = "center";
    ctx.fillText("లిపిమాల — OCR", canvas.width / 2, padding);
    ctx.fillStyle = "#102a43"; ctx.font = `${fontSize}px ${fontFamily}`; ctx.textAlign = "left";
    let y = padding + titleSize + 20;
    wrapped.forEach((l) => { ctx.fillText(l, padding, y); y += lineH; });
    ctx.fillStyle = "#757575"; ctx.font = "13px serif"; ctx.textAlign = "center";
    ctx.fillText(`Generated: ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height - 20);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png", 1.0);
    a.download = `lipimala_${Date.now()}.png`;
    a.click();
  };

  const exportHTML = () =>
    downloadText(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>లిపిమాల — OCR</title></head>
      <body style="font-family:${fontFamily};font-size:${fontSize}px;line-height:${lineSpacing}">
      <h1>లిపిమాల — OCR</h1><p>Generated: ${new Date().toLocaleString()}</p>
      <pre style="white-space:pre-wrap">${ocrText}</pre></body></html>`,
      `lipimala_${Date.now()}.html`, "text/html"
    );

  const exportEPUB = async () => {
    if (!ocrText) return;
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip");
    zip.folder("OEBPS")?.file(
      "content.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml"><body style="font-family:${fontFamily}">
      <h1>లిపిమాల — OCR</h1><pre style="white-space:pre-wrap">${ocrText}</pre></body></html>`
    );
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `lipimala_${Date.now()}.epub`);
  };

  const exportJSON = () =>
    downloadText(
      JSON.stringify(
        { engine, language: "Telugu", font: { fontFamily, fontSize, lineSpacing }, generatedAt: new Date().toISOString(), content: ocrText },
        null, 2
      ),
      `lipimala_${Date.now()}.json`, "application/json"
    );

  const copyText = async () => {
    try { await navigator.clipboard.writeText(ocrText); setProgress("కాపీ చేయబడింది ✅"); }
    catch { setImageError("కాపీ విఫలమైంది."); }
  };

  /* ================================================================
     UI
  ================================================================ */

  return (
    <div style={{ padding: 20, maxWidth: 820, margin: "auto" }}>
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "calc(var(--telugu-font-size, 1rem) * 1.8)",
          textAlign: "center",
        }}
      >
        లిపిమాల
      </Typography>

      <TeluguOcrExplanation />

      <div style={{ display: "inline-flex", marginBottom: 20, marginTop: 12 }}>
        {(["document", "image"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "10px 20px",
              background: activeTab === t ? "#15803d" : "#eee",
              color: activeTab === t ? "#fff" : "#333",
              border: "none",
              fontWeight: "bold",
            }}
          >
            {t === "document" ? "పత్ర విశ్లేషణ" : "అక్షర గుర్తింపు"}
          </button>
        ))}
      </div>

      {activeTab === "document" && <FileUploadManager />}

      {activeTab === "image" && (
        <Stack spacing={2}>
          {/* ── Engine selector ── */}
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              OCR ఇంజన్ ఎంచుకోండి
            </Typography>
            <Select fullWidth size="small" value={engine} onChange={(e) => setEngine(e.target.value as EngineId)}>
              {ENGINES.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.ready ? "✅ " : "⚙️ "} {e.label}
                </MenuItem>
              ))}
            </Select>

            {engine === "paddleocr" && (
              <TextField
                fullWidth
                size="small"
                sx={{ mt: 1 }}
                label="PaddleOCR సర్వర్ URL (మీ సొంత సర్వర్)"
                placeholder="https://your-paddleocr-server.example.com/ocr"
                value={paddleUrl}
                onChange={(e) => setPaddleUrl(e.target.value)}
              />
            )}
          </Box>

          {engine === "tesseract" && (
            <Alert severity="success">
              ✅ Tesseract.js — పూర్తిగా బ్రౌజర్‌లోనే నడుస్తుంది, ఎలాంటి సర్వర్ అవసరం లేదు.
            </Alert>
          )}
          {engine === "htr" && (
            <Alert severity="success">
              ✅ HTR (Transformers.js/TrOCR) — పూర్తిగా బ్రౌజర్‌లోనే నడుస్తుంది. మొదటిసారి ~280MB మోడల్
              డౌన్‌లోడ్ అవుతుంది, తర్వాత బ్రౌజర్‌లో కాషె అవుతుంది.
            </Alert>
          )}
          {engine === "paddleocr" && (
            <Alert severity="warning">
              ⚠️ PaddleOCR బ్రౌజర్‌లో నేరుగా నడవదు — పైన ఉన్న డిఫాల్ట్ URL (<code>/api/paddleocr</code>)
              ఈ ప్రాజెక్ట్‌లోనే ఉన్న Python సర్వర్‌లెస్ ఫంక్షన్‌ను సూచిస్తుంది (Vercel ఇప్పుడు Python
              ఫంక్షన్లకు మద్దతు ఇస్తుంది). GPU లేకపోవడం వల్ల ఇది Tesseract/HTR కంటే నెమ్మదిగా ఉంటుంది.
              మీకు వేరే సర్వర్ ఉంటే ఆ URL ఇక్కడ మార్చవచ్చు.
            </Alert>
          )}

          <FileUploadComponent file={file} onFileChange={onFileChange} loading={loading} />

          {progress && <p>{progress}</p>}
          {imageError && <ErrorMessageComponent message={imageError} />}

          {fileUrl && (
            <Image src={fileUrl} alt="Preview" width={600} height={400} style={{ width: "100%", borderRadius: 12 }} />
          )}

          <ActionsComponent
            loading={loading}
            file={file}
            lang={[TELUGU_LANG]}
            onAnalyze={onAnalyze}
            onClear={onClear}
            onCancel={onClear}
          />

          {ocrText && (
            <>
              <Box>
                <label>అక్షర శైలి</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  {TELUGU_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                <label>అక్షర పరిమాణం: {fontSize}px</label>
                <input type="range" min={16} max={36} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: "100%" }} />

                <label>వరుస అంతరం: {lineSpacing.toFixed(1)}</label>
                <input type="range" min={1.3} max={2.4} step={0.1} value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value))} style={{ width: "100%" }} />
              </Box>

              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                style={{ width: "100%", height: 240, marginTop: 12, fontFamily, fontSize, lineHeight: lineSpacing }}
              />

              <Typography variant="subtitle1" fontWeight={700}>⬇ ఎగుమతి (Export)</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Chip label="TXT" onClick={exportTXT} clickable />
                <Chip label="Word (.docx)" onClick={exportWord} clickable />
                <Chip label="PDF" onClick={exportPDF} clickable />
                <Chip label="పోస్టర్ (PNG)" onClick={exportImage} clickable />
                <Chip label="HTML" onClick={exportHTML} clickable />
                <Chip label="EPUB" onClick={exportEPUB} clickable />
                <Chip label="JSON" onClick={exportJSON} clickable />
                <Chip label="కాపీ" onClick={copyText} clickable />
                <Chip label="క్లియర్" onClick={onClear} clickable color="error" />
              </Stack>
            </>
          )}

          {/* ================================================================
              OCR ఇంజన్ల వివరాలు (సంక్షిప్తంగా) — every major free/open-
              source OCR + HTR engine, short Telugu description each.
             ================================================================ */}
          <Box sx={{ mt: 2, p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>🧠 OCR ఇంజన్ల వివరాలు</Typography>

            <Typography variant="subtitle2" color="success.main" sx={{ mt: 1 }}>
              ✅ బ్రౌజర్‌లోనే పనిచేస్తాయి (ఈ పేజీలో వాడుతున్నవి)
            </Typography>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>Tesseract.js (Apache 2.0)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">Google తయారు చేసిన Tesseract OCR ను WebAssembly లోకి మార్చినది — పూర్తిగా బ్రౌజర్‌లోనే నడుస్తుంది. తెలుగు సహా అనేక భాషలకు సిద్ధంగా ఉన్న ట్రెయిన్డ్ మోడల్స్ (~10MB), శుభ్రమైన ప్రింటెడ్ టెక్స్ట్‌కి బాగా పనిచేస్తుంది.</Typography></AccordionDetails>
            </Accordion>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>HTR — Transformers.js / TrOCR (MIT)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">Hugging Face మోడల్స్‌ను ONNX రూపంలో బ్రౌజర్‌లోనే నడిపే లైబ్రరీ. చేతిరాత, అసాధారణ ఫాంట్లకు Tesseract కంటే మెరుగ్గా పనిచేస్తుంది. మొదటిసారి పెద్ద మోడల్ (~280MB) డౌన్‌లోడ్ అవుతుంది, తర్వాత కాషె నుండి వేగంగా పనిచేస్తుంది.</Typography></AccordionDetails>
            </Accordion>

            <Typography variant="subtitle2" color="warning.main" sx={{ mt: 2 }}>
              ⚙️ సొంత సర్వర్ అవసరం (ఈ పేజీలో ఐచ్ఛికం)
            </Typography>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>PaddleOCR / PaddleOCR-VL (Apache 2.0)</Typography></AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Baidu తయారు చేసిన శక్తివంతమైన OCR టూల్‌కిట్ — 100+ భాషలు, టేబుల్స్/ఫార్ములాలతో సహా
                  సంక్లిష్ట డాక్యుమెంట్లను బాగా అర్థం చేసుకుంటుంది. కానీ ఇది Python + PaddlePaddle
                  framework మీద ఆధారపడి ఉంటుంది కాబట్టి బ్రౌజర్‌లో నేరుగా నడవదు — GPU సర్వర్ మీద హోస్ట్
                  చేయాలి.
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 12, bgcolor: "#f5f5f5", p: 1, borderRadius: 1 }}>
                  {`from paddleocr import PaddleOCR
ocr = PaddleOCR(lang="te")
# FastAPI/Flask ద్వారా HTTP endpoint గా exposed చేసి,
# ఆ URL ను ఈ పేజీలో "PaddleOCR సర్వర్ URL" ఫీల్డ్‌లో పెట్టండి.`}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              📚 ఇతర ఓపెన్ సోర్స్ ఇంజన్లు (సూచన కోసం మాత్రమే — ఇక్కడ వైర్ చేయలేదు)
            </Typography>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>Surya OCR</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">90+ భాషలకు లేఅవుట్-అవగాహన గల OCR మోడల్ — టేబుల్స్, బహుళ కాలమ్‌ల పేజీలలో అత్యుత్తమ లైన్-లెవెల్ గుర్తింపు. GPU సిఫార్సు చేయబడుతుంది.</Typography></AccordionDetails>
            </Accordion>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>docTR (Apache 2.0)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">Mindee తయారు చేసిన డిటెక్షన్+రికగ్నిషన్ pipeline — ప్రధానంగా ఇంగ్లీష్/ఫ్రెంచ్‌కు తయారైన మోడల్స్, తెలుగు వంటి భాషలకు fine-tuning అవసరం.</Typography></AccordionDetails>
            </Accordion>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>EasyOCR (Apache 2.0)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">PyTorch ఆధారిత, 80+ భాషలు — త్వరగా ప్రోటోటైప్ చేయడానికి బాగుంటుంది, కానీ పెద్ద స్థాయి వినియోగానికి ఖచ్చితత్వం తక్కువ.</Typography></AccordionDetails>
            </Accordion>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>Kraken (చారిత్రక/హస్తలిపి HTR)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">పాత మాన్యుస్క్రిప్ట్‌లు, హస్తలిపి కోసం digital humanities లో విస్తృతంగా వాడే టూల్ — ప్రతి లిపికి ప్రత్యేక ట్రైనింగ్ అవసరం.</Typography></AccordionDetails>
            </Accordion>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>Indic-OCR (Tesseract-ఆధారిత కమ్యూనిటీ ప్రాజెక్ట్)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">భారతీయ లిపుల కోసం ప్రత్యేకంగా మెరుగుపరచిన Tesseract tessdata మోడల్స్ అందించే ఓపెన్ సోర్స్ ప్రాజెక్ట్.</Typography></AccordionDetails>
            </Accordion>

            <Accordion disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={600}>olmOCR / Qwen2.5-VL / GOT-OCR 2.0 (వీక్షణ-భాషా మోడల్స్)</Typography></AccordionSummary>
              <AccordionDetails><Typography variant="body2">కొత్త తరం OCR — పేజీని విడిభాగాలుగా కాక ఒకేసారి పూర్తిగా చదివి structured markdown/JSON ఇస్తాయి. టేబుల్స్, సంక్లిష్ట లేఅవుట్‌లకు అత్యుత్తమం, కానీ భారీ GPU అవసరం.</Typography></AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              గమనిక: ✅ గుర్తు ఉన్న రెండు ఇంజన్లు మాత్రమే ఎలాంటి సెటప్ లేకుండా ప్రతి వినియోగదారుకూ వెంటనే
              పనిచేస్తాయి. PaddleOCR మీరు సొంతంగా సర్వర్ సెటప్ చేస్తేనే పనిచేస్తుంది. మిగతావి ప్రస్తుతానికి
              సూచన కోసం మాత్రమే.
            </Typography>
          </Box>
        </Stack>
      )}
    </div>
  );
}