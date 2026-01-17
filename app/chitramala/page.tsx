"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import PoemInput from "@/app/components/PoemInput";
import ChitramalaPreviewCard from "@/app/components/ChitramalaCard";

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
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        p: { xs: 1.5, sm: 2.5 },
      }}
    >
      {/* =========================
         📘 HOW TO USE – STEPS
         ========================= */}
     <Box
  sx={{
    mb: 3,
    p: 2,
    border: "1px dashed #cfcfcf",
    borderRadius: 2,
    backgroundColor: "#fafafa",
    fontSize: "0.95rem",
  }}
>
  {/* 🔰 Title */}
<Box
  sx={{
    mb: 3,
    p: 2,
    border: "1px dashed #cfcfcf",
    borderRadius: 2,
    backgroundColor: "#fafafa",
    fontSize: "0.95rem",
  }}
>
  {/* 🔰 Title */}
  <Box sx={{ mb: 1 }}>
    <strong style={{ fontSize: "1.05rem" }}>
      చిత్రమాల పద్య యంత్రం
    </strong>
    <div style={{ fontSize: "0.85rem", color: "#555" }}>
      పద్యాన్ని రాయండి • చిత్రంగా మార్చండి • పంచుకోండి
    </div>
  </Box>

  {/* 📘 How to use */}
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
    ఫాంట్ / థీమ్ మార్చి <b>చిత్రాన్ని డౌన్‌లోడ్</b> చేయండి
  </li>
  <li>
    🔤 <b>తెలుగు ఫాంట్లు & ఫాంట్ సైజ్:</b> చిత్రమాలలో
    <b> గురజాడ, ఎన్‌టిఆర్, వేటూరి, సిరివెన్నెల, చతుర,
    రమణీయ, రామరాజ, రవి ప్రకాష్, టానా, తెనాలి రామకృష్ణ,
    తిమ్మన, పొన్నల</b> వంటి తెలుగు ఫాంట్లు అందుబాటులో ఉన్నాయి.
    అవసరానికి అనుగుణంగా <b>ఫాంట్ సైజ్‌ను కూడా మార్చుకోవచ్చు</b>.
  </li>
  <li>
    🔒 <b>గోప్యత గమనిక:</b> మీ పద్యాలు, చిత్రాలు మేము
    <b> ఎక్కడా సేవ్ చేయము</b>. మీ డేటా పూర్తిగా
    <b> మీ డివైస్‌లోనే ఉంటుంది</b> — మీ గోప్యతే మా
    <b> మొదటి ప్రాధాన్యత</b>.
  </li>
</ol>

</Box>

       
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
          setPoem(null);           // 🔥 clear preview
          setResetKey((k) => k + 1); // 🔄 reset inputs
        }}
      />

      {/* =========================
         🖼 PREVIEW SECTION
         ========================= */}
      {poem && (
        <Box
          sx={{
            mt: 4,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ChitramalaPreviewCard
            title={poem.title}
            poet={poem.poet}
            lines={poem.lines}
            enableRead
          />
        </Box>
      )}
    </Box>
  );
}
