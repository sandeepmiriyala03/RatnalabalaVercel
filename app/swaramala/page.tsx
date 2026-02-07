"use client";

import { useState } from "react";
import { Box,Typography } from "@mui/material";
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
<>
      {/* =========================
         📘 HOW TO USE
         ========================= */}
    
          <Typography
                         variant="h3"
                         fontWeight={800}
                         sx={{
                           letterSpacing: "-0.5px",
                           background: "linear-gradient(90deg, #0f172a, #2563eb)",
                           WebkitBackgroundClip: "text",
                           WebkitTextFillColor: "transparent",       fontWeight: 700,
                   fontSize: "calc(var(--telugu-font-size) * 1.8)",
                      textAlign: "center",  // ✅ Centers the text
                         }}>
                   🎙️ స్వరమాల — మాటలతో అక్షరాలు
                 </Typography>
          <div style={{ fontSize: "0.85rem", color: "#555" }}>
            మాట్లాడండి • ఎడిట్ చేయండి • చిత్రంగా మార్చండి
          </div>
       

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
   

     <Swaramala/>
     </>   
    
  
  );
}
