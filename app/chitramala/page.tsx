"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import PoemInput from "@/app/components/PoemInput";
import ChitramalaCanvaEditor from "@/app/components/ChitramalaCanvaEditor";

/* =========================
   📦 TYPES
   ========================= */

type PoemData = {
  title?: string;
  poet?: string;
  lines: string[];
};

export default function ChitramalaPage() {
  const [poem, setPoem] = useState<PoemData | null>(null);

  /* 🔄 Used to fully reset PoemInput */
  const [resetKey, setResetKey] = useState(0);

  return (
    <>
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center", // ✅ Centers the text
        }}
      >
        చిత్రమాల పద్య యంత్రం
      </Typography>

      <Box sx={{ textAlign: "center", mb: 2 }}>
        <div style={{ fontSize: "0.85rem", color: "#555" }}>
          పద్యాన్ని రాయండి • చిత్రంగా మార్చండి • పంచుకోండి
        </div>
      </Box>

      {/* 📘 How to use */}
      <Box sx={{ maxWidth: 720, mx: "auto", mb: 3, px: 2 }}>
        <strong>చిత్రమాల ఎలా ఉపయోగించాలి?</strong>

        <ol style={{ paddingLeft: 18, marginTop: 8 }}>
          <li>ముందుగా <b>కవి పేరు</b> నమోదు చేయండి</li>
          <li><b>పాదాల సంఖ్య (1 – 8)</b> ఎంచుకోండి</li>
          <li>ప్రతి పాదాన్ని విడిగా టైప్ చేయండి</li>
          <li>కావాలంటే <b>పద్య శీర్షిక</b> ఇవ్వండి</li>
          <li>
            <b>“పోస్టర్ చూపించండి”</b> బటన్‌పై క్లిక్ చేయండి
          </li>
          <li>
            ఫాంట్ / థీమ్ / బ్యాక్‌గ్రౌండ్ మార్చి, ఎలిమెంట్లను లాగి తమకు నచ్చిన చోట పెట్టుకుని{" "}
            <b>చిత్రాన్ని డౌన్‌లోడ్</b> చేయండి
          </li>
          <li>
            🔤 <b>తెలుగు ఫాంట్లు & ఫాంట్ సైజ్:</b> చిత్రమాలలో
            <b> గురజాడ, ఎన్‌టిఆర్, వేటూరి, సిరివెన్నెల, చతుర,
            రమణీయ, రామరాజ, రవి ప్రకాష్, టానా, తెనాలి రామకృష్ణ,
            తిమ్మన, పొన్నల</b> వంటి తెలుగు ఫాంట్లు అందుబాటులో ఉన్నాయి.
            అవసరానికి అనుగుణంగా <b>ఫాంట్ సైజ్‌ను కూడా మార్చుకోవచ్చు</b>.
          </li>
          <li>
            🖼️ <b>సొంత బ్యాక్‌గ్రౌండ్:</b> మీ సొంత ఫోటోను అప్‌లోడ్ చేసి పోస్టర్
            బ్యాక్‌గ్రౌండ్‌గా వాడుకోవచ్చు, ఓవర్‌లే/బ్లర్‌తో టెక్స్ట్ స్పష్టంగా కనిపించేలా
            సర్దుబాటు చేసుకోవచ్చు.
          </li>
          <li>
            🔒 <b>గోప్యత గమనిక:</b> మీ పద్యాలు, చిత్రాలు మేము
            <b> ఎక్కడా సేవ్ చేయము</b>. మీ డేటా పూర్తిగా
            <b> మీ డివైస్‌లోనే ఉంటుంది</b> — మీ గోప్యతే మా
            <b> మొదటి ప్రాధాన్యత</b>.
          </li>
        </ol>
      </Box>

      {/* =========================
         📝 INPUT SECTION
         ========================= */}
      <PoemInput
        key={resetKey} // 🔑 force re-mount on reset
        onGenerate={(data) => {
          setPoem(data);
        }}
        onReset={() => {
          setPoem(null);
          setResetKey((k) => k + 1); // 🔄 reset inputs
        }}
      />

      {/* =========================
         🎨 CANVA-STYLE EDITOR SECTION
         ========================= */}
      {poem && (
        <Box sx={{ mt: 4, px: { xs: 1, sm: 2 } }}>
          <ChitramalaCanvaEditor
            title={poem.title}
            poet={poem.poet}
            lines={poem.lines}
          />
        </Box>
      )}
    </>
  );
}