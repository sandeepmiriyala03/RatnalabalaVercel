"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Fade, Collapse } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";

export default function PageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);

  /* Measure load time once on mount */
  useEffect(() => {
    const measure = () => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;

      const time = nav
        ? Math.round(nav.loadEventEnd - nav.startTime)
        : Math.round(performance.now());

      setLoadTime(time);
      setVisible(true);
    };

    if (document.readyState === "complete") {
      measure();
    } else {
      window.addEventListener("load", measure);
      return () => window.removeEventListener("load", measure);
    }
  }, []);

  /* Auto-collapse to a small dot after 4s so it doesn't linger on screen */
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setExpanded(false), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (loadTime === null) return null;

  const getSpeedInfo = (ms: number) => {
    if (ms < 800) return { color: "#22c55e", label: "మెరుపు వేగం" };
    if (ms < 2000) return { color: "#eab308", label: "మంచి వేగం" };
    return { color: "#ef4444", label: "నెమ్మది" };
  };

  const { color, label } = getSpeedInfo(loadTime);
  const seconds = (loadTime / 1000).toFixed(2);

  return (
    <Fade in={visible} timeout={500}>
      <Box
        onMouseEnter={() => setExpanded(true)}
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          position: "fixed",
          bottom: { xs: 12, sm: 16 },
          left: { xs: 12, sm: 16 },
          zIndex: 1100, // below GoToTopButton (usually 1200+) to avoid stacking conflicts
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Collapse
          in={expanded}
          orientation="horizontal"
          collapsedSize={32}
          timeout={300}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: expanded ? 0.6 : 0,
              height: 32,
              px: expanded ? 1.2 : 0,
              width: expanded ? "auto" : 32,
              justifyContent: "center",
              borderRadius: "999px",
              backgroundColor: "rgba(20, 20, 20, 0.78)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${color}55`,
              boxShadow: `0 2px 10px rgba(0,0,0,0.25), 0 0 10px ${color}22`,
              transition: "all 0.3s ease, box-shadow 0.2s ease",
              "&:hover": {
                boxShadow: `0 2px 12px rgba(0,0,0,0.3), 0 0 14px ${color}55`,
              },
            }}
          >
            <BoltIcon sx={{ fontSize: 15, color, flexShrink: 0 }} />
            {expanded && (
              <Typography
                variant="caption"
                sx={{
                  color: "#f5f5f5",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {seconds}s · {label}
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>
    </Fade>
  );
}