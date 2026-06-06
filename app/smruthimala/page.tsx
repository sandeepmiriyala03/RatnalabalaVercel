"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Card,
  CardContent,
  Pagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import { PlayArrow, Stop, VolumeUp } from "@mui/icons-material";
import seethamalaData from "@/data/Pingali_Seethamama.json";

const STORIES_PER_PAGE = 3;

export default function SmruthimalaPage() {
  const stories = seethamalaData.stories;
  const totalStories = stories.length;

  // స్టేట్స్ (States)
  const [page, setPage] = useState(1);
  const [playingId, setPlayingId] = useState(null);


// పేజీ మారినప్పుడు ఆడియో ఆపి, స్క్రీన్ పైకి స్క్రోల్ అవ్వడానికి
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    handleStopSpeech();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ప్రస్తుతం ఉన్న పేజీ కథలను లెక్కించడం
  const paginatedStories = useMemo(() => {
    const startIndex = (page - 1) * STORIES_PER_PAGE;
    return stories.slice(startIndex, startIndex + STORIES_PER_PAGE);
  }, [page, stories]);

  // ఆడియో ఆపే ఫంక్షన్
  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }
  };

  // పేజీ రీలోడ్ లేదా క్లోజ్ అయినప్పుడు ఆడియో ఆటోమేటిక్‌గా ఆగిపోవడానికి
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // తెలుగు Text-to-Speech (TTS) ఫంక్షన్
  const handlePlaySpeech = (storyId, textArray, title) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;

    // ఒకవేళ ఆల్రెడీ ఇదే కథ ప్లే అవుతుంటే ఆపేయాలి
    if (playingId === storyId) {
      handleStopSpeech();
      return;
    }

    synth.cancel(); // మునుపటి ఆడియోలను క్లియర్ చేయడానికి

    // శీర్షిక మరియు పారాగ్రాఫ్‌లను ఒకే టెక్స్ట్‌గా మార్చడం
    const fullText = `${title}. ${textArray.join(" ")}`;
    const utterance = new SpeechSynthesisUtterance(fullText);

    // బ్రౌజర్‌లో అందుబాటులో ఉన్న తెలుగు వాయిస్‌ను వెతకడం
    const voices = synth.getVoices();
    const teluguVoice = voices.find(
      (voice) => voice.lang.includes("te") || voice.lang.includes("TE")
    );
    
    if (teluguVoice) {
      utterance.voice = teluguVoice;
    }
    
    utterance.lang = "te-IN";
    utterance.rate = 0.95; // చదివే వేగం

    // ఆడియో ముగిసినప్పుడు స్టేట్ రీసెట్ చేయడం
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(storyId);
    synth.speak(utterance);
  };

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, px: 2, maxWidth: 850, mx: "auto", minHeight: "100vh" }}>
      
      {/* 🌶️ ప్రధాన శీర్షిక */}
      <Typography
        variant="h3"
        fontWeight={900}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #dc2626, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          mb: 1,
          fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.5rem" }
        }}
      >
        స్మృతిమాల
      </Typography>

      {/* 👵 సబ్‌టైటిల్ */}
      <Typography 
        variant="h6" 
        align="center" 
        fontWeight={600} 
        sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" }, color: "#475569" }}
      >
        పింగళి సీతమామ సిరీస్: | మిరపకాయల వీధి ముచ్చట్లు
      </Typography>

      {/* 📻 టాగ్‌లైన్ */}
      <Typography align="center" sx={{ mb: 4, opacity: 0.85, fontStyle: "italic", color: "#64748b", fontSize: "0.95rem" }}>
        🌶️ ఆనాటి మిరపఘాటు – 👵 సీతమామ ప్రేమ – 🥞 కాంతమ్మ ఇడ్లీ రుచి
      </Typography>

      {/* 📈 ప్లాట్‌ఫారమ్ సమ్మరీ చిప్స్ */}
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
          variant="filled"
          sx={{ fontWeight: "bold" }}
        />
        <Chip 
          label="🔊 తెలుగు ఆడియో అందుబాటులో ఉంది" 
          icon={<VolumeUp fontSize="small" />}
          variant="outlined" 
          color="primary"
          sx={{ fontWeight: "500" }}
        />
      </Stack>

      <Divider sx={{ mb: 5 }} />

      {/* 📖 కథల కంటైనర్ */}
      <Stack spacing={4}>
        {paginatedStories.map((story) => {
          const originalIndex = stories.findIndex((s) => s.story_id === story.story_id);
          const isCurrentPlaying = playingId === story.story_id;

          return (
            <Card 
              key={story.story_id} 
              elevation={isCurrentPlaying ? 6 : 2} 
              sx={{ 
                borderRadius: 4, 
                borderLeft: isCurrentPlaying ? "6px solid #2563eb" : "6px solid #dc2626",
                background: isCurrentPlaying ? "#f8fafc" : "#fffdfa",
                transition: "all 0.3s ease",
                transform: isCurrentPlaying ? "scale(1.01)" : "none"
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                
                {/* హెడర్: భాగం సంఖ్య, శీర్షిక మరియు ఆడియో బటన్ */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                    <Chip 
                      label={`భాగం ${originalIndex + 1}`} 
                      size="small" 
                      color={isCurrentPlaying ? "primary" : "error"} 
                      sx={{ fontWeight: "bold", borderRadius: 1 }} 
                    />
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      color="#0f172a"
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    >
                      {story.title}
                    </Typography>
                  </Stack>

                  {/* 🎧 TTS ఆడియో ప్లేయర్ బటన్ */}
                  <Tooltip title={isCurrentPlaying ? "ఆడియో ఆపు" : "తెలుగులో వినండి"} placement="top">
                    <IconButton 
                      onClick={() => handlePlaySpeech(story.story_id, story.story_text, story.title)}
                      color={isCurrentPlaying ? "primary" : "default"}
                      sx={{ 
                        background: isCurrentPlaying ? "#dbeafe" : "#f1f5f9",
                        "&:hover": { background: isCurrentPlaying ? "#bfdbfe" : "#e2e8f0" }
                      }}
                    >
                      {isCurrentPlaying ? <Stop /> : <PlayArrow />}
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* కథ చిన్న సబ్‌టైటిల్ */}
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ mb: 3, pl: 0.5, fontStyle: "italic", color: "#64748b" }}
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
                        lineHeight: 1.9,
                        color: "#334155",
                        fontSize: "1.08rem",
                        textAlign: "justify",
                        textIndent: { xs: "0px", sm: "24px" }
                      }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>

              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* 📑 కింద పేజీల విభజన (Pagination UI) */}
      {totalStories > STORIES_PER_PAGE && (
        <Stack alignItems="center" sx={{ mt: 6, mb: 2 }}>
          <Pagination 
            count={Math.ceil(totalStories / STORIES_PER_PAGE)} 
            page={page} 
            onChange={handlePageChange} 
            color="error" 
            size="large"
            variant="outlined"
            shape="rounded"
            sx={{
              "& .MuiPaginationItem-root": {
                fontWeight: "bold",
              }
            }}
          />
        </Stack>
      )}

    </Box>
  );
}