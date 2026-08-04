"use client";

import React, { useMemo } from "react";
import { Box, Typography, Stack } from "@mui/material";

import storiesData from "@/data/kids_stories_te.json";
import StoryCard from "@/app/components/StoryCard";


import type {
  KathamalaStory,
  AgeKey,
} from "@/app/types/kathamala";


interface Props {
  ageKey: AgeKey;
}

export default function StoryListByAge({ ageKey }: Props) {
  const stories = storiesData.stories as KathamalaStory[];

  /* 🎯 Filter stories by selected age group */
  const filteredStories = useMemo(() => {
    if (ageKey === "all") {
      return stories;
    }

    return stories.filter(
      (story) => story.age_group === ageKey
    );
  }, [ageKey, stories]);

  /* 🚫 Empty State */
  if (filteredStories.length === 0) {
    return (
      <Typography
        align="center"
        sx={{ opacity: 0.7, mt: 4 }}
      >
        ఈ వయస్సు గుంపుకు ప్రస్తుతం కథలు లేవు.
      </Typography>
    );
  }

  return (
    <Box>
      {/* 📚 Stories List */}
      <Stack spacing={3}>
        {filteredStories.map((story) => (
          <StoryCard
            key={story.story_id}
            story={story}
          />
        ))}
      </Stack>
    </Box>
  );
}