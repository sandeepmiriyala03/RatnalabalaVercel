"use client";

/* ═══════════════════════════════════════════════════════════════
   డౌన్‌లోడ్ / పంచుకోండి — ఫార్మాట్ ఎంపిక → దశల వారీ స్థితి → ఫైల్
   • ఫోన్‌లో కింది నుంచి వచ్చే పెద్ద పలక; పెద్ద అక్షరాలు, ✓ గుర్తులు
   • పూర్తయ్యాక: "డౌన్‌లోడ్" + (ఫోన్‌లో) "WhatsApp / పంచుకోండి"
     iPhone లో బ్రౌజర్ బటన్ నొక్కితేనే ఫైల్ ఇస్తుంది — అందుకే ఈ బటన్లు
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import { canShareFiles, exportDocx, exportPdf, exportPng, exportPptx, exportShowHtml, exportVideo, makeAudioContext, pickVideoType, saveBlob, shareBlob, sizeLabel, videoSeconds, type VideoShape } from "./exporters";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import MusicVideoRoundedIcon from "@mui/icons-material/MusicVideoRounded";
import type { Project } from "./model";

export type Format = "pdf" | "png" | "video" | "docx" | "pptx" | "show";

const FORMATS: { id: Format; title: string; hint: string; icon: React.ReactNode; color: string }[] = [
  { id: "pdf", title: "PDF", hint: "ప్రింట్ · WhatsApp లో పంపడానికి · మీ ఫాంట్ అలాగే", icon: <PictureAsPdfRoundedIcon />, color: "#a31515" },
  { id: "png", title: "చిత్రం (పోస్టర్)", hint: "WhatsApp స్టేటస్ · Instagram · Facebook", icon: <ImageRoundedIcon />, color: "#1f5f3f" },
  { id: "video", title: "వీడియో (మీ పాటతో) ⭐", hint: "WhatsApp స్టేటస్ · Instagram Reels · Facebook — MP4", icon: <MovieRoundedIcon />, color: "#c2185b" },
  { id: "docx", title: "Word", hint: "తర్వాత మార్చుకోవచ్చు · ఫాంట్ ఫైల్ లోపలే", icon: <DescriptionRoundedIcon />, color: "#1d4ed8" },
  { id: "pptx", title: "PowerPoint", hint: "స్లైడ్ షో · TV / ప్రొజెక్టర్ (సంగీతం ఉండదు)", icon: <SlideshowRoundedIcon />, color: "#b4470c" },
  { id: "show", title: "స్లైడ్ షో ఫైల్ (సంగీతంతో)", hint: "Internet లేకుండా ఏ కంప్యూటర్ / ఫోన్‌లోనైనా — ఫైల్ తెరిచి ▶ నొక్కండి", icon: <MusicVideoRoundedIcon />, color: "#6a1b9a" },
];

const STEPS = ["ఫాంట్లు, చిత్రాలు సిద్ధం", "పేజీలు గీస్తున్నాం", "ఫైల్ కూర్చుతున్నాం", "సిద్ధం!"];

const isIOS = () =>
  typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

type Result = { blob: Blob; name: string; notes: string[] };

type Props = {
  open: boolean;
  onClose: () => void;
  project: Project;
  pageCount: number;
  initial?: Format;
  /** the song chosen for the slideshow (goes inside the offline slideshow file) */
  music?: Blob | null;
};

export default function ExportDialog({ open, onClose, project, pageCount, initial, music = null }: Props) {
  const phone = useMediaQuery("(max-width:600px)");
  const [format, setFormat] = useState<Format>(initial ?? "pdf");
  const [editable, setEditable] = useState(false);
  const [shape, setShape] = useState<VideoShape>("status");
  const [videoType, setVideoType] = useState<string | null | undefined>(undefined);
  useEffect(() => setVideoType(pickVideoType()), []);
  const [page, setPage] = useState(0);
  const [stage, setStage] = useState<"choose" | "working" | "done" | "error">("choose");
  const [step, setStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const [detail, setDetail] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setStage("choose");
      setResult(null);
      setError("");
      if (initial) setFormat(initial);
      setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
    }
  }, [open, initial, pageCount]);

  const progress = (s: number, pc: number, d = "") => {
    setStep(s);
    setPercent(pc);
    setDetail(d);
  };

  const start = async () => {
    // sound for the video must be switched on right here, inside the tap
    const audioCtx = format === "video" && music ? makeAudioContext() : null;
    setStage("working");
    progress(0, 2);
    statusRef.current?.focus();
    try {
      const notes: string[] = [];
      let out: { blob: Blob; name: string; failed: string[] };
      if (format === "pdf") out = await exportPdf(project, progress);
      else if (format === "png") out = await exportPng(project, page, progress);
      else if (format === "docx") {
        const r = await exportDocx(project, progress);
        out = r;
        if (r.notEmbedded.length) notes.push(`Word లోపల పెట్టలేని ఫాంట్: ${r.notEmbedded.join(", ")} — ఆ కంప్యూటర్‌లో ఉంటేనే అదే రూపం.`);
      } else if (format === "video") {
        const r = await exportVideo(project, music, shape, audioCtx, progress);
        out = r;
        if (!r.whatsappReady) notes.push("ఈ బ్రౌజర్ WebM వీడియో మాత్రమే చేయగలదు. WhatsApp కి నేరుగా పంపాలంటే తాజా Chrome / Edge / Safari లో, లేదా ఫోన్‌లో మళ్ళీ తయారు చేయండి.");
        if (r.seconds > 90) notes.push(`వీడియో ${Math.round(r.seconds)} సెకన్లు. WhatsApp స్టేటస్‌లో పొడవైన వీడియోలు కత్తిరించబడవచ్చు — స్లైడ్లు లేదా సెకన్లు తగ్గించండి.`);
        if (!music) notes.push("పాట లేకుండా తయారైంది. పాట కావాలంటే: రూపం → స్లైడ్ షో → నేపథ్య సంగీతం.");
        notes.push("ఫోన్‌లో \"WhatsApp / పంచుకోండి\" నొక్కి → WhatsApp → \"నా స్టేటస్\" ఎంచుకోండి.");
      } else if (format === "show") {
        out = await exportShowHtml(project, music, progress);
        notes.push("ఈ ఫైల్‌ను ఏ కంప్యూటర్‌కైనా (pen drive / WhatsApp / email) పంపండి. అక్కడ ఫైల్‌పై డబుల్-క్లిక్ చేసి, \"▶ స్లైడ్ షో మొదలుపెట్టండి\" నొక్కితే చాలు — internet అవసరం లేదు.");
      } else out = await exportPptx(project, editable, progress);
      if (out.failed.length) notes.push(`ఈ ఫాంట్ రాలేదు, బదులుగా సాధారణ తెలుగు ఫాంట్ వాడాం: ${out.failed.join(", ")}`);
      setResult({ blob: out.blob, name: out.name, notes });
      setStage("done");
      if (!isIOS()) void saveBlob(out.blob, out.name); // iPhone: the button below (needs a tap)
    } catch (e) {
      console.error("export failed", e);
      setError("ఫైల్ తయారు కాలేదు. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి. పేజీలు చాలా ఎక్కువైతే కొన్ని తగ్గించి చూడండి.");
      setStage("error");
    }
  };

  const busy = stage === "working";
  const share = result && canShareFiles(result.blob, result.name);

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={false}
      aria-labelledby="export-title"
      PaperProps={{
        sx: phone
          ? { m: 0, position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", maxWidth: "100%", borderRadius: "20px 20px 0 0", maxHeight: "92dvh" }
          : { borderRadius: "16px" },
      }}
    >
      <DialogTitle id="export-title" sx={{ fontWeight: 800, fontSize: "1.35rem", pr: 7 }}>
        ⬇️ డౌన్‌లోడ్ / పంచుకోండి
        {!busy && (
          <IconButton aria-label="మూసివేయండి" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, width: 48, height: 48 }}>
            <CloseRoundedIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent sx={{ pb: "max(20px, env(safe-area-inset-bottom))" }}>
        {stage === "choose" && (
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700 }}>ఏ రకం ఫైల్ కావాలి?</Typography>
            {FORMATS.map((f) => {
              const active = format === f.id;
              return (
                <Box
                  key={f.id}
                  component="button"
                  type="button"
                  onClick={() => setFormat(f.id)}
                  aria-pressed={active}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    textAlign: "left",
                    p: 1.5,
                    minHeight: 64,
                    borderRadius: "12px",
                    cursor: "pointer",
                    font: "inherit",
                    color: "var(--foreground)",
                    bgcolor: active ? "var(--surface)" : "var(--surface-elevated)",
                    border: active ? `3px solid ${f.color}` : "1px solid var(--border-strong)",
                    "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ color: f.color, display: "flex", "& svg": { fontSize: 34 } }} aria-hidden>
                    {f.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>{f.title}</Typography>
                    <Typography variant="body2" sx={{ color: "var(--muted-text)" }}>
                      {f.hint}
                    </Typography>
                  </Box>
                  {active ? <CheckCircleRoundedIcon sx={{ color: f.color }} /> : <RadioButtonUncheckedRoundedIcon sx={{ color: "var(--border-strong)" }} />}
                </Box>
              );
            })}

            {format === "png" && pageCount > 1 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 700 }}>ఏ పేజీ?</Typography>
                <Select size="small" value={page} onChange={(e) => setPage(Number(e.target.value))} inputProps={{ "aria-label": "పేజీ" }} sx={{ minHeight: 44 }}>
                  {Array.from({ length: pageCount }, (_, i) => (
                    <MenuItem key={i} value={i} sx={{ minHeight: 44 }}>
                      {project.mode === "slides" ? "స్లైడ్" : "పేజీ"} {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            )}

            {format === "video" && (
              <Box>
                {videoType === null ? (
                  <Alert severity="warning">ఈ బ్రౌజర్‌లో వీడియో తయారు చేయలేం. తాజా Chrome / Edge / Safari లో ప్రయత్నించండి.</Alert>
                ) : (
                  <>
                    <Typography sx={{ fontWeight: 700, mb: 0.5 }}>వీడియో ఆకారం:</Typography>
                    <ToggleButtonGroup exclusive fullWidth value={shape} onChange={(_, v) => v && setShape(v)} orientation={phone ? "vertical" : "horizontal"}>
                      <ToggleButton value="status" sx={{ textTransform: "none", flexDirection: "column", alignItems: "flex-start", textAlign: "left", py: 1, minHeight: 56 }}>
                        <b>📱 WhatsApp స్టేటస్ (నిలువు 9:16)</b>
                        <Typography component="span" variant="body2">
                          స్టేటస్, Reels, Shorts కి సరిగ్గా
                        </Typography>
                      </ToggleButton>
                      <ToggleButton value="same" sx={{ textTransform: "none", flexDirection: "column", alignItems: "flex-start", textAlign: "left", py: 1, minHeight: 56 }}>
                        <b>🖥️ స్లైడ్ ఆకారంలోనే</b>
                        <Typography component="span" variant="body2">
                          TV, YouTube, కంప్యూటర్‌కి
                        </Typography>
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <Typography sx={{ mt: 1 }}>
                      ⏱️ సుమారు <b>{Math.round(videoSeconds(project, pageCount))} సెకన్లు</b> ({pageCount} {project.mode === "slides" ? "స్లైడ్లు" : "పేజీలు"} × {Math.max(3, project.show.seconds || 5)} సెకన్లు) ·{" "}
                      {music ? "🎵 మీ పాటతో" : "🔇 పాట లేదు"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: "var(--muted-text)" }}>
                      వీడియో ఎంత పొడవో తయారు కావడానికి అంతే సమయం పడుతుంది. అంతవరకు ఈ పేజీని మూయకండి, వేరే tab కి వెళ్ళకండి.
                    </Typography>
                  </>
                )}
              </Box>
            )}

            {format === "pptx" && (
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>PowerPoint లో అక్షరాలు:</Typography>
                <ToggleButtonGroup exclusive fullWidth value={editable ? "edit" : "exact"} onChange={(_, v) => v && setEditable(v === "edit")} orientation={phone ? "vertical" : "horizontal"}>
                  <ToggleButton value="exact" sx={{ textTransform: "none", flexDirection: "column", alignItems: "flex-start", textAlign: "left", py: 1, minHeight: 56 }}>
                    <b>అసలు రూపం (సిఫార్సు)</b>
                    <Typography component="span" variant="body2">
                      ఫాంట్, అలంకరణ ఉన్నదున్నట్లు — ఏ కంప్యూటర్‌లోనైనా
                    </Typography>
                  </ToggleButton>
                  <ToggleButton value="edit" sx={{ textTransform: "none", flexDirection: "column", alignItems: "flex-start", textAlign: "left", py: 1, minHeight: 56 }}>
                    <b>ఎడిట్ చేయగలిగేలా</b>
                    <Typography component="span" variant="body2">
                      అక్షరాలు మార్చుకోవచ్చు; ఫాంట్ ఆ కంప్యూటర్‌లో ఉండాలి
                    </Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
                {project.show.seconds > 0 && (
                  <Typography variant="body2" sx={{ mt: 1, color: "var(--muted-text)" }}>
                    స్లైడ్లు ప్రతి {project.show.seconds} సెకన్లకు తనంతట తానే మారతాయి (PowerPoint లో F5 నొక్కండి). PowerPoint ఫైల్‌లో సంగీతం ఉండదు — పాటతో కావాలంటే "స్లైడ్ షో ఫైల్ (సంగీతంతో)" ఎంచుకోండి.
                  </Typography>
                )}
              </Box>
            )}

            <Button variant="contained" size="large" onClick={start} disabled={format === "video" && videoType === null} startIcon={<DownloadRoundedIcon />} sx={{ minHeight: 56, fontWeight: 800, fontSize: "1.1rem", textTransform: "none", bgcolor: "var(--secondary)", mt: 1 }}>
              {FORMATS.find((f) => f.id === format)!.title} తయారు చేయండి
            </Button>
          </Stack>
        )}

        {(stage === "working" || stage === "done") && (
          <Box ref={statusRef} tabIndex={-1} role="status" aria-live="polite" sx={{ outline: "none" }}>
            <Stack spacing={1.25} sx={{ mb: 2 }}>
              {STEPS.map((label, i) => {
                const done = stage === "done" || i < step;
                const now = stage === "working" && i === step;
                return (
                  <Stack key={label} direction="row" spacing={1.25} alignItems="center" sx={{ opacity: done || now ? 1 : 0.55 }}>
                    {done ? (
                      <CheckCircleRoundedIcon sx={{ color: "#1f7a3f", fontSize: 30 }} />
                    ) : now ? (
                      <Box sx={{ width: 30, height: 30, display: "grid", placeItems: "center" }}>
                        <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--secondary)", borderTopColor: "transparent", animation: "rbspin 0.9s linear infinite", "@keyframes rbspin": { to: { transform: "rotate(360deg)" } } }} />
                      </Box>
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 30, color: "var(--border-strong)" }} />
                    )}
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: now ? 800 : 600 }}>
                      {label}
                      {now && detail ? ` (${detail})` : ""}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
            <LinearProgress variant="determinate" value={stage === "done" ? 100 : percent} sx={{ height: 12, borderRadius: 6 }} color={stage === "done" ? "success" : "primary"} aria-label="పురోగతి" />
            <Typography align="right" sx={{ mt: 0.5, fontWeight: 800 }}>
              {stage === "done" ? 100 : percent}%
            </Typography>
          </Box>
        )}

        {stage === "done" && result && (
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <Alert severity="success" sx={{ fontSize: "1.05rem" }}>
              <b>{result.name}</b> ({sizeLabel(result.blob.size)}) సిద్ధం.
              {!isIOS() && " డౌన్‌లోడ్ మొదలైంది — రాకపోతే కింది బటన్ నొక్కండి."}
            </Alert>
            {result.notes.map((n) => (
              <Alert key={n} severity="warning">
                {n}
              </Alert>
            ))}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" size="large" startIcon={<DownloadRoundedIcon />} onClick={() => saveBlob(result.blob, result.name)} sx={{ flex: 1, minHeight: 56, fontWeight: 800, textTransform: "none", bgcolor: "var(--secondary)" }}>
                డౌన్‌లోడ్
              </Button>
              {share && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ShareRoundedIcon />}
                  onClick={() => shareBlob(result.blob, result.name, project.title || "ఖతి మాల").catch(() => {})}
                  sx={{ flex: 1, minHeight: 56, fontWeight: 800, textTransform: "none" }}
                >
                  WhatsApp / పంచుకోండి
                </Button>
              )}
            </Stack>
            <Button onClick={() => setStage("choose")} sx={{ minHeight: 48, textTransform: "none", fontWeight: 700 }}>
              ఇంకో ఫార్మాట్ కావాలా?
            </Button>
          </Stack>
        )}

        {stage === "error" && (
          <Stack spacing={1.5}>
            <Alert severity="error" sx={{ fontSize: "1.05rem" }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={start} sx={{ minHeight: 52, fontWeight: 800, textTransform: "none" }}>
              మళ్ళీ ప్రయత్నించండి
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
