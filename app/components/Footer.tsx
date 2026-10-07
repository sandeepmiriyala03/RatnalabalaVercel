"use client";

/* ═══════════════════════════════════════════════════════════════
   FOOTER — one fixed line at the bottom of every page, like the header

   © year యుక్తిశాల AI · total visits. Nothing else.

   Everything lives in this one file:
   • Fixed green bar (same colour as the Navbar), 44px + iPhone home-bar space
   • A spacer in the page flow, so the last lines of a page are never hidden
     behind the bar (plus `bottomSpace`, if the layout passes it)
   • Lifts the floating buttons (AI / పైకి / ఇన్‌స్టాల్ / శోధన) above the bar
     with a small global style, so no other file has to change
   • Slides away while the phone keyboard is open (it would cover typing)
   • Year and visits are set in effects — no new Date() during render
     (Next.js 16.4 Cache Components prerender rule)
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Box, GlobalStyles } from "@mui/material";

const BAR = 44; // px
const SAFE_BOTTOM = "env(safe-area-inset-bottom, 0px)";

export default function Footer({ bottomSpace = "0px" }: { bottomSpace?: string }) {
  const [year, setYear] = useState<number | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /* Year — in the browser only */
  useEffect(() => setYear(new Date().getFullYear()), []);

  /* Visits: count this visit, then read the total */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await fetch("/api/pageview", { method: "POST" });
        const res = await fetch("/api/pageview");
        const data = await res.json();
        if (alive && typeof data.views === "number") setViews(data.views);
      } catch {
        /* the line just shows without the count */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* Phone keyboard open = visible area shrinks a lot */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setKeyboardOpen(window.innerHeight - vv.height > 150);
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);

  const lift = keyboardOpen ? "0px" : `${BAR}px`;

  return (
    <>
      {/* Floating buttons (fixed, direct children of <body>) move up by the bar height.
          Left: the AI button itself. Right: the bottom button of the stack, so the
          whole stack moves up together. */}
      <GlobalStyles
        styles={{
          "body > .MuiFab-root, body > .MuiStack-root > .MuiFab-root:not(:has(~ .MuiFab-root))": {
            marginBottom: lift,
            transition: "margin-bottom 0.2s ease",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "body > .MuiFab-root, body > .MuiStack-root > .MuiFab-root": { transition: "none" },
          },
        }}
      />

      {/* Spacer in the page flow: page end stays clear of the bar and the buttons */}
      <Box aria-hidden sx={{ height: `calc(${BAR}px + ${bottomSpace} + ${SAFE_BOTTOM})` }} />

      <Box
        component="footer"
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1040, // below the floating buttons (1050), header (1100) and dialogs
          height: `calc(${BAR}px + ${SAFE_BOTTOM})`,
          pb: SAFE_BOTTOM,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, sm: 2 },
          bgcolor: "var(--secondary)",
          color: "var(--background)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
          fontSize: { xs: "0.88rem", sm: "0.95rem" },
          lineHeight: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          transform: keyboardOpen ? "translateY(100%)" : "none",
          transition: "transform 0.2s ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          "@media (max-width: 359.98px)": { fontSize: "0.8rem", gap: 0.5, px: 1 }, // very small phones
        }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          © {year ?? ""} యుక్తిశాల AI
        </Box>
        {views !== null && (
          <>
            <Box component="span" aria-hidden sx={{ opacity: 0.6 }}>
              ·
            </Box>
            <Box component="span">{views.toLocaleString("en-IN")} సందర్శనలు</Box>
          </>
        )}
      </Box>
    </>
  );
}