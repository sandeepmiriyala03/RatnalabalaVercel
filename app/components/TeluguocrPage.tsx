"use client";

import React, { useState, useRef, useCallback } from "react";
import Tesseract from "tesseract.js";
import Image from "next/image";
import html2canvas from "html2canvas";

import { FileUploadComponent } from "./FileUploadComponent";
import FileUploadManager from "./FileUploadManager";
import { ActionsComponent } from "./ActionsComponent";
import ErrorMessageComponent from "./ErrorMessageComponent";
import { TeluguOcrExplanation } from "./TeluguOcrExplanation";

/* ================= CONFIG ================= */

export type LangOption = {
  value: string;
  label: string;
  group?:  "indic"  | "detection";
};

const TELUGU_LANG: LangOption = {
  value: "tel",
  label: "Telugu",
  group: "indic",
};

const MAX_OCR_TIME_MS = 30000;
const MIN_IMAGE_WIDTH = 100;

const TELUGU_FONTS = [
  { label: "Noto Serif Telugu", value: "'Noto Serif Telugu', serif" },
  { label: "Noto Sans Telugu", value: "'Noto Sans Telugu', sans-serif" },
  { label: "Pothana2000", value: "'Pothana2000', serif" },
  { label: "Default Serif", value: "serif" },
];

/* ================= HELPERS ================= */

function resizeImageFile(
  file: File,
  minWidth: number,
  maxWidth: number
): Promise<Blob | File> {
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

      if (width === img.width) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context error"));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
        file.type || "image/png",
        0.8
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/* ================= POSTER ================= */

function posterHTML(
  text: string,
  fontFamily: string,
  fontSize: number,
  lineSpacing: number
) {
  const paras = text
    .split("\n")
    .filter(Boolean)
    .map((p) => `<p style="margin-bottom:12px;">${p}</p>`)
    .join("");

  return `
  <div id="poster" style="
    max-width:820px;
    padding:40px 32px;
    background:#fffdf7;
    border:6px double #2f855a;
    border-radius:14px;
    font-family:${fontFamily};
    font-size:${fontSize}px;
    line-height:${lineSpacing};
    color:#102a43;
  ">
    ${paras}
    <hr style="margin:28px 0;border:1px solid #9ae6b4;" />
    <p style="text-align:center;font-size:14px;color:#555;">
      లిపిమాల  ద్వారా సృష్టించబడింది •  తెలుగు OCR
    </p>
  </div>
  `;
}

/* ================= PAGE ================= */

type ActiveTab = "image" | "document";

export default function TeluguOcrPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [progress, setProgress] = useState("");

  const [fontFamily, setFontFamily] = useState(TELUGU_FONTS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [lineSpacing, setLineSpacing] = useState(1.6);

  const cancelFlag = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ========== OCR ========== */
  const onAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setProgress("చిత్రాన్ని ప్రాసెస్ చేస్తోంది...");
    cancelFlag.current = false;
    startTimer();

    try {
      const processed = await resizeImageFile(file, MIN_IMAGE_WIDTH, 1200);
      const url = URL.createObjectURL(processed as Blob);
      setFileUrl(url);

      const { data } = await Tesseract.recognize(url, TELUGU_LANG.value, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(`OCR ${Math.round((m.progress ?? 0) * 100)}%`);
          }
        },
      });

      if (!cancelFlag.current) {
        const cleaned = (data.text || "").trim();
        cleaned ? setOcrText(cleaned) : setImageError("పాఠ్యం గుర్తించబడలేదు.");
      }

      URL.revokeObjectURL(url);
    } catch {
      if (!cancelFlag.current) setImageError("OCR విఫలమైంది.");
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

  /* ================= UI ================= */

  return (
    <div style={{ padding: 20, maxWidth: 760, margin: "auto" }}>
      <h1 style={{ textAlign: "center" }}>యథాక్షర పఠనం</h1>

      <TeluguOcrExplanation />

      <div style={{ display: "inline-flex", marginBottom: 20 }}>
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
        <>
          <FileUploadComponent
            file={file}
            onFileChange={onFileChange}
            loading={loading}
          />

          {progress && <p>{progress}</p>}
          {imageError && <ErrorMessageComponent message={imageError} />}

          {fileUrl && (
            <Image
              src={fileUrl}
              alt="Preview"
              width={600}
              height={400}
              style={{ width: "100%", borderRadius: 12 }}
            />
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
              {/* FONT CONTROLS */}
              <div style={{ marginTop: 16 }}>
                <label>అక్షర శైలి</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  {TELUGU_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <label>అక్షర పరిమాణం: {fontSize}px</label>
                <input
                  type="range"
                  min={16}
                  max={36}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  style={{ width: "100%" }}
                />

                <label>వరుస అంతరం: {lineSpacing.toFixed(1)}</label>
                <input
                  type="range"
                  min={1.3}
                  max={2.4}
                  step={0.1}
                  value={lineSpacing}
                  onChange={(e) => setLineSpacing(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                style={{
                  width: "100%",
                  height: 260,
                  marginTop: 12,
                  fontFamily,
                  fontSize,
                  lineHeight: lineSpacing,
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
