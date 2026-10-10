// AGENTS.md → see "Homepage Rules"
"use client";
/* ముఖ పేజీ — పైన పరిచయం, రోజు పద్యం, రేడియో; మధ్యలో "మా కవులు" (రెండు కార్డులు
   పక్కపక్కనే, ఫోన్‌లో ఒకదాని కింద ఒకటి); తర్వాత మాలలు, శైలిమాల, ప్రాజెక్ట్ గురించి */
import { Box } from "@mui/material";

import RatnalabalaHighlights from "@/app/components/Ratnalabala";
import RatnalabalaBackground from "./components/RatnalabalaBackground";
import MiraIntro from "./components/MiraIntro";

export default function Page() {
  return (
    <RatnalabalaHighlights
      poets={
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2.5, md: 3 }, alignItems: "stretch" }}>
          <RatnalabalaBackground />
          <MiraIntro />
        </Box>
      }
    />
  );
}