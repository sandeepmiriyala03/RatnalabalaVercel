"use client";

/* ═══════════════════════════════════════════════════════════════
   FOOTER — ప్రతి పేజీలో (RootClientLayout)

   • Next.js 16.4 Cache Components: render లో new Date() / performance.now() వాడితే
     prerender error (next-prerender-current-time-client). తేదీ, సంవత్సరం, లోడ్ సమయం
     అన్నీ effect లోనే — మొదటి HTML లో "…", browser లో నిజమైన విలువ
   • అక్షరాలు కనీసం 0.95rem, రంగులు site tokens (AAA, dark mode ఆటోమేటిక్)
   • కింద తేలే బటన్లకు చోటు: bottomSpace prop
   ═══════════════════════════════════════════════════════════════ */

import { Box, Chip, Container, Divider, Tooltip, Typography } from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import { useEffect, useState } from "react";

interface BuildInfo {
  version: string;
  commitHash: string;
  commitDate: string;
  buildTime: string;
}

const MALAS = [
  "రత్నాలబాల", "పద్యాలమాల", "భావాలమాల", "అక్షరమాల", "శతకాలమాల", "చిత్రమాల", "కథామాల",
  "సామెతలమాల", "లిపిమాల", "ఖతిమాల", "స్వరమాల", "ధ్వనిమాల", "దర్శనమాల", "కళామాల",
];
const VERBS = ["చదవండి", "వినండి", "రాయండి", "చిత్రీకరించండి", "చూడండి", "సృష్టించండి", "పంచుకోండి", "నేర్చుకోండి", "అన్వేషించండి", "భద్రపరచండి"];

const muted = { color: "var(--muted-text)", fontSize: "0.95rem", lineHeight: 1.8 } as const;

export default function Footer({ bottomSpace = "0px" }: { bottomSpace?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  /* తేదీ: browser లో మాత్రమే, నిమిషానికి ఒకసారి */
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  /* 📊 సందర్శనలు: ఒకటి పెంచి, మొత్తం తెచ్చుకో */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await fetch("/api/pageview", { method: "POST" });
        const res = await fetch("/api/pageview");
        const data = await res.json();
        if (alive) setViews(typeof data.views === "number" ? data.views : null);
      } catch {
        if (alive) setViews(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ⚡ పేజీ లోడ్ సమయం (Navigation Timing) */
  useEffect(() => {
    const mountedAt = performance.now();
    const measure = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      setLoadTime(Math.round(nav && nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.startTime : performance.now() - mountedAt));
    };
    if (document.readyState === "complete") {
      measure();
      return;
    }
    window.addEventListener("load", measure);
    return () => window.removeEventListener("load", measure);
  }, []);

  /* 🏗️ version, చివరి commit */
  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBuildInfo(data))
      .catch(() => setBuildInfo(null));
  }, []);

  const formattedDate = now?.toLocaleDateString("te-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const formattedCommitDate = buildInfo?.commitDate
    ? new Date(buildInfo.commitDate).toLocaleDateString("te-IN", { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        pt: 3,
        pb: `calc(24px + ${bottomSpace})`,
        px: 2,
        bgcolor: "var(--surface)",
        color: "var(--foreground)",
        borderTop: "2px solid var(--border-strong)",
        textAlign: "center",
      }}
    >
      <Container maxWidth="md" disableGutters>
        {/* మాలల పేర్లు — చుక్కల వరుస కాకుండా, విడివిడిగా చదవగలిగేలా */}
        <Box
          component="ul"
          aria-label="రత్నాలబాల మాలలు"
          sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 2, rowGap: 0.5, fontSize: "1rem", fontWeight: 700 }}
        >
          {MALAS.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </Box>

        <Typography sx={{ ...muted, mt: 1 }}>{VERBS.join(" · ")}</Typography>

        <Divider sx={{ my: 2, borderColor: "var(--border)" }} />

        <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>© {now ? now.getFullYear() : ""} యుక్తిశాల AI</Typography>

        <Typography sx={{ ...muted, mt: 0.5 }}>
          👁️ మొత్తం సందర్శనలు: {views !== null ? views.toLocaleString("te-IN") : "…"}
        </Typography>
        <Typography sx={muted}>🔒 గోప్యత మొదటి ప్రాధాన్యత</Typography>
        {formattedDate && <Typography sx={muted}>📅 {formattedDate}</Typography>}

        <Typography sx={{ ...muted, fontSize: "0.92rem", mt: 0.5 }}>
          ⚡ లోడ్ సమయం: {loadTime !== null ? `${loadTime} ms` : "…"}
          {buildInfo && (
            <>
              {" · "}📦 v{buildInfo.version} ({buildInfo.commitHash})
              {formattedCommitDate && ` · 🕓 ${formattedCommitDate}`}
            </>
          )}
        </Typography>

        <Tooltip title="తెలుగు అక్షర విశ్లేషణ Rust/WebAssembly తో నడుస్తుంది. సైట్ UI Next.js పై నడుస్తుంది.">
          <Chip
            icon={<CodeRoundedIcon />}
            label="Rust · WebAssembly"
            variant="outlined"
            sx={{
              mt: 1.5,
              height: 36,
              fontSize: "0.92rem",
              fontWeight: 600,
              color: "var(--foreground)",
              borderColor: "var(--border-strong)",
              "& .MuiChip-icon": { color: "var(--secondary)" },
            }}
          />
        </Tooltip>
      </Container>
    </Box>
  );
}