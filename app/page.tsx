//Logerror.md 

"use client";
import { Box } from "@mui/material";

import RatnalabalaHighlights from "@/app/components/Ratnalabala";
import RatnalabalaBackground from "./components/RatnalabalaBackground";
import MiraIntro from "./components/MiraIntro";
import FeaturedContent from "./components/FeaturedContent"; // NEW

export default function Page() {
  return (
    <Box>
      {/* NEW — placed first, so the rotating pick is the first thing
          a visitor sees, above the existing highlights/background/intro
          sections. Move this line if you'd rather it sit elsewhere. */}
      <FeaturedContent />

      <RatnalabalaHighlights />
      <RatnalabalaBackground />
      <MiraIntro />
    </Box>
  );
}