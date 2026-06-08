"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Container,
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  VolumeUp,
  Share,
  Book,
} from "@mui/icons-material";
import html2canvas from "html2canvas";

// జేసన్ డేటా ఇంపోర్ట్
import seethamalaData from "@/data/Pingali_Seethamama.json";

interface Story {
  story_id: string;
  title: string;
  subtitle: string;
  story_text: string[];
}

const STORIES_PER_PAGE = 3;

export default function SmruthimalaPage() {
  const stories = (seethamalaData.stories as Story[]) || [];

  const [page, setPage] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // డివైస్ స్క్రీన్ వెడల్పును ట్రాక్ చేయడానికి స్టేట్
  const [deviceWidth, setDeviceWidth] = useState(375);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceWidth(window.innerWidth);

      const handleResize = () => {
        setDeviceWidth(window.innerWidth);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // గూగుల్ తెలుగు ఫాంట్లు
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Mandali&family=NTR&family=Peddana&family=Ramabhadra&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const paginatedStories = useMemo(() => {
    const start = (page - 1) * STORIES_PER_PAGE;
    return stories.slice(start, start + STORIES_PER_PAGE);
  }, [page, stories]);

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlaySpeech = (storyId: string, textArray: string[], title: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    if (playingId === storyId) {
      handleStopSpeech();
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(`${title}. ${textArray.join(" ")}`);
    const voices = synth.getVoices();
    const teluguVoice = voices.find(
      (voice) => voice.lang.includes("te") || voice.lang.includes("TE")
    );

    if (teluguVoice) utterance.voice = teluguVoice;
    utterance.lang = "te-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(storyId);
    synth.speak(utterance);
  };

  // వైట్ పేజీ బగ్ ఫిక్స్ చేయబడిన పర్ఫెక్ట్ డౌన్‌లోడ్ ఫంక్షన్
  const downloadFullStoryPoster = async (storyId: string, title: string) => {
    const element = document.getElementById(`hidden-poster-${storyId}`);
    if (!element) return;

    try {
      // ఫాంట్లు పూర్తిగా లోడ్ అయ్యే వరకు వేచి ఉండటం
      await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 1. క్యాప్చర్ చేయడానికి వీలుగా ఎలిమెంట్‌ను తాత్కాలికంగా విజిబుల్ చేయడం
      const originalOpacity = element.style.opacity;
      const originalLeft = element.style.left;
      const originalPosition = element.style.position;
      
      element.style.opacity = "1";
      element.style.left = "0px";
      element.style.position = "absolute"; 

      // 2. క్యాప్చర్ రన్ చేయడం (విండో బౌండరీస్ ఫోర్స్ చేయబడ్డాయి)
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff", 
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,  
        windowHeight: element.scrollHeight,
      });

      // 3. క్యాప్చర్ అయిపోయాక మళ్ళీ ఎలిమెంట్‌ను పాతపద్ధతిలో దాచేయడం
      element.style.opacity = originalOpacity;
      element.style.left = originalLeft;
      element.style.position = originalPosition;

      // 4. ఇమేజ్ డౌన్‌లోడ్ ప్రాసెస్
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${title.replace(/\s+/g, "_")}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Poster download failed:", error);
    }
  };

  return (
    <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="md">
        
        {/* వెబ్‌సైట్ మెయిన్ హెడర్ */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Peddana', serif",
              fontWeight: 800,
              color: "#000000",
              mb: 1,
            }}
          >
            స్మృతిమాల
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Mandali', sans-serif",
              color: "#000000",
              mb: 3,
            }}
          >
            పింగళి సీతమామ సిరీస్
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Chip
              icon={<Book sx={{ fontSize: "18px", color: "#ffffff !important" }} />}
              label={`${stories.length} కథలు`}
              sx={{ bgcolor: "#000000", color: "#ffffff", fontWeight: 600, fontFamily: "'NTR', sans-serif" }}
            />
            <Chip
              icon={<VolumeUp sx={{ fontSize: "18px", color: "#000000 !important" }} />}
              variant="outlined"
              label="ఆడియో ప్లేయర్"
              sx={{ borderColor: "#000000", color: "#000000", fontWeight: 600, fontFamily: "'NTR', sans-serif" }}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 5, borderColor: "#000000" }} />

        {/* కథల లిస్ట్ */}
        <Stack spacing={5}>
          {paginatedStories.map((story, index) => {
            const isPlaying = playingId === story.story_id;
            const currentStoryNumber = (page - 1) * STORIES_PER_PAGE + index + 1;

            return (
              <Box key={story.story_id} sx={{ position: "relative" }}>
                
                {/* వెబ్‌సైట్ రీడింగ్ కార్డ్ */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 0,
                    border: "2px solid #000000",
                    background: "#ffffff",
                    p: { xs: 2, sm: 4 },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontFamily: "'NTR', sans-serif", color: "#000000", fontWeight: 700, fontSize: "1.05rem", display: "block", mb: 0.5 }}>
                          కథా భాగం {currentStoryNumber}
                        </Typography>
                        <Typography variant="h4" sx={{ fontFamily: "'Ramabhadra', sans-serif", color: "#000000", fontWeight: 700, fontSize: { xs: "1.4rem", sm: "1.8rem" }, mb: 1 }}>
                          {story.title}
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: "'Mandali', sans-serif", color: "#000000", fontSize: "1.05rem" }}>
                          {story.subtitle}
                        </Typography>
                      </Box>

                      {/* ఆడియో & షేర్ బటన్లు */}
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={isPlaying ? "ఆపు" : "వినండి"}>
                          <IconButton
                            onClick={() => handlePlaySpeech(story.story_id, story.story_text, story.title)}
                            sx={{
                              bgcolor: isPlaying ? "#000000" : "#ffffff",
                              color: isPlaying ? "#ffffff" : "#000000",
                              border: "1px solid #000000",
                              "&:hover": { bgcolor: isPlaying ? "#333333" : "#f0f0f0" },
                              width: 44,
                              height: 44,
                            }}
                          >
                            {isPlaying ? <Stop /> : <PlayArrow />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="పూర్తి కథా పోస్టర్ డౌన్‌లోడ్ చేయండి">
                          <IconButton
                            onClick={() => downloadFullStoryPoster(story.story_id, story.title)}
                            sx={{
                              bgcolor: "#ffffff",
                              color: "#000000",
                              border: "1px solid #000000",
                              "&:hover": { bgcolor: "#f0f0f0" },
                              width: 44,
                              height: 44,
                            }}
                          >
                            <Share sx={{ fontSize: "20px" }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 3, borderColor: "#000000" }} />

                    {/* వెబ్‌సైట్ స్టోరీ టెక్స్ట్ */}
                    <Box>
                      {story.story_text.map((paragraph, idx) => (
                        <Typography key={idx} sx={{ fontFamily: "'NTR', sans-serif", fontSize: { xs: "1.25rem", sm: "1.35rem" }, color: "#000000", mb: 2.5, lineHeight: 1.9, textAlign: "justify" }}>
                          {paragraph}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* ----------------------------------------------------------------- */}
                {/* హిడెన్ పోస్టర్ కంటైనర్ (opacity: 0 తో పర్ఫెక్ట్ క్యాప్చర్ కోసం) */}
                {/* ----------------------------------------------------------------- */}
                <Box
                  id={`hidden-poster-${story.story_id}`}
                  sx={{
                    opacity: 0,
                    pointerEvents: "none",
                    position: "fixed",
                    left: "-10000px",
                    top: 0,
                    width: `${deviceWidth}px`, 
                    height: "auto",            
                    background: "#ffffff",     
                    p: "6vw", 
                    boxSizing: "border-box",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      border: "2px solid #000000", 
                      p: "6vw",
                      display: "flex",
                      flexDirection: "column",
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    {/* పోస్టర్ హెడర్ */}
                    <Box sx={{ textAlign: "center", mb: "4vh" }}>
                      <Typography sx={{ fontFamily: "'Peddana', serif", fontSize: "clamp(24px, 5vw, 40px)", color: "#000000", fontWeight: 700 }}>
                        పింగళి సీతమామ స్మృతిమాల
                      </Typography>
                      <Box sx={{ width: "60px", height: "2px", backgroundColor: "#000000", mx: "auto", mt: 1.5 }} />
                    </Box>

                    {/* పోస్టర్ టైటిల్ సెక్షన్ */}
                    <Box sx={{ textAlign: "center", mb: "3vh" }}>
                      <Typography sx={{ fontFamily: "'NTR', sans-serif", fontSize: "clamp(14px, 3.5vw, 22px)", color: "#000000", fontWeight: 600, mb: 1 }}>
                        భాగం {currentStoryNumber}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Ramabhadra', sans-serif",
                          fontSize: "clamp(28px, 6.5vw, 54px)",
                          color: "#000000",
                          fontWeight: "bold",
                          lineHeight: 1.3,
                          mb: 1.5,
                        }}
                      >
                        {story.title}
                      </Typography>
                      <Typography sx={{ fontFamily: "'Mandali', sans-serif", fontSize: "clamp(16px, 4vw, 26px)", color: "#000000" }}>
                        {story.subtitle}
                      </Typography>
                    </Box>

                    <Divider sx={{ borderColor: "#000000", borderBottomWidth: 1, my: 3 }} />

                    {/* 📜 పూర్తి కథా భాగం */}
                    <Box sx={{ flexGrow: 1 }}>
                      {story.story_text.map((paragraph, idx) => (
                        <Typography
                          key={idx}
                          sx={{
                            fontFamily: "'NTR', sans-serif",
                            fontSize: "clamp(18px, 4.5vw, 24px)", 
                            color: "#000000", 
                            mb: 2.5,
                            lineHeight: 1.8,
                            textAlign: "justify",
                            fontWeight: 500,
                          }}
                        >
                          {paragraph}
                        </Typography>
                      ))}
                    </Box>

                    <Divider sx={{ borderColor: "#000000", borderBottomWidth: 1, my: 3 }} />

                    {/* ఫుటర్ */}
                    <Box sx={{ textAlign: "center", mt: "2vh" }}>
                      <Typography sx={{ fontFamily: "'Mandali', sans-serif", fontSize: "clamp(12px, 3vw, 18px)", color: "#000000", fontWeight: 600 }}>
                        బాల్య మాల  
                      </Typography>
                    </Box>

                  </Box>
                </Box>
                {/* ----------------------------------------------------------------- */}

              </Box>
            );
          })}
        </Stack>

        {/* పేజినేషన్ */}
        <Stack alignItems="center" sx={{ mt: 6 }}>
          <Pagination
            page={page}
            onChange={(_, value) => {
              setPage(value);
              handleStopSpeech();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            count={Math.ceil(stories.length / STORIES_PER_PAGE)}
            sx={{
              "& .MuiPaginationItem-root": { fontFamily: "'NTR', sans-serif", fontSize: "1.1rem", color: "#000000", border: "1px solid #000000", borderRadius: 0 },
              "& .Mui-selected": { bgcolor: "#000000 !important", color: "#ffffff !important" },
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
}