"use client";

/* ═══════════════════════════════════════════════════════════════
   PDF ప్రశ్నోత్తరి — పాఠకుడు తన PDF అప్‌లోడ్ చేసి, దాని గురించి
   ప్రశ్నలు అడుగుతాడు. జవాబు ఆ PDF నుండే, పేజీ సంఖ్యలతో.

   Python (api/main.py):
     POST /api/main?endpoint=pdf-upload   PDF bytes → doc_id
     POST /api/main?endpoint=pdf-ask      { doc_id, question }
     POST /api/main?endpoint=pdf-delete   { doc_id }
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import {
  Alert,
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

const MAX_BYTES = 4 * 1024 * 1024; // must match PDF_MAX_BYTES in main.py
const SESSION_KEY = "ratnalabala-pdf-doc";

type Doc = {
  doc_id: string;
  filename: string;
  pages: number;
  total_pages: number;
  chunks: number;
  telugu_percent: number;
  preview: string;
  keep_hours: number;
  warnings: string[];
};

type Source = { page: number; snippet: string; similarity: number };
type Turn = { question: string; answer?: string; sources?: Source[]; error?: string; pending?: boolean };

/* Upload is one request, so the steps are shown in order while it runs */
const UPLOAD_STEPS = [
  "PDF నుండి అక్షరాలు తీస్తున్నాం…",
  "పాఠ్యాన్ని చిన్న భాగాలుగా విడదీస్తున్నాం…",
  "ప్రతి భాగం అర్థం గుర్తిస్తున్నాం… (పెద్ద PDF కి కొంచెం సమయం పడుతుంది)",
  "దాదాపు పూర్తయింది…",
];

const EXAMPLES = ["ఈ పుస్తకం దేని గురించి?", "ముఖ్యమైన విషయాలు ఏమిటి?", "రచయిత ఎవరు?"];

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* sessionStorage: survives a refresh, cleared when the tab closes */
function loadDoc(): Doc | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Doc) : null;
  } catch {
    return null;
  }
}
function saveDoc(doc: Doc | null) {
  try {
    if (doc) sessionStorage.setItem(SESSION_KEY, JSON.stringify(doc));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage blocked: works for this page only */
  }
}

export default function PdfQA() {
  const fileRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const asking = turns.some((t) => t.pending);

  useEffect(() => setDoc(loadDoc()), []);

  // Move through the step messages while the upload runs
  useEffect(() => {
    if (!uploading) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, UPLOAD_STEPS.length - 1)), 4000);
    return () => clearInterval(id);
  }, [uploading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  /* ---------- upload ---------- */
  const upload = async (file: File | undefined) => {
    if (!file || uploading) return;
    setUploadError("");

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setUploadError("ఇది PDF ఫైల్ కాదు. .pdf ఫైల్ ఎంచుకోండి.");
    if (file.size > MAX_BYTES) return setUploadError("PDF చాలా పెద్దది (గరిష్ఠం 4 MB). చిన్న PDF ఎంచుకోండి.");

    setUploading(true);
    try {
      const res = await fetch("/api/main?endpoint=pdf-upload", {
        method: "POST",
        headers: { "Content-Type": "application/pdf", "X-Filename": encodeURIComponent(file.name) },
        body: file,
      });
      const data = await readJson<Doc & { success: boolean; error?: string }>(res);
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            (res.status === 413 ? "PDF చాలా పెద్దది (గరిష్ఠం 4 MB)." : "PDF సిద్ధం చేయలేకపోయాం. మళ్ళీ ప్రయత్నించండి.")
        );
      }
      setDoc(data);
      saveDoc(data);
      setTurns([]);
      requestAnimationFrame(() => questionRef.current?.focus());
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "సమస్య ఏర్పడింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ---------- ask ---------- */
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
      const data = await readJson<{ success: boolean; answer?: string; sources?: Source[]; error?: string }>(res);
      if (res.status === 404) {
        // Expired after 24h or deleted: ask for a fresh upload
        setDoc(null);
        saveDoc(null);
      }
      if (!res.ok || !data?.success) throw new Error(data?.error || "జవాబు రాలేదు. మళ్ళీ ప్రయత్నించండి.");
      finish({ answer: data.answer, sources: data.sources ?? [] });
    } catch (e) {
      finish({ error: e instanceof Error ? e.message : "సమస్య ఏర్పడింది." });
      setQuestion(text); // keep the question so it can be sent again
    }
  };

  /* ---------- remove ---------- */
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
      /* deleted automatically after 24h anyway */
    }
  };

  /* ═══════════════════════ UI ═══════════════════════ */

  return (
    <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 }, color: "var(--foreground)" }}>
      <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "1.7rem", sm: "2.1rem" }, lineHeight: 1.4 }}>
        PDF ప్రశ్నోత్తరి
      </Typography>
      <Typography sx={{ mt: 1, mb: 3, lineHeight: 1.8, color: "var(--muted-text)", maxWidth: "62ch" }}>
        మీ తెలుగు PDF అప్‌లోడ్ చేయండి, దాని గురించి ఏదైనా అడగండి. జవాబు <strong>మీ PDF నుండే</strong>, పేజీ సంఖ్యలతో వస్తుంది.
      </Typography>

      {/* ---------- 1. Upload ---------- */}
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
                  PDF ఎంచుకోండి
                </Button>
              </Box>
              <Typography sx={{ mt: 1.5, fontSize: "0.95rem", color: "var(--muted-text)", lineHeight: 1.7 }}>
                లేదా PDF ను ఇక్కడికి లాగి వదలండి · గరిష్ఠం 4 MB · అక్షరాలు ఉన్న PDF లు మాత్రమే (scan / ఫోటో PDF లు కాదు)
              </Typography>
            </>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => void upload(e.target.files?.[0])}
          />
        </Box>
      )}

      {uploadError && (
        <Alert severity="error" onClose={() => setUploadError("")} sx={{ mt: 2, fontSize: "0.95rem" }}>
          {uploadError}
        </Alert>
      )}

      {/* ---------- 2. Ready: document card ---------- */}
      {doc && (
        <Box
          sx={{
            p: 2,
            borderRadius: "var(--radius)",
            border: "1.5px solid var(--secondary)",
            bgcolor: "color-mix(in srgb, var(--secondary) 6%, transparent)",
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
            <MenuBookRoundedIcon sx={{ fontSize: 32, color: "var(--secondary)", mt: 0.3 }} aria-hidden />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>{doc.filename}</Typography>
              <Typography sx={{ fontSize: "0.95rem", color: "var(--muted-text)" }}>
                {doc.pages} పేజీలు సిద్ధం · ప్రశ్నలు అడగవచ్చు · {doc.keep_hours} గంటల తర్వాత ఆటోమేటిక్‌గా తొలగిపోతుంది
              </Typography>
            </Box>
            <Button
              onClick={removeDoc}
              startIcon={<DeleteOutlineRoundedIcon />}
              sx={{ textTransform: "none", color: "var(--error)", flexShrink: 0, fontWeight: 700 }}
            >
              వేరే PDF
            </Button>
          </Stack>

          {doc.warnings.map((w) => (
            <Alert key={w} severity="warning" sx={{ mt: 1.5, fontSize: "0.95rem" }}>
              {w}
            </Alert>
          ))}

          {doc.preview && (
            <Box component="details" sx={{ mt: 1.5 }}>
              <Box component="summary" sx={{ cursor: "pointer", fontSize: "0.95rem", color: "var(--accent-text)", py: 0.5 }}>
                అక్షరాలు సరిగ్గా వచ్చాయో చూడండి (మొదటి పేజీ)
              </Box>
              <Typography sx={{ mt: 1, p: 1.5, borderRadius: "var(--radius-sm)", bgcolor: "var(--surface)", whiteSpace: "pre-wrap", lineHeight: 1.9 }}>
                {doc.preview}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* ---------- 3. Questions & answers ---------- */}
      {doc && (
        <Box sx={{ mt: 3 }}>
          {turns.length === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>ఇలా అడగవచ్చు:</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {EXAMPLES.map((ex) => (
                  <Button
                    key={ex}
                    onClick={() => void ask(ex)}
                    variant="outlined"
                    sx={{ minHeight: 44, textTransform: "none", borderRadius: "999px", fontSize: "0.95rem" }}
                  >
                    {ex}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          <Stack spacing={2} aria-live="polite">
            {turns.map((t, i) => (
              <Box key={i}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>❓ {t.question}</Typography>

                {t.pending && (
                  <Stack direction="row" alignItems="center" spacing={1} role="status">
                    <CircularProgress size={20} />
                    <Typography sx={{ color: "var(--muted-text)" }}>మీ PDF లో వెతికి జవాబు సిద్ధం చేస్తున్నాం…</Typography>
                  </Stack>
                )}

                {t.error && <Alert severity="error" sx={{ fontSize: "0.95rem" }}>{t.error}</Alert>}

                {t.answer && (
                  <Box sx={{ p: 2, borderRadius: "var(--radius)", border: "1px solid var(--border-strong)", bgcolor: "var(--surface-elevated)" }}>
                    <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.9, fontSize: "1.05rem" }}>{t.answer}</Typography>

                    {t.sources && t.sources.length > 0 && (
                      <Box component="details" sx={{ mt: 1.5 }}>
                        <Box component="summary" sx={{ cursor: "pointer", fontWeight: 700, color: "var(--accent-text)", py: 0.5 }}>
                          📖 ఆధారాలు: పేజీ {[...new Set(t.sources.map((s) => s.page))].sort((a, b) => a - b).join(", ")}
                        </Box>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {t.sources.map((s, j) => (
                            <Box key={j} sx={{ p: 1.25, borderRadius: "var(--radius-sm)", bgcolor: "var(--surface)" }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                పేజీ {s.page} · దగ్గరితనం {Math.round(s.similarity * 100)}%
                              </Typography>
                              <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.8 }}>{s.snippet}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ))}
            <div ref={bottomRef} />
          </Stack>

          {/* Question box */}
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
              placeholder="ఉదా: ఈ పుస్తకంలో ధర్మం గురించి ఏమి చెప్పారు?"
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
        </Box>
      )}

      <Typography sx={{ mt: 4, fontSize: "0.9rem", color: "var(--muted-text)", lineHeight: 1.7 }}>
        🔒 మీ PDF ఫైల్ సేవ్ కాదు. దాని నుండి తీసిన పాఠ్యం మాత్రమే {doc?.keep_hours ?? 24} గంటలు ఉంచి, తర్వాత ఆటోమేటిక్‌గా తొలగిస్తాం.
        &ldquo;వేరే PDF&rdquo; నొక్కితే వెంటనే తొలగిపోతుంది.
      </Typography>
    </Box>
  );
}