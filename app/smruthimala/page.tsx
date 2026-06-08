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
  Download,
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

  // గూగుల్ తెలుగు ఫాంట్లను హెడ్ సెకన్ లో యాడ్ చేయడం కోసం
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Peddana&family=Ramabhadra&family=NTR&family=Mandali&display=swap";
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

  // పోస్టర్ డౌన్‌లోడ్ ఫంక్షన్
  const downloadPoster = async (storyId: string, title: string) => {
    const element = document.getElementById(`poster-container-${storyId}`);
    if (!element) return;

    try {
      // డౌన్‌లోడ్ బటన్ హైడ్ చేసి ఇమేజ్ క్యాప్చర్ చేయడం కోసం తాత్కాలిక మార్పు
      const actionArea = element.querySelector(`.action-area-${storyId}`) as HTMLElement;
      if (actionArea) actionArea.style.display = "none";

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // హై-క్వాలిటీ పోస్టర్ కోసం
        backgroundColor: "#fcf8f2", // పాతకాలపు పుస్తకం రంగు లైట్ బ్యాక్‌గ్రౌండ్
      });

      if (actionArea) actionArea.style.display = "flex";

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${title.replace(/\s+/g, "_")}_పోస్టర్.png`;
      link.click();
    } catch (error) {
      console.error("పోస్టర్ డౌన్‌లోడ్ చేయడంలో లోపం దొర్లింది:", error);
    }
  };

  return (
    <Box sx={{ bg: "#faf7f2", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="md">
        {/* హెడర్ సెక్షన్ */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Peddana', serif",
              fontWeight: 700,
              color: "#4a2c11",
              mb: 1,
            }}
          >
            స్మృతిమాల
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Mandali', sans-serif",
              color: "#7a5c3e",
              mb: 3,
              letterSpacing: 1,
            }}
          >
            పింగళి సీతమామ సిరీస్ — బాల్యపు ముచ్చట్లు
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Chip
              icon={<Book sx={{ color: "#fff !important" }} />}
              label={`మొత్తం కథలు: ${stories.length}`}
              sx={{ bgcolor: "#7a5c3e", color: "#fff", fontWeight: "bold", fontFamily: "'NTR', sans-serif", fontSize: "16px" }}
            />
            <Chip
              icon={<VolumeUp />}
              variant="outlined"
              label="తెలుగు ఆడియో అందుబాటులో ఉంది"
              color="primary"
              sx={{ fontWeight: "bold", fontFamily: "'NTR', sans-serif", fontSize: "16px" }}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 5, borderColor: "#e0d5c1" }} />

        {/* కథల లిస్ట్ */}
        <Stack spacing={4}>
          {paginatedStories.map((story, index) => {
            const isPlaying = playingId === story.story_id;
            const currentStoryNumber = (page - 1) * STORIES_PER_PAGE + index + 1;

            return (
              <Card
                key={story.story_id}
                id={`poster-container-${story.story_id}`}
                sx={{
                  borderRadius: 4,
                  boxShadow: "0 8px 24px rgba(74, 44, 17, 0.06)",
                  border: "1px solid #eadecc",
                  background: "#fff",
                  p: 2,
                  position: "relative",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 30px rgba(74, 44, 17, 0.1)",
                  },
                }}
              >
                <CardContent>
                  {/* కార్డ్ టాప్ బార్ */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                    <Box>
                      <Chip
                        size="small"
                        label={`భాగం ${currentStoryNumber}`}
                        sx={{
                          mb: 1.5,
                          bgcolor: "#9e2a2b",
                          color: "#fff",
                          fontWeight: "bold",
                          fontFamily: "'NTR', sans-serif",
                        }}
                      />
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "'Ramabhadra', sans-serif",
                          color: "#2b1805",
                          fontWeight: "bold",
                          mb: 1,
                          fontSize: { xs: "1.5rem", sm: "1.85rem" },
                        }}
                      >
                        {story.title}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "'Mandali', sans-serif",
                          color: "#8c6c4d",
                          fontStyle: "italic",
                        }}
                      >
                        {story.subtitle}
                      </Typography>
                    </Box>

                    {/* ఆడియో మరియు డౌన్‌లోడ్ యాక్షన్ బటన్స్ */}
                    <Stack direction="row" spacing={1} className={`action-area-${story.story_id}`}>
                      <Tooltip title={isPlaying ? "ఆడియో ఆపు" : "తెలుగులో వినండి"}>
                        <IconButton
                          onClick={() => handlePlaySpeech(story.story_id, story.story_text, story.title)}
                          sx={{
                            bgcolor: isPlaying ? "#9e2a2b" : "#f5ebd6",
                            color: isPlaying ? "#fff" : "#4a2c11",
                            "&:hover": { bgcolor: isPlaying ? "#7a2021" : "#ebdcb9" },
                          }}
                        >
                          {isPlaying ? <Stop /> : <PlayArrow />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="సోషల్ మీడియా పోస్టర్ డౌన్‌లోడ్ చేయండి">
                        <IconButton
                          onClick={() => downloadPoster(story.story_id, story.title)}
                          sx={{
                            bgcolor: "#e4f0ec",
                            color: "#1e5542",
                            "&:hover": { bgcolor: "#d1e7e0" },
                          }}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Divider sx={{ mb: 3, borderStyle: "dashed", borderColor: "#eadecc" }} />

                  {/* కథ టెక్స్ట్ బాడీ */}
                  <Box>
                    {story.story_text.map((paragraph, idx) => (
                      <Typography
                        key={idx}
                        sx={{
                          fontFamily: "'NTR', sans-serif",
                          fontSize: "1.35rem",
                          color: "#3d2a19",
                          mb: 2.5,
                          lineHeight: 1.85,
                          textAlign: "justify",
                          textIndent: "1.5rem",
                        }}
                      >
                        {paragraph}
                      </Typography>
                    ))}
                  </Box>

                  {/* పోస్టర్ కు అందమైన వాటర్‌మార్క్ ఫుటర్ (డౌన్‌లోడ్ లో మాత్రమే హైలైట్ అవుతుంది) */}
                  <Box
                    sx={{
                      mt: 3,
                      pt: 1.5,
                      borderTop: "1px solid #f2ede4",
                      textAlign: "right",
                      opacity: 0.7,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontFamily: "'Mandali', sans-serif", color: "#8c6c4d" }}>
                      ✨ బాల్యమాల — పింగళి సీతమామ సిరీస్ నుండి...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        {/* పేజినేషన్ సెక్షన్ */}
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
              "& .MuiPaginationItem-root": {
                fontFamily: "'NTR', sans-serif",
                fontSize: "1.1rem",
                color: "#4a2c11",
              },
              "& .Mui-selected": {
                bgcolor: "#7a5c3e !important",
                color: "#fff !important",
                fontWeight: "bold",
              },
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
}