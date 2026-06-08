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

  // డివైస్ స్క్రీన్ డైమెన్షన్స్ ట్రాక్ చేయడానికి స్టేట్
  const [deviceDimensions, setDeviceDimensions] = useState({ width: 375, height: 812 });

  useEffect(() => {
    // విండో లోడ్ అయినప్పుడు మరియు రీసైజ్ అయినప్పుడు డివైస్ సైజ్ అప్‌డేట్ అవుతుంది
    if (typeof window !== "undefined") {
      setDeviceDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const handleResize = () => {
        setDeviceDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
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

  // డివైస్ సైజ్ ప్రకారం (As Per Device) పోస్టర్ డౌన్‌లోడ్ చేసే పర్ఫెక్ట్ ఫంక్షన్
  const downloadSharePoster = async (storyId: string, title: string) => {
    const element = document.getElementById(`hidden-poster-${storyId}`);
    if (!element) return;

    try {
      // 1. పోస్టర్ కంటైనర్‌ను తాత్కాలికంగా ఆన్ చేయడం
      element.style.display = "block";

      // 2. html2canvas రన్ చేసి ఇమేజ్ క్యాప్చర్ చేయడం
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: window.devicePixelRatio || 2, // డివైస్ స్క్రీన్ క్వాలిటీని బట్టి క్రిస్ప్ ఇమేజ్ వస్తుంది
        backgroundColor: null,
        width: deviceDimensions.width, // ఎగ్జాక్ట్ డివైస్ వెడల్పు
        height: deviceDimensions.height, // ఎగ్జాక్ట్ డివైస్ ఎత్తు
      });

      // 3. పోస్టర్ కంటైనర్‌ను మళ్లీ హైడ్ చేయడం
      element.style.display = "none";

      // 4. ఇమేజ్ డౌన్‌లోడ్ ప్రాసెస్
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${title.replace(/\s+/g, "_")}_డివైస్_స్టేటర్.png`;
      link.click();
    } catch (error) {
      console.error("పోస్టర్ డౌన్‌లోడ్ అవ్వడంలో సమస్య వచ్చింది:", error);
    }
  };

  return (
    <Box sx={{ bg: "#fcfbfa", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="md">
        
        {/* వెబ్‌సైట్ మెయిన్ హెడర్ */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Peddana', serif",
              fontWeight: 800,
              color: "#3a220f",
              mb: 1,
            }}
          >
            స్మృతిమాల
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Mandali', sans-serif",
              color: "#6e523b",
              mb: 3,
            }}
          >
            పింగళి సీతమామ సిరీస్
          </Typography>

          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Chip
              icon={<Book sx={{ fontSize: "18px", color: "#fff !important" }} />}
              label={`${stories.length} కథలు`}
              sx={{ bgcolor: "#5c3d24", color: "#fff", fontWeight: 600, fontFamily: "'NTR', sans-serif" }}
            />
            <Chip
              icon={<VolumeUp sx={{ fontSize: "18px" }} />}
              variant="outlined"
              label="ఆడియో ప్లేయర్"
              sx={{ borderColor: "#5c3d24", color: "#5c3d24", fontWeight: 600, fontFamily: "'NTR', sans-serif" }}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 5, borderColor: "#eedfc8" }} />

        {/* కథల లిస్ట్ */}
        <Stack spacing={5}>
          {paginatedStories.map((story, index) => {
            const isPlaying = playingId === story.story_id;
            const currentStoryNumber = (page - 1) * STORIES_PER_PAGE + index + 1;

            return (
              <Box key={story.story_id} sx={{ position: "relative" }}>
                
                {/* రీడింగ్ కార్డ్ */}
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: "1px solid #ebdcc5",
                    background: "#ffffff",
                    p: { xs: 2, sm: 4 },
                    boxShadow: "0 4px 20px rgba(92, 61, 36, 0.03)",
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontFamily: "'NTR', sans-serif", color: "#b84244", fontWeight: 700, fontSize: "1.05rem", display: "block", mb: 0.5 }}>
                          కథా భాగం {currentStoryNumber}
                        </Typography>
                        <Typography variant="h4" sx={{ fontFamily: "'Ramabhadra', sans-serif", color: "#1f1105", fontWeight: 700, fontSize: { xs: "1.4rem", sm: "1.8rem" }, mb: 1 }}>
                          {story.title}
                        </Typography>
                        <Typography variant="body1" sx={{ fontFamily: "'Mandali', sans-serif", color: "#7c624d", fontSize: "1.05rem" }}>
                          {story.subtitle}
                        </Typography>
                      </Box>

                      {/* ఆడియో & షేర్ బటన్లు */}
                      <Stack direction="row" spacing={1}>
                        <Tooltip title={isPlaying ? "ఆపు" : "వినండి"}>
                          <IconButton
                            onClick={() => handlePlaySpeech(story.story_id, story.story_text, story.title)}
                            sx={{
                              bgcolor: isPlaying ? "#b84244" : "#fbf7f0",
                              color: isPlaying ? "#fff" : "#5c3d24",
                              "&:hover": { bgcolor: isPlaying ? "#963234" : "#f3eada" },
                              width: 44,
                              height: 44,
                            }}
                          >
                            {isPlaying ? <Stop /> : <PlayArrow />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="డివైస్ సైజ్ పోస్టర్ సేవ్ చేయండి">
                          <IconButton
                            onClick={() => downloadSharePoster(story.story_id, story.title)}
                            sx={{
                              bgcolor: "#f0f7f4",
                              color: "#2a6f4d",
                              "&:hover": { bgcolor: "#e1ede8" },
                              width: 44,
                              height: 44,
                            }}
                          >
                            <Share sx={{ fontSize: "20px" }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 3, borderColor: "#f7f1e6" }} />

                    {/* స్టోరీ టెక్స్ట్ */}
                    <Box>
                      {story.story_text.map((paragraph, idx) => (
                        <Typography key={idx} sx={{ fontFamily: "'NTR', sans-serif", fontSize: { xs: "1.25rem", sm: "1.35rem" }, color: "#2c1e12", mb: 2.5, lineHeight: 1.9, textAlign: "justify" }}>
                          {paragraph}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* ----------------------------------------------------------------- */}
                {/* 📱 డైనమిక్ డివైస్ సైజ్ పోస్టర్ (As Per Device Screen Size - No Stars) */}
                {/* ----------------------------------------------------------------- */}
                <Box
                  id={`hidden-poster-${story.story_id}`}
                  sx={{
                    display: "none", 
                    width: `${deviceDimensions.width}px`,   // కరెక్ట్ డివైస్ విడ్త్ ఇక్కడ అప్లై అవుతుంది
                    height: `${deviceDimensions.height}px`, // కరెక్ట్ డివైస్ హైట్ ఇక్కడ అప్లై అవుతుంది
                    position: "absolute",
                    top: -9999,
                    left: -9999,
                    background: "linear-gradient(135deg, #2b1704 0%, #4a2c11 100%)", 
                    p: "5vw", // డివైస్ స్క్రీన్‌ను బట్టి ప్యాడింగ్ మారుతుంది
                    boxSizing: "border-box",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      border: "1px solid rgba(238, 223, 200, 0.3)",
                      borderRadius: "12px",
                      p: "4vw",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* బ్రాండింగ్ శీర్షిక */}
                    <Box sx={{ textAlign: "center", mt: "6vh" }}>
                      <Typography sx={{ fontFamily: "'Peddana', serif", fontSize: "clamp(24px, 5vw, 42px)", color: "#eedfc8" }}>
                        పింగళి సీతమామ స్మృతిమాల
                      </Typography>
                      <Box sx={{ width: "40px", height: "1px", bg: "rgba(238, 223, 200, 0.3)", mx: "auto", mt: 2 }} />
                    </Box>

                    {/* కంటెంట్ ఏరియా - క్లీన్ & సింపుల్ */}
                    <Box sx={{ textAlign: "center", px: 2 }}>
                      <Typography sx={{ fontFamily: "'NTR', sans-serif", fontSize: "clamp(16px, 3.5vw, 26px)", color: "#eedfc8", opacity: 0.7, mb: 2 }}>
                        భాగం {currentStoryNumber}
                      </Typography>
                      
                      <Typography
                        sx={{
                          fontFamily: "'Ramabhadra', sans-serif",
                          fontSize: "clamp(32px, 7vw, 68px)", // మొబైల్ ఐతే చిన్నగా, డెస్క్‌టాప్ ఐతే పెద్దగా మారుతుంది
                          color: "#ffffff",
                          fontWeight: "bold",
                          lineHeight: 1.4,
                          mb: 3,
                        }}
                      >
                        {story.title}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "'Mandali', sans-serif",
                          fontSize: "clamp(18px, 4vw, 32px)",
                          color: "#eedfc8",
                          lineHeight: 1.6,
                        }}
                      >
                        {story.subtitle}
                      </Typography>
                    </Box>

                    {/* ఫుటర్ నోట్ */}
                    <Box sx={{ textAlign: "center", mb: "4vh" }}>
                      <Typography sx={{ fontFamily: "'Mandali', sans-serif", fontSize: "clamp(14px, 3vw, 22px)", color: "#f3eada", opacity: 0.5 }}>
                        వెబ్‌సైట్‌లో పూర్తి కథను చదవండి
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
              "& .MuiPaginationItem-root": { fontFamily: "'NTR', sans-serif", fontSize: "1.1rem", color: "#5c3d24" },
              "& .Mui-selected": { bgcolor: "#5c3d24 !important", color: "#fff !important" },
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
}