"use client";

import React, { useMemo } from "react";
import { Box, Typography, Stack } from "@mui/material";

import storiesData from "@/data/kids_stories_te.json";
import { AgeKey, KathamalaStory } from "@/types/kathamala";
import StoryCard from "@/app/components/StoryCard";

interface Props {
  ageKey: AgeKey;
}

export default function StoryListByAge({ ageKey }: Props) {
  const stories: KathamalaStory[] = storiesData.stories;

  /* 🎯 Filter stories by age group */
  const filteredStories = useMemo(() => {
    if (ageKey === "all") return stories;
    return stories.filter((s) => s.age_group === ageKey);
  }, [ageKey, stories]);

  /* 🚫 Empty state */
  if (filteredStories.length === 0) {
    return (
      <Typography align="center" sx={{ opacity: 0.7, mt: 4 }}>
        ఈ వయస్సు గుంపుకు కథలు లేవు.
      </Typography>
    );
  }

  return (
    <Box>
      {/* 📚 Stories List */}
      <Stack spacing={3}>
        {filteredStories.map((story) => (
          <StoryCard key={story.story_id} story={story} />
        ))}
      </Stack>
    </Box>
  );
}
