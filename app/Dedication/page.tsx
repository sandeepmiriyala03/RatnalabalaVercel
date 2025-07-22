"use client";

import {
  Box,
  Typography,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from "@mui/material";
import { useState } from "react";

// --- Language-specific Content Constants ---
const teluguIntro = `
మా ప్రియతమ తాతయ్య, రచయిత శ్రీ మిరియాల వెంకట రత్నం గారికి, మరియు
ఈ పుస్తక రూపకల్పనలో భాగమైనశ్రీ కామ బుషి సత్య నారాయణ వర్మ (అముఖం),
డాక్టర్ మిరియాల రామ కృష్ణ (సంపాదకుడు),శ్రీమతి ఎం లక్ష్మి దేవి (ప్రచురణ) గార్లకు అంకితం చేస్తున్నాము. వారి సహకారం, కృషి లేకుండా ఇది సాధ్యమయ్యేది కాదు.

కృతజ్ఞతలతో,

మీ కుటుంబం
`;

const englishIntro = `We dedicate this book to our beloved grandfather,
the author Sri Miriyala Venkata Ratnam,
and to Sri Kama Bushi Satyanarayana Varma (Editor),
Dr. Miriyala Rama Krishna (Editor), and Smt. M. Lakshmi Devi (Publisher)

who were part of the creation of this book.

This would not have been possible without their support and hard work.

With gratitude,

Your family`;

// Headings for the dedication page
const teluguHeading = "అంకితం";
const englishHeading = "Dedication";

// --- HomePage Component ---
export default function HomePage() {
  const [lang, setLang] = useState<"te" | "en">("te");

  // All speech-related state, effects, and functions have been removed.

  return (
    <Container sx={{ mt: 6 }}>
      {/* --- Language Toggle --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_, newLang) => {
            if (newLang) {
              setLang(newLang);
            }
          }}
          aria-label="language selection"
        >
          <ToggleButton value="te" aria-label="Telugu">తెలుగు</ToggleButton>
          <ToggleButton value="en" aria-label="English">English</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* --- Main Content Card (Heading and Intro Text) --- */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {lang === "te" ? teluguHeading : englishHeading}
        </Typography>

        <CardContent>
          <Typography variant="h6" sx={{ whiteSpace: "pre-line", textAlign: "center" }}>
            {lang === "te" ? teluguIntro : englishIntro}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}