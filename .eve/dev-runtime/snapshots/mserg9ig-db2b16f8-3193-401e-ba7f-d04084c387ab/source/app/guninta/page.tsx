"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Chip,
  Stack, Button, alpha, IconButton, Tooltip,
} from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const GUNINTA_MARKS = ["", "ా","ి","ీ","ు","ూ","ృ","ౄ","ె","ే","ై","ొ","ో","ౌ","ం","ః"];
const GUNINTA_NAMES = [
  "అకారము","ఆకారము","ఇకారము","ఈకారము","ఉకారము","ఊకారము",
  "ఋకారము","ౠకారము","ఎకారము","ఏకారము","ఐకారము","ఒకారము",
  "ఓకారము","ఔకారము","పూర్ణానుస్వారము","విసర్గ",
];
const SWARALU = ["అ","ఆ","ఇ","ఈ","ఉ","ఊ","ఋ","ౠ","ఎ","ఏ","ఐ","ఒ","ఓ","ఔ","అం","అః"];

const VYANJANALU = [
  "క","ఖ","గ","ఘ","చ","ఛ","జ","ఝ",
  "ట","ఠ","డ","ఢ","ణ","త","థ","ద","ధ","న",
  "ప","ఫ","బ","భ","మ","య","ర","ల","వ",
  "శ","ష","స","హ","ళ","క్ష","ఱ",
];

// Generate gunintam for each vyanjana
// Special suffixes for అం (ం) and అః (ః)
function getGunintam(vyanjana: string, index: number): string {
  if (index === 0) return vyanjana;           // అ — base
  if (index === 14) return vyanjana + "ం";    // అం
  if (index === 15) return vyanjana + "ః";    // అః
  return vyanjana + GUNINTA_MARKS[index];     // others
}

/* ═══════════════════════════════════════════
   TTS HOOK
═══════════════════════════════════════════ */
function useTTS() {
  const [speaking, setSpeaking] = useState<string | null>(null);
  const stopRef = useRef(false);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speaking === text) { setSpeaking(null); return; }
    stopRef.current = false;

    const u = new SpeechSynthesisUtterance(text);
    u.lang  = "te-IN";
    u.rate  = 0.75;
    u.pitch = 1.1;
    const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("te"));
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(text);
    u.onend   = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(u);
  }, [speaking]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(null);
  }, []);

  return { speak, stop, speaking };
}

function useSpeakRow() {
  const [runningRow, setRunningRow] = useState<string | null>(null);
  const stopRef = useRef(false);

  const speakRow = async (vyanjana: string, forms: string[]) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (runningRow === vyanjana) { setRunningRow(null); return; }
    stopRef.current = false;
    setRunningRow(vyanjana);

    for (const form of forms) {
      if (stopRef.current) break;
      await new Promise<void>(res => {
        const u = new SpeechSynthesisUtterance(form);
        u.lang  = "te-IN"; u.rate = 0.7; u.pitch = 1.1;
        const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("te"));
        if (v) u.voice = v;
        u.onend = () => res(); u.onerror = () => res();
        window.speechSynthesis.speak(u);
      });
      await new Promise(r => setTimeout(r, 350));
    }
    setRunningRow(null);
  };

  const stopRow = (vyanjana: string) => {
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setRunningRow(null);
  };

  return { speakRow, stopRow, runningRow };
}

/* ═══════════════════════════════════════════
   GUNINTA CELL
═══════════════════════════════════════════ */
function GunintaCell({
  form, name, speak, speaking,
}: {
  form: string;
  name: string;
  speak: (t: string) => void;
  speaking: string | null;
}) {
  const active = speaking === form;
  const color  = "#2d6a4f";

  return (
    <Tooltip title={name} arrow placement="top">
      <Box
        onClick={() => speak(form)}
        sx={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          minWidth: { xs: 44, sm: 52 }, minHeight: { xs: 52, sm: 60 },
          borderRadius: "10px", cursor: "pointer",
          border: `1.5px solid ${alpha(color, active ? 0.9 : 0.18)}`,
          background: active ? color : alpha(color, 0.05),
          transition: "all 0.15s",
          "&:hover": { background: alpha(color, 0.15), transform: "scale(1.06)" },
          "&:active": { transform: "scale(0.96)" },
          px: 0.5,
        }}
      >
        <Typography sx={{
          fontFamily: "'Noto Serif Telugu', serif",
          fontSize: { xs: "1.1rem", sm: "1.25rem" },
          fontWeight: 700,
          color: active ? "#fff" : color,
          lineHeight: 1.3,
        }}>
          {form}
        </Typography>
        {active && (
          <VolumeUpRoundedIcon sx={{ fontSize: 10, color: "#fff", mt: 0.2 }} />
        )}
      </Box>
    </Tooltip>
  );
}

/* ═══════════════════════════════════════════
   GUNINTA ROW
═══════════════════════════════════════════ */
function GunintaRow({
  vyanjana, speak, speaking, speakRow, stopRow, runningRow,
}: {
  vyanjana: string;
  speak: (t: string) => void;
  speaking: string | null;
  speakRow: (v: string, f: string[]) => void;
  stopRow: (v: string) => void;
  runningRow: string | null;
}) {
  const forms = GUNINTA_MARKS.map((_, i) => getGunintam(vyanjana, i));
  const isRunning = runningRow === vyanjana;
  const color = "#2d6a4f";

  return (
    <Card elevation={0} sx={{
      border: `1px solid ${alpha(color, 0.15)}`, borderRadius: "14px",
      overflow: "hidden", mb: 1.5,
    }}>
      {/* Row header */}
      <Box sx={{ background: alpha(color, 0.07), px: 2, py: 1, borderBottom: `1px solid ${alpha(color, 0.1)}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "10px", background: color,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#fff", fontFamily: "'Noto Serif Telugu', serif" }}>
                {vyanjana}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {vyanjana} గుణింతము
            </Typography>
          </Stack>
          <Tooltip title={isRunning ? "ఆపు" : `${vyanjana} గుణింతం అన్నీ వినండి`} arrow>
            <IconButton
              size="small"
              onClick={() => isRunning ? stopRow(vyanjana) : speakRow(vyanjana, forms)}
              sx={{
                color: isRunning ? "#c0392b" : color,
                border: `1px solid ${alpha(isRunning ? "#c0392b" : color, 0.3)}`,
                borderRadius: "8px", p: 0.8,
                background: isRunning ? alpha("#c0392b", 0.08) : "transparent",
              }}
            >
              {isRunning ? <StopRoundedIcon sx={{ fontSize: 16 }} /> : <VolumeUpRoundedIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Guninta forms */}
      <CardContent sx={{ p: "12px 14px !important" }}>
        <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
          {forms.map((form, i) => (
            <GunintaCell
              key={i} form={form} name={GUNINTA_NAMES[i]}
              speak={speak} speaking={speaking}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function GunintaMala() {
  const [selectedVyanjana, setSelectedVyanjana] = useState<string | null>(null);
  const { speak, stop, speaking } = useTTS();
  const { speakRow, stopRow, runningRow } = useSpeakRow();
  const color = "#2d6a4f";

  const visibleList = selectedVyanjana ? [selectedVyanjana] : VYANJANALU;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} mb={1}>
          <AutoStoriesRoundedIcon sx={{ color, fontSize: 30 }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "#1a3d2b", fontFamily: "'Noto Serif Telugu', serif" }}>
            గుణింత మాల
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.95rem", color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8, maxWidth: 600, mx: "auto" }}>
          గుణింతం అంటే హల్లుకి అచ్చు కూడటంవలన వచ్చే శబ్దాల అమరిక — 🔊 ప్రతి రూపం వినవచ్చు
        </Typography>
        <Stack direction="row" justifyContent="center" gap={1} mt={1.5} flexWrap="wrap" useFlexGap>
          <Chip label={`${VYANJANALU.length} వ్యంజనాలు`} size="small"
            sx={{ background: alpha(color, 0.1), color, fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
          <Chip label="16 గుణింత రూపాలు ప్రతి అక్షరానికి" size="small"
            sx={{ background: alpha("#1a5276", 0.1), color: "#1a5276", fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
        </Stack>
      </Box>

      {/* Guninta marks reference */}
      <Card elevation={0} sx={{ border: `1px solid ${alpha(color, 0.15)}`, borderRadius: "14px", mb: 3 }}>
        <CardContent sx={{ p: "14px 16px !important" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1.5, letterSpacing: 0.5, textTransform: "uppercase" }}>
            అచ్చుల గుర్తులు (Guninta Marks)
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
            {SWARALU.map((s, i) => (
              <Box key={i} sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                px: 1.2, py: 0.8, borderRadius: "8px",
                background: alpha(color, 0.06), border: `1px solid ${alpha(color, 0.15)}`,
                minWidth: 44,
              }}>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>
                  {s}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", textAlign: "center", mt: 0.2 }}>
                  {GUNINTA_MARKS[i] || "ᖋ"}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Vyanjana filter */}
      <Card elevation={0} sx={{ border: `1px solid ${alpha(color, 0.15)}`, borderRadius: "14px", mb: 3 }}>
        <CardContent sx={{ p: "14px 16px !important" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
              అక్షరం ఎంచుకోండి
            </Typography>
            {selectedVyanjana && (
              <Button size="small" onClick={() => setSelectedVyanjana(null)}
                sx={{ fontSize: 12, textTransform: "none", color: "text.secondary" }}>
                అన్నీ చూడండి ✕
              </Button>
            )}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
            {VYANJANALU.map(v => (
              <Chip key={v} label={v} size="small"
                onClick={() => setSelectedVyanjana(selectedVyanjana === v ? null : v)}
                sx={{
                  fontFamily: "'Noto Serif Telugu', serif", fontSize: 15,
                  fontWeight: 700, cursor: "pointer", height: 36, minWidth: 40,
                  ...(selectedVyanjana === v
                    ? { background: color, color: "#fff" }
                    : { background: alpha(color, 0.07), color, border: `1px solid ${alpha(color, 0.2)}` }),
                  "&:hover": { background: selectedVyanjana === v ? color : alpha(color, 0.18) },
                }} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Tip */}
      <Box sx={{ mb: 2.5, p: 1.5, borderRadius: "10px", background: alpha("#1a5276", 0.05), border: `1px dashed ${alpha("#1a5276", 0.2)}` }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", textAlign: "center" }}>
          💡 గుణింత రూపం click చేస్తే వినిపిస్తుంది · row లో 🔊 నొక్కితే ఆ వ్యంజనం అన్ని గుణింతాలు వినిపిస్తాయి
        </Typography>
      </Box>

      {/* Rows */}
      <Stack spacing={0}>
        {visibleList.map(v => (
          <GunintaRow
            key={v} vyanjana={v}
            speak={speak} speaking={speaking}
            speakRow={speakRow} stopRow={stopRow} runningRow={runningRow}
          />
        ))}
      </Stack>
    </Box>
  );
}