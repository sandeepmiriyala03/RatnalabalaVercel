"use client";

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
// మీ కొత్త పింగళి సీతమామ సిరీస్ JSON డేటా పాత్ ఇక్కడ ఇవ్వండి
import seethamalaData from "@/data/Pingali_Seethamama.json";

export default function SmruthimalaPage() {
  const stories = seethamalaData.stories;
  const totalStories = seethamalaData.total_stories;

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, px: 2, maxWidth: 850, mx: "auto" }}>
      
      {/* 🌶️ Title */}
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #b91c1c, #2563eb)", // మిరపకాయల ఎరుపు & రాయల్ బ్లూ మిక్సింగ్
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center",
          mb: 1
        }}
      >
        స్మృతిమాల
      </Typography>

      {/* 👵 Subtitle */}
      <Typography 
        variant="h6" 
        align="center" 
        fontWeight={600} 
        color="text.secondary"
        sx={{ mb: 2, fontSize: "1.1rem", color: "#475569" }}
      >
        పింగళి సీతమామ సిరీస్: మిరపకాయల వీధి ముచ్చట్లు
      </Typography>

      {/* 📻 Tagline */}
      <Typography align="center" sx={{ mb: 3, opacity: 0.85, fontStyle: "italic" }}>
        🌶️ ఆనాటి మిరపఘాటు – 👵 సీతమామ ప్రేమ – 🥞 కాంతమ్మ ఇడ్లీ రుచి
      </Typography>

      {/* 📈 Platform Summary */}
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 5 }}
      >
        <Chip
          label={`📚 మొత్తం ముచ్చట్లు: ${totalStories}`}
          color="error"
          variant="outlined"
        />
        <Chip 
          label="✨ జ్ఞాపకాల హారం × తెలుగు" 
          variant="outlined" 
        />
      </Stack>

      <Divider sx={{ mb: 5 }} />

      {/* 📖 Stories Container */}
      <Stack spacing={4}>
        {stories.map((story, index) => (
          <Card 
            key={story.story_id} 
            elevation={2} 
            sx={{ 
              borderRadius: 3, 
              borderLeft: "5px solid #b91c1c", // లెఫ్ట్ సైడ్ బోర్డర్ హైలైట్
              background: "#fffdfa" // పాత చందమామ పుస్తకాల కలర్ ఫీల్ కోసం చిన్న ఆఫ్-వైట్ షేడ్
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              
              {/* కథ సంఖ్య & శీర్షిక */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Chip 
                  label={`భాగం ${index + 1}`} 
                  size="small" 
                  color="error" 
                  sx={{ fontWeight: "bold", borderRadius: 1 }} 
                />
                <Typography 
                  variant="h5" 
                  fontWeight={700} 
                  color="#0f172a"
                >
                  {story.title}
                </Typography>
              </Stack>

              {/* కథ చిన్న సబ్‌టైటిల్ */}
              <Typography 
                variant="subtitle2" 
                color="text.secondary" 
                sx={{ mb: 3, pl: 0.5, fontStyle: "italic" }}
              >
                {story.subtitle}
              </Typography>

              <Divider sx={{ mb: 3, opacity: 0.5 }} />

              {/* కథ అసలు పాఠం (Paragraphs) */}
              <Stack spacing={2.5}>
                {story.story_text.map((paragraph, pIndex) => (
                  <Typography
                    key={pIndex}
                    variant="body1"
                    sx={{
                      lineHeight: 1.8,
                      color: "#334155",
                      fontSize: "1.05rem",
                      textAlign: "justify",
                      textIndent: { xs: "0px", sm: "24px" } // మొదటి లైన్ కాస్త లోపలికి రావడానికి
                    }}
                  >
                    {paragraph}
                  </Typography>
                ))}
              </Stack>

            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}