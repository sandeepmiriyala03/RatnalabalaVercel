"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Box, Card, CardContent, TextField, Select, MenuItem,
  Slider, Button, Typography, Stack,
} from "@mui/material";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";

/* ========================= TYPES ========================= */
type FontKey =
  | "spbalasubrahmanyam"
  | "bvsatyamurty"
  | "mallanna"
  | "mallanna-italic"
  | "pvnr"
  | "seelaveerraju"
  | "syamalaramana"
  | "gurajada" | "ntr" | "ramaneeya" | "veturi" | "sirivennela"
  | "chathura-thin" | "chathura-light" | "chathura-regular" | "chathura-bold" | "chathura-extrabold"
  | "ramaraja" | "raviprakash" | "tenaliramakrishna" | "timmana" | "tana" | "ponnala-regular"
  | "gidugu" | "gidugu-italic" | "lakkireddy" | "nandakam" | "nandakam-italic"
  | "peddana" | "purushothamaa" | "purushothamaa-italic" | "ramabhadra" | "ramabhadra-italic"
  | "sreekrushnadevaraya" | "sreekrushnadevaraya-italic" | "suranna-regular" | "suranna-bold"
  | "suranna-italic" | "suranna-bolditalic" | "suravaram" | "suravaram-italic"
  | "annamayya" | "annamayya-bold" | "annamayya-italic" | "annamayya-bolditalic"
  | "dhurjati" | "dhurjati-italic" | "jims" | "jims-italic" | "kanakadurga"
  | "kanakadurga-italic" | "mandali-regular" | "mandali-bold" | "mandali-italic"
  | "mandali-bolditalic" | "pottisreeramulu" | "tirosundaratelugu-regular";

type CanvasSize = "a4" | "square";

/* ========================= FONT METADATA ========================= */
const FONTS: { key: FontKey; label: string; className: string; fontFamily: string }[] = [
  { key: "spbalasubrahmanyam",      label: "ఎస్ పి బాలసుబ్రహ్మణ్యం", className: "chitramala-font-spbalasubrahmanyam", fontFamily: "SPBalasubrahmanyam" },
  { key: "bvsatyamurty",            label: "బి వి సత్యమూర్తి",         className: "chitramala-font-bvsatyamurty",         fontFamily: "BVSatyamurty" },
  { key: "mallanna",                label: "మల్లన్న",                 className: "chitramala-font-mallanna",             fontFamily: "Mallanna" },
  { key: "mallanna-italic",         label: "మల్లన్న (ఇటాలిక్)",      className: "chitramala-font-mallanna-italic",      fontFamily: "MallannaItalic" },
  { key: "pvnr",                    label: "పి వి నరసింహారావు",       className: "chitramala-font-pvnr",                 fontFamily: "PVNR" },
  { key: "seelaveerraju",           label: "శీల వీర్రాజు",             className: "chitramala-font-seelaveerraju",        fontFamily: "SeelaVeerraju" },
  { key: "syamalaramana",           label: "శ్యామల రమణ",              className: "chitramala-font-syamalaramana",        fontFamily: "SyamalaRamana" },
  { key: "gurajada",               label: "గురజాడ",                  className: "chitramala-font-gurajada",             fontFamily: "Gurajada" },
  { key: "ntr",                    label: "ఎన్‌టిఆర్",               className: "chitramala-font-ntr",                  fontFamily: "NTR" },
  { key: "ramaneeya",              label: "రమణీయ",                   className: "chitramala-font-ramaneeya",            fontFamily: "Ramaneeya" },
  { key: "veturi",                 label: "వేటూరి",                  className: "chitramala-font-veturi",               fontFamily: "Veturi" },
  { key: "sirivennela",            label: "సిరివెన్నెల",              className: "chitramala-font-sirivennela",          fontFamily: "Sirivennela" },
  { key: "chathura-thin",          label: "చతుర (Thin)",             className: "chitramala-font-chathura-thin",        fontFamily: "ChathuraThin" },
  { key: "chathura-light",         label: "చతుర (Light)",            className: "chitramala-font-chathura-light",       fontFamily: "ChathuraLight" },
  { key: "chathura-regular",       label: "చతుర (Regular)",          className: "chitramala-font-chathura-regular",     fontFamily: "ChathuraRegular" },
  { key: "chathura-bold",          label: "చతుర (Bold)",             className: "chitramala-font-chathura-bold",        fontFamily: "ChathuraBold" },
  { key: "chathura-extrabold",     label: "చతుర (ExtraBold)",        className: "chitramala-font-chathura-extrabold",   fontFamily: "ChathuraExtraBold" },
  { key: "ramaraja",               label: "రామరాజ",                  className: "chitramala-font-ramaraja",             fontFamily: "Ramaraja" },
  { key: "raviprakash",            label: "రవి ప్రకాష్",             className: "chitramala-font-raviprakash",          fontFamily: "RaviPrakash" },
  { key: "tenaliramakrishna",      label: "తెనాలి రామకృష్ణ",        className: "chitramala-font-tenali",               fontFamily: "TenaliRamakrishna" },
  { key: "timmana",                label: "తిమ్మన",                  className: "chitramala-font-timmana",              fontFamily: "Timmana" },
  { key: "tirosundaratelugu-regular",label: "తిరొ సుందర తెలుగు",      className: "chitramala-font-TiroSundaraTelugu-Regular", fontFamily: "TiroSundaraTelugu-Regular" },
  { key: "tana",                   label: "టానా",                    className: "chitramala-font-tana",                 fontFamily: "TANA" },
  { key: "ponnala-regular",        label: "పొన్నల",                  className: "chitramala-font-ponnala",              fontFamily: "Ponnala" },
  { key: "gidugu",                 label: "గిడుగు",                  className: "chitramala-font-gidugu",               fontFamily: "Gidugu" },
  { key: "gidugu-italic",          label: "గిడుగు (ఇటాలిక్)",       className: "chitramala-font-gidugu-italic",        fontFamily: "GiduguItalic" },
  { key: "lakkireddy",             label: "లక్కిరెడ్డి",             className: "chitramala-font-lakkireddy",           fontFamily: "LakkiReddy" },
  { key: "nandakam",               label: "నందకం",                   className: "chitramala-font-nandakam",             fontFamily: "Nandakam" },
  { key: "nandakam-italic",        label: "నందకం (ఇటాలిక్)",        className: "chitramala-font-nandakam-italic",      fontFamily: "NandakamItalic" },
  { key: "peddana",                label: "పెద్దన",                  className: "chitramala-font-peddana",              fontFamily: "Peddana" },
  { key: "purushothamaa",          label: "పురుషోత్తమ",              className: "chitramala-font-purushothamaa",        fontFamily: "Purushothamaa" },
  { key: "purushothamaa-italic",   label: "పురుషోత్తమ (ఇటాలిక్)",  className: "chitramala-font-purushothamaa-italic", fontFamily: "PurushothamaaItalic" },
  { key: "ramabhadra",             label: "రామభద్ర",                 className: "chitramala-font-ramabhadra",           fontFamily: "Ramabhadra" },
  { key: "ramabhadra-italic",      label: "రామభద్ర (ఇటాలిక్)",     className: "chitramala-font-ramabhadra-italic",    fontFamily: "RamabhadraItalic" },
  { key: "sreekrushnadevaraya",    label: "శ్రీ కృష్ణదేవరాయ",      className: "chitramala-font-sreekrushnadevaraya",  fontFamily: "SreeKrushnadevaraya" },
  { key: "sreekrushnadevaraya-italic", label: "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", className: "chitramala-font-sreekrushnadevaraya-italic", fontFamily: "SreeKrushnadevarayaItalic" },
  { key: "suranna-regular",        label: "సురన్న (Regular)",        className: "chitramala-font-suranna",              fontFamily: "Suranna" },
  { key: "suranna-bold",           label: "సురన్న (Bold)",           className: "chitramala-font-suranna-bold",         fontFamily: "SurannaBold" },
  { key: "suranna-italic",         label: "సురన్న (Italic)",         className: "chitramala-font-suranna-italic",       fontFamily: "SurannaItalic" },
  { key: "suranna-bolditalic",     label: "సురన్న (Bold Italic)",    className: "chitramala-font-suranna-bolditalic",   fontFamily: "SurannaBoldItalic" },
  { key: "suravaram",              label: "సురవరం",                  className: "chitramala-font-suravaram",            fontFamily: "Suravaram" },
  { key: "suravaram-italic",       label: "సురవరం (ఇటాలిక్)",      className: "chitramala-font-suravaram-italic",     fontFamily: "SuravaramItalic" },
  { key: "annamayya",              label: "అన్నమయ్య",                className: "chitramala-font-annamayya",            fontFamily: "Annamayya" },
  { key: "annamayya-bold",         label: "అన్నమయ్య (Bold)",        className: "chitramala-font-annamayya-bold",       fontFamily: "Annamayya-Bold" },
  { key: "annamayya-italic",       label: "అన్నమయ్య (ఇటాలిక్)",   className: "chitramala-font-annamayya-italic",     fontFamily: "Annamayya-Italic" },
  { key: "annamayya-bolditalic",   label: "అన్నమయ్య (Bold Italic)", className: "chitramala-font-annamayya-bolditalic", fontFamily: "Annamayya-BoldItalic" },
  { key: "dhurjati",               label: "ధూర్జటి",                className: "chitramala-font-dhurjati",             fontFamily: "Dhurjati" },
  { key: "dhurjati-italic",        label: "ధూర్జటి (ఇటాలిక్)",    className: "chitramala-font-dhurjati-italic",      fontFamily: "Dhurjati-Italic" },
  { key: "jims",                   label: "జిమ్స్",                  className: "chitramala-font-jims",                 fontFamily: "JIMS" },
  { key: "jims-italic",            label: "జిమ్స్ (ఇటాలిక్)",      className: "chitramala-font-jims-italic",          fontFamily: "JIMS-Italic" },
  { key: "kanakadurga",            label: "కనకదుర్గ",               className: "chitramala-font-kanakadurgA",          fontFamily: "KanakaDurga" },
  { key: "kanakadurga-italic",     label: "కనకదుర్గ (ఇటాలిక్)",   className: "chitramala-font-kanakadurgA-italic",   fontFamily: "KanakaDurga-Italic" },
  { key: "mandali-regular",        label: "మండలి (Regular)",        className: "chitramala-font-mandali",              fontFamily: "Mandali-Regular" },
  { key: "mandali-bold",           label: "మండలి (Bold)",           className: "chitramala-font-mandali-bold",         fontFamily: "Mandali-Bold" },
  { key: "mandali-italic",         label: "మండలి (Italic)",         className: "chitramala-font-mandali-italic",       fontFamily: "Mandali-Italic" },
  { key: "mandali-bolditalic",     label: "మండలి (Bold Italic)",    className: "chitramala-font-mandali-bolditalic",   fontFamily: "Mandali-BoldItalic" },
  { key: "pottisreeramulu",        label: "పొట్టి శ్రీరాములు",     className: "chitramala-font-pottisreeramulu",      fontFamily: "PottiSreeramulu" }
];

const CANVAS = {
  a4:     { label: "A4 (Print)",      aspect: "210 / 297" },
  square: { label: "Square (Social)", aspect: "1 / 1" },
};

export default function KhatiMala() {
  const previewRef = useRef<HTMLDivElement>(null);

  const [title,     setTitle]     = useState("");
  const [text,      setText]      = useState("#spb");
  const [fontKey,   setFontKey]   = useState<FontKey>("spbalasubrahmanyam");
  const [fontSize,  setFontSize]  = useState(22);
  const [canvasSize,setCanvasSize]= useState<CanvasSize>("a4");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortedFonts = [...FONTS].sort((a, b) =>
    sortOrder === "asc"
      ? a.label.localeCompare(b.label, "te-IN")
      : b.label.localeCompare(a.label, "te-IN")
  );

  const currentFontObj = FONTS.find(f => f.key === fontKey) || FONTS[0];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" mb={2}>ఖతి మాల</Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {/* LEFT: Controls */}
          <Box>
            <TextField fullWidth label="శీర్షిక" value={title}
              onChange={e => setTitle(e.target.value)} sx={{ mb: 2 }} />

            <TextField fullWidth multiline rows={8} label="తెలుగు పాఠ్యం (#spb అని టైప్ చేయండి)"
              value={text} onChange={e => setText(e.target.value)} />

            {/* Font Picker */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography>ఫాంట్</Typography>
                <Button
                  size="small" variant="outlined"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  sx={{ minWidth: 0, px: 1.5, fontSize: 12, textTransform: "none" }}
                >
                  {sortOrder === "asc" ? "A → Z" : "Z → A"}
                </Button>
              </Box>

              <Select
                fullWidth
                value={fontKey}
                onChange={e => setFontKey(e.target.value as FontKey)}
              >
                {sortedFonts.map(f => (
                  <MenuItem key={f.key} value={f.key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                      <Typography variant="caption" sx={{
                        bgcolor: fontKey === f.key ? "primary.main" : "action.hover",
                        color:   fontKey === f.key ? "primary.contrastText" : "text.secondary",
                        borderRadius: 1, px: 0.8, py: 0.2, fontSize: 10,
                        whiteSpace: "nowrap", minWidth: 90, textAlign: "center",
                      }}>
                        {f.key}
                      </Typography>
                      <span className={f.className} style={{
                        fontSize: 18,
                        lineHeight: 1.6,
                        fontFamily: f.fontFamily,
                        fontFeatureSettings: '"liga" 1, "calt" 1',
                      }}>
                        {f.label}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Font Size */}
            <Box sx={{ mt: 2 }}>
              <Typography>ఫాంట్ సైజ్</Typography>
              <Slider min={16} max={80} value={fontSize}
                onChange={(_, v) => setFontSize(v as number)} />
            </Box>

            {/* Canvas Size */}
            <Box sx={{ mt: 2 }}>
              <Typography>పరిమాణం</Typography>
              <Select fullWidth value={canvasSize}
                onChange={e => setCanvasSize(e.target.value as CanvasSize)}>
                {Object.entries(CANVAS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* RIGHT: Preview */}
          <Box
            ref={previewRef}
            className={currentFontObj.className}
            sx={{
              aspectRatio: CANVAS[canvasSize].aspect,
              border: "1px solid #ddd", borderRadius: 2, p: 3,
              fontSize: `${fontSize}px`, lineHeight: 1.8,
              display: "flex", flexDirection: "column", justifyContent: "flex-start",
              bgcolor: "#fff",
              fontFamily: `${currentFontObj.fontFamily}, system-ui`,
              fontFeatureSettings: '"liga" 1, "calt" 1',
              WebkitFontFeatureSettings: '"liga" 1, "calt" 1',
            }}
          >
            <Typography sx={{
              textAlign: "center",
              fontWeight: 600,
              mb: 1,
              fontFamily: "inherit",
              fontSize: "inherit",
              fontFeatureSettings: '"liga" 1, "calt" 1',
            }}>
              {title || "శీర్షిక"}
            </Typography>
            <Box sx={{
              whiteSpace: "pre-wrap",
              textAlign: "justify",
              wordBreak: "break-word",
              lineHeight: 1.9,
              fontFamily: "inherit",
              fontSize: "inherit",
              fontFeatureSettings: '"liga" 1, "calt" 1',
            }}>
              {text ? text : (
                <Typography component="span" sx={{ opacity: 0.4 }}>
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