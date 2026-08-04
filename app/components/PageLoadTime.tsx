"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Tooltip, Fade } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";

export default function PageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

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

  if (loadTime === null) return null;

  // Color + label based on speed
  const getSpeedInfo = (ms: number) => {
    if (ms < 800) return { color: "#22c55e", label: "మెరుపు వేగం" }; // green - lightning
    if (ms < 2000) return { color: "#eab308", label: "మంచి వేగం" }; // yellow - good
    return { color: "#ef4444", label: "నెమ్మది" }; // red - slow
  };

  const { color, label } = getSpeedInfo(loadTime);
  const seconds = (loadTime / 1000).toFixed(2);

  return (
    <Fade in={visible} timeout={600}>
      <Tooltip title={`${label} • ${loadTime}ms`} arrow placement="top">
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            px: 1.2,
            py: 0.5,
            borderRadius: "999px",
            backgroundColor: "rgba(20, 20, 20, 0.75)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${color}55`,
            boxShadow: `0 0 12px ${color}33`,
            cursor: "default",
            userSelect: "none",
            transition: "opacity 0.3s ease",
            "&:hover": {
              boxShadow: `0 0 16px ${color}66`,
            },
          }}
        >
          <BoltIcon sx={{ fontSize: 14, color }} />
          <Typography
            variant="caption"
            sx={{
              color: "#f5f5f5",
              fontSize: "0.7rem",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {seconds}s
          </Typography>
        </Box>
      </Tooltip>
    </Fade>
  );
}