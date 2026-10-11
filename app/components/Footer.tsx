"use client";

/* ═══════════════════════════════════════════════════════════════
   FOOTER — one fixed line at the bottom of every page, like the header

   © year యుక్తిశాల AI · total visits · చివరి మార్పు (last deploy date & time)

   Everything lives in this one file:
   • Fixed bar (same colour as the Navbar), 44px + iPhone home-bar space;
     on phones 60px, two lines (date goes to the second line)
   • A spacer in the page flow, so the last lines of a page are never hidden
     behind the bar (plus `bottomSpace`, if the layout passes it)
   • Lifts the floating buttons (AI / పైకి / ఇన్‌స్టాల్ / శోధన) above the bar
     with a small global style, so no other file has to change
   • Slides away while the phone keyboard is open (it would cover typing)
   • Year, visits and the deploy time are set in effects — no new Date()
     during render (Next.js 16.4 Cache Components prerender rule)
   • Deploy time comes from NEXT_PUBLIC_DEPLOYED_AT, written once at build
     time in next.config.ts (Vercel builds on every deploy → always fresh).
     Shown in India time (IST), Telugu month names.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { Box, GlobalStyles } from "@mui/material";

const BAR = 44; // px — one line (tablet / computer)
const BAR_PHONE = 60; // px — two lines on phones (all three items don't fit on one)
const PHONE = "@media (max-width: 599.98px)";
const SAFE_BOTTOM = "env(safe-area-inset-bottom, 0px)";

/** Set at build time in next.config.ts → env.NEXT_PUBLIC_DEPLOYED_AT */
const DEPLOYED_AT = process.env.NEXT_PUBLIC_DEPLOYED_AT ?? "";

type Deployed = { iso: string; date: string; time: string };

/** "11 అక్టో 2026" and "6:29 PM", always in India time */
function formatDeployed(iso: string): Deployed | null {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  const zone = { timeZone: "Asia/Kolkata" } as const;
  // te-IN prints "11, అక్టో 2026" — build "11 అక్టో 2026" from the parts instead
  const parts = new Intl.DateTimeFormat("te-IN", { ...zone, day: "numeric", month: "short", year: "numeric" }).formatToParts(d);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    iso,
    date: `${part("day")} ${part("month")} ${part("year")}`,
    time: new Intl.DateTimeFormat("en-IN", { ...zone, hour: "numeric", minute: "2-digit", hour12: true }).format(d).toUpperCase(),
  };
}

const dot = (
  <Box component="span" aria-hidden sx={{ opacity: 0.7 }}>
    ·
  </Box>
);

export default function Footer({ bottomSpace = "0px" }: { bottomSpace?: string }) {
  const [year, setYear] = useState<number | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [deployed, setDeployed] = useState<Deployed | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /* Year + deploy time — in the browser only */
  useEffect(() => {
    setYear(new Date().getFullYear());
    setDeployed(formatDeployed(DEPLOYED_AT));
  }, []);

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
  const liftPhone = keyboardOpen ? "0px" : `${BAR_PHONE}px`;

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
          [PHONE]: {
            "body > .MuiFab-root, body > .MuiStack-root > .MuiFab-root:not(:has(~ .MuiFab-root))": { marginBottom: liftPhone },
          },
          "@media (prefers-reduced-motion: reduce)": {
            "body > .MuiFab-root, body > .MuiStack-root > .MuiFab-root": { transition: "none" },
          },
        }}
      />

      {/* Spacer in the page flow: page end stays clear of the bar and the buttons */}
      <Box
        aria-hidden
        sx={{
          height: `calc(${BAR}px + ${bottomSpace} + ${SAFE_BOTTOM})`,
          [PHONE]: { height: `calc(${BAR_PHONE}px + ${bottomSpace} + ${SAFE_BOTTOM})` },
        }}
      />

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
          alignContent: "center",
          flexWrap: "wrap",
          columnGap: { xs: 0.75, sm: 1.5 },
          rowGap: 0.75,
          bgcolor: "var(--secondary)",
          color: "var(--background)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
          fontSize: { xs: "0.85rem", sm: "0.95rem" },
          lineHeight: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          transform: keyboardOpen ? "translateY(100%)" : "none",
          transition: "transform 0.2s ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          [PHONE]: { height: `calc(${BAR_PHONE}px + ${SAFE_BOTTOM})` },
          "@media (max-width: 359.98px)": { fontSize: "0.78rem", columnGap: 0.5, px: 1 }, // very small phones
        }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          © {year ?? ""} యుక్తిశాల AI
        </Box>

        {views !== null && (
          <>
            {dot}
            <Box component="span">{views.toLocaleString("en-IN")} సందర్శనలు</Box>
          </>
        )}

        {deployed && (
          <>
            <Box component="span" aria-hidden sx={{ opacity: 0.7, [PHONE]: { display: "none" } }}>
              ·
            </Box>
            {/* phones: forces the date onto line 2 */}
            <Box component="span" aria-hidden sx={{ display: "none", [PHONE]: { display: "block", flexBasis: "100%", height: 0 } }} />
            {/* "చివరి మార్పు: 11 అక్టో 2026, 6:29 PM" — phones: on its own second line */}
            <Box component="time" dateTime={deployed.iso} title="ఈ సైట్ చివరిసారి నవీకరించిన సమయం (IST)">
              🔄 చివరి మార్పు: {deployed.date}, {deployed.time}
            </Box>
          </>
        )}
      </Box>
    </>
  );
}