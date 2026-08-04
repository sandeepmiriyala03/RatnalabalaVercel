import fs from "fs/promises";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import pLimit from "p-limit";

/* ================= CONFIG ================= */

const CHUNK_SIZE = 15000;
const CHUNK_OVERLAP = 300;
const MAX_CONCURRENT_CHUNKS = 2;

/* ================= TYPES ================= */

interface ChunkEntities {
  numbers: string[];
  dates: string[];
}

interface ChunkAnalysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
  entities: ChunkEntities;
}

export interface ProcessResult {
  total_chunks: number;
  file_type: string;
  analysis: ChunkAnalysis[];
  final_summary: string;
}

/* ================= HELPERS ================= */

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + CHUNK_SIZE;
    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

function extractKeywords(text: string, max = 10): string[] {
  const words = text.match(/[\u0C00-\u0C7F]+/g) || [];
  const freq: Record<string, number> = {};

  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

function extractSummary(text: string, max = 3): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean)
    .slice(0, max);
}

function extractEntities(text: string): ChunkEntities {
  return {
    numbers: text.match(/\d+/g) || [],
    dates:
      text.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g) || [],
  };
}

/* ================= OCR (images only) ================= */

async function ocrTeluguImage(imagePath: string): Promise<string> {
  const { data } = await Tesseract.recognize(imagePath, "tel");
  return data.text || "";
}

/* ================= MAIN ================= */

export async function processFile(
  filePath: string
): Promise<ProcessResult> {
  const buffer = await fs.readFile(filePath);

  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    throw new Error("ఫైల్ రకం గుర్తించలేకపోయింది");
  }

  const { mime, ext } = detected;
  let text = "";

  /* ===== PDF (SAFE – NO TEST FILE BUG) ===== */
  if (mime === "application/pdf") {
    // ⚠️ VERY IMPORTANT: require INSIDE function
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");

    const data = await pdfParse(buffer);
    text = data?.text?.trim() || "";

    if (!text) {
      throw new Error("PDF లో పాఠ్యం లేదు");
    }
  }

  /* ===== DOCX ===== */
  else if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
  }

  /* ===== IMAGE ===== */
  else if (mime.startsWith("image/")) {
    text = await ocrTeluguImage(filePath);
  }

  else {
    throw new Error(`ఈ ఫైల్ రకం మద్దతు ఇవ్వబడలేదు: ${mime}`);
  }

  if (!text.trim()) {
    throw new Error("తెలుగు పాఠ్యం గుర్తించబడలేదు");
  }

  /* ===== ANALYSIS ===== */
  const chunks = chunkText(text);
  const limit = pLimit(MAX_CONCURRENT_CHUNKS);

  const analysis: ChunkAnalysis[] = await Promise.all(
    chunks.map((chunk, idx) =>
      limit(async () => ({
        chunk_number: idx + 1,
        keywords: extractKeywords(chunk),
        highlights: extractSummary(chunk, 2),
        summary: extractSummary(chunk, 3),
        entities: extractEntities(chunk),
      }))
    )
  );

  const finalSummary = analysis
    .map(a => a.summary.join(" "))
    .join(" ");

  return {
    total_chunks: analysis.length,
    file_type: ext,
    analysis,
    final_summary: finalSummary,
  };
}
