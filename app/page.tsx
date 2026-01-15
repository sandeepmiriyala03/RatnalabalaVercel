"use client";
import { Box } from "@mui/material";

import RatnalabalaHighlights from "@/app/components/Ratnalabala";
import RatnalabalaBackground from "./components/RatnalabalaBackground";
import MiraIntro from "./components/MiraIntro";
export default function Page() {
  return (
    <Box>
      <RatnalabalaBackground/>
      <MiraIntro/>
      <RatnalabalaHighlights/>
    </Box>
  );
}