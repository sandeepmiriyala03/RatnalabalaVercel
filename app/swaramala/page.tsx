"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import Swaramala from "@/app/components/swaramala";


/* =========================
   📦 TYPES
========================= */

type SwaramalaData = {
  text: string;
};

/* =========================
   🌸 SWARAMALA PAGE
========================= */

export default function SwaramalaPage() {
  const [data, setData] = useState<SwaramalaData | null>(null);

  // 🔄 force reset Swaramala component
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
         📘 HOW TO USE
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
        <Box sx={{ mb: 1 }}>
          <strong style={{ fontSize: "1.05rem" }}>
            స్వరమాల — మాటలతో అక్షరాలు
          </strong>
          <div style={{ fontSize: "0.85rem", color: "#555" }}>
            మాట్లాడండి • ఎడిట్ చేయండి • చిత్రంగా మార్చండి
          </div>
        </Box>

        <strong>స్వరమాల ఎలా ఉపయోగించాలి?</strong>

        <ol style={{ paddingLeft: 18, marginTop: 8 }}>
          <li>🎙️ <b>మాట్లాడండి</b> లేదా టైప్ చేయండి</li>
          <li>✍️ టెక్స్ట్‌ను కావలసిన విధంగా <b>ఎడిట్</b> చేయండి</li>
          <li>🔤 ఫాంట్ / 🎨 థీమ్ ఎంచుకోండి</li>
          <li>🔊 కావాలంటే మీ టెక్స్ట్‌ను <b>వినండి</b></li>
          <li>⬇️ పోస్టర్‌ను <b>డౌన్‌లోడ్</b> చేయండి</li>
          <li>
            🔒 <b>గోప్యత:</b> మీ డేటా ఎక్కడా సేవ్ చేయబడదు.
            అన్నీ <b>మీ డివైస్‌లోనే</b> జరుగుతాయి.
          </li>
        </ol>
      </Box>

     <Swaramala/>
        
        </Box>
  
  );
}
