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
} from "@mui/material";
import {
PlayArrow,
Stop,
VolumeUp,
} from "@mui/icons-material";

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

const paginatedStories = useMemo(() => {
const start = (page - 1) * STORIES_PER_PAGE;
return stories.slice(start, start + STORIES_PER_PAGE);
}, [page, stories]);

const handleStopSpeech = () => {
if (
typeof window !== "undefined" &&
"speechSynthesis" in window
) {
window.speechSynthesis.cancel();
setPlayingId(null);
}
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

const handlePlaySpeech = (
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

const voices = synth.getVoices();

const teluguVoice = voices.find(
  (voice) =>
    voice.lang.includes("te") ||
    voice.lang.includes("TE")
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
maxWidth: 900,
mx: "auto",
px: 2,
py: 4,
}}
> <Typography
     variant="h3"
     align="center"
     fontWeight={700}
     gutterBottom
   >
స్మృతిమాల </Typography>

  <Typography
    variant="h6"
    align="center"
    color="text.secondary"
    sx={{ mb: 4 }}
  >
    పింగళి సీతమామ సిరీస్
  </Typography>

  <Stack
    direction="row"
    spacing={2}
    justifyContent="center"
    sx={{ mb: 4 }}
  >
    <Chip
      color="primary"
      label={`📚 మొత్తం కథలు: ${stories.length}`}
    />

    <Chip
      color="secondary"
      variant="outlined"
      icon={<VolumeUp />}
      label="తెలుగు ఆడియో"
    />
  </Stack>

  <Divider sx={{ mb: 4 }} />

  <Stack spacing={3}>
    {paginatedStories.map((story, index) => {
      const isPlaying =
        playingId === story.story_id;

      return (
        <Card
          key={story.story_id}
          elevation={3}
        >
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Box>
                <Chip
                  size="small"
                  color="error"
                  label={`భాగం ${
                    (page - 1) *
                      STORIES_PER_PAGE +
                    index +
                    1
                  }`}
                  sx={{ mb: 1 }}
                />

                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
                >
                  {story.title}
                </Typography>

                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  {story.subtitle}
                </Typography>
              </Box>

              <Tooltip
                title={
                  isPlaying
                    ? "ఆడియో ఆపు"
                    : "తెలుగులో వినండి"
                }
              >
                <IconButton
                  color={
                    isPlaying
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    handlePlaySpeech(
                      story.story_id,
                      story.story_text,
                      story.title
                    )
                  }
                >
                  {isPlaying ? (
                    <Stop />
                  ) : (
                    <PlayArrow />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {story.story_text.map(
              (paragraph, idx) => (
                <Typography
                  key={idx}
                  sx={{
                    mb: 2,
                    lineHeight: 1.9,
                    textAlign: "justify",
                  }}
                >
                  {paragraph}
                </Typography>
              )
            )}
          </CardContent>
        </Card>
      );
    })}
  </Stack>

  <Stack
    alignItems="center"
    sx={{ mt: 4 }}
  >
    <Pagination
      page={page}
      onChange={(_, value) => {
        setPage(value);
        handleStopSpeech();

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
      count={Math.ceil(
        stories.length / STORIES_PER_PAGE
      )}
      color="primary"
    />
  </Stack>
</Box>
);
}
