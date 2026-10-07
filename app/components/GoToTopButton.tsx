"use client";

/* ═══════════════════════════════════════════════════════════════
   "పైకి" బటన్ — ప్రతి పేజీలో (RootClientLayout కుడి వైపు గుంపులో, పైన)

   • మిగతా తేలే బటన్లలాగే 56px, మాటతో — బాణం గుర్తు మాత్రమే అయితే పెద్దవాళ్ళకు అర్థం కాకపోవచ్చు
   • ఒకటిన్నర తెర కిందికి వెళ్ళాకే కనిపిస్తుంది; కనిపించనప్పుడు DOM లో లేదు (Tab తో దొరకదు)
   • పైకి వెళ్ళాక focus కూడా పేజీ మొదటికి (keyboard / screen reader వాడేవారి కోసం)
   • "కదలిక తగ్గించండి" సెట్టింగ్ ఉంటే ఒక్కసారిగా, లేకపోతే మెల్లగా
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Box, Fab, Zoom } from "@mui/material";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import { fabSx } from "@/lib/floating";

const MAIN_CONTENT_ID = "main-content"; // Navbar skip link తో అదే

export default function GoToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setShow(window.scrollY > window.innerHeight * 1.5);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update); // ప్రతి frame కి ఒక్కసారే
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const goToTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const main = document.getElementById(MAIN_CONTENT_ID);
    if (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.style.outline = "none";
      main.focus({ preventScroll: true });
    }
  };

  return (
    <Zoom in={show} unmountOnExit>
      <Fab
        variant="extended"
        onClick={goToTop}
        aria-label="పేజీ పైకి వెళ్ళండి"
        sx={{
          ...fabSx,
          bgcolor: "var(--surface-elevated)",
          color: "var(--foreground)",
          border: "2px solid var(--border-strong)",
          "&:hover": { bgcolor: "var(--surface)" },
          "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 3 },
        }}
      >
        <KeyboardArrowUpRoundedIcon />
        <Box component="span">పైకి</Box>
      </Fab>
    </Zoom>
  );
}