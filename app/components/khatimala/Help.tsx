"use client";

/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — సహాయం, రెండు దారులు

   1. 💡 గుర్తులు (Hint): ఒక్క నొక్కుతో ప్రతి ముఖ్యమైన బటన్ కింద
      "ఇది ఏం చేస్తుంది" అనే పసుపు చీటీ కనిపిస్తుంది — అన్నీ ఒకేసారి.
      మళ్ళీ నొక్కితే అన్నీ దాక్కుంటాయి.
   2. 📖 దశల వారీ గైడ్ (GuideDialog): 8 సులభమైన దశలు, ఒక్కో దశకు
      "చూపించు 👉" — ఆ భాగానికి తీసుకెళ్ళి, అది మెరిసేలా చేస్తుంది.
      మొదటిసారి వచ్చినవారికి ఒక్కసారి తానే తెరుచుకుంటుంది.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress, Stack, Typography, useMediaQuery } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

/* ─────────────────────────────────────────────────────────────── */
/* 1. HINT — a yellow note under a control (only while help is on)  */
/* ─────────────────────────────────────────────────────────────── */

type HintProps = { show: boolean; text: string; children: React.ReactNode; wide?: boolean };

export function Hint({ show, text, children, wide }: HintProps) {
  if (!show) return <>{children}</>;
  return (
    <Box sx={{ display: wide ? "flex" : "inline-flex", flexDirection: "column", alignItems: wide ? "stretch" : "flex-start", gap: 0.75, maxWidth: "100%" }}>
      {children}
      <Box
        role="note"
        sx={{
          position: "relative",
          alignSelf: "flex-start",
          maxWidth: wide ? "100%" : 230,
          px: 1,
          py: 0.5,
          borderRadius: "10px",
          bgcolor: "#fff3b0",
          color: "#3b2a00",
          border: "2px solid #d9a400",
          fontSize: "0.92rem",
          fontWeight: 700,
          lineHeight: 1.45,
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -8,
            left: 14,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "7px solid #d9a400",
          },
          "@media print": { display: "none" },
        }}
      >
        💡 {text}
      </Box>
    </Box>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* 2. GUIDE — simple steps, each can point at the real place        */
/* ─────────────────────────────────────────────────────────────── */

export type GuideTarget = { tab?: "edit" | "design" | "preview"; id: string };

export type GuideStep = { icon: string; title: string; text: string; target?: GuideTarget };

export const GUIDE_STEPS: GuideStep[] = [
  {
    icon: "🆕",
    title: "మొదలుపెట్టండి",
    text: 'పైన "కొత్తది" నొక్కండి. ఖాళీ పత్రం, పద్య పోస్టర్, శుభాకాంక్షలు, వ్యాసం, స్లైడ్ షో — ఒకటి ఎంచుకోండి. "ఫైల్ పేరు" లో మీ పేరు ఇవ్వండి.',
    target: { id: "kh-new" },
  },
  {
    icon: "✏️",
    title: "వ్రాయండి",
    text: "ఏ పెట్టెనైనా నొక్కి వ్రాయండి. పెట్టె పైన ఒక వరుస వస్తుంది: ఫాంట్, సైజు (− +), లావు B, వాలు I, అడుగు గీత U, ఎడమ / మధ్య / కుడి, రంగు.",
    target: { tab: "edit", id: "kh-blocks" },
  },
  {
    icon: "➕",
    title: "ఇంకా చేర్చండి",
    text: 'కింద "కొత్తది జోడించండి" లో — శీర్షిక, పేరా, పద్యం, జాబితా, పట్టిక, మీ ఫోటో, అలంకరణ గీత. ⬆ ⬇ తో జరపండి, 🗑 తో తీసేయండి.',
    target: { tab: "edit", id: "kh-add" },
  },
  {
    icon: "🎨",
    title: "అందంగా చేయండి",
    text: '"రూపం" లో — పరిమాణం (A4, WhatsApp స్టోరీ, చతురస్రం), 10 రూపాలు, మొత్తానికి ఒక ఫాంట్, నేపథ్య చిత్రం, పేజీ సంఖ్యలు.',
    target: { tab: "design", id: "kh-body" },
  },
  {
    icon: "🎞️",
    title: "స్లైడ్ షో + పాట",
    text: '"రూపం" లో "స్లైడ్ షో" ఎంచుకోండి. "ఎన్ని స్లైడ్లు?" తో మీ పత్రం తానే స్లైడ్లుగా మారుతుంది. అక్కడే మీ పాట (MP3) చేర్చండి.',
    target: { tab: "design", id: "kh-body" },
  },
  {
    icon: "👁️",
    title: "చూడండి",
    text: "ఇక్కడ కనిపించేదే ఫైల్‌లో వస్తుంది. పేజీలో ఏ భాగాన్ని నొక్కినా దాన్ని మార్చే పెట్టె తెరుచుకుంటుంది. స్లైడ్ షో అయితే ▶ తో పూర్తి తెరలో, పాటతో.",
    target: { tab: "preview", id: "kh-preview" },
  },
  {
    icon: "⬇️",
    title: "డౌన్‌లోడ్ / పంచుకోండి",
    text: '"డౌన్‌లోడ్" నొక్కి ఎంచుకోండి: PDF, చిత్రం, వీడియో (WhatsApp స్టేటస్ — పాటతో), Word, PowerPoint, స్లైడ్ షో ఫైల్. ఫోన్‌లో "WhatsApp / పంచుకోండి".',
    target: { id: "kh-download" },
  },
  {
    icon: "↶",
    title: "భయం వద్దు",
    text: "పొరపాటైతే ↶ వెనక్కి నొక్కండి. మీ పని (చిత్రాలు, పాటతో సహా) ఈ పరికరంలోనే తానే సేవ్ అవుతుంది. ఏ బటన్ ఏం చేస్తుందో మర్చిపోతే 💡 గుర్తులు నొక్కండి.",
    target: { id: "kh-undo" },
  },
];

/** Scroll to an element and make it glow for a moment */
export function flash(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  el.animate?.(
    [
      { boxShadow: "0 0 0 0 rgba(217,164,0,0.95)", outline: "4px solid #d9a400", outlineOffset: "2px" },
      { boxShadow: "0 0 0 14px rgba(217,164,0,0)", outline: "4px solid #d9a400", outlineOffset: "2px" },
    ],
    { duration: 900, iterations: reduce ? 1 : 3 }
  );
}

type GuideProps = { open: boolean; onClose: () => void; onShow: (t: GuideTarget) => void; onHints: () => void };

export function GuideDialog({ open, onClose, onShow, onHints }: GuideProps) {
  const phone = useMediaQuery("(max-width:600px)");
  const [i, setI] = useState(0);
  const step = GUIDE_STEPS[i];
  const last = i === GUIDE_STEPS.length - 1;
  const big = { minHeight: 52, fontWeight: 800, fontSize: "1.05rem", textTransform: "none" as const };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="guide-title"
      PaperProps={{
        sx: phone
          ? { m: 0, position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", maxWidth: "100%", borderRadius: "20px 20px 0 0" }
          : { borderRadius: "16px" },
      }}
    >
      <DialogTitle id="guide-title" sx={{ fontWeight: 800, fontSize: "1.3rem", pr: 7 }}>
        📖 ఖతి మాల — ఎలా వాడాలి?
        <IconButton aria-label="గైడ్ మూసివేయండి" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, width: 48, height: 48 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: "max(20px, env(safe-area-inset-bottom))" }}>
        <Typography sx={{ fontWeight: 700, color: "var(--muted-text)", mb: 0.5 }} aria-live="polite">
          దశ {i + 1} / {GUIDE_STEPS.length}
        </Typography>
        <LinearProgress variant="determinate" value={((i + 1) / GUIDE_STEPS.length) * 100} sx={{ height: 8, borderRadius: 4, mb: 2 }} aria-hidden />

        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ minHeight: 150 }}>
          <Box aria-hidden sx={{ fontSize: 46, lineHeight: 1 }}>
            {step.icon}
          </Box>
          <Box>
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.35rem", mb: 0.75 }}>
              {step.title}
            </Typography>
            <Typography sx={{ fontSize: "1.12rem", lineHeight: 1.9 }}>{step.text}</Typography>
          </Box>
        </Stack>

        {/* step dots — tap to jump */}
        <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ my: 2 }} role="tablist" aria-label="దశలు">
          {GUIDE_STEPS.map((s, k) => (
            <Box
              key={s.title}
              component="button"
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={`దశ ${k + 1}: ${s.title}`}
              onClick={() => setI(k)}
              sx={{ width: 28, height: 28, p: 0, border: "none", bgcolor: "transparent", cursor: "pointer", display: "grid", placeItems: "center" }}
            >
              <Box sx={{ width: k === i ? 14 : 10, height: k === i ? 14 : 10, borderRadius: "50%", bgcolor: k <= i ? "var(--secondary)" : "var(--border-strong)" }} />
            </Box>
          ))}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {step.target && (
            <Button variant="outlined" onClick={() => onShow(step.target!)} sx={{ ...big, flex: 1 }}>
              చూపించు 👉
            </Button>
          )}
          <Stack direction="row" spacing={1} sx={{ flex: 2 }}>
            <Button variant="outlined" disabled={i === 0} onClick={() => setI(i - 1)} sx={{ ...big, flex: 1 }}>
              ◀ వెనుక
            </Button>
            {last ? (
              <Button variant="contained" onClick={onClose} sx={{ ...big, flex: 1, bgcolor: "var(--secondary)" }}>
                ✓ ముగించు
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setI(i + 1)} sx={{ ...big, flex: 1, bgcolor: "var(--secondary)" }}>
                తర్వాత ▶
              </Button>
            )}
          </Stack>
        </Stack>

        <Button fullWidth onClick={onHints} sx={{ mt: 1.5, minHeight: 48, fontWeight: 700, textTransform: "none" }}>
          💡 బదులుగా అన్ని బటన్ల దగ్గర గుర్తులు చూపించు
        </Button>
      </DialogContent>
    </Dialog>
  );
}