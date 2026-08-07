"use client";

import {
  Box,
  Container,
  Typography,
  Divider,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface BuildInfo {
  version: string;
  commitHash: string;
  commitDate: string;
  buildTime: string;
}

export default function Footer() {
  const theme = useTheme();
  const [dateTime, setDateTime] = useState(new Date());
  const [views, setViews] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  const navStart = useRef<number>(
    typeof performance !== "undefined" ? performance.now() : 0
  );

  /* 📊 Increment + Fetch analytics */
  useEffect(() => {
    const loadViews = async () => {
      try {
        await fetch("/api/pageview", { method: "POST" });
        const res = await fetch("/api/pageview");
        const data = await res.json();
        setViews(typeof data.views === "number" ? data.views : null);
      } catch {
        setViews(null);
      }
    };
    loadViews();
  }, []);

  /* ⏱ Date update */
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* 🚀 Route load time (Navigation Timing API, falls back to a manual mark) */
  useEffect(() => {
    const measure = () => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;

      if (nav) {
        // Time from navigation start to the browser's "load" event
        setLoadTime(Math.round(nav.loadEventEnd - nav.startTime));
      } else {
        // Fallback: time from component mount ref to now (client route change)
        setLoadTime(Math.round(performance.now() - navStart.current));
      }
    };

    if (document.readyState === "complete") {
      measure();
    } else {
      window.addEventListener("load", measure);
      return () => window.removeEventListener("load", measure);
    }
  }, []);

  /* 🏗️ Build info (version + last commit) */
  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBuildInfo(data))
      .catch(() => setBuildInfo(null));
  }, []);

  const formattedDate = dateTime.toLocaleDateString("te-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedCommitDate = buildInfo?.commitDate
    ? new Date(buildInfo.commitDate).toLocaleDateString("te-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 1.5,
        px: 1,
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[50]
            : theme.palette.grey[900],
        borderTop: "1px solid",
        borderColor: "divider",
        textAlign: "center",
        fontSize: "0.8rem",
      }}
    >
      <Container maxWidth="md">
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
         రత్నాలబాల · పద్యాలవాల · భావాలమాల · అక్షరమాల · శతకాలమాల · చిత్రమాల · కథామాల · సామెతలమాల · లిపిమాల · ఖతిమాల · స్వరమాల · ధ్వనిమాల · దర్శనమాల · కళామాల
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontStyle: "italic", display: "block", mt: 0.3 }}
        >
         చదవండి - వినండి - రాయండి - చిత్రీకరించండి - చూడండి - సృష్టించండి - పంచుకోండి - నేర్చుకోండి - అన్వేషించండి - భద్రపరచండి
        </Typography>

        <Divider sx={{ my: 0.8 }} />

        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          © {new Date().getFullYear()} యుక్తిశాల AI
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.2 }}
        >
          👁️ మొత్తం సందర్శనలు:{" "}
          {views !== null ? views.toLocaleString("te-IN") : "…"}
          {" • "}
          🔒 గోప్యత మొదటి ప్రాధాన్యత • {formattedDate}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.2, opacity: 0.7 }}
        >
          ⚡ లోడ్ సమయం: {loadTime !== null ? `${loadTime} ms` : "…"}
          {buildInfo && (
            <>
              {" • "}📦 v{buildInfo.version}
              {" ("}{buildInfo.commitHash}{") "}
              {formattedCommitDate && `• 🕓 ${formattedCommitDate}`}
            </>
          )}
        </Typography>
      </Container>
    </Box>
  );
}