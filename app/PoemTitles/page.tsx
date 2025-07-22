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

// --- Data for Poem Titles ---
const poemTitles = [
  "అసహనం",
  "ఆకలి",
  "ఆనందం",
  "బుణం",
  "బాల్యం",
  "గుణం",
  "గర్వం",
  "గౌరవం",
  "జ్ఞానం",
  "జొప్యం",
  "క్రమశిక్షణ",
  "దయ",
  "దారిద్య్రం",
  "దానం",
  "దురాశ",
  "ద్రోహం",
  "ధనం",
  "న్యాయం",
  "పెద్దలు",
  "పొదుపు",
  "పౌరుషం",
  "భారం",
  "మనిషి",
  "మంచితనం",
  "మాటలు",
  "మనసు",
  "మైత్రి",
  "లోకం",
  "విషం",
  "వ్యసనం",
  "వైద్యం",
  "శుచి",
  "సుఖం",
  "సొగసు",
  "సౌజన్యం",
  "సాహసం"
];
const poemTitlesInEnglish = [
  "Addiction",
  "Adventure/Courage",
  "Beauty",
  "Betrayal",
  "Burden",
  "Charity",
  "Childhood",
  "Courtesy",
  "Debt",
  "Discipline",
  "Elders",
  "Friendness",
  "Goodness",
  "Greed",
  "Happiness/Comfort",
  "Human",
  "Hunger",
  "Intolerance",
  "Interference",
  "Joy",
  "Justice",
  "Kindness",
  "Knowledge",
  "Manliness/Valor",
  "Medicine",
  "Mind",
  "Poison",
  "Poverty",
  "Pride",
  "Purity/Cleanliness",
  "Quality/Virtue",
  "Respect",
  "Saving",
  "Wealth",
  "Words",
  "World"
];

// --- Language-specific Content Constants ---
const teluguIntro = "మొత్తం రచయిత రాసిన తెలుగు కవితలు 36 బాల్యం గురించి మీరు క్రింద శీర్షికలను చూడవచ్చు.ప్రతి కవితలో అద్భుతమైన అర్థం మరియు సరళమైన మార్గం తెలుగులో ఉన్నాయి. ఇందులో నాలుగు పంక్తులు ఉన్నాయి.";
const englishIntro = "You can see 36 Telugu poems written by the author about childhood below. Each poem has a wonderful meaning and a simple path in Telugu. Each poem contains four lines.";

const teluguListIntro = "మొత్తం పద్యాల పట్టిక";
const englishListIntro = "List of all poems";

const teluguLastLine = "చివరి పంక్తి భావరత్నబాల! భాగ్యలీల!";
const englishLastLine = "Last line: Bhavaratnabala! Bhagyaleela!";

const teluguHeading = "పదాలు";
const englishHeading = "Words";

// --- PoemTitlesPage Component ---
export default function PoemTitlesPage() {
  // Set initial language to English, as Sanskrit is removed
  const [lang, setLang] = useState<"en" | "te">("en");

  const displayedPoemTitles =
    lang === "te"
      ? poemTitles
      : poemTitlesInEnglish; // Only English or Telugu now

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
          {/* Sanskrit toggle has been removed */}
        </ToggleButtonGroup>
      </Box>

      {/* --- Main Content Card --- */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {lang === "te" ? teluguHeading : englishHeading}
        </Typography>

        <CardContent>
          {/* Introductory Text */}
          <Typography variant="h6" sx={{ whiteSpace: "pre-line", textAlign: "center" }}>
            {lang === "te" ? teluguIntro : englishIntro}
          </Typography>

          {/* Last Line */}
          <Typography align="center" sx={{ fontWeight: "bold", mt: 2 }}>
            {lang === "te" ? teluguLastLine : englishLastLine}
          </Typography>

          {/* List of Poem Titles */}
          <Box sx={{ mt: 4, px: 3 }}>
            <Typography variant="h5" gutterBottom textAlign="center">
              {lang === "te" ? teluguListIntro : englishListIntro}
            </Typography>

            <ul style={{ listStyleType: "circle", lineHeight: "2", fontSize: "1.1rem" }}>
              {displayedPoemTitles.map((title, index) => (
                <li key={index}>{title}</li>
              ))}
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}