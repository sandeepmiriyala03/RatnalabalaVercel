"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

import {
  ensureFontLoaded,
  fetchTeluguFonts,
  findFont,
  fontStack,
  loadPref,
  resolveFontFamily,
  savePref,
  SITE_FONT,
  type TeluguFont,
} from "@/app/components/exportPoems";

/* ================================================================== */
/* సైజులు — ప్రింట్ + సోషల్ మీడియా                                       */
/* ================================================================== */

type CanvasSize = "a4" | "square" | "story";

const CANVAS: Record<CanvasSize, { label: string; hint: string; aspect: number; posterWidth: number; pdf: [number, number] }> = {
  a4: { label: "A4", hint: "ప్రింట్", aspect: 210 / 297, posterWidth: 1240, pdf: [210, 297] },
  square: { label: "చతురస్రం", hint: "Instagram / Facebook", aspect: 1, posterWidth: 1080, pdf: [150, 150] },
  story: { label: "స్టోరీ", hint: "WhatsApp / Instagram స్టేటస్", aspect: 9 / 16, posterWidth: 1080, pdf: [108, 192] },
};

const DEFAULT_FONT_ID = "spbalasubrahmanyam";
const SAVE_KEY = "ratnalabala-khatimala";

type Saved = { title: string; text: string; fontId: string; fontSize: number; canvasSize: CanvasSize };
const DEFAULTS: Saved = { title: "", text: "#spb", fontId: DEFAULT_FONT_ID, fontSize: 22, canvasSize: "a4" };

type Job = { percent: number; message: string } | null;

const today = () => new Date().toISOString().slice(0, 10);
const fileBase = (title: string) =>
  `${(title.trim() || "ఖతి_మాల").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_")}_${today()}`;

export default function KhatiMala() {
  const previewRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(DEFAULTS.title);
  const [text, setText] = useState(DEFAULTS.text);
  const [fontId, setFontId] = useState(DEFAULTS.fontId);
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(DEFAULTS.canvasSize);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [fonts, setFonts] = useState<TeluguFont[]>([SITE_FONT]);
  const [job, setJob] = useState<Job>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job !== null && job.percent < 100;

  /* ఫాంట్లు — main.py నుండే (/api/main?endpoint=fonts) */
  useEffect(() => {
    let alive = true;
    fetchTeluguFonts().then((list) => alive && setFonts(list));
    return () => {
      alive = false;
    };
  }, []);

  /* 💾 Auto Save (Offline) — ఈ పరికరంలోనే, సర్వర్‌కి వెళ్ళదు */
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const s = loadPref<Saved>(SAVE_KEY, DEFAULTS);
    setTitle(s.title);
    setText(s.text);
    setFontId(s.fontId);
    setFontSize(s.fontSize);
    setCanvasSize(CANVAS[s.canvasSize] ? s.canvasSize : "a4");
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    const id = setTimeout(() => savePref(SAVE_KEY, { title, text, fontId, fontSize, canvasSize }), 500);
    return () => clearTimeout(id);
  }, [restored, title, text, fontId, fontSize, canvasSize]);

  const font = useMemo(() => findFont(fonts, fontId), [fonts, fontId]);
  useEffect(() => ensureFontLoaded(font), [font]);

  const sortedFonts = useMemo(() => {
    const [site, ...rest] = fonts;
    rest.sort((a, b) => (sortOrder === "asc" ? 1 : -1) * a.label.localeCompare(b.label, "te-IN"));
    return [site, ...rest];
  }, [fonts, sortOrder]);

  const canvas = CANVAS[canvasSize];
  const hasContent = Boolean(title.trim() || text.trim());

  /* ---------------- ఎగుమతి సహాయకులు ---------------- */

  /** Preview ను చిత్రంగా — ఫాంట్లు పూర్తిగా వచ్చాక */
  const capture = async (targetWidth: number) => {
    const node = previewRef.current;
    if (!node) throw new Error("Preview not ready");
    await document.fonts.ready;
    const options = { pixelRatio: targetWidth / node.offsetWidth, backgroundColor: "#ffffff", cacheBust: true };
    // html-to-image మొదటిసారి కొన్నిసార్లు ఫాంట్ లేకుండా గీస్తుంది — ఒకసారి ముందుగా వేడి చేస్తాం
    await toPng(node, { ...options, pixelRatio: 0.2 });
    return toPng(node, options);
  };

  const run = async (kind: string, work: () => Promise<void>) => {
    if (busy) return;
    setError(null);
    try {
      await work();
      setTimeout(() => setJob(null), 2500);
    } catch (err) {
      console.error(`${kind} failed:`, err);
      setJob(null);
      setError(`${kind} తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి.`);
    }
  };

  const downloadPdf = () =>
    run("PDF", async () => {
      setJob({ percent: 10, message: "పేజీ సిద్ధం చేస్తున్నాం…" });
      const png = await capture(canvas.posterWidth * 2);
      setJob({ percent: 70, message: "PDF తయారవుతోంది…" });
      const [w, h] = canvas.pdf;
      const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "mm", format: [w, h] });
      pdf.addImage(png, "PNG", 0, 0, w, h);
      pdf.save(`${fileBase(title)}.pdf`);
      setJob({ percent: 100, message: "PDF డౌన్‌లోడ్ అయింది ✓" });
    });

  const downloadPoster = () =>
    run("పోస్టర్", async () => {
      setJob({ percent: 10, message: "పోస్టర్ సిద్ధం చేస్తున్నాం…" });
      const png = await capture(canvas.posterWidth);
      setJob({ percent: 80, message: "చిత్రం సేవ్ అవుతోంది…" });
      saveAs(png, `${fileBase(title)}_${canvasSize}.png`);
      setJob({ percent: 100, message: "పోస్టర్ డౌన్‌లోడ్ అయింది ✓ ఇప్పుడు WhatsApp / Instagram లో పంచుకోండి." });
    });

  const downloadWord = () =>
    run("Word", async () => {
      setJob({ percent: 20, message: "Word ఫైల్ తయారవుతోంది…" });
      // Word లో ఈ ఫాంట్ కంప్యూటర్‌లో install అయి ఉంటేనే అదే రూపం; లేకపోతే Word తన తెలుగు ఫాంట్ వాడుతుంది
      const family = font.id === SITE_FONT.id ? "Nirmala UI" : resolveFontFamily(font.family);
      const size = Math.round(fontSize * 1.5); // docx size = half-points
      const doc = new Document({
        sections: [
          {
            children: [
              ...(title.trim()
                ? [new Paragraph({ alignment: "center", spacing: { after: 240 }, children: [new TextRun({ text: title, bold: true, font: family, size: size + 6 })] })]
                : []),
              ...text.split(/\r?\n/).map((line) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: line, font: family, size })] })),
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileBase(title)}.docx`);
      setJob({ percent: 100, message: "Word డౌన్‌లోడ్ అయింది ✓" });
    });

  const previewFont = fontStack(font);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" mb={2}>
          ఖతి మాల
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {/* ---------- ఎడమ: నియంత్రణలు ---------- */}
          <Box>
            <TextField fullWidth label="శీర్షిక" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2 }} />

            <TextField
              fullWidth
              multiline
              rows={8}
              label="తెలుగు పాఠ్యం"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* ఫాంట్ — main.py నుండి */}
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography>
                  ఫాంట్ <Typography component="span" variant="caption" color="text.secondary">({fonts.length - 1})</Typography>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSortOrder((p) => (p === "asc" ? "desc" : "asc"))}
                  sx={{ minWidth: 0, px: 1.5, fontSize: 12, textTransform: "none" }}
                >
                  {sortOrder === "asc" ? "అ → ఱ" : "ఱ → అ"}
                </Button>
              </Stack>

              <Select
                fullWidth
                value={fonts.some((f) => f.id === fontId) ? fontId : SITE_FONT.id}
                onChange={(e) => setFontId(e.target.value)}
                inputProps={{ "aria-label": "ఫాంట్" }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 420 } } }}
              >
                {sortedFonts.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {/* ప్రతి పేరు ఆ ఫాంట్‌లోనే — ఎంచుకునే ముందే రూపం కనిపిస్తుంది */}
                    <span style={{ fontSize: 18, lineHeight: 1.6, fontFamily: fontStack(f) }}>{f.label}</span>
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* అక్షర సైజ్ */}
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>అక్షర సైజ్</Typography>
                <Typography color="text.secondary">{fontSize}px</Typography>
              </Stack>
              <Slider min={16} max={80} value={fontSize} onChange={(_, v) => setFontSize(v as number)} aria-label="అక్షర సైజ్" />
            </Box>

            {/* పరిమాణం */}
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ mb: 0.5 }}>పరిమాణం</Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={canvasSize}
                onChange={(_, v: CanvasSize | null) => v && setCanvasSize(v)}
                aria-label="పరిమాణం"
              >
                {(Object.keys(CANVAS) as CanvasSize[]).map((k) => (
                  <ToggleButton key={k} value={k} sx={{ textTransform: "none", flexDirection: "column", lineHeight: 1.3, py: 0.75 }}>
                    <b>{CANVAS[k].label}</b>
                    <Typography component="span" variant="caption" color="text.secondary">
                      {CANVAS[k].hint}
                    </Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* డౌన్‌లోడ్లు */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2.5 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<PictureAsPdfRoundedIcon />}
                onClick={downloadPdf}
                disabled={busy || !hasContent}
                sx={{ flex: 1, textTransform: "none", fontWeight: 700 }}
              >
                PDF
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ImageRoundedIcon />}
                onClick={downloadPoster}
                disabled={busy || !hasContent}
                sx={{ flex: 1, textTransform: "none", fontWeight: 700 }}
              >
                సోషల్ మీడియా పోస్టర్
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionRoundedIcon />}
                onClick={downloadWord}
                disabled={busy || !hasContent}
                sx={{ flex: 1, textTransform: "none", fontWeight: 700 }}
              >
                Word
              </Button>
            </Stack>

            {job && (
              <Box sx={{ mt: 1.5 }} role="status" aria-live="polite">
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {job.message}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.percent}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={job.percent}
                  color={job.percent >= 100 ? "success" : "primary"}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
              💾 మీ పాఠ్యం ఈ పరికరంలోనే ఆటోమేటిక్‌గా సేవ్ అవుతుంది.
            </Typography>
          </Box>

          {/* ---------- కుడి: నమూనా (ఇదే PDF / పోస్టర్ అవుతుంది) ---------- */}
          <Box
            ref={previewRef}
            sx={{
              aspectRatio: String(canvas.aspect),
              maxHeight: { md: canvasSize === "story" ? 720 : "none" },
              mx: "auto",
              width: "100%",
              maxWidth: canvasSize === "story" ? 405 : "none",
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 3,
              overflow: "hidden",
              fontSize: `${fontSize}px`,
              lineHeight: 1.8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              bgcolor: "#fff",
              color: "#0f172a",
              fontFamily: previewFont,
              fontFeatureSettings: '"liga" 1, "calt" 1',
            }}
          >
            <Typography
              sx={{ textAlign: "center", fontWeight: 600, mb: 1, fontFamily: "inherit", fontSize: "inherit", lineHeight: 1.5 }}
            >
              {title || "శీర్షిక"}
            </Typography>
            <Box sx={{ whiteSpace: "pre-wrap", textAlign: "justify", wordBreak: "break-word", lineHeight: 1.9 }}>
              {text || (
                <Typography component="span" sx={{ opacity: 0.4, fontFamily: "inherit", fontSize: "inherit" }}>
                  ఇక్కడ మీ పాఠ్యం ప్రదర్శించబడుతుంది
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}