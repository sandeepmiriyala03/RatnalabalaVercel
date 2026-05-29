"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Typography, Card, CardContent, Chip,
  TextField, InputAdornment, Collapse, Divider,
  Stack, Button, alpha, useTheme, Tab, Tabs,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import FindInPageRoundedIcon from "@mui/icons-material/FindInPageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const SAMASA_RULES = [
  {
    id: 1, name: "తత్పురుష సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "ఉత్తర పదార్థము ప్రధానముగా గలది తత్పురుష సమాసము. మొదటి పదము లోపించిన విభక్తి పేరు సమాసమునకు వచ్చును.",
    pradhanyam: "ఉత్తరపద ప్రాధాన్యము",
    vigrahyaVakya: "లోపించిన విభక్తిని చేర్చి చెప్పుట",
    subtypes: [
      { name: "ప్రథమా తత్పురుష", example: "అర్ధ రాజ్యము", vigraha: "రాజ్యము యొక్క అర్ధభాగము" },
      { name: "ద్వితీయా తత్పురుష", example: "కృష్ణశ్రితుడు", vigraha: "కృష్ణుని ఆశ్రయించిన వాడు" },
      { name: "తృతీయ తత్పురుష", example: "గుణహీనుడు", vigraha: "గుణము చేత హీనుడు" },
      { name: "చతుర్థీ తత్పురుష", example: "పూజాగృహము", vigraha: "పూజ కొఱకు గృహము" },
      { name: "పంచమీ తత్పురుష", example: "ప్రాణాధికుడు", vigraha: "ప్రాణముకంటె అధికుడు" },
      { name: "షష్ఠీ తత్పురుష", example: "రాజభటుడు", vigraha: "రాజుయొక్క భటుడు" },
      { name: "సప్తమీ తత్పురుష", example: "గృహకృత్యములు", vigraha: "గృహమందలి కృత్యములు" },
      { name: "నఞ్ తత్పురుష", example: "అజ్ఞానము", vigraha: "జ్ఞానము లేనిది" },
    ],
    examples: [
      { samasa: "రామబాణము", vigraha: "రాముని యొక్క బాణము" },
      { samasa: "రాజభటుడు", vigraha: "రాజుయొక్క భటుడు" },
      { samasa: "చెట్టుకొమ్మ", vigraha: "చెట్టు యొక్క కొమ్మ" },
      { samasa: "అజ్ఞానము", vigraha: "జ్ఞానము లేనిది" },
    ],
  },
  {
    id: 2, name: "కర్మధారయ సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "విశేషణ, విశేష్యముల (నామవాచకము) తో ఏర్పడు సమాసము కర్మధారయ సమాసము. ఇది సమానాధికరణ సమాసము.",
    pradhanyam: "విశేషణ-విశేష్య సంబంధం",
    vigrahyaVakya: "విశేషణంతో కూడిన విశేష్యం",
    subtypes: [
      { name: "విశేషణ పూర్వపద", example: "పెద్ద గుఱ్ఱము", vigraha: "పెద్దదైన గుఱ్ఱము" },
      { name: "విశేషణ ఉత్తరపద", example: "బ్రాహ్మణ వృద్ధుడు", vigraha: "వృద్ధుడైన బ్రాహ్మణుడు" },
      { name: "ఉపమాన పూర్వపద", example: "చిగురు కేలు", vigraha: "చిగురువంటి కేలు" },
      { name: "ఉపమాన ఉత్తరపద", example: "చరణ కమలము", vigraha: "కమలము వంటి చరణము" },
      { name: "రూపక సమాసము", example: "కోపాగ్ని", vigraha: "కోపమనెడి అగ్ని" },
      { name: "సంభావనా పూర్వపద", example: "గంగానది", vigraha: "గంగ అను పేరుగల నది" },
      { name: "త్రికపూర్వక", example: "ఆ కన్య", vigraha: "ఆ అను కన్య" },
      { name: "మధ్యమ పద సమాసము", example: "గాజుల సెట్టి", vigraha: "గాజులమ్ము సెట్టి" },
    ],
    examples: [
      { samasa: "సరసపుమాట", vigraha: "సరసమైన మాట" },
      { samasa: "ముఖారవిందము", vigraha: "అరవిందము వంటి ముఖము" },
      { samasa: "విద్యాధనము", vigraha: "విద్యయనెడి ధనము" },
      { samasa: "మధురానగరము", vigraha: "మధుర అను పేరుగల నగరము" },
    ],
  },
  {
    id: 3, name: "ద్విగు సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "సంఖ్యా వాచకపదము పూర్వమున కలది ద్విగు సమాసము. ఇందు సంఖ్య మొదటి పదముగా ఉంటుంది.",
    pradhanyam: "పూర్వపద ప్రాధాన్యము (సంఖ్య)",
    vigrahyaVakya: "సంఖ్య + నామవాచకం",
    subtypes: [
      { name: "తద్ధితార్థ ద్విగువు", example: "షాణ్మాతురుడు", vigraha: "ఆఱుగురు తల్లుల కొడుకు" },
      { name: "ఉత్తరపద ద్విగువు", example: "పంచగవధనుడు", vigraha: "ఐదు ఆవులు ధనముగా గలవాడు" },
      { name: "సమాహార ద్విగువు", example: "త్రిలోకి", vigraha: "మూడు లోకముల సమాహారము" },
    ],
    examples: [
      { samasa: "త్రిలోకి", vigraha: "మూడు లోకముల సమాహారము" },
      { samasa: "పంచభూతాలు", vigraha: "ఐదు భూతముల సమాహారము" },
      { samasa: "అష్టదిక్కులు", vigraha: "ఎనిమిది దిక్కుల సమాహారము" },
      { samasa: "సప్తర్షులు", vigraha: "ఏడుగురు ఋషుల సమాహారము" },
    ],
  },
  {
    id: 4, name: "ద్వంద్వ సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "ఉభయ పదముల అర్ధము ప్రధానముగా గలది ద్వంద్వ సమాసము. విగ్రహ వాక్యమున 'ను' అను సంయోజకం చేర్చబడును.",
    pradhanyam: "ఉభయ పద ప్రాధాన్యము",
    vigrahyaVakya: "మొదటిపదం + ను + రెండవపదం",
    subtypes: [
      { name: "ద్విపద ద్వంద్వము", example: "రామకృష్ణులు", vigraha: "రాముడును కృష్ణుడును" },
      { name: "బహుపద ద్వంద్వము", example: "ధర్మార్థకామమోక్షములు", vigraha: "ధర్మము అర్థము కామము మోక్షము" },
    ],
    examples: [
      { samasa: "రాధాకృష్ణులు", vigraha: "రాధ యును కృష్ణుడును" },
      { samasa: "అన్నదమ్ములు", vigraha: "అన్న యును తమ్ముడును" },
      { samasa: "సత్త్వరజస్తమోగుణములు", vigraha: "సత్త్వము రజస్సు తమస్సు" },
      { samasa: "శివకేశవులు", vigraha: "శివుడును కేశవుడును" },
    ],
  },
  {
    id: 5, name: "బహువ్రీహి సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "రెండు పదముల అర్థము లేక వేరైన మరొక అర్థము ప్రధానమైన సమాసము బహువ్రీహి. అన్యపదార్థము ప్రధానమైనది.",
    pradhanyam: "అన్యపదార్థ ప్రాధాన్యము",
    vigrahyaVakya: "కలవాడు / కలది అని వస్తుంది",
    subtypes: [
      { name: "సామాన్య బహువ్రీహి", example: "పీతాంబరుడు", vigraha: "పచ్చని వస్త్రము కలవాడు (విష్ణువు)" },
      { name: "స్త్రీ వాచ్య బహువ్రీహి", example: "పద్మాలయ", vigraha: "పద్మము నిలయముగా కలది (లక్ష్మి)" },
    ],
    examples: [
      { samasa: "పీతాంబరుడు", vigraha: "పచ్చని వస్త్రము కలవాడు" },
      { samasa: "కమలాక్షుడు", vigraha: "కమలముల వంటి కన్నులు కలవాడు" },
      { samasa: "చతుర్భుజుడు", vigraha: "నాలుగు భుజములు కలవాడు" },
      { samasa: "గజాననుడు", vigraha: "గజము వంటి ముఖము కలవాడు" },
    ],
  },
  {
    id: 6, name: "అవ్యయీభావ సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "లింగ, వచన, విభక్తులు లేని అవ్యయములు. అవ్యయము పూర్వపదముగా కలది అవ్యయీభావ సమాసము. తెలుగులో ఇది చాలా తక్కువగా వాడబడును.",
    pradhanyam: "అవ్యయ పూర్వపదం",
    vigrahyaVakya: "పదము పదము అని వస్తుంది",
    subtypes: [
      { name: "యథా అవ్యయీభావము", example: "యథావిధి", vigraha: "విధినతిక్రమింపక" },
      { name: "ప్రతి అవ్యయీభావము", example: "ప్రతిదినము", vigraha: "దినము దినము" },
      { name: "ప్రత్యహము", example: "ప్రత్యహము", vigraha: "అహము అహము (ప్రతిరోజు)" },
    ],
    examples: [
      { samasa: "యథావిధి", vigraha: "విధి ప్రకారం" },
      { samasa: "ప్రతిదినము", vigraha: "దినము దినము" },
      { samasa: "ప్రత్యహము", vigraha: "ప్రతి రోజు" },
      { samasa: "యథాశక్తి", vigraha: "శక్తిని అనుసరించి" },
    ],
  },
];

const SAMASA_TYPES = [
  { label: "సాంస్కృతిక సమాసము", desc: "కేవలం సంస్కృత పదాలతో" },
  { label: "ఆచ్చిక సమాసము", desc: "అచ్చ తెలుగు పదాలతో" },
  { label: "మిశ్రమ సమాసము", desc: "సంస్కృత + తెలుగు పదాలతో" },
];

const CATEGORIES = ["అన్నీ", "ముఖ్య సమాసాలు"];

const CAT_COLOR: Record<string, string> = {
  "ముఖ్య సమాసాలు": "#2d6a4f",
};

const SAMASA_COLORS = [
  "#2d6a4f", "#1a5276", "#6c3483", "#784212", "#922b21", "#1a5c3a",
];

/* ═══════════════════════════════════════════
   SAMASA DETECTOR ENGINE
═══════════════════════════════════════════ */
interface DetectResult {
  detected: boolean;
  samasaId: number;
  samasaName: string;
  definition: string;
  pradhanyam: string;
  vigraha: string;
  category: string;
  examples: { samasa: string; vigraha: string }[];
  subtype?: string;
}

function detectSamasa(word: string): DetectResult {
  const NOT_FOUND: DetectResult = {
    detected: false, samasaId: 0, samasaName: "", definition: "",
    pradhanyam: "", vigraha: "", category: "", examples: [],
  };

  const match = (id: number, vigraha: string, subtype?: string): DetectResult => {
    const r = SAMASA_RULES.find(x => x.id === id)!;
    return {
      detected: true, samasaId: r.id, samasaName: r.name,
      definition: r.definition, pradhanyam: r.pradhanyam,
      vigraha, category: r.category, examples: r.examples, subtype,
    };
  };

  const w = word.trim();

  // ── ద్వంద్వ సమాసము — రెండు proper nouns కలిసి ══
  if (/రామకృష్ణ|రాధాకృష్ణ|శివకేశవ|అన్నదమ్మ|సీతారామ|లక్ష్మీనారాయణ/.test(w))
    return match(4, `${w.slice(0, w.length/2)} + ను + ${w.slice(w.length/2)}`, "ద్విపద ద్వంద్వము");

  if (/ధర్మార్థ|కామమోక్ష|సత్త్వరజస్|పురుషార్థ/.test(w))
    return match(4, "బహుపదాల సమాహారం", "బహుపద ద్వంద్వము");

  // ── ద్విగు సమాసము — సంఖ్య మొదలు ══
  if (/^(త్రి|చతుర్|పంచ|సప్త|అష్ట|నవ|దశ|ద్వి|ద్వా|షట్|శత)/.test(w))
    return match(3, `సంఖ్య + ${w.replace(/^(త్రి|చతుర్|పంచ|సప్త|అష్ట|నవ|దశ|ద్వి|ద్వా|షట్|శత)/, "")} = సమాహారం`, "సమాహార ద్విగువు");

  // ── బహువ్రీహి సమాసము — కలవాడు అర్థం ══
  if (/పీతాంబర|కమలాక్ష|గజానన|చతుర్భుజ|పద్మాలయ|చంద్రశేఖర|నీలకంఠ|త్రిలోచన|విశ్వంభర/.test(w))
    return match(5, `${w} = __ కలవాడు`, "సామాన్య బహువ్రీహి");

  // ── అవ్యయీభావ సమాసము ══
  if (/^(యథా|ప్రతి|ప్రత్య|అను|ఆ|అధి|అప|అభి|పరి|వి)/.test(w))
    return match(6, `అవ్యయం + పదం = ${w}`, "అవ్యయీభావ సమాసము");

  // ── కర్మధారయ — ఉపమాన పదాలు ══
  if (/కమల$|అరవింద$|చంద్ర$|సూర్య$|అగ్ని$/.test(w) || /ముఖ|పాద|నయన|నేత్ర|వదన/.test(w))
    return match(2, `${w} = __వంటి __`, "ఉపమాన ఉత్తరపద కర్మధారయ");

  if (/చిగురు|బింబ|పద్మ/.test(w) && /కేలు|ఓష్ఠ|పాద/.test(w))
    return match(2, `${w} = __వంటి __`, "ఉపమాన పూర్వపద కర్మధారయ");

  // ── కర్మధారయ — రూపక సమాసము ══
  if (/అగ్ని$|ధనము$|సాగర$|రాజు$/.test(w) && w.includes("కోప|విద్య|జ్ఞాన|భక్తి"))
    return match(2, `${w} = __అనెడి __`, "రూపక సమాసము");

  // ── కర్మధారయ — విశేషణ పూర్వపద ══
  if (/^(మంచి|పెద్ద|చిన్న|నల్ల|తెల్ల|అందమైన|సరస|మృదు|మధుర)/.test(w))
    return match(2, `విశేషణం + విశేష్యం = ${w}`, "విశేషణ పూర్వపద కర్మధారయ");

  // ── తత్పురుష — షష్ఠీ (యొక్క) ══
  if (/భటుడు$|కొమ్మ$|పుత్రుడు$|కుమారుడు$|కొడుకు$|పుత్రి$/.test(w))
    return match(1, `${w} = __ యొక్క __`, "షష్ఠీ తత్పురుష సమాసము");

  // ── తత్పురుష — నఞ్ (అ/అన్) ══
  if (/^(అ|అన్|అనా|నిర్|నిస్|వి|దుర్|దుస్)/.test(w) && w.length > 4)
    return match(1, `${w} = __ లేనిది / కానిది`, "నఞ్ తత్పురుష సమాసము");

  // ── తత్పురుష — general ══
  if (w.includes("బాణ") || w.includes("రాజ") || w.includes("దేవ") || w.includes("విద్య"))
    return match(1, `${w} = __ యొక్క __`, "షష్ఠీ తత్పురుష సమాసము");

  return NOT_FOUND;
}

/* ═══════════════════════════════════════════
   SAMASA CARD
═══════════════════════════════════════════ */
function SamasaCard({ rule, colorIdx }: { rule: typeof SAMASA_RULES[0]; colorIdx: number }) {
  const [open, setOpen] = useState(false);
  const color = SAMASA_COLORS[colorIdx % SAMASA_COLORS.length];

  return (
    <Card elevation={0} sx={{
      border: `1px solid ${alpha(color, 0.2)}`, borderRadius: "14px", overflow: "hidden",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: `0 4px 20px ${alpha(color, 0.12)}` },
    }}>
      <Box sx={{ height: 4, background: color }} />
      <CardContent sx={{ p: "16px 18px", "&:last-child": { pb: "16px" } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(color, 0.7), fontFamily: "'Noto Serif Telugu', serif" }}>
                {rule.id}.
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem" }, color: "text.primary", fontFamily: "'Noto Serif Telugu', serif" }}>
                {rule.name}
              </Typography>
            </Stack>
            <Chip label={rule.pradhanyam} size="small" sx={{
              fontSize: 11, height: 22, fontFamily: "'Noto Serif Telugu', serif",
              background: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.3)}`,
            }} />
          </Box>
          <Button size="small" onClick={() => setOpen(v => !v)}
            endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            sx={{
              textTransform: "none", fontWeight: 700, fontSize: 12, color,
              border: `1px solid ${alpha(color, 0.3)}`, borderRadius: "8px",
              px: 1.5, py: 0.5, minWidth: 0, "&:hover": { background: alpha(color, 0.06) },
            }}>
            {open ? "తక్కువ" : "వివరాలు"}
          </Button>
        </Stack>

        <Typography sx={{
          mt: 1.2, fontSize: 13, color: "text.secondary", lineHeight: 1.8,
          fontFamily: "'Noto Serif Telugu', serif",
          display: "-webkit-box", WebkitLineClamp: open ? "unset" : 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {rule.definition}
        </Typography>

        <Collapse in={open} timeout={280} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, borderStyle: "dashed", borderColor: alpha(color, 0.2) }} />

            {/* Vigraha vakya */}
            <Box sx={{ background: alpha(color, 0.05), borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", px: 2, py: 1.2, mb: 2 }}>
              <Typography sx={{ fontSize: 11, color, fontWeight: 700, mb: 0.3, fontFamily: "'Noto Serif Telugu', serif" }}>విగ్రహ వాక్యం</Typography>
              <Typography sx={{ fontSize: 13, color: "text.primary", fontFamily: "'Noto Serif Telugu', serif" }}>{rule.vigrahyaVakya}</Typography>
            </Box>

            {/* Subtypes */}
            {rule.subtypes.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  రకాలు
                </Typography>
                <Stack spacing={0.6}>
                  {rule.subtypes.map((sub, i) => (
                    <Stack key={i} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1}
                      sx={{ background: alpha(color, 0.04), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif", minWidth: 160 }}>
                        {sub.name}
                      </Typography>
                      <Typography sx={{ fontSize: 13, color, fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700 }}>{sub.example}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>= {sub.vigraha}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Examples */}
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>
              ఉదాహరణలు
            </Typography>
            <Stack spacing={0.8}>
              {rule.examples.map((ex, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5}
                  sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif", minWidth: 120 }}>{ex.samasa}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>=</Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.vigraha}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   DETECTOR RESULT CARD
═══════════════════════════════════════════ */
function DetectorResult({ res, input }: { res: DetectResult; input: string }) {
  const colorIdx = res.samasaId - 1;
  const color = SAMASA_COLORS[colorIdx % SAMASA_COLORS.length];
  return (
    <Card elevation={0} sx={{ border: `2px solid ${alpha(color, 0.4)}`, borderRadius: "14px", overflow: "hidden" }}>
      <Box sx={{ height: 5, background: color }} />
      <CardContent sx={{ p: "20px 22px !important" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.4rem" }, color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {res.samasaName}
            </Typography>
            {res.subtype && (
              <Chip label={res.subtype} size="small" sx={{
                mt: 0.5, fontFamily: "'Noto Serif Telugu', serif", fontSize: 12, height: 24,
                background: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.3)}`,
              }} />
            )}
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color }}>{res.samasaId}</Typography>
          </Box>
        </Stack>

        {/* Input word */}
        <Box sx={{ background: alpha(color, 0.07), borderRadius: "8px", px: 2, py: 1.2, mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", mb: 0.3 }}>మీరు ఇచ్చిన పదం</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Noto Serif Telugu', serif" }}>{input}</Typography>
        </Box>

        {/* Vigraha */}
        <Box sx={{ background: alpha(color, 0.05), borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", px: 2, py: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 11, color, fontWeight: 700, mb: 0.5, fontFamily: "'Noto Serif Telugu', serif" }}>విగ్రహ వాక్యం</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "text.primary", fontFamily: "'Noto Serif Telugu', serif" }}>{res.vigraha}</Typography>
        </Box>

        {/* Pradhanyam */}
        <Box sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 2, py: 1.2, mb: 2 }}>
          <Typography sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", mb: 0.3 }}>ప్రాధాన్యత</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{res.pradhanyam}</Typography>
        </Box>

        {/* Definition */}
        <Box sx={{ background: alpha(color, 0.04), borderLeft: `3px solid ${alpha(color, 0.5)}`, borderRadius: "0 8px 8px 0", px: 2, py: 1.2, mb: 2 }}>
          <Typography sx={{ fontSize: 11, color, fontWeight: 700, mb: 0.3, fontFamily: "'Noto Serif Telugu', serif" }}>నిర్వచనం</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.9, fontFamily: "'Noto Serif Telugu', serif" }}>{res.definition}</Typography>
        </Box>

        {/* Examples */}
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>ఉదాహరణలు</Typography>
        <Stack spacing={0.8}>
          {res.examples.map((ex, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1}
              sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif", minWidth: 120 }}>{ex.samasa}</Typography>
              <Typography sx={{ color: "text.secondary" }}>=</Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.vigraha}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function SamasaMalaPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [tried, setTried] = useState(false);

  const SAMPLES = [
    "రామకృష్ణులు","పీతాంబరుడు","త్రిలోకి","అజ్ఞానము",
    "కమలాక్షుడు","యథావిధి","రాజభటుడు","ముఖారవిందము",
    "పంచభూతాలు","గజాననుడు",
  ];

  const filtered = useMemo(() =>
    SAMASA_RULES.filter(r => {
      const q = search.toLowerCase();
      return !q || r.name.includes(q) || r.definition.includes(q) ||
        r.examples.some(e => e.samasa.includes(q) || e.vigraha.includes(q));
    }), [search]);

  const handleDetect = () => {
    if (!input.trim()) return;
    setDetectResult(detectSamasa(input.trim()));
    setTried(true);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={1}>
          <AutoStoriesRoundedIcon sx={{ color: "#2d6a4f", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "#1a3d2b", fontFamily: "'Noto Serif Telugu', serif" }}>
            సమాస మాల
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8, maxWidth: 600, mx: "auto" }}>
          తెలుగు వ్యాకరణంలో సమాస నిర్వచనాలు, రకాలు, విగ్రహ వాక్యాలతో
        </Typography>
        <Stack direction="row" justifyContent="center" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
          {SAMASA_TYPES.map((t, i) => (
            <Chip key={i} label={t.label} size="small" sx={{
              fontFamily: "'Noto Serif Telugu', serif", fontSize: 11,
              background: alpha(SAMASA_COLORS[i], 0.1), color: SAMASA_COLORS[i],
              border: `1px solid ${alpha(SAMASA_COLORS[i], 0.3)}`,
            }} />
          ))}
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": { fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700, fontSize: 14, textTransform: "none" },
            "& .Mui-selected": { color: "#2d6a4f !important" },
            "& .MuiTabs-indicator": { background: "#2d6a4f" },
          }}>
          <Tab icon={<MenuBookRoundedIcon fontSize="small" />} iconPosition="start" label="సమాస జాబితా" />
          <Tab icon={<FindInPageRoundedIcon fontSize="small" />} iconPosition="start" label="సమాస గుర్తించు" />
        </Tabs>
      </Box>

      {/* TAB 0 — LIST */}
      {tab === 0 && (
        <Box>
          <TextField fullWidth placeholder="సమాస పేరు లేదా ఉదాహరణ వెతకండి..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
              sx: { borderRadius: "12px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 15 },
            }}
            sx={{ mb: 3 }} />
          <Stack spacing={2}>
            {filtered.map((rule, i) => <SamasaCard key={rule.id} rule={rule} colorIdx={i} />)}
          </Stack>
          {filtered.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                "{search}" కి సమాసాలు దొరకలేదు
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1 — DETECTOR */}
      {tab === 1 && (
        <Box>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: alpha("#2d6a4f", 0.2), borderRadius: "14px", mb: 2.5 }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5, fontFamily: "'Noto Serif Telugu', serif" }}>
                తెలుగు సమాస పదం టైప్ చేయండి — సమాసం automatic గా గుర్తించబడుతుంది
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth value={input}
                  onChange={e => { setInput(e.target.value); setTried(false); setDetectResult(null); }}
                  onKeyDown={e => e.key === "Enter" && handleDetect()}
                  placeholder="ఉదా: పీతాంబరుడు, రామకృష్ణులు, త్రిలోకి..."
                  InputProps={{ sx: { borderRadius: "10px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 18 } }}
                />
                <Button variant="contained" disableElevation onClick={handleDetect} disabled={!input.trim()}
                  sx={{
                    borderRadius: "10px", px: 3, background: "#2d6a4f",
                    fontWeight: 700, fontSize: 14, textTransform: "none",
                    fontFamily: "'Noto Serif Telugu', serif",
                    "&:hover": { background: "#1a3d2b" },
                  }}>
                  గుర్తించు
                </Button>
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 1, fontFamily: "'Noto Serif Telugu', serif" }}>
                  ఉదాహరణలు click చేయండి:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
                  {SAMPLES.map(s => (
                    <Chip key={s} label={s} size="small"
                      onClick={() => { setInput(s); setDetectResult(null); setTried(false); }}
                      sx={{
                        fontFamily: "'Noto Serif Telugu', serif", fontSize: 13, cursor: "pointer",
                        background: alpha("#2d6a4f", 0.07), color: "#2d6a4f",
                        border: `1px solid ${alpha("#2d6a4f", 0.2)}`,
                        "&:hover": { background: alpha("#2d6a4f", 0.15) },
                      }} />
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Collapse in={tried} timeout={300}>
            {detectResult?.detected ? (
              <DetectorResult res={detectResult} input={input} />
            ) : tried && (
              <Card elevation={0} sx={{ border: "1px solid", borderColor: alpha("#e74c3c", 0.3), borderRadius: "14px" }}>
                <CardContent sx={{ p: "20px !important", textAlign: "center" }}>
                  <Typography sx={{ fontSize: "2rem", mb: 1 }}></Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#e74c3c", fontFamily: "'Noto Serif Telugu', serif", mb: 0.5 }}>
                    సమాసం గుర్తించలేకపోయాం
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                    "{input}" లో సమాసం detect కాలేదు. వేరే పదం try చేయండి.
                  </Typography>
                  <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={0.8} mt={2} useFlexGap>
                    {["పీతాంబరుడు","త్రిలోకి","రామకృష్ణులు"].map(s => (
                      <Chip key={s} label={s} size="small"
                        onClick={() => { setInput(s); setDetectResult(null); setTried(false); }}
                        sx={{ fontFamily: "'Noto Serif Telugu', serif", cursor: "pointer", background: alpha("#2d6a4f", 0.08), color: "#2d6a4f" }} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Collapse>
        </Box>
      )}


    </Box>
  );
}