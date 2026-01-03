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

/* ------------------ DATA ------------------ */

const poemTitles = [
  "అసహనం","ఆకలి","ఆనందం","బుణం","బాల్యం","గుణం","గర్వం","గౌరవం",
  "జ్ఞానం","జొప్యం","క్రమశిక్షణ","దయ","దారిద్య్రం","దానం","దురాశ",
  "ద్రోహం","ధనం","న్యాయం","పెద్దలు","పొదుపు","పౌరుషం","భారం",
  "మనిషి","మంచితనం","మాటలు","మనసు","మైత్రి","లోకం","విషం",
  "వ్యసనం","వైద్యం","శుచి","సుఖం","సొగసు","సౌజన్యం","సాహసం",
];

const poemTitlesInEnglish = [
  "Addiction","Adventure / Courage","Beauty","Betrayal","Burden",
  "Charity","Childhood","Courtesy","Debt","Discipline","Elders",
  "Friendship","Goodness","Greed","Happiness","Human","Hunger",
  "Intolerance","Interference","Joy","Justice","Kindness","Knowledge",
  "Valor","Medicine","Mind","Poison","Poverty","Pride","Purity",
  "Virtue","Respect","Saving","Wealth","Words","World",
];

/* ------------------ TEXT ------------------ */

const teluguIntro =
  "మొత్తం రచయిత రాసిన తెలుగు కవితలు 36. బాల్యం గురించి రచించబడిన ఈ పద్యాలు సరళమైన భాషలో గాఢమైన భావాన్ని వ్యక్తపరుస్తాయి.";

const englishIntro =
  "Below are 36 Telugu poems written by the author. Each poem conveys deep meaning in a simple and elegant form.";

const teluguListIntro = "మొత్తం పద్యాల పట్టిక";
const englishListIntro = "List of all poems";

const teluguLastLine = "చివరి పంక్తి : భావరత్నబాల! భాగ్యలీల!";
const englishLastLine = "Last line: Bhavaratnabala! Bhagyaleela!";

const teluguHeading = "పదాలు";
const englishHeading = "Words";

/* ------------------ COMPONENT ------------------ */

export default function PoemTitlesPage() {
  const [lang, setLang] = useState<"te" | "en">("en");

  const displayedTitles = lang === "te" ? poemTitles : poemTitlesInEnglish;

  return (
    <Container
      sx={{
        mt: 6,
        fontFamily: "var(--telugu-font-family)",
        fontSize: "var(--telugu-font-size)",
        lineHeight: 1.9,
      }}
    >
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
        >
          <ToggleButton value="te">తెలుగు</ToggleButton>
          <ToggleButton value="en">English</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 📘 Content */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: "calc(var(--telugu-font-size) * 1.8)",
            }}
          >
            {lang === "te" ? teluguHeading : englishHeading}
          </Typography>

          <Typography
            align="center"
            sx={{ whiteSpace: "pre-line", mb: 2 }}
          >
            {lang === "te" ? teluguIntro : englishIntro}
          </Typography>

          <Typography
            align="center"
            sx={{ fontWeight: 600, mb: 3 }}
          >
            {lang === "te" ? teluguLastLine : englishLastLine}
          </Typography>

          {/* 📜 Titles List */}
          <Typography
            align="center"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            {lang === "te" ? teluguListIntro : englishListIntro}
          </Typography>

          <Box component="ul" sx={{ pl: 3 }}>
            {displayedTitles.map((t, i) => (
              <Typography
                component="li"
                key={i}
                sx={{ mb: 0.5 }}
              >
                {t}
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
