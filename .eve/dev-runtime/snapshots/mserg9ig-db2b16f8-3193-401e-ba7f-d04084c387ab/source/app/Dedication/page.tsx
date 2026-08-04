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

const teluguHeading = "అంకితం";
const englishHeading = "Dedication";

const teluguIntro = `
మా ప్రియతమ తాతయ్య, రచయిత శ్రీ మిరియాల వెంకట రత్నం గారికి, మరియు
ఈ పుస్తక రూపకల్పనలో భాగమైనశ్రీ కామ బుషి సత్య నారాయణ వర్మ (అముఖం),
డాక్టర్ మిరియాల రామ కృష్ణ (సంపాదకుడు),శ్రీమతి ఎం లక్ష్మి దేవి (ప్రచురణ) గార్లకు అంకితం చేస్తున్నాము. వారి సహకారం, కృషి లేకుండా ఇది సాధ్యమయ్యేది కాదు.

కృతజ్ఞతలతో,

మీ కుటుంబం
`;

const englishIntro = `
We dedicate this book to our beloved grandfather,
the author Sri Miriyala Venkata Ratnam,
and to Sri Kama Bushi Satyanarayana Varma (Editor),
Dr. Miriyala Rama Krishna (Editor), and
Smt. M. Lakshmi Devi (Publisher),

who were part of the creation of this book.

This would not have been possible without their support and hard work.

With gratitude,

Your family
`;

/* ===============================
   🧩 Component
   =============================== */

export default function DedicationPage() {
  const [lang, setLang] = useState<"te" | "en">("te");
  const isTelugu = lang === "te";

  return (
    <Container sx={{ mt: 6, mb: 4 }}>
      {/* 🌐 Language Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_, v) => v && setLang(v)}
          aria-label="language selection"
        >
          <ToggleButton value="te">తెలుగు</ToggleButton>
          <ToggleButton value="en">English</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 📖 Content Card */}
      <Card sx={{ p: { xs: 1, sm: 2 }, mb: 4 }}>
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
            fontWeight: 600,
          }}
        >
          {isTelugu ? teluguHeading : englishHeading}
        </Typography>

        <CardContent>
          {/* 📝 Body Text */}
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
