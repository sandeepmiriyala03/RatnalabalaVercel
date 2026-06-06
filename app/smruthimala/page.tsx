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

interface Story {
  story_id: string;
  title: string;
  subtitle: string;
  story_text: string[];
}

interface StoryData {
  stories: Story[];
}

const STORIES_PER_PAGE = 3;

export default function SmruthimalaPage() {
  const stories = (seethamalaData as StoryData).stories || [];
  const totalStories = stories.length;

  const [page, setPage] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleStopSpeech = () => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }
  };

  const handlePageChange = (
    _: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    handleStopSpeech();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const paginatedStories = useMemo(() => {
    const startIndex = (page - 1) * STORIES_PER_PAGE;

    return stories.slice(
      startIndex,
      startIndex + STORIES_PER_PAGE
    );
  }, [page, stories]);

  const handlePlaySpeech = async (
    storyId: string,
    textArray: string[],
    title: string
  ) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const synth = window.speechSynthesis;

    if (playingId === storyId) {
      handleStopSpeech();
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(
      `${title}. ${textArray.join(" ")}`
    );

    let voices = synth.getVoices();

    if (!voices.length) {
      voices = await new Promise<SpeechSynthesisVoice[]>(
        (resolve) => {
          window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
          };
        }
      );
    }

    const teluguVoice = voices.find((voice) =>
      voice.lang.toLowerCase().includes("te")
    );

    if (teluguVoice) {
      utterance.voice = teluguVoice;
    }

    utterance.lang = "te-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(storyId);
    synth.speak(utterance);
  };

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        px: 2,
        maxWidth: 850,
        mx: "auto",
        minHeight: "100vh",
      }}
    >
      {/* Your existing JSX remains unchanged */}
    </Box>
  );
}