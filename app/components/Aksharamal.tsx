"use client";

import React, { useMemo, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
  Pagination,
  Container,
  MenuItem
} from "@mui/material";

import AksharaPosterCard from "@/app/components/AksharaMalaPoster";
import AksharaPdfDownload from "./AksharaPdfDownload";

/* ================= TYPE ================= */
type Akshara = {
  id: string;
  type: "swaralu" | "vyanjanalu" | "gunintalu";
  letter: string;
  word?: string;
  image?: string;
};

/* =========================
   TYPES
========================= */

 type FontKey =
  | "gurajada"
  | "ntr"
  | "ramaneeya"
  | "veturi"
  | "sirivennela"

  | "chathura-thin"
  | "chathura-light"
  | "chathura-regular"
  | "chathura-bold"
  | "chathura-extrabold"

  | "ramaraja"
  | "raviprakash"
  | "tenaliramakrishna"
  | "timmana"
  | "tana"
  | "ponnala-regular"

  | "gidugu"
  | "gidugu-italic"

  | "lakkireddy"

  | "nandakam"
  | "nandakam-italic"

  | "peddana"

  | "purushothamaa"
  | "purushothamaa-italic"

  | "ramabhadra"
  | "ramabhadra-italic"

  | "sreekrushnadevaraya"
  | "sreekrushnadevaraya-italic"

  | "suranna-regular"
  | "suranna-bold"
  | "suranna-italic"
  | "suranna-bolditalic"

  | "suravaram"
  | "suravaram-italic"

  /* =========================
     🆕 Newly Added (1/19/2026)
     ========================= */

  | "annamayya"
  | "annamayya-bold"
  | "annamayya-italic"
  | "annamayya-bolditalic"

  | "dhurjati"
  | "dhurjati-italic"

  | "jims"
  | "jims-italic"

  | "kanakadurga"
  | "kanakadurga-italic"

  | "mandali-regular"
  | "mandali-bold"
  | "mandali-italic"
  | "mandali-bolditalic"

  | "pottisreeramulu";
const FONTS: { key: FontKey; label: string; className: string }[] = [
  { key: "gurajada", label: "గురజాడ", className: "chitramala-font-gurajada" },
  { key: "ntr", label: "ఎన్‌టిఆర్", className: "chitramala-font-ntr" },
  { key: "ramaneeya", label: "రమణీయ", className: "chitramala-font-ramaneeya" },
  { key: "veturi", label: "వేటూరి", className: "chitramala-font-veturi" },
  { key: "sirivennela", label: "సిరివెన్నెల", className: "chitramala-font-sirivennela" },

  { key: "chathura-thin", label: "చతుర (Thin)", className: "chitramala-font-chathura-thin" },
  { key: "chathura-light", label: "చతుర (Light)", className: "chitramala-font-chathura-light" },
  { key: "chathura-regular", label: "చతుర (Regular)", className: "chitramala-font-chathura-regular" },
  { key: "chathura-bold", label: "చతుర (Bold)", className: "chitramala-font-chathura-bold" },
  { key: "chathura-extrabold", label: "చతుర (ExtraBold)", className: "chitramala-font-chathura-extrabold" },

  { key: "ramaraja", label: "రామరాజ", className: "chitramala-font-ramaraja" },
  { key: "raviprakash", label: "రవి ప్రకాష్", className: "chitramala-font-raviprakash" },
  { key: "tenaliramakrishna", label: "తెనాలి రామకృష్ణ", className: "chitramala-font-tenali" },
  { key: "timmana", label: "తిమ్మన", className: "chitramala-font-timmana" },
  { key: "tana", label: "టానా", className: "chitramala-font-tana" },
  { key: "ponnala-regular", label: "పొన్నల", className: "chitramala-font-ponnala" },

  { key: "gidugu", label: "గిడుగు", className: "chitramala-font-gidugu" },
  { key: "gidugu-italic", label: "గిడుగు (ఇటాలిక్)", className: "chitramala-font-gidugu-italic" },

  { key: "lakkireddy", label: "లక్కిరెడ్డి", className: "chitramala-font-lakkireddy" },

  { key: "nandakam", label: "నందకం", className: "chitramala-font-nandakam" },
  { key: "nandakam-italic", label: "నందకం (ఇటాలిక్)", className: "chitramala-font-nandakam-italic" },

  { key: "peddana", label: "పెద్దన", className: "chitramala-font-peddana" },

  { key: "purushothamaa", label: "పురుషోత్తమ", className: "chitramala-font-purushothamaa" },
  { key: "purushothamaa-italic", label: "పురుషోత్తమ (ఇటాలిక్)", className: "chitramala-font-purushothamaa-italic" },

  { key: "ramabhadra", label: "రామభద్ర", className: "chitramala-font-ramabhadra" },
  { key: "ramabhadra-italic", label: "రామభద్ర (ఇటాలిక్)", className: "chitramala-font-ramabhadra-italic" },

  { key: "sreekrushnadevaraya", label: "శ్రీ కృష్ణదేవరాయ", className: "chitramala-font-sreekrushnadevaraya" },
  { key: "sreekrushnadevaraya-italic", label: "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", className: "chitramala-font-sreekrushnadevaraya-italic" },

  { key: "suranna-regular", label: "సురన్న (Regular)", className: "chitramala-font-suranna" },
  { key: "suranna-bold", label: "సురన్న (Bold)", className: "chitramala-font-suranna-bold" },
  { key: "suranna-italic", label: "సురన్న (Italic)", className: "chitramala-font-suranna-italic" },
  { key: "suranna-bolditalic", label: "సురన్న (Bold Italic)", className: "chitramala-font-suranna-bolditalic" },

  { key: "suravaram", label: "సురవరం", className: "chitramala-font-suravaram" },
  { key: "suravaram-italic", label: "సురవరం (ఇటాలిక్)", className: "chitramala-font-suravaram-italic" },


{ key: "annamayya", label: "అన్నమయ్య", className: "chitramala-font-annamayya" },
{ key: "annamayya-bold", label: "అన్నమయ్య (Bold)", className: "chitramala-font-annamayya-bold" },
{ key: "annamayya-italic", label: "అన్నమయ్య (ఇటాలిక్)", className: "chitramala-font-annamayya-italic" },
{ key: "annamayya-bolditalic", label: "అన్నమయ్య (Bold Italic)", className: "chitramala-font-annamayya-bolditalic" },

{ key: "dhurjati", label: "ధూర్జటి", className: "chitramala-font-dhurjati" },
{ key: "dhurjati-italic", label: "ధూర్జటి (ఇటాలిక్)", className: "chitramala-font-dhurjati-italic" },

{ key: "jims", label: "జిమ్స్", className: "chitramala-font-jims" },
{ key: "jims-italic", label: "జిమ్స్ (ఇటాలిక్)", className: "chitramala-font-jims-italic" },

{ key: "kanakadurga", label: "కనకదుర్గ", className: "chitramala-font-kanakadurgA" },
{ key: "kanakadurga-italic", label: "కనకదుర్గ (ఇటాలిక్)", className: "chitramala-font-kanakadurgA-italic" },

{ key: "mandali-regular", label: "మండలి (Regular)", className: "chitramala-font-mandali" },
{ key: "mandali-bold", label: "మండలి (Bold)", className: "chitramala-font-mandali-bold" },
{ key: "mandali-italic", label: "మండలి (Italic)", className: "chitramala-font-mandali-italic" },
{ key: "mandali-bolditalic", label: "మండలి (Bold Italic)", className: "chitramala-font-mandali-bolditalic" },

{ key: "pottisreeramulu", label: "పొట్టి శ్రీరాములు", className: "chitramala-font-pottisreeramulu" },

];

/*
  🔤 Mapping UI font choice → actual .ttf font files.
  These files live in /public/fonts and are NEVER
  downloaded as standalone files to the user's machine.
*/
const FONT_FILES: Record<FontKey, { name: string; file: string }> = {
  gurajada: { name: "Gurajada", file: "/fonts/Gurajada-Regular.ttf" },
  ntr: { name: "NTR", file: "/fonts/NTR-Regular.ttf" },
  ramaneeya: { name: "Ramaneeya", file: "/fonts/RamaneeyaWin.ttf" },
  veturi: { name: "Veturi", file: "/fonts/Veturi.ttf" },
  sirivennela: { name: "Sirivennela", file: "/fonts/Sirivennela.ttf" },

  "chathura-thin": { name: "ChathuraThin", file: "/fonts/Chathura-Thin.ttf" },
  "chathura-light": { name: "ChathuraLight", file: "/fonts/Chathura-Light.ttf" },
  "chathura-regular": { name: "ChathuraRegular", file: "/fonts/Chathura-Regular.ttf" },
  "chathura-bold": { name: "ChathuraBold", file: "/fonts/Chathura-Bold.ttf" },
  "chathura-extrabold": { name: "ChathuraExtraBold", file: "/fonts/Chathura-ExtraBold.ttf" },

  ramaraja: { name: "Ramaraja", file: "/fonts/Ramaraja-Regular.ttf" },
  raviprakash: { name: "RaviPrakash", file: "/fonts/RaviPrakash.ttf" },
  tenaliramakrishna: {
    name: "TenaliRamakrishna",
    file: "/fonts/TenaliRamakrishna-Regular.ttf",
  },
  timmana: { name: "Timmana", file: "/fonts/TimmanaRegular.ttf" },
  tana: { name: "TANA", file: "/fonts/TANA.ttf" },
  "ponnala-regular": { name: "Ponnala", file: "/fonts/Ponnala-Regular.ttf" },

  gidugu: { name: "Gidugu", file: "/fonts/Gidugu.otf" },
  "gidugu-italic": { name: "GiduguItalic", file: "/fonts/Gidugu-Italic.otf" },

  lakkireddy: { name: "LakkiReddy", file: "/fonts/LakkiReddy.ttf" },

  nandakam: { name: "Nandakam", file: "/fonts/Nandakam.otf" },
  "nandakam-italic": {
    name: "NandakamItalic",
    file: "/fonts/Nandakam-Italic.otf",
  },

  peddana: { name: "Peddana", file: "/fonts/Peddana-Regular.ttf" },

  purushothamaa: { name: "Purushothamaa", file: "/fonts/Purushothamaa.otf" },
  "purushothamaa-italic": {
    name: "PurushothamaaItalic",
    file: "/fonts/Purushothamaa-Italic.otf",
  },

  ramabhadra: { name: "Ramabhadra", file: "/fonts/Ramabhadra.otf" },
  "ramabhadra-italic": {
    name: "RamabhadraItalic",
    file: "/fonts/Ramabhadra-Italic.otf",
  },

  sreekrushnadevaraya: {
    name: "SreeKrushnadevaraya",
    file: "/fonts/Sree Krushnadevaraya.otf",
  },
  "sreekrushnadevaraya-italic": {
    name: "SreeKrushnadevarayaItalic",
    file: "/fonts/Sree Krushnadevaraya-Italic.otf",
  },

  "suranna-regular": {
    name: "Suranna",
    file: "/fonts/Suranna Regular.otf",
  },
  "suranna-bold": {
    name: "SurannaBold",
    file: "/fonts/Suranna Bold.otf",
  },
  "suranna-italic": {
    name: "SurannaItalic",
    file: "/fonts/Suranna-Italic.otf",
  },
  "suranna-bolditalic": {
    name: "SurannaBoldItalic",
    file: "/fonts/Suranna Bold Italic.otf",
  },

  suravaram: { name: "Suravaram", file: "/fonts/Suravaram.otf" },
  "suravaram-italic": {
    name: "SuravaramItalic",
    file: "/fonts/Suravaram-Italic.otf",
  },

  annamayya: { name: "Annamayya", file: "/fonts/Annamayya.otf" },
  "annamayya-bold": {
    name: "AnnamayyaBold",
    file: "/fonts/AnnamayyaBold.otf",
  },
  "annamayya-italic": {
    name: "AnnamayyaItalic",
    file: "/fonts/AnnamayyaItalic.otf",
  },
  "annamayya-bolditalic": {
    name: "AnnamayyaBoldItalic",
    file: "/fonts/AnnamayyaBoldItalic.otf",
  },

  dhurjati: { name: "Dhurjati", file: "/fonts/Dhurjati.otf" },
  "dhurjati-italic": {
    name: "DhurjatiItalic",
    file: "/fonts/Dhurjati-Italic.otf",
  },

  jims: { name: "JIMS", file: "/fonts/JIMS.otf" },
  "jims-italic": { name: "JIMSItalic", file: "/fonts/JIMSItalic.otf" },

  kanakadurga: {
    name: "KanakaDurga",
    file: "/fonts/KanakaDurga.otf",
  },
  "kanakadurga-italic": {
    name: "KanakaDurgaItalic",
    file: "/fonts/KanakaDurga-Italic.otf",
  },

  "mandali-regular": {
    name: "Mandali",
    file: "/fonts/Mandali-Regular.otf",
  },
  "mandali-bold": {
    name: "MandaliBold",
    file: "/fonts/Mandali-Bold.otf",
  },
  "mandali-italic": {
    name: "MandaliItalic",
    file: "/fonts/Mandali-Italic.otf",
  },
  "mandali-bolditalic": {
    name: "MandaliBoldItalic",
    file: "/fonts/Mandali-Bold Italic.otf",
  },

  pottisreeramulu: {
    name: "PottiSreeramulu",
    file: "/fonts/Potti Sreeramulu.otf",
  },
};
/* ================= DATA ================= */
const AKSHARALU: Akshara[] = [
  // అచ్చులు (Swaralu) - 16
 
  { id: "s1", type: "swaralu", letter: "అ", word: "అరటి", image: "/akshara/1.jpg" },
  { id: "s2", type: "swaralu", letter: "ఆ", word: "ఆవు", image: "/akshara/2.jpg" },
  { id: "s3", type: "swaralu", letter: "ఇ", word: "ఇల్లు", image: "/akshara/3.jpg" },
  { id: "s4", type: "swaralu", letter: "ఈ", word: "ఈక", image: "/akshara/4.jpg" },
  { id: "s5", type: "swaralu", letter: "ఉ", word: "ఉడుత", image: "/akshara/5.jpg" },
  { id: "s6", type: "swaralu", letter: "ఊ", word: "ఊయల", image: "/akshara/6.jpg" },

  { id: "s7", type: "swaralu", letter: "ఋ", word: "ఋషి" },
  { id: "s8", type: "swaralu", letter: "ౠ", word: "ౠ" },

  { id: "s9", type: "swaralu", letter: "ఎ", word: "ఎలుక", image: "/akshara/7.jpg" },
  { id: "s10", type: "swaralu", letter: "ఏ", word: "ఏనుగు", image: "/akshara/8.jpg" },
  { id: "s11", type: "swaralu", letter: "ఐ", word: "ఐదు", image: "/akshara/9.jpg" },
  { id: "s12", type: "swaralu", letter: "ఒ", word: "ఒంటె", image: "/akshara/10.jpg" },
  { id: "s13", type: "swaralu", letter: "ఓ", word: "ఓడ", image: "/akshara/11.jpg" },
  { id: "s14", type: "swaralu", letter: "ఔ", word: "ఔషధం", image: "/akshara/12.jpg" },
  { id: "s15", type: "swaralu", letter: "అం", word: "అంకెలు", image: "/akshara/13.jpg" },
  { id: "s16", type: "swaralu", letter: "అః", word: "అంతఃపురం" },

  { id: "v1", type: "vyanjanalu", letter: "క", word: "కప్ప", image: "/akshara/14.jpg" },
  { id: "v2", type: "vyanjanalu", letter: "ఖ", word: "ఖడ్గం", image: "/akshara/15.jpg" },
  { id: "v3", type: "vyanjanalu", letter: "గ", word: "గడియారం", image: "/akshara/16.jpg" },
  { id: "v4", type: "vyanjanalu", letter: "ఘ", word: "ఘంట", image: "/akshara/17.jpg" },

  { "id": "v5", "type": "vyanjanalu", "letter": "ఙ", word: " జ్ఞానము" },

  { id: "v6", type: "vyanjanalu", letter: "చ", word: "చక్రము", image: "/akshara/18.jpg" },
  { id: "v7", type: "vyanjanalu", letter: "ఛ", word: "ఛత్రము", image: "/akshara/19.jpg" },
  { id: "v8", type: "vyanjanalu", letter: "జ", word: "జడ", image: "/akshara/20.jpg" },

{ "id": "v9", "type": "vyanjanalu", "letter": "ఝ", word: "ఝషము", "image": "/akshara/21.jpg" },
{ "id": "v10", "type": "vyanjanalu", "letter": "ఞ", "word": "ఞ" },
{ "id": "v11", "type": "vyanjanalu", "letter": "ట", "word": "టపాకాయ", "image": "/akshara/22.jpg" },
{ "id": "v12", "type": "vyanjanalu", "letter": "ఠ", "word": "కంఠము", "image": "/akshara/23.jpg" },
{ "id": "v13", "type": "vyanjanalu", "letter": "డ", "word": "డప్పు", "image": "/akshara/24.jpg" },
{ "id": "v14", "type": "vyanjanalu", "letter": "ఢ", "word": "ఢంకా", "image": "/akshara/25.jpg" },
{ "id": "v15", "type": "vyanjanalu", "letter": "ణ", "word": "వీణ", "image": "/akshara/26.jpg" },
{ "id": "v16", "type": "vyanjanalu", "letter": "త", "word": "తల", "image": "/akshara/27.jpg" },
{ "id": "v17", "type": "vyanjanalu", "letter": "థ", "word": "రథము", "image": "/akshara/28.jpg" },
{ "id": "v18", "type": "vyanjanalu", "letter": "ద", "word": "దంతము", "image": "/akshara/29.jpg" },
{ "id": "v19", "type": "vyanjanalu", "letter": "ధ", "word": "ధనుస్సు", "image": "/akshara/30.jpg" },

 { "id": "v20", "type": "vyanjanalu", "letter": "న", "word": "నత్త", "image": "/akshara/31.jpg" },
{ "id": "v21", "type": "vyanjanalu", "letter": "ప", "word": "పడవ", "image": "/akshara/32.jpg" },
{ "id": "v22", "type": "vyanjanalu", "letter": "ఫ", "word": "ఫలము", "image": "/akshara/33.jpg" },
{ "id": "v23", "type": "vyanjanalu", "letter": "బ", "word": "బండి", "image": "/akshara/34.jpg" },
{ "id": "v24", "type": "vyanjanalu", "letter": "భ", "word": "భవనము", "image": "/akshara/35.jpg" },
{ "id": "v25", "type": "vyanjanalu", "letter": "మ", "word": "మద్దెల", "image": "/akshara/36.jpg" },
{ "id": "v26", "type": "vyanjanalu", "letter": "య", "word": "యంత్రము", "image": "/akshara/37.jpg" },
{ "id": "v27", "type": "vyanjanalu", "letter": "ర", "word": "రంగులు", "image": "/akshara/38.jpg" },
{ "id": "v28", "type": "vyanjanalu", "letter": "ల", "word": "లత", "image": "/akshara/39.jpg" },
{ "id": "v29", "type": "vyanjanalu", "letter": "వ", "word": "వల", "image": "/akshara/40.jpg" },
{ id: "v30", type: "vyanjanalu", letter: "శ", word: "శంఖము", image: "/akshara/41.jpg" },
{ id: "v31", type: "vyanjanalu", letter: "ష", word: "షట్పదము", image: "/akshara/42.jpg" },
{ id: "v32", type: "vyanjanalu", letter: "స", word: "సంచి", image: "/akshara/43.jpg" },
{ id: "v33", type: "vyanjanalu", letter: "హ", word: "హంస", image: "/akshara/44.jpg" },
{ id: "v34", type: "vyanjanalu", letter: "ళ", word: "తాళము", image: "/akshara/45.jpg" },
{ id: "v35", type: "vyanjanalu", letter: "క్ష", word: "వృక్షము" },
{ id: "v36", type: "vyanjanalu", letter: "ఱ", word: "ఱంపము" }
];


const PAGE_SIZE = 4;

export default function AksharamalaParent() {
const [fontIndex, setFontIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "swaralu" | "vyanjanalu">("all");

  const filtered = useMemo(() => {

    const term = search.trim();

    return AKSHARALU.filter((a) => {

      const matchesSearch =
        !term ||
        a.letter.includes(term) ||
        (a.word && a.word.includes(term));

      const matchesType =
        typeFilter === "all" || a.type === typeFilter;

      return matchesSearch && matchesType;

    });

  }, [search, typeFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleFilter = (type: "all" | "swaralu" | "vyanjanalu") => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <Container maxWidth="md">

      <Stack spacing={4} sx={{ py: 6 }}>

        {/* HEADER */}
        <Box textAlign="center">

          {/* FILTER BUTTONS */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ mb: 2 }}
          >
            <Chip
              label="అన్నీ"
              clickable
              color={typeFilter === "all" ? "primary" : "default"}
              onClick={() => handleFilter("all")}
            />

            <Chip
              label="అచ్చులు"
              clickable
              color={typeFilter === "swaralu" ? "primary" : "default"}
              onClick={() => handleFilter("swaralu")}
            />

            <Chip
              label="హల్లులు"
              clickable
              color={typeFilter === "vyanjanalu" ? "primary" : "default"}
              onClick={() => handleFilter("vyanjanalu")}
            />
            
<TextField
  select
  label="PDF ఫాంట్"
  value={fontIndex}
  onChange={(e) => setFontIndex(Number(e.target.value))}
  sx={{ width: 200, mt: 2 }}
>
  {FONTS.map((f, i) => (
    <MenuItem key={i} value={i}>
      {f.label}
    </MenuItem>
  ))}
</TextField>
<AksharaPdfDownload
  data={AKSHARALU}
  fontName={FONT_FILES[FONTS[fontIndex].key].name}
  fontFile={FONT_FILES[FONTS[fontIndex].key].file}
/>
          </Stack>

          {/* INFO */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Chip
              label={`మొత్తం: ${filtered.length}`}
              color="secondary"
              sx={{ fontWeight: 800 }}
            />

            <Chip
              label={`పేజీ: ${page} / ${pageCount || 1}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          {/* SEARCH */}
          <TextField
            fullWidth
            placeholder="అక్షరం లేదా పదం వెతకండి..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{
              bgcolor: "white",
              borderRadius: "12px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px"
              }
            }}
          />

        </Box>

        {/* RESULTS */}
        {filtered.length === 0 ? (

          <Box textAlign="center" sx={{ py: 10 }}>
            <Typography variant="h6" sx={{ opacity: 0.5 }}>
              క్షమించండి! ఏమీ దొరకలేదు.
            </Typography>
          </Box>

        ) : (

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center"
            }}
          >
            {visible.map((a) => (
              <Box
                key={a.id}
                sx={{
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 16px)"
                  },
                  maxWidth: {
                    xs: "100%",
                    sm: "440px"
                  }
                }}
              >
                <AksharaPosterCard
                  akshara={a}
                  enableRead={true}
                />
              </Box>
            ))}
          </Box>

        )}

        {/* PAGINATION */}
        {pageCount > 1 && (

          <Box display="flex" justifyContent="center">

            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, v) => {
                setPage(v);
                window.scrollTo({
                  top: 0,
                  behavior: "smooth"
                });
              }}
              color="primary"
              size="large"
              shape="rounded"
            />

          </Box>

        )}

      </Stack>

    </Container>
  );
}