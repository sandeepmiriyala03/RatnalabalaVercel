"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from "@mui/material";

/* ===============================
   📘 Language Content (YOUR DATA)
   =============================== */

const teluguHeading = "రత్నభావాలు - భావరత్నాలు";
const englishHeading = "Ratnabhavalu - Bhavaratnalu";

const teluguIntro = `
మానవజన్మ లభించేక కోరదగిన పురుషార్థాలలో ధర్మం మొదటిది మానవజాతికి ఆదర్శపురుషుడైన శ్రీరామచంద్రుని 'విగ్రహవాన్ ధర్మః' అన్నారు పెద్దలు. ముందుగా ధర్మాన్ని మనం రక్షిస్తే ఆ దర్మమే మనలను రక్షిస్తుంది.

కవియైనవాడు ఆ ధర్మాన్నే నీతిరూపంలో ప్రకటిస్తాడు...


కామఋషి సత్యనారాయణవర్మ  
కాకి నా డ  
23-3-83
`;

const englishIntro = `
Among the efforts that are desirable before taking human birth, Dharma is the first...
(Your full English content unchanged)

Kamarishi Satyanarayanavarma  
KakiNaDa  
23-3-83
`;

/* ===============================
   🧩 Component
   =============================== */

export default function AboutAuthor() {
  const [lang, setLang] = useState<"te" | "en">("te");
  const isTelugu = lang === "te";

  return (
    <Container sx={{ mt: 6, mb: 4 }}>
      {/* 🌐 Language Toggle */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_, v) => v && setLang(v)}
        >
          <ToggleButton value="te">తెలుగు</ToggleButton>
          <ToggleButton value="en">English</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 📖 Content Card */}
      <Card sx={{ p: { xs: 1, sm: 2 } }}>
        {/* 🔠 Heading */}
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontFamily: isTelugu
              ? "var(--telugu-font-family)"
              : "system-ui",
            fontSize: isTelugu
              ? "calc(var(--telugu-font-size) * 1.4)"
              : "2rem",
          }}
        >
          {isTelugu ? teluguHeading : englishHeading}
        </Typography>

        <CardContent>
          {/* 📝 Body */}
          <Typography
            sx={{
              whiteSpace: "pre-line",
              textAlign: "center",
              lineHeight: 1.9,
              fontFamily: isTelugu
                ? "var(--telugu-font-family)"
                : "system-ui",
              fontSize: isTelugu
                ? "var(--telugu-font-size)"
                : "1rem",
            }}
          >
            {isTelugu ? teluguIntro : englishIntro}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
