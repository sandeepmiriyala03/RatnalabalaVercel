// AGENTS.md → see "Homepage Rules"
"use client";
/* ముఖ పేజీ — పైన పరిచయం, రోజు పద్యం, రేడియో; మధ్యలో "మా కవులు" (రెండు కార్డులు
   పక్కపక్కనే, ఫోన్‌లో ఒకదాని కింద ఒకటి); తర్వాత మాలలు, శైలిమాల, ప్రాజెక్ట్ గురించి.
   Inline styles లేవు — globals.css classes మాత్రమే. */

import RatnalabalaHighlights from "@/app/components/Ratnalabala";
import RatnalabalaBackground from "./components/RatnalabalaBackground";
import MiraIntro from "./components/MiraIntro";

export default function Page() {
  return (
    <RatnalabalaHighlights
      poets={
        <div className="rb-grid rb-grid--2">
          <RatnalabalaBackground />
          <MiraIntro />
        </div>
      }
    />
  );
}
