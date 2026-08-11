// AGENTS.md → see "Homepage Rules"
"use client";
import { Box } from "@mui/material";

import RatnalabalaHighlights from "@/app/components/Ratnalabala";
import RatnalabalaBackground from "./components/RatnalabalaBackground";
import MiraIntro from "./components/MiraIntro";
import FeaturedContent from "./components/FeaturedContent"; // NEW

export default function Page() {
  return (
    <Box>
      <FeaturedContent />

      <RatnalabalaHighlights />
      <RatnalabalaBackground />
      <MiraIntro />
    </Box>
  );
}