"use client";

/* ═══════════════════════════════════════════════════════════════
   PDF ప్రశ్నోత్తరి — సొంత logic తో private RAG (బయటి AI మోడల్ లేదు)

   పాఠకుడు తెలుగు PDF అప్‌లోడ్ చేస్తాడు → తెరపై కనిపించేవి:
     1. నియమాల తనిఖీ  (తెలుగు %, నాణ్యత %, టైప్ పేజీలు)
     1b. PDF లో ఏమి ఉంది (చిత్రాలు, ఖాళీ పేజీలు, header/footer, పేజీ సంఖ్యలు — ఏమి వదిలేశాం)
     2. ముక్కలు       (పేజీ పటం + ప్రతి ముక్క పూర్తి పాఠ్యం, overlap రంగుతో)
     3. Vector & DB   (పద్ధతి, కొలతలు, Neon pgvector)
     4. ప్రశ్న → వెతికిన ముక్కల scores → PDF లోని అసలు వాక్యాలే జవాబు

   Python (api/main.py):
     POST /api/main?endpoint=pdf-upload   PDF bytes (header X-Filename)
     POST /api/main?endpoint=pdf-ask      { doc_id, question }
     POST /api/main?endpoint=pdf-delete   { doc_id }
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const MAX_BYTES = 4 * 1024 * 1024; // main.py PDF_MAX_BYTES తో సమానం
const SESSION_KEY = "ratnalabala-pdf-rag";
const CHUNKS_SHOWN = 8;

/* ---------- main.py జవాబుల రూపం ---------- */
type Checks = {
  total_pages: number;
  text_pages: number;
  image_pages: number[];
  telugu_percent: number;
  min_telugu_percent: number;
  quality_percent: number;
  min_quality_percent: number;
  fixed_symbols: number;
  blank_pages: number[];
  scan_pages: number[];
  characters: number;
};
type ContentReport = {
  pictures: number;
  picture_pages: number[];
  background_pages: number[];
  header_lines: number;
  header_examples: string[];
  page_number_lines: number;
  symbol_lines: number;
  attachments: number;
  form_fields: number;
};
type PageKind = "text" | "blank" | "image" | "scan_ocr" | "background";
type PageMapItem = { page: number; kind: PageKind; chars: number; images: number; chunks: number[] };
type Chunking = { target_chars: number; overlap_chars: number; rule: string };
type VectorInfo = { method: string; dimensions: number; store: string; similarity: string; avg_nonzero: number };
type ChunkInfo = {
  index: number;
  page: number;
  chars: number;
  sentences: number;
  overlap_chars: number;
  text: string;
  keywords: string[];
  nonzero: number;
};
type Doc = {
  doc_id: string;
  filename: string;
  keep_hours: number;
  checks: Checks;
  content: ContentReport;
  page_map: PageMapItem[];
  chunking: Chunking;
  vector: VectorInfo;
  chunks: ChunkInfo[];
  preview: string;
  warnings: string[];
  took_ms: number;
};
type Part = { t: string; m: boolean };
type AnswerLine = { page: number; score: number; parts: Part[] };
type Retrieved = { page: number; index: number; score: number; used: boolean; preview: string };
type AskResult = {
  found: boolean;
  message: string | null;
  answer: AnswerLine[];
  retrieved: Retrieved[];
  threshold: number;
  query_terms: string[];
  took_ms: number;
};
type Turn = { question: string; pending?: boolean; error?: string; result?: AskResult };

/* అప్‌లోడ్ ఒకే request — అది నడుస్తుండగా దశలు క్రమంగా చూపిస్తాం */
const UPLOAD_STEPS = [
  "1/4 · PDF నుండి అక్షరాలు తీస్తున్నాం…",
  "2/4 · తెలుగు, నాణ్యత నియమాలు తనిఖీ చేస్తున్నాం…",
  "3/4 · ముక్కలుగా విడదీసి vectors తయారుచేస్తున్నాం…",
  "4/4 · డేటాబేస్‌లో భద్రపరుస్తున్నాం…",
];

/* నియమం పేరు — తిరస్కరణ సందేశం పైన శీర్షికగా */
const RULE_TITLE: Record<string, string> = {
  not_pdf: "PDF కాదు",
  password: "పాస్‌వర్డ్ ఉన్న PDF",
  scanned: "Scan / ఫోటో PDF",
  image_pages: "చిత్రాల పేజీలు ఎక్కువ",
  legacy_font: "పాత తెలుగు ఫాంట్",
  not_telugu: "తెలుగు PDF కాదు",
  low_quality: "అక్షరాల నాణ్యత తక్కువ",
  no_text: "పాఠ్యం దొరకలేదు",
  scan_ocr: "Scan + OCR PDF",
  unsafe_content: "JavaScript / ఆటోమేటిక్ చర్యలు ఉన్న PDF",
  portfolio: "PDF Portfolio (చాలా ఫైళ్ళ సంచి)",
};

/* పేజీ రకం → పేరు, రంగు (పేజీ పటంలో) */
const PAGE_KIND: Record<PageKind, { label: string; color: string; used: boolean }> = {
  text: { label: "టైప్ పాఠ్యం", color: "var(--secondary)", used: true },
  background: { label: "చిత్రం పైన టైప్ పాఠ్యం", color: "var(--secondary)", used: true },
  blank: { label: "ఖాళీ పేజీ", color: "var(--muted-text)", used: false },
  image: { label: "చిత్రం మాత్రమే", color: "var(--error)", used: false },
  scan_ocr: { label: "Scan + OCR", color: "var(--error)", used: false },
};

const pageList = (pages: number[]) => (pages.length > 12 ? `${pages.slice(0, 12).join(", ")} …` : pages.join(", "));

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* sessionStorage: refresh చేసినా ఉంటుంది, tab మూస్తే పోతుంది */
function loadDoc(): Doc | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const doc = raw ? (JSON.parse(raw) as Doc) : null;
    return doc?.checks && doc.content && Array.isArray(doc.page_map) && Array.isArray(doc.chunks) ? doc : null;
  } catch {
    return null;
  }
}
function saveDoc(doc: Doc | null) {
  try {
    if (doc) sessionStorage.setItem(SESSION_KEY, JSON.stringify(doc));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage లేకపోయినా ఈ పేజీలో పని చేస్తుంది */
  }
}

/* ═══════════════════════ చిన్న భాగాలు ═══════════════════════ */

const card = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: "var(--radius)",
  border: "1px solid var(--border-strong)",
  bgcolor: "var(--surface-elevated)",
} as const;

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.15rem", mb: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "inline-grid",
          placeItems: "center",
          fontSize: "0.95rem",
          bgcolor: "var(--secondary)",
          color: "var(--background)",
          flexShrink: 0,
        }}
      >
        {n}
      </Box>
      {children}
    </Typography>
  );
}

/* స్కోర్ పట్టీ — సంఖ్యతో పాటు; హద్దు గీతతో */
function ScoreBar({ score, threshold, used }: { score: number; threshold?: number; used?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Box sx={{ position: "relative", flex: 1, height: 12, borderRadius: 6, bgcolor: "var(--surface)", border: "1px solid var(--border-strong)", overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: used === false ? "var(--muted-text)" : "var(--secondary)" }} />
        {threshold !== undefined && (
          <Box aria-hidden sx={{ position: "absolute", top: 0, bottom: 0, left: `${Math.round(threshold * 100)}%`, width: 2, bgcolor: "var(--error)" }} />
        )}
      </Box>
      <Typography component="span" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: "0.95rem", minWidth: 52, textAlign: "right" }}>
        {score.toFixed(3)}
      </Typography>
    </Box>
  );
}

function CheckRow({ ok, label, value, rule }: { ok: boolean; label: string; value: string; rule: string }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        alignItems: "center",
        gap: 1,
        py: 1,
        borderBottom: "1px solid var(--border-strong)",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <CheckCircleRoundedIcon sx={{ color: ok ? "var(--secondary)" : "var(--error)" }} aria-label={ok ? "పాస్" : "ఫెయిల్"} />
      <Box>
        <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "var(--muted-text)" }}>{rule}</Typography>
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.9, borderBottom: "1px solid var(--border-strong)", "&:last-of-type": { borderBottom: 0 } }}>
      <Typography sx={{ color: "var(--muted-text)" }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, textAlign: "right", overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>
  );
}

function Highlighted({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.m ? (
          <Box
            key={i}
            component="mark"
            sx={{ bgcolor: "color-mix(in srgb, var(--secondary) 22%, transparent)", color: "inherit", fontWeight: 800, px: 0.25, borderRadius: "4px" }}
          >
            {p.t}
          </Box>
        ) : (
          <span key={i}>{p.t}</span>
        )
      )}
    </>
  );
}

/* ═══════════════════════ పేజీ ═══════════════════════ */

export default function PdfQA() {
  const fileRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);
  const [uploadError, setUploadError] = useState<{ title?: string; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [allChunks, setAllChunks] = useState(false);
  const [pageFilter, setPageFilter] = useState<number | null>(null);

  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const asking = turns.some((t) => t.pending);

  useEffect(() => setDoc(loadDoc()), []);

  useEffect(() => {
    if (!uploading) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, UPLOAD_STEPS.length - 1)), 1500);
    return () => clearInterval(id);
  }, [uploading]);

  useEffect(() => {
    if (turns.length) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  /* PDF లోని ముఖ్య పదాలతో ఉదాహరణ ప్రశ్నలు — పదాల ఆధారంగా వెతుకుతుంది కాబట్టి ఇవే బాగా పని చేస్తాయి */
  const examples = useMemo(() => {
    if (!doc) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of doc.chunks) {
      const w = c.keywords[0];
      if (w && !seen.has(w)) {
        seen.add(w);
        out.push(`${w} గురించి ఏమి చెప్పారు?`);
      }
      if (out.length === 3) break;
    }
    return out;
  }, [doc]);

  /* ---------- అప్‌లోడ్ ---------- */
  const upload = async (file: File | undefined) => {
    if (!file || uploading) return;
    setUploadError(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setUploadError({ title: RULE_TITLE.not_pdf, text: "ఇది PDF ఫైల్ కాదు. .pdf ఫైల్ ఎంచుకోండి." });
    if (file.size > MAX_BYTES) return setUploadError({ title: "ఫైల్ పెద్దది", text: "PDF గరిష్ఠం 4 MB. చిన్న PDF ఎంచుకోండి." });

    setUploading(true);
    try {
      const res = await fetch("/api/main?endpoint=pdf-upload", {
        method: "POST",
        headers: { "Content-Type": "application/pdf", "X-Filename": encodeURIComponent(file.name) },
        body: file,
      });
      const data = await readJson<Doc & { success: boolean; error?: string; rule?: string }>(res);
      if (!res.ok || !data?.success) {
        setUploadError({
          title: data?.rule ? RULE_TITLE[data.rule] : undefined,
          text:
            data?.error ||
            (res.status === 413 ? "PDF చాలా పెద్దది (గరిష్ఠం 4 MB)." : "PDF సిద్ధం చేయలేకపోయాం. మళ్ళీ ప్రయత్నించండి."),
        });
        return;
      }
      setDoc(data);
      saveDoc(data);
      setTurns([]);
      setAllChunks(false);
      setPageFilter(null);
    } catch {
      setUploadError({ text: "ఇంటర్నెట్ సమస్య. మళ్ళీ ప్రయత్నించండి." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ---------- ప్రశ్న ---------- */
  const ask = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || !doc || asking) return;
    setQuestion("");
    setTurns((t) => [...t, { question: text, pending: true }]);

    const finish = (patch: Partial<Turn>) =>
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, ...patch, pending: false } : turn)));

    try {
      const res = await fetch("/api/main?endpoint=pdf-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: doc.doc_id, question: text }),
      });
      const data = await readJson<AskResult & { success: boolean; error?: string }>(res);
      if (res.status === 404) {
        setDoc(null); // 24 గంటల గడువు ముగిసింది / తొలగించబడింది
        saveDoc(null);
      }
      if (!res.ok || !data?.success) throw new Error(data?.error || "జవాబు రాలేదు. మళ్ళీ ప్రయత్నించండి.");
      finish({ result: data });
    } catch (e) {
      finish({ error: e instanceof Error ? e.message : "సమస్య ఏర్పడింది." });
      setQuestion(text);
    }
  };

  /* ---------- తొలగింపు ---------- */
  const removeDoc = async () => {
    if (!doc) return;
    const id = doc.doc_id;
    setDoc(null);
    saveDoc(null);
    setTurns([]);
    try {
      await fetch("/api/main?endpoint=pdf-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: id }),
      });
    } catch {
      /* 24 గంటల్లో ఎలాగూ తొలగిపోతుంది */
    }
  };

  const c = doc?.checks;
  const filtered = doc ? (pageFilter === null ? doc.chunks : doc.chunks.filter((ch) => ch.page === pageFilter)) : [];
  const shownChunks = allChunks || pageFilter !== null ? filtered : filtered.slice(0, CHUNKS_SHOWN);

  /* PDF లో ఏమి దొరికింది, ఏమి వదిలేశాం — సాధారణ మాటల్లో */
  const contentLines: { icon: string; text: string }[] = [];
  if (doc) {
    const ct = doc.content;
    if (ct.pictures)
      contentLines.push({ icon: "🖼️", text: `${ct.pictures} చిత్రాలు (పేజీలు ${pageList(ct.picture_pages)}) — చిత్రాలు చదవం, పక్కన ఉన్న పాఠ్యం మాత్రమే తీసుకున్నాం` });
    if (ct.background_pages.length)
      contentLines.push({ icon: "🎨", text: `పేజీ అంత నేపథ్య చిత్రం (పేజీలు ${pageList(ct.background_pages)}) — దాని పైన టైప్ పాఠ్యం ఉంది కాబట్టి అనుమతించాం` });
    if (c?.image_pages.length)
      contentLines.push({ icon: "🚫", text: `చిత్రం / scan పేజీలు వదిలేశాం: ${pageList(c.image_pages)}` });
    if (c?.blank_pages.length) contentLines.push({ icon: "⬜", text: `ఖాళీ పేజీలు వదిలేశాం: ${pageList(c.blank_pages)}` });
    if (ct.header_lines)
      contentLines.push({
        icon: "✂️",
        text: `ప్రతి పేజీ పైన / కింద వచ్చే వరుసలు ${ct.header_lines} తీసేశాం${ct.header_examples.length ? ` (ఉదా: "${ct.header_examples[0]}")` : ""}`,
      });
    if (ct.page_number_lines) contentLines.push({ icon: "🔢", text: `పేజీ సంఖ్యల వరుసలు ${ct.page_number_lines} తీసేశాం` });
    if (ct.symbol_lines) contentLines.push({ icon: "✳️", text: `గుర్తులు మాత్రమే ఉన్న వరుసలు ${ct.symbol_lines} తీసేశాం (* * *, ❖ లాంటివి)` });
    if (c?.fixed_symbols) contentLines.push({ icon: "🔧", text: `ఒత్తుల దగ్గర చెత్త గుర్తులు ${c.fixed_symbols} సరిచేశాం ("బ్రాD హ్మణ" → "బ్రాహ్మణ")` });
    if (ct.attachments) contentLines.push({ icon: "📎", text: `జతపరిచిన ఫైళ్ళు ${ct.attachments} — తెరవలేదు, చదవలేదు` });
    if (ct.form_fields) contentLines.push({ icon: "📝", text: "Form ఉంది — form లో నింపిన విలువలు చదవం" });
    if (!contentLines.length) contentLines.push({ icon: "✅", text: "అనవసర భాగాలు ఏవీ లేవు — శుభ్రమైన టైప్ PDF" });
  }

  return (
    <Box sx={{ maxWidth: 860, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 }, color: "var(--foreground)", fontSize: "1.05rem" }}>
      <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.7rem", sm: "2.1rem" }, lineHeight: 1.4 }}>
        PDF ప్రశ్నోత్తరి
      </Typography>
      <Typography sx={{ mt: 1, mb: 3, lineHeight: 1.8, color: "var(--muted-text)", maxWidth: "64ch" }}>
        మీ <strong>తెలుగు PDF</strong> అప్‌లోడ్ చేసి ప్రశ్న అడగండి. జవాబు <strong>మీ PDF లోని అసలు వాక్యాలే</strong>, పేజీ
        సంఖ్యతో. బయటి AI కి ఏమీ పంపం — మన సొంత లెక్కలతోనే వెతుకుతాం.
      </Typography>

      {/* ═══════════ అప్‌లోడ్ ═══════════ */}
      {!doc && (
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void upload(e.dataTransfer.files?.[0]);
          }}
          sx={{
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            borderRadius: "var(--radius)",
            border: `2px dashed ${dragOver ? "var(--secondary)" : "var(--border-strong)"}`,
            bgcolor: dragOver ? "color-mix(in srgb, var(--secondary) 8%, transparent)" : "var(--surface)",
          }}
        >
          <PictureAsPdfRoundedIcon sx={{ fontSize: 56, color: "var(--primary)" }} aria-hidden />

          {uploading ? (
            <Box role="status" aria-live="polite" sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{UPLOAD_STEPS[step]}</Typography>
              <LinearProgress sx={{ height: 8, borderRadius: 4, maxWidth: 420, mx: "auto" }} />
            </Box>
          ) : (
            <>
              <Box sx={{ mt: 1.5 }}>
                <Button
                  onClick={() => fileRef.current?.click()}
                  startIcon={<PictureAsPdfRoundedIcon />}
                  sx={{
                    minHeight: 56,
                    px: 3,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "var(--radius-sm)",
                    bgcolor: "var(--secondary)",
                    color: "var(--background)",
                    "&:hover": { bgcolor: "var(--secondary)", filter: "brightness(1.08)" },
                  }}
                >
                  తెలుగు PDF ఎంచుకోండి
                </Button>
              </Box>
              <Typography sx={{ mt: 1, fontSize: "0.95rem", color: "var(--muted-text)" }}>లేదా PDF ను ఇక్కడికి లాగి వదలండి</Typography>

              <Box component="ul" sx={{ textAlign: "left", maxWidth: 460, mx: "auto", mt: 2, mb: 0, pl: 3, lineHeight: 1.9, fontSize: "0.98rem" }}>
                <li>తెలుగు PDF మాత్రమే (కనీసం 40% తెలుగు అక్షరాలు)</li>
                <li>టైప్ చేసిన PDF మాత్రమే — scan / ఫోటో PDF లు కాదు</li>
                <li>Unicode తెలుగు ఫాంట్ (Word / Google Docs నుండి చేసినవి)</li>
                <li>గరిష్ఠం 4 MB · మొదటి 120 పేజీలు చదువుతాం</li>
              </Box>
            </>
          )}

          <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => void upload(e.target.files?.[0])} />
        </Box>
      )}

      {uploadError && (
        <Alert severity="error" onClose={() => setUploadError(null)} sx={{ mt: 2, fontSize: "1rem", lineHeight: 1.8 }}>
          {uploadError.title && <AlertTitle sx={{ fontWeight: 800 }}>❌ {uploadError.title}</AlertTitle>}
          {uploadError.text}
        </Alert>
      )}

      {/* ═══════════ PDF సిద్ధం ═══════════ */}
      {doc && c && (
        <Stack spacing={2.5}>
          {/* పత్రం కార్డు */}
          <Box sx={{ ...card, border: "1.5px solid var(--secondary)", bgcolor: "color-mix(in srgb, var(--secondary) 6%, transparent)" }}>
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <MenuBookRoundedIcon sx={{ fontSize: 32, color: "var(--secondary)", mt: 0.3 }} aria-hidden />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{doc.filename}</Typography>
                <Typography sx={{ fontSize: "0.95rem", color: "var(--muted-text)", lineHeight: 1.7 }}>
                  ✅ సిద్ధం · {c.text_pages} పేజీలు · {doc.chunks.length} ముక్కలు · {(doc.took_ms / 1000).toFixed(1)} సెకన్లు ·{" "}
                  {doc.keep_hours} గంటల తర్వాత ఆటోమేటిక్‌గా తొలగింపు
                </Typography>
              </Box>
              <Button
                onClick={removeDoc}
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{ textTransform: "none", color: "var(--error)", flexShrink: 0, fontWeight: 700, minHeight: 44 }}
              >
                వేరే PDF
              </Button>
            </Stack>
            {doc.warnings.map((w) => (
              <Alert key={w} severity="warning" sx={{ mt: 1.5, fontSize: "0.95rem" }}>
                {w}
              </Alert>
            ))}
          </Box>

          {/* 1. నియమాల తనిఖీ */}
          <Box sx={card} component="section" aria-labelledby="rag-checks">
            <SectionTitle n="1">
              <span id="rag-checks">నియమాల తనిఖీ</span>
            </SectionTitle>
            <CheckRow
              ok={c.telugu_percent >= c.min_telugu_percent}
              label="తెలుగు అక్షరాలు"
              value={`${c.telugu_percent}%`}
              rule={`కనీసం ${c.min_telugu_percent}% కావాలి`}
            />
            <CheckRow
              ok={c.quality_percent >= c.min_quality_percent}
              label="అక్షరాల నాణ్యత"
              value={`${c.quality_percent}%`}
              rule={`కనీసం ${c.min_quality_percent}% · సరిచేసిన గుర్తులు ${c.fixed_symbols}`}
            />
            <CheckRow
              ok
              label="టైప్ చేసిన పేజీలు"
              value={`${c.text_pages} / ${doc.page_map.length}`}
              rule={`చిత్రం / scan పేజీలు ${c.image_pages.length} (గరిష్ఠం 10%) · ఖాళీ ${c.blank_pages.length}`}
            />
            <CheckRow ok label="JavaScript / ఆటోమేటిక్ చర్యలు" value="లేవు" rule="ఉంటే PDF తిరస్కరిస్తాం" />
            <CheckRow ok label="మొత్తం అక్షరాలు" value={c.characters.toLocaleString("en-IN")} rule="శుభ్రం చేసిన తర్వాత" />

            <Typography component="h3" sx={{ fontWeight: 800, mt: 2.5, mb: 1 }}>
              PDF లో ఏమేమి ఉన్నాయి, ఏమి వదిలేశాం
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ listStyle: "none", p: 0, m: 0 }}>
              {contentLines.map((l) => (
                <Box component="li" key={l.text} sx={{ display: "flex", gap: 1, lineHeight: 1.8, fontSize: "0.98rem" }}>
                  <span aria-hidden>{l.icon}</span>
                  <span>{l.text}</span>
                </Box>
              ))}
            </Stack>

            {doc.preview && (
              <Box component="details" sx={{ mt: 1.5 }}>
                <Box component="summary" sx={{ cursor: "pointer", color: "var(--accent-text)", fontWeight: 700, py: 0.75 }}>
                  అక్షరాలు సరిగ్గా వచ్చాయో చూడండి (మొదటి పేజీ)
                </Box>
                <Typography sx={{ mt: 1, p: 1.5, borderRadius: "var(--radius-sm)", bgcolor: "var(--surface)", whiteSpace: "pre-wrap", lineHeight: 1.9 }}>
                  {doc.preview}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 2. ముక్కలు — ఎలా విడదీశామో */}
          <Box sx={card} component="section" aria-labelledby="rag-chunks">
            <SectionTitle n="2">
              <span id="rag-chunks">ముక్కలు (Chunking) — {doc.chunks.length}</span>
            </SectionTitle>

            {/* ఎలా విడదీశాం: 3 నియమాలు */}
            <Box component="ol" sx={{ m: 0, mb: 2, pl: 3, lineHeight: 1.9, fontSize: "0.98rem" }}>
              <li>
                ప్రతి పేజీని <strong>వాక్యాల దగ్గరే</strong> కోశాం — వాక్యం మధ్యలో తెగదు.
              </li>
              <li>
                ఒక్కో ముక్క గరిష్ఠం <strong>~{doc.chunking.target_chars} అక్షరాలు</strong>.
              </li>
              <li>
                ముందు ముక్క చివరి వాక్యం (~{doc.chunking.overlap_chars} అక్షరాలు) తర్వాతి ముక్క మొదట్లో మళ్ళీ వస్తుంది —{" "}
                <Box component="span" sx={{ bgcolor: "color-mix(in srgb, var(--primary) 16%, transparent)", px: 0.5, borderRadius: "4px" }}>
                  ఇలా రంగుతో
                </Box>{" "}
                చూపించాం (overlap). విషయం రెండు ముక్కల మధ్య తెగిపోదు.
              </li>
              <li>ముక్క పేజీ దాటదు — జవాబులో పేజీ సంఖ్య ఖచ్చితం.</li>
            </Box>

            {/* పేజీ పటం: ప్రతి పేజీ ఏ రకం, ఎన్ని ముక్కలు */}
            <Typography component="h3" sx={{ fontWeight: 800, mb: 1 }}>
              పేజీ పటం — పేజీ నొక్కితే దాని ముక్కలు
            </Typography>
            <Box
              role="group"
              aria-label="పేజీలు"
              sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 1, mb: 1.5 }}
            >
              {doc.page_map.map((p) => {
                const k = PAGE_KIND[p.kind];
                const active = pageFilter === p.page;
                return (
                  <Box
                    key={p.page}
                    component="button"
                    type="button"
                    disabled={!k.used}
                    onClick={() => setPageFilter(active ? null : p.page)}
                    aria-pressed={active}
                    title={`పేజీ ${p.page}: ${k.label}${p.chunks.length ? ` · ${p.chunks.length} ముక్కలు` : ""}`}
                    sx={{
                      minHeight: 64,
                      p: 0.75,
                      font: "inherit",
                      cursor: k.used ? "pointer" : "not-allowed",
                      color: "var(--foreground)",
                      borderRadius: "var(--radius-sm)",
                      border: `2px solid ${active ? "var(--foreground)" : k.color}`,
                      bgcolor: k.used ? "color-mix(in srgb, var(--secondary) 10%, var(--surface))" : "var(--surface)",
                      opacity: k.used ? 1 : 0.8,
                      textAlign: "center",
                      lineHeight: 1.35,
                      "&:focus-visible": { outline: "3px solid var(--foreground)", outlineOffset: 2 },
                    }}
                  >
                    <Box sx={{ fontWeight: 800, fontSize: "0.95rem" }}>పే. {p.page}</Box>
                    <Box sx={{ fontSize: "0.8rem" }}>{k.used ? `${p.chunks.length} ముక్క${p.chunks.length === 1 ? "" : "లు"}` : k.label}</Box>
                    {p.images > 0 && <Box sx={{ fontSize: "0.8rem" }} aria-label={`${p.images} చిత్రాలు`}>🖼️ {p.images}</Box>}
                  </Box>
                );
              })}
            </Box>
            <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ fontSize: "0.88rem", color: "var(--muted-text)", mb: 2 }}>
              <span>🟩 వాడిన పేజీలు</span>
              <span>⬜ ఖాళీ</span>
              <span>🟥 చిత్రం / scan (వదిలేశాం)</span>
            </Stack>

            {pageFilter !== null && (
              <Button onClick={() => setPageFilter(null)} sx={{ mb: 1, minHeight: 44, textTransform: "none", fontWeight: 700 }}>
                ← అన్ని పేజీల ముక్కలు చూపించు (ఇప్పుడు పేజీ {pageFilter} మాత్రమే)
              </Button>
            )}

            {/* ముక్కలు — పూర్తి పాఠ్యం, overlap రంగుతో */}
            <Stack spacing={1.25}>
              {shownChunks.map((ch) => {
                const fill = Math.min(100, Math.round((100 * ch.chars) / doc.chunking.target_chars));
                return (
                  <Box key={ch.index} sx={{ p: 1.5, borderRadius: "var(--radius-sm)", bgcolor: "var(--surface)", border: "1px solid var(--border-strong)" }}>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 0.75, fontSize: "0.92rem", fontWeight: 700 }}>
                      <span>ముక్క #{ch.index + 1}</span>
                      <span>· పేజీ {ch.page}</span>
                      <span>· {ch.sentences} వాక్యాలు</span>
                      <span>· {ch.chars} అక్షరాలు</span>
                      {ch.overlap_chars > 0 && <span>· overlap {ch.overlap_chars}</span>}
                      <span>· vector లో {ch.nonzero} విలువలు</span>
                    </Stack>
                    {/* ముక్క పరిమాణం vs 700 హద్దు */}
                    <Box
                      aria-hidden
                      sx={{ height: 6, borderRadius: 3, bgcolor: "var(--surface-elevated)", border: "1px solid var(--border-strong)", mb: 1, overflow: "hidden" }}
                    >
                      <Box sx={{ width: `${fill}%`, height: "100%", bgcolor: "var(--secondary)" }} />
                    </Box>

                    <Box component="details">
                      <Box component="summary" sx={{ cursor: "pointer", lineHeight: 1.8, py: 0.25 }}>
                        <Box component="span" sx={{ fontSize: "0.98rem" }}>
                          {ch.text.slice(ch.overlap_chars, ch.overlap_chars + 110).replace(/\n/g, " ")}…
                        </Box>{" "}
                        <Box component="span" sx={{ color: "var(--accent-text)", fontWeight: 700, fontSize: "0.9rem" }}>
                          (పూర్తిగా చూడండి)
                        </Box>
                      </Box>
                      <Typography component="div" sx={{ mt: 1, whiteSpace: "pre-wrap", lineHeight: 1.9, fontSize: "1rem" }}>
                        {ch.overlap_chars > 0 && (
                          <Box
                            component="span"
                            title="ముందు ముక్క నుండి (overlap)"
                            sx={{ bgcolor: "color-mix(in srgb, var(--primary) 16%, transparent)", borderRadius: "4px" }}
                          >
                            <Box component="span" sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                              ↩ overlap:{" "}
                            </Box>
                            {ch.text.slice(0, ch.overlap_chars)}
                          </Box>
                        )}
                        {ch.text.slice(ch.overlap_chars)}
                      </Typography>
                    </Box>

                    {ch.keywords.length > 0 && (
                      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }} aria-label="ముఖ్య పదాలు">
                        {ch.keywords.map((k) => (
                          <Box
                            key={k}
                            component="span"
                            sx={{ px: 1, py: 0.25, borderRadius: "999px", fontSize: "0.9rem", border: "1px solid var(--secondary)", color: "var(--accent-text)" }}
                          >
                            {k}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
            {pageFilter === null && doc.chunks.length > CHUNKS_SHOWN && (
              <Button onClick={() => setAllChunks((v) => !v)} sx={{ mt: 1.5, minHeight: 44, textTransform: "none", fontWeight: 700 }}>
                {allChunks ? "కొన్నే చూపించు" : `అన్ని ${doc.chunks.length} ముక్కలూ చూపించు`}
              </Button>
            )}
          </Box>

          {/* 3. Vector & DB */}
          <Box sx={card} component="section" aria-labelledby="rag-vector">
            <SectionTitle n="3">
              <span id="rag-vector">Vector & డేటాబేస్</span>
            </SectionTitle>
            <InfoRow label="Embedding పద్ధతి" value={doc.vector.method} />
            <InfoRow label="Vector కొలతలు" value={doc.vector.dimensions.toLocaleString("en-IN")} />
            <InfoRow label="ఒక్కో ముక్కకు సగటు విలువలు" value={`${doc.vector.avg_nonzero} (sparse)`} />
            <InfoRow label="Vector DB" value={doc.vector.store} />
            <InfoRow label="పోలిక" value={`${doc.vector.similarity} (0 = సంబంధం లేదు, 1 = ఒకటే)`} />
            <InfoRow label="బయటి AI మోడల్" value="లేదు — private" />
          </Box>

          {/* 4. ప్రశ్నోత్తరాలు */}
          <Box sx={card} component="section" aria-labelledby="rag-ask">
            <SectionTitle n="4">
              <span id="rag-ask">ప్రశ్న అడగండి</span>
            </SectionTitle>

            {turns.length === 0 && examples.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>మీ PDF లోని పదాలతో ఇలా అడగవచ్చు:</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {examples.map((ex) => (
                    <Button key={ex} onClick={() => void ask(ex)} variant="outlined" sx={{ minHeight: 44, textTransform: "none", borderRadius: "999px", fontSize: "0.98rem" }}>
                      {ex}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            <Stack spacing={2.5} aria-live="polite">
              {turns.map((t, i) => (
                <Box key={i}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>❓ {t.question}</Typography>

                  {t.pending && (
                    <Stack direction="row" alignItems="center" spacing={1} role="status">
                      <CircularProgress size={20} />
                      <Typography sx={{ color: "var(--muted-text)" }}>మీ PDF లో వెతుకుతున్నాం…</Typography>
                    </Stack>
                  )}

                  {t.error && <Alert severity="error" sx={{ fontSize: "0.98rem" }}>{t.error}</Alert>}

                  {t.result && (
                    <Box sx={{ p: 2, borderRadius: "var(--radius)", border: "1px solid var(--border-strong)", bgcolor: "var(--surface)" }}>
                      {t.result.found ? (
                        <Stack spacing={1.5}>
                          <Typography sx={{ fontWeight: 700, color: "var(--accent-text)", fontSize: "0.95rem" }}>📖 మీ PDF లో ఇలా ఉంది:</Typography>
                          {t.result.answer.map((a, j) => (
                            <Box key={j} sx={{ pl: 1.5, borderLeft: "4px solid var(--secondary)" }}>
                              <Typography sx={{ lineHeight: 2, fontSize: "1.08rem" }}>
                                <Highlighted parts={a.parts} />
                              </Typography>
                              <Typography sx={{ fontSize: "0.9rem", color: "var(--muted-text)", fontWeight: 700 }}>— పేజీ {a.page}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="info" sx={{ fontSize: "0.98rem", lineHeight: 1.8 }}>
                          {t.result.message}
                        </Alert>
                      )}

                      {/* శోధన వివరాలు: వెతికిన ముక్కలు, scores, హద్దు */}
                      <Box component="details" sx={{ mt: 1.5 }}>
                        <Box component="summary" sx={{ cursor: "pointer", fontWeight: 700, color: "var(--accent-text)", py: 0.75 }}>
                          🔍 శోధన వివరాలు ({t.result.took_ms} ms)
                        </Box>
                        <Typography sx={{ fontSize: "0.95rem", mt: 1, lineHeight: 1.8 }}>
                          <strong>వెతికిన పదాలు:</strong> {t.result.query_terms.join(", ") || "—"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.95rem", mb: 1, lineHeight: 1.8 }}>
                          <strong>హద్దు (threshold):</strong> {t.result.threshold} — దీని పైన score ఉన్న ముక్కలే జవాబుకు వాడతాం (ఎరుపు గీత)
                        </Typography>
                        <Stack spacing={1}>
                          {t.result.retrieved.map((r) => (
                            <Box key={r.index} sx={{ p: 1.25, borderRadius: "var(--radius-sm)", bgcolor: "var(--surface-elevated)", opacity: r.used ? 1 : 0.75 }}>
                              <Stack direction="row" justifyContent="space-between" sx={{ fontSize: "0.92rem", fontWeight: 700, mb: 0.5 }}>
                                <span>
                                  ముక్క #{r.index + 1} · పేజీ {r.page}
                                </span>
                                <span>{r.used ? "✅ వాడాం" : "— వదిలేశాం"}</span>
                              </Stack>
                              <ScoreBar score={r.score} threshold={t.result!.threshold} used={r.used} />
                              <Typography sx={{ fontSize: "0.92rem", mt: 0.5, lineHeight: 1.7, color: "var(--muted-text)" }}>{r.preview}…</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
              <div ref={bottomRef} />
            </Stack>

            <Stack
              component="form"
              direction="row"
              spacing={1}
              alignItems="stretch"
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                void ask();
              }}
              sx={{ mt: 2.5 }}
            >
              <TextField
                inputRef={questionRef}
                fullWidth
                label="మీ ప్రశ్న"
                placeholder="ఉదా: కోపం గురించి ఏమి చెప్పారు?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                inputProps={{ maxLength: 1000 }}
                autoComplete="off"
              />
              <IconButton
                type="submit"
                disabled={asking || !question.trim()}
                aria-label="ప్రశ్న పంపండి"
                sx={{
                  width: 56,
                  flexShrink: 0,
                  borderRadius: "var(--radius-sm)",
                  bgcolor: "var(--secondary)",
                  color: "var(--background)",
                  "&:hover": { bgcolor: "var(--secondary)", filter: "brightness(1.08)" },
                  "&.Mui-disabled": { bgcolor: "var(--surface)", color: "var(--muted-text)" },
                }}
              >
                {asking ? <CircularProgress size={22} sx={{ color: "inherit" }} /> : <SendRoundedIcon />}
              </IconButton>
            </Stack>
            <Typography sx={{ mt: 1, fontSize: "0.9rem", color: "var(--muted-text)", lineHeight: 1.7 }}>
              💡 ఇది పదాల పోలికతో వెతుకుతుంది — PDF లో ఉన్న పదాలతో అడిగితే మంచి జవాబు వస్తుంది.
            </Typography>
          </Box>
        </Stack>
      )}

      <Typography sx={{ mt: 4, fontSize: "0.92rem", color: "var(--muted-text)", lineHeight: 1.8 }}>
        🔒 మీ PDF ఫైల్ సేవ్ కాదు, బయటి AI కి వెళ్ళదు. తీసిన పాఠ్యం, vectors మాత్రమే {doc?.keep_hours ?? 24} గంటలు ఉంచి
        ఆటోమేటిక్‌గా తొలగిస్తాం. &ldquo;వేరే PDF&rdquo; నొక్కితే వెంటనే తొలగిపోతుంది.
      </Typography>
    </Box>
  );
}