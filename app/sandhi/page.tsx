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
const SANDHI_RULES = [
  {
    id: 1, name: "సవర్ణదీర్ఘ సంధి", category: "స్వర సంధి",
    rule: "అ, ఇ, ఉ, ఋ లకు సవర్ణములగు అచ్చులు పరమైనపుడు వాని దీర్ఘములు ఏకాదేశంబగును",
    purva: "అ / ఇ / ఉ / ఋ", para: "సవర్ణ అచ్చు", result: "దీర్ఘం",
    examples: [
      { before: "సుర + అరులు", after: "సురారులు" },
      { before: "ముని + ఇంద్ర", after: "మునీంద్ర" },
    ],
  },
  {
    id: 2, name: "గుణసంధి", category: "స్వర సంధి",
    rule: "అకారమునకు ఇ, ఉ, ఋ లు పరమయినపుడు ఏ, ఓ, ఆర్ లు ఏకాదేశముగా వచ్చెను",
    purva: "అ", para: "ఇ / ఉ / ఋ", result: "ఏ / ఓ / ఆర్",
    examples: [
      { before: "దేవ + ఇంద్ర", after: "దేవేంద్ర" },
      { before: "సర్వ + ఉపగతుడు", after: "సర్వోపగతుడు" },
      { before: "రాజ + ఋషి", after: "రాజర్షి" },
    ],
  },
  {
    id: 3, name: "వృద్ధి సంధి", category: "స్వర సంధి",
    rule: "అకారమునకు ఏ, ఐలు పరమైన ఐ కారమును; ఓ, ఔలు పరమైన ఔ కారమును ఏకాదేశముగా వచ్చును",
    purva: "అ", para: "ఏ / ఐ / ఓ / ఔ", result: "ఐ / ఔ",
    examples: [
      { before: "రక్ష + ఏక", after: "రక్షైక" },
      { before: "పద + ఔన్నత్యము", after: "పదౌన్నత్యము" },
    ],
  },
  {
    id: 4, name: "యణాదేశ సంధి", category: "స్వర సంధి",
    rule: "ఇ,ఉ,ఋ లకు అసవర్ణములగు అచ్చులు పరమగునపుడు వరుసగా య,వ,ర లు ఆదేశముగా వచ్చెను",
    purva: "ఇ / ఉ / ఋ", para: "అసవర్ణ అచ్చు", result: "య / వ / ర",
    examples: [
      { before: "అతి + అంత", after: "అత్యంత" },
      { before: "మను + అంతరము", after: "మన్వంతరము" },
    ],
  },
  {
    id: 5, name: "అనునాసిక సంధి", category: "హల్ సంధి",
    rule: "క,చ,ట,త,ప లకు స,మ లు పరమైనపుడు వరుసగా జ,ణ,జ్ఞ,మ లు వికల్పముగా ఆదేశమగును",
    purva: "క / చ / ట / త / ప", para: "స / మ", result: "జ / ణ / జ్ఞ / మ",
    examples: [{ before: "వాక్ + మానసంబులకు", after: "వాజ్మానసంబులకు" }],
  },
  {
    id: 6, name: "శ్చత్వ సంధి", category: "హల్ సంధి",
    rule: "స, త, థ, ద, ధ లకు శ, చ, జ, ఝ లు పరమైనపుడు వికల్పముగా ఆదేశంగును",
    purva: "స / త / థ / ద / ధ", para: "శ / చ / జ / ఝ", result: "శ / జ / జ్ఞ",
    examples: [
      { before: "జగత్ + జన", after: "జగజ్జన" },
      { before: "మునివచస్ + శాపావధి", after: "మునివచశ్శాపావధి" },
    ],
  },
  {
    id: 7, name: "విసర్గ సంధి", category: "విసర్గ సంధి",
    rule: "విసర్గమునకు శ,ష,స లు పరమైనపుడు వరుసగా శ,ష,స లు ఆదేశంబగును",
    purva: "అః (విసర్గ)", para: "శ / ష / స", result: "శ / ష / స",
    examples: [
      { before: "చతుః + శ్లోక", after: "చతుశ్శ్లోక" },
      { before: "చతుః + సాగర", after: "చతుస్సాగర" },
    ],
  },
  {
    id: 8, name: "అకార సంధి", category: "తెలుగు సంధి",
    rule: "అత్తునకు సంధి బహుళముగా నగును",
    purva: "అ", para: "ఏదైనా", result: "లోపం / యడాగమం",
    examples: [
      { before: "మేన + అత్త", after: "మేనత్త" },
      { before: "తన + ఈడు", after: "తనయీడు" },
    ],
  },
  {
    id: 9, name: "ఇకార సంధి", category: "తెలుగు సంధి",
    rule: "ఏమ్యాదుల ఇత్తునకు సంధి వికల్పము",
    purva: "ఇ", para: "అచ్చు", result: "వికల్పం",
    examples: [{ before: "ఏమి + అని", after: "ఏమని" }],
  },
  {
    id: 10, name: "ఉకార సంధి", category: "తెలుగు సంధి",
    rule: "ఉత్తున కచ్చు పరంబగునపుడు సంధి యగు (నిత్యము)",
    purva: "ఉ", para: "అచ్చు", result: "నిత్యం",
    examples: [{ before: "వేనుడు + అనంగ", after: "వేనుడనంగ" }],
  },
  {
    id: 11, name: "యడాగమ సంధి", category: "ఆగమ సంధి",
    rule: "సంధిలేని చోట స్వరంబుకంటే పరంబయిన స్వరంబునకు యడాగమంబగు",
    purva: "అచ్చు", para: "అచ్చు", result: "య్ ఆగమం",
    examples: [{ before: "మా + అమ్మ", after: "మాయమ్మ" }],
  },
  {
    id: 12, name: "ఆమ్రేడిత సంధి", category: "తెలుగు సంధి",
    rule: "అచ్చునకు ఆమ్రేడితము పరమగునపుడు సంధి తరచుగానగును",
    purva: "అచ్చు", para: "ఆమ్రేడితం", result: "సంధి",
    examples: [{ before: "ఏమి + ఏమి", after: "ఏమేమి" }],
  },
  {
    id: 13, name: "త్రిక సంధి", category: "తెలుగు సంధి",
    rule: "ఆ,ఈ,ఏ సర్వనామములకు (త్రికము) మీది హల్లు పరమైన ద్విత్వంబు బహుళంగా వస్తుంది",
    purva: "ఆ / ఈ / ఏ", para: "అసంయుక్త హల్లు", result: "ద్విత్వం",
    examples: [
      { before: "ఆ + తెఱంగు", after: "అత్తెఱంగు" },
      { before: "ఏ + చోటు", after: "ఎచ్చోటు" },
    ],
  },
  {
    id: 14, name: "గసడదవాదేశ సంధి", category: "తెలుగు సంధి",
    rule: "ప్రథమము మీది పరుషములకు గ,స,డ,ద,వ లు బహుళములగును",
    purva: "ప్రథమ విభక్తి", para: "క / చ / ట / త / ప", result: "గ / స / డ / ద / వ",
    examples: [{ before: "రాముఁడు + తాను", after: "రాముఁడుఁదాను" }],
  },
  {
    id: 15, name: "పుంప్వాదేశ సంధి", category: "సమాస సంధి",
    rule: "కర్మధారయ సమాసమున సువర్ణమునకు పుంపు లగును",
    purva: "సువర్ణం", para: "కర్మధారయం", result: "పుంపు",
    examples: [{ before: "వాటము + మాట", after: "వాటపుమాట" }],
  },
  {
    id: 16, name: "రుగాగమ సంధి", category: "ఆగమ సంధి",
    rule: "పేదాదుల కాలు పరమయినపుడు రగాగము వచ్చును",
    purva: "పేద / ముద్దు", para: "ఆలు", result: "ర ఆగమం",
    examples: [
      { before: "పేద + ఆలు", after: "పేదరాలు" },
      { before: "ముద్దు + ఆలు", after: "ముద్దరాలు" },
    ],
  },
  {
    id: 17, name: "పడ్వాది సంధి", category: "తెలుగు సంధి",
    rule: "పడ్వాదులు పరమగునపుడు సువర్ణమునకు లోప పూర్ణబిందువులు వికల్పములగును",
    purva: "సువర్ణం", para: "పడ్వాది", result: "లోపం / బిందువు",
    examples: [{ before: "భయము + పడి", after: "భయపడి" }],
  },
  {
    id: 18, name: "టుగాగమ సంధి", category: "ఆగమ సంధి",
    rule: "కర్మధారయ సమాసమునందు ఉకారాంత పదమునకు అచ్చు పరమైనపుడు టుగాగమంబగు",
    purva: "ఉ-కారాంతం", para: "అచ్చు", result: "ట ఆగమం",
    examples: [{ before: "చిగురు + ఆకు", after: "చిగురుటాకు" }],
  },
  {
    id: 19, name: "నుగాగమ సంధి", category: "ఆగమ సంధి",
    rule: "షష్టీ తత్పురుష సమాసమునందు ఉకార ఋకారాంత శబ్దములకు అచ్చు పరమగునపుడు నుగాగమము వచ్చును",
    purva: "ఉ / ఋ కారాంతం", para: "అచ్చు", result: "న ఆగమం",
    examples: [
      { before: "చేయు + అతడు", after: "చేయునతడు" },
      { before: "తెలియు + అప్పుడు", after: "తెలియునప్పుడు" },
    ],
  },
  {
    id: 20, name: "ప్రాతాది సంధి", category: "తెలుగు సంధి",
    rule: "సమాసములందు ప్రాతాదుల తొలి అచ్చుమీది వర్ణములకెల్ల లోపంబు బహుళముగానగును",
    purva: "ప్రాతాది", para: "ఏదైనా", result: "లోపం",
    examples: [{ before: "క్రొత్త + అగుచు", after: "క్రొత్తయగుచు" }],
  },
  {
    id: 21, name: "ద్రుత సంధి", category: "తెలుగు సంధి",
    rule: "ద్రుత ప్రకృతికముల మీద పరుషములకు సరళమగును",
    purva: "ద్రుతం", para: "పరుషం", result: "సరళం",
    examples: [{ before: "మాధుర్యమునన్ + తేలు", after: "మాధుర్యమునఁదేలు" }],
  },
  {
    id: 22, name: "ద్విగు సమాస సంధి", category: "సమాస సంధి",
    rule: "సమానాధికారణంబగు ఉత్తరపదంబు పరంబగునపుడు మూడు శబ్దములలో డు వర్ణమునకు లోపంబగును",
    purva: "డు-వర్ణం", para: "ఉత్తరపదం", result: "లోపం + ద్విత్వం",
    examples: [{ before: "మూడు + లోకములు", after: "ముల్లోకములు" }],
  },
  {
    id: 23, name: "బహువ్రీహి సమాస సంధి", category: "సమాస సంధి",
    rule: "బహువ్రీహిని స్త్రీ వాచ్యంబునగుచో ఉపమానంబు మీది మేనునకు బోడి అగును",
    purva: "ఉపమానం", para: "మేను", result: "బోడి",
    examples: [{ before: "అలరు + మేను", after: "అలరుబోడి" }],
  },
  {
    id: 24, name: "అల్లోప సంధి", category: "తెలుగు సంధి",
    rule: "అది, అవి శబ్దముల అకారమునకు సమాసమున లోపము బహుళముగానగు",
    purva: "అది / అవి", para: "సమాసం", result: "అ-లోపం",
    examples: [{ before: "నా + అది", after: "నాది" }],
  },
  {
    id: 25, name: "దుగాగమ సంధి", category: "ఆగమ సంధి",
    rule: "నీ,నా,తన శబ్దములకు ఉత్తర పదము పరమగునపుడు దుగాగమము వికల్పముగా వచ్చును",
    purva: "నీ / నా / తన", para: "ఉత్తరపదం", result: "దు ఆగమం",
    examples: [{ before: "నీ + సుస్వరూపము", after: "నీదుసుస్వరూపము" }],
  },
  {
    id: 26, name: "ద్విరుక్తటకార సంధి", category: "తెలుగు సంధి",
    rule: "కుఱు,చిఱు,కడు,నిడు,నడు శబ్దములందలి ఱ,డ లకు అచ్చు పరమగునప్పుడు ద్విరుక్త టకారంబగు",
    purva: "కుఱు / చిఱు / కడు / నిడు / నడు", para: "అచ్చు", result: "ట్ట ద్విత్వం",
    examples: [
      { before: "కుఱు + ఉసురు", after: "కుట్టుసురు" },
      { before: "చిఱు + అడవి", after: "చిట్టడవి" },
      { before: "నడు + అడవి", after: "నట్టడవి" },
    ],
  },
];

const CATEGORIES = ["అన్నీ", "స్వర సంధి", "హల్ సంధి", "విసర్గ సంధి", "తెలుగు సంధి", "ఆగమ సంధి", "సమాస సంధి"];

const CAT_COLOR: Record<string, string> = {
  "స్వర సంధి":   "#2d6a4f",
  "హల్ సంధి":    "#1a5276",
  "విసర్గ సంధి": "#784212",
  "తెలుగు సంధి": "#6c3483",
  "ఆగమ సంధి":   "#1a5c3a",
  "సమాస సంధి":  "#922b21",
};

/* ═══════════════════════════════════════════
   SANDHI DETECTOR ENGINE
═══════════════════════════════════════════ */
interface DetectResult {
  detected: boolean;
  sandhiId: number;
  sandhiName: string;
  rule: string;
  purva: string;
  para: string;
  result: string;
  category: string;
  examples: { before: string; after: string }[];
}

function detectSandhi(word: string): DetectResult {
  const NOT_FOUND: DetectResult = {
    detected: false, sandhiId: 0, sandhiName: "", rule: "",
    purva: "", para: "", result: "", category: "", examples: [],
  };

  const match = (id: number): DetectResult => {
    const r = SANDHI_RULES.find(x => x.id === id)!;
    return { detected: true, sandhiId: r.id, sandhiName: r.name, rule: r.rule,
      purva: r.purva, para: r.para, result: r.result, category: r.category, examples: r.examples };
  };

  // 4. యణాదేశ సంధి — త్య, ద్య, న్య, వ్య, మ్వ, న్వ
  if (/[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]్య|[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]్వ/.test(word))
    return match(4);

  // 26. ద్విరుక్తటకార సంధి
  if (/చిట్ట|కుట్ట|నట్ట|కట్టెద/.test(word)) return match(26);

  // 13. త్రిక సంధి
  if (/అత్తె|ఎచ్చ|ఆట్ట|ఈట్ట/.test(word)) return match(13);

  // 22. ద్విగు సమాస సంధి
  if (/ముల్ల|త్రిల్ల/.test(word)) return match(22);

  // 16. రుగాగమ సంధి
  if (/రాలు|రాలి|రాల$/.test(word)) return match(16);

  // 18. టుగాగమ సంధి
  if (/టాకు|టాకి|టాత/.test(word)) return match(18);

  // 11. యడాగమ సంధి — vowel + య + vowel pattern
  if (/[అఆఇఈఉఊఎఏఒఓ]య[అఆఇఈఉఊఎఏఒఓ]/.test(word)) return match(11);

  // 24. అల్లోప సంధి
  if (/నాది|వాది|తనది|వీడిది/.test(word) || (word.endsWith("ది") && word.length > 3)) return match(24);

  // 3. వృద్ధి సంధి — ై
  if (/ై/.test(word) && !/[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]ై/.test(word)) return match(3);

  // 2. గుణసంధి — ే + ంద్ర or ో
  if (/ేంద్ర|ేశ్వర|ేంద్రు|ోత్సవ|ోపగత|ార్షి/.test(word)) return match(2);

  // 1. సవర్ణదీర్ఘ సంధి — ీంద్ర or ూత్సవ
  if (/ీంద్ర|ూత్సవ|ారులు|ీంద్రు/.test(word)) return match(1);

  // 8. అకార సంధి — double consonant హల్లు merge
  if (/[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]త్త/.test(word)) return match(8);

  // 14. గసడదవాదేశ సంధి
  if (/డుద|డుగ|డుజ|డుబ/.test(word)) return match(14);

  // 19. నుగాగమ సంధి
  if (/యున|లున|వున/.test(word)) return match(19);

  return NOT_FOUND;
}

/* ═══════════════════════════════════════════
   SANDHI CARD (for list view)
═══════════════════════════════════════════ */
function SandhiCard({ rule }: { rule: typeof SANDHI_RULES[0] }) {
  const [open, setOpen] = useState(false);
  const color = CAT_COLOR[rule.category] || "#2d6a4f";
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
            <Chip label={rule.category} size="small" sx={{
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
          {rule.rule}
        </Typography>

        <Collapse in={open} timeout={280} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, borderStyle: "dashed", borderColor: alpha(color, 0.2) }} />
            <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap" useFlexGap>
              {[
                { label: "పూర్వం", value: rule.purva },
                { label: "+", value: null },
                { label: "పరం", value: rule.para },
                { label: "→", value: null },
                { label: "ఫలితం", value: rule.result },
              ].map((item, i) =>
                item.value === null ? (
                  <Typography key={i} sx={{ color: "text.secondary", fontWeight: 700 }}>{item.label}</Typography>
                ) : (
                  <Box key={i} sx={{
                    background: alpha(color, item.label === "ఫలితం" ? 0.15 : 0.1),
                    border: `1px solid ${alpha(color, item.label === "ఫలితం" ? 0.4 : 0.3)}`,
                    borderRadius: "8px", px: 1.5, py: 0.5,
                  }}>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: item.label === "ఫలితం" ? 14 : 13, fontWeight: item.label === "ఫలితం" ? 800 : 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{item.value}</Typography>
                  </Box>
                )
              )}
            </Stack>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>
              ఉదాహరణలు
            </Typography>
            <Stack spacing={0.8}>
              {rule.examples.map((ex, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5}
                  sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                  <Typography sx={{ fontSize: 14, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.before}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>→</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{ex.after}</Typography>
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
  const color = CAT_COLOR[res.category] || "#2d6a4f";
  return (
    <Card elevation={0} sx={{ border: `2px solid ${alpha(color, 0.4)}`, borderRadius: "14px", overflow: "hidden" }}>
      <Box sx={{ height: 5, background: color }} />
      <CardContent sx={{ p: "20px 22px !important" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.4rem" }, color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {res.sandhiName}
            </Typography>
            <Chip label={res.category} size="small" sx={{
              mt: 0.5, fontFamily: "'Noto Serif Telugu', serif", fontSize: 12, height: 24,
              background: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.3)}`,
            }} />
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color }}>{res.sandhiId}</Typography>
          </Box>
        </Stack>

        {/* Input word */}
        <Box sx={{ background: alpha(color, 0.07), borderRadius: "8px", px: 2, py: 1.2, mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", mb: 0.3 }}>మీరు ఇచ్చిన పదం</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Noto Serif Telugu', serif" }}>{input}</Typography>
        </Box>

        {/* Pattern */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2.5} flexWrap="wrap" useFlexGap>
          {[
            { label: "పూర్వం", value: res.purva },
            { label: "+", value: null },
            { label: "పరం", value: res.para },
            { label: "→", value: null },
            { label: "ఫలితం", value: res.result },
          ].map((item, i) =>
            item.value === null ? (
              <Typography key={i} sx={{ fontWeight: 700, color: "text.secondary", fontSize: 18 }}>{item.label}</Typography>
            ) : (
              <Box key={i} sx={{
                background: alpha(color, item.label === "ఫలితం" ? 0.15 : 0.08),
                border: `${item.label === "ఫలితం" ? 2 : 1}px solid ${alpha(color, item.label === "ఫలితం" ? 0.4 : 0.25)}`,
                borderRadius: "8px", px: 1.5, py: 0.8, textAlign: "center",
              }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{item.label}</Typography>
                <Typography sx={{ fontSize: item.label === "ఫలితం" ? 18 : 16, fontWeight: 800, color, fontFamily: "'Noto Serif Telugu', serif" }}>{item.value}</Typography>
              </Box>
            )
          )}
        </Stack>

        {/* Rule */}
        <Box sx={{ background: alpha(color, 0.05), borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", px: 2, py: 1.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 11, color, fontWeight: 700, mb: 0.5, fontFamily: "'Noto Serif Telugu', serif", letterSpacing: 0.5 }}>నియమం</Typography>
          <Typography sx={{ fontSize: 14, color: "text.primary", lineHeight: 1.9, fontFamily: "'Noto Serif Telugu', serif" }}>{res.rule}</Typography>
        </Box>

        {/* Examples */}
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>ఉదాహరణలు</Typography>
        <Stack spacing={0.8}>
          {res.examples.map((ex, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1}
              sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
              <Typography sx={{ fontSize: 14, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.before}</Typography>
              <Typography sx={{ color: "text.secondary" }}>→</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{ex.after}</Typography>
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
export default function SandhiMalaPage() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  // List tab state
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("అన్నీ");

  // Detector tab state
  const [input, setInput]       = useState("");
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [tried, setTried]       = useState(false);

  const SAMPLES = ["మునీంద్ర","దేవేంద్ర","అత్యంత","మాయమ్మ","చిట్టడవి","నాది","పేదరాలు","రక్షైక","చిగురుటాకు","ముల్లోకములు"];

  const filtered = useMemo(() => {
    return SANDHI_RULES.filter(r => {
      const matchCat = category === "అన్నీ" || r.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || r.name.includes(q) || r.rule.includes(q) ||
        r.examples.some(e => e.before.includes(q) || e.after.includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const handleDetect = () => {
    if (!input.trim()) return;
    setDetectResult(detectSandhi(input.trim()));
    setTried(true);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={1}>
          <AutoStoriesRoundedIcon sx={{ color: "#2d6a4f", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "#1a3d2b", fontFamily: "'Noto Serif Telugu', serif" }}>
            సంధి మాల
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8, maxWidth: 600, mx: "auto" }}>
          తెలుగు వ్యాకరణంలో ౨౬ సంధి నియమాలు — నిర్వచనాలు, నియమాలు, ఉదాహరణలతో
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
          <Tab icon={<MenuBookRoundedIcon fontSize="small" />} iconPosition="start" label="సంధి జాబితా" />
          <Tab icon={<FindInPageRoundedIcon fontSize="small" />} iconPosition="start" label="సంధి గుర్తించు" />
        </Tabs>
      </Box>

      {/* ── TAB 0: LIST ── */}
      {tab === 0 && (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Chip label={`${SANDHI_RULES.length} సంధులు`} size="small"
              sx={{ background: alpha("#2d6a4f", 0.1), color: "#2d6a4f", fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
            <Chip label={`${filtered.length} కనిపిస్తున్నాయి`} size="small"
              sx={{ background: alpha("#1a5276", 0.1), color: "#1a5276", fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
          </Stack>

          <TextField fullWidth placeholder="సంధి పేరు లేదా ఉదాహరణ వెతకండి..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
              sx: { borderRadius: "12px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 15 },
            }}
            sx={{ mb: 2 }} />

          <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
            {CATEGORIES.map(cat => (
              <Chip key={cat} label={cat} onClick={() => setCategory(cat)}
                sx={{
                  fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", height: 34,
                  ...(category === cat
                    ? { background: "#2d6a4f", color: "white" }
                    : { background: alpha("#2d6a4f", 0.08), color: "#2d6a4f", border: `1px solid ${alpha("#2d6a4f", 0.2)}` }),
                }} />
            ))}
          </Stack>

          {filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", fontSize: "1.1rem" }}>
                "{search}" కి సంధులు దొరకలేదు
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filtered.map(rule => <SandhiCard key={rule.id} rule={rule} />)}
            </Stack>
          )}
        </Box>
      )}

      {/* ── TAB 1: DETECTOR ── */}
      {tab === 1 && (
        <Box>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: alpha("#2d6a4f", 0.2), borderRadius: "14px", mb: 2.5 }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5, fontFamily: "'Noto Serif Telugu', serif" }}>
                తెలుగు పదం టైప్ చేయండి — సంధి automatic గా గుర్తించబడుతుంది
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth value={input}
                  onChange={e => { setInput(e.target.value); setTried(false); setDetectResult(null); }}
                  onKeyDown={e => e.key === "Enter" && handleDetect()}
                  placeholder="ఉదా: మునీంద్ర, దేవేంద్ర, అత్యంత..."
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
                  <Typography sx={{ fontSize: "2rem", mb: 1 }}>🤔</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#e74c3c", fontFamily: "'Noto Serif Telugu', serif", mb: 0.5 }}>
                    సంధి గుర్తించలేకపోయాం
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                    "{input}" లో సంధి detect కాలేదు. వేరే పదం try చేయండి.
                  </Typography>
                  <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={0.8} mt={2} useFlexGap>
                    {["మునీంద్ర","దేవేంద్ర","చిట్టడవి"].map(s => (
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