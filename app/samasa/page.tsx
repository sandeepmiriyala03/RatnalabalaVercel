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
import SamasaDetectorPanel from "@/app/components/SamasaDetectorPanel";
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
      { name: "ప్రథమా తత్పురుష",  example: "అర్ధ రాజ్యము",      vigraha: "రాజ్యము యొక్క అర్ధభాగము" },
      { name: "ద్వితీయా తత్పురుష", example: "కృష్ణశ్రితుడు",     vigraha: "కృష్ణుని ఆశ్రయించిన వాడు" },
      { name: "తృతీయ తత్పురుష",   example: "గుణహీనుడు",         vigraha: "గుణము చేత హీనుడు" },
      { name: "చతుర్థీ తత్పురుష",  example: "పూజాగృహము",         vigraha: "పూజ కొఱకు గృహము" },
      { name: "పంచమీ తత్పురుష",   example: "ప్రాణాధికుడు",       vigraha: "ప్రాణముకంటె అధికుడు" },
      { name: "షష్ఠీ తత్పురుష",    example: "రాజభటుడు",          vigraha: "రాజుయొక్క భటుడు" },
      { name: "సప్తమీ తత్పురుష",   example: "గృహకృత్యములు",      vigraha: "గృహమందలి కృత్యములు" },
      { name: "నఞ్ తత్పురుష",      example: "అజ్ఞానము",           vigraha: "జ్ఞానము లేనిది" },
    ],
    examples: [
      { samasa: "రామబాణము",    vigraha: "రాముని యొక్క బాణము" },
      { samasa: "రాజభటుడు",   vigraha: "రాజుయొక్క భటుడు" },
      { samasa: "చెట్టుకొమ్మ", vigraha: "చెట్టు యొక్క కొమ్మ" },
      { samasa: "అజ్ఞానము",   vigraha: "జ్ఞానము లేనిది" },
    ],
  },
  {
    id: 2, name: "కర్మధారయ సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "విశేషణ, విశేష్యముల తో ఏర్పడు సమాసము కర్మధారయ సమాసము. ఇది సమానాధికరణ సమాసము.",
    pradhanyam: "విశేషణ-విశేష్య సంబంధం",
    vigrahyaVakya: "విశేషణంతో కూడిన విశేష్యం",
    subtypes: [
      { name: "విశేషణ పూర్వపద",         example: "పెద్ద గుఱ్ఱము",       vigraha: "పెద్దదైన గుఱ్ఱము" },
      { name: "విశేషణ ఉత్తరపద",         example: "బ్రాహ్మణ వృద్ధుడు",    vigraha: "వృద్ధుడైన బ్రాహ్మణుడు" },
      { name: "ఉపమాన పూర్వపద",         example: "చిగురు కేలు",          vigraha: "చిగురువంటి కేలు" },
      { name: "ఉపమాన ఉత్తరపద",         example: "చరణ కమలము",           vigraha: "కమలము వంటి చరణము" },
      { name: "రూపక సమాసము",           example: "కోపాగ్ని",             vigraha: "కోపమనెడి అగ్ని" },
      { name: "సంభావనా పూర్వపద",       example: "గంగానది",              vigraha: "గంగ అను పేరుగల నది" },
      { name: "మధ్యమ పద సమాసము",       example: "గాజుల సెట్టి",          vigraha: "గాజులమ్ము సెట్టి" },
    ],
    examples: [
      { samasa: "సరసపుమాట",    vigraha: "సరసమైన మాట" },
      { samasa: "ముఖారవిందము", vigraha: "అరవిందము వంటి ముఖము" },
      { samasa: "విద్యాధనము",  vigraha: "విద్యయనెడి ధనము" },
      { samasa: "మధురానగరము",  vigraha: "మధుర అను పేరుగల నగరము" },
    ],
  },
  {
    id: 3, name: "ద్విగు సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "సంఖ్యా వాచకపదము పూర్వమున కలది ద్విగు సమాసము. ఇందు సంఖ్య మొదటి పదముగా ఉంటుంది.",
    pradhanyam: "పూర్వపద ప్రాధాన్యము (సంఖ్య)",
    vigrahyaVakya: "సంఖ్య + నామవాచకం = సమాహారం",
    subtypes: [
      { name: "తద్ధితార్థ ద్విగువు",   example: "షాణ్మాతురుడు",   vigraha: "ఆఱుగురు తల్లుల కొడుకు" },
      { name: "ఉత్తరపద ద్విగువు",     example: "పంచగవధనుడు",     vigraha: "ఐదు ఆవులు ధనముగా గలవాడు" },
      { name: "సమాహార ద్విగువు",      example: "త్రిలోకి",         vigraha: "మూడు లోకముల సమాహారము" },
    ],
    examples: [
      { samasa: "త్రిలోకి",     vigraha: "మూడు లోకముల సమాహారము" },
      { samasa: "పంచభూతాలు",  vigraha: "ఐదు భూతముల సమాహారము" },
      { samasa: "అష్టదిక్కులు",vigraha: "ఎనిమిది దిక్కుల సమాహారము" },
      { samasa: "సప్తర్షులు",   vigraha: "ఏడుగురు ఋషుల సమాహారము" },
    ],
  },
  {
    id: 4, name: "ద్వంద్వ సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "ఉభయ పదముల అర్ధము ప్రధానముగా గలది ద్వంద్వ సమాసము. విగ్రహ వాక్యమున 'ను' అను సంయోజకం చేర్చబడును.",
    pradhanyam: "ఉభయ పద ప్రాధాన్యము",
    vigrahyaVakya: "మొదటిపదం + ను + రెండవపదం",
    subtypes: [
      { name: "ద్విపద ద్వంద్వము",  example: "రామకృష్ణులు",             vigraha: "రాముడును కృష్ణుడును" },
      { name: "బహుపద ద్వంద్వము", example: "ధర్మార్థకామమోక్షాలు",      vigraha: "ధర్మము అర్థము కామము మోక్షము" },
    ],
    examples: [
      { samasa: "రాధాకృష్ణులు",  vigraha: "రాధ యును కృష్ణుడును" },
      { samasa: "తల్లిదండ్రులు", vigraha: "తల్లి యును తండ్రి యును" },
      { samasa: "సీతారాములు",    vigraha: "సీత యును రాముడును" },
      { samasa: "శివకేశవులు",    vigraha: "శివుడును కేశవుడును" },
    ],
  },
  {
    id: 5, name: "బహువ్రీహి సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "రెండు పదముల అర్థము లేక వేరైన మరొక అర్థము ప్రధానమైన సమాసము బహువ్రీహి. అన్యపదార్థము ప్రధానమైనది.",
    pradhanyam: "అన్యపదార్థ ప్రాధాన్యము",
    vigrahyaVakya: "కలవాడు / కలది అని వస్తుంది",
    subtypes: [
      { name: "సామాన్య బహువ్రీహి",     example: "పీతాంబరుడు", vigraha: "పచ్చని వస్త్రము కలవాడు (విష్ణువు)" },
      { name: "స్త్రీ వాచ్య బహువ్రీహి", example: "పద్మాలయ",    vigraha: "పద్మము నిలయముగా కలది (లక్ష్మి)" },
    ],
    examples: [
      { samasa: "పీతాంబరుడు",  vigraha: "పచ్చని వస్త్రము కలవాడు" },
      { samasa: "కమలాక్షుడు",  vigraha: "కమలముల వంటి కన్నులు కలవాడు" },
      { samasa: "చతుర్భుజుడు", vigraha: "నాలుగు భుజములు కలవాడు" },
      { samasa: "గజాననుడు",    vigraha: "గజము వంటి ముఖము కలవాడు" },
    ],
  },
  {
    id: 6, name: "అవ్యయీభావ సమాసము", category: "ముఖ్య సమాసాలు",
    definition: "లింగ, వచన, విభక్తులు లేని అవ్యయములు. అవ్యయము పూర్వపదముగా కలది అవ్యయీభావ సమాసము. తెలుగులో ఇది చాలా తక్కువగా వాడబడును.",
    pradhanyam: "అవ్యయ పూర్వపదం",
    vigrahyaVakya: "పదము పదము అని వస్తుంది",
    subtypes: [
      { name: "యథా అవ్యయీభావము",   example: "యథావిధి",    vigraha: "విధినతిక్రమింపక" },
      { name: "ప్రతి అవ్యయీభావము",  example: "ప్రతిదినము", vigraha: "దినము దినము" },
    ],
    examples: [
      { samasa: "యథావిధి",   vigraha: "విధి ప్రకారం" },
      { samasa: "ప్రతిదినము",vigraha: "దినము దినము" },
      { samasa: "ప్రత్యహము", vigraha: "ప్రతి రోజు" },
      { samasa: "యథాశక్తి",  vigraha: "శక్తిని అనుసరించి" },
    ],
  },
];

const CAT_COLOR: Record<string, string> = { "ముఖ్య సమాసాలు": "#2d6a4f" };
const SAMASA_COLORS = ["#2d6a4f","#1a5276","#6c3483","#784212","#922b21","#1a5c3a"];

/* ═══════════════════════════════════════════
   SAMASA CARD
═══════════════════════════════════════════ */
function SamasaCard({ rule, colorIdx }: { rule: typeof SAMASA_RULES[0]; colorIdx: number }) {
  const [open, setOpen] = useState(false);
  const color = SAMASA_COLORS[colorIdx % SAMASA_COLORS.length];

  return (
    <Card elevation={0} sx={{
      border: `1px solid ${alpha(color, 0.2)}`, borderRadius: "14px",
      overflow: "hidden", transition: "box-shadow 0.2s",
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
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>రకాలు</Typography>
            <Stack spacing={0.6} mb={2}>
              {rule.subtypes.map((sub, i) => (
                <Stack key={i} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1}
                  sx={{ background: alpha(color, 0.04), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif", minWidth: 180 }}>
                    {sub.name}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color, fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700 }}>{sub.example}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>= {sub.vigraha}</Typography>
                </Stack>
              ))}
            </Stack>

            {/* Examples */}
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>ఉదాహరణలు</Typography>
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
   MAIN PAGE
═══════════════════════════════════════════ */
export default function SamasaMalaPage() {
  const [tab, setTab]       = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    SAMASA_RULES.filter(r => {
      const q = search.toLowerCase();
      return !q || r.name.includes(q) || r.definition.includes(q) ||
        r.examples.some(e => e.samasa.includes(q) || e.vigraha.includes(q));
    }), [search]);

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
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                "{search}" కి సమాసాలు దొరకలేదు
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filtered.map((rule, i) => <SamasaCard key={rule.id} rule={rule} colorIdx={i} />)}
            </Stack>
          )}
        </Box>
      )}

      {/* TAB 1 — DETECTOR */}
      {tab === 1 && <SamasaDetectorPanel />}

     
    </Box>
  );
}