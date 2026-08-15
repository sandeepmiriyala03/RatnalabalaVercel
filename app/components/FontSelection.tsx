// AGENTS.md → see "FontControlsTelugu Component Rules"
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Paper,
  Slider,
  Tooltip,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import type { TeluguFont } from "@/app/types/fonts";
import { useDeviceFontBounds } from "./useDeviceFontBounds";

type Props = {
  fontFamily: TeluguFont;
  setFontFamily: React.Dispatch<React.SetStateAction<TeluguFont>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
};

type FontOption = { label: string; value: TeluguFont };

export default function FontControlsTelugu({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
}: Props) {
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [agentApplied, setAgentApplied] = useState(false);
  const { min, max } = useDeviceFontBounds();

  // Font list comes from the Python backend instead of being hardcoded.
  const [teluguFonts, setTeluguFonts] = useState<FontOption[]>([]);

  useEffect(() => {
    fetch("/api/fonts")
      .then((res) => res.json())
      .then((data: FontOption[]) => setTeluguFonts(data))
      .catch(() => {
        // API unreachable — leave the list empty rather than crashing.
      });
  }, []);

  // ── THE AGENTIC PART ──
  // On mount, before the user touches anything: perceive the screen
  // width, ask the Python agent (api/font_agent.py) to decide a font
  // + size, and act on its answer automatically. No click required.
  useEffect(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1024;

    fetch(`/api/font_agent?content_type=ui&width=${width}`)
      .then((res) => res.json())
      .then((decision: { fontFamily: string; fontSizeMultiplier: number }) => {
        setFontFamily(decision.fontFamily as TeluguFont);
        setFontSize(+(1.0 * decision.fontSizeMultiplier).toFixed(2));
        setAgentApplied(true);
      })
      .catch(() => {
        // Agent unreachable — keep whatever default the parent passed in.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--telugu-font-size",
      `${fontSize}rem`
    );
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty("--telugu-font-family", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    if (fontSize < min) setFontSize(min);
    if (fontSize > max) setFontSize(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  /* ⚡ Load time — scoped to this component only */
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;

      const time = nav
        ? Math.round(nav.loadEventEnd - nav.startTime)
        : Math.round(performance.now());

      setLoadTime(time);
    };

    if (document.readyState === "complete") {
      measure();
    } else {
      window.addEventListener("load", measure);
      return () => window.removeEventListener("load", measure);
    }
  }, []);

  const getSpeedColor = (ms: number) => {
    if (ms < 800) return "#22c55e";
    if (ms < 2000) return "#eab308";
    return "#ef4444";
  };

  const STEP = 0.1;

  const increase = () => {
    setAgentApplied(false); // manual override
    setFontSize((v) => Math.min(max, +(v + STEP).toFixed(2)));
  };

  const decrease = () => {
    setAgentApplied(false);
    setFontSize((v) => Math.max(min, +(v - STEP).toFixed(2)));
  };

  const restoreDefaults = () => {
    setAgentApplied(false);
    setFontFamily("Dhurjati");
    setFontSize(1.0);
    setSnackbarOpen(true);
  };

  const isAtMin = fontSize <= min;
  const isAtMax = fontSize >= max;
  const isDefault = fontFamily === "Dhurjati" && fontSize === 1.0;

  const sizePercent = Math.round(fontSize * 100);

  const currentFontLabel =
    teluguFonts.find((f) => f.value === fontFamily)?.label ?? fontFamily;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: "12px",
          borderColor: "var(--border, #e4dacb)",
          backgroundColor: "var(--surface, #f7f2ea)",
        }}
      >
        {agentApplied && (
          <Box display="flex" alignItems="center" gap={0.5} mb={1}>
            <SmartToyIcon sx={{ fontSize: 14, color: "var(--primary, #8b3a1f)" }} />
            <Typography variant="caption" sx={{ color: "var(--primary, #8b3a1f)" }}>
              ఏజెంట్ ఎంచుకుంది
            </Typography>
          </Box>
        )}

        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={2.5}
        >
          {/* 🔤 Font Selector */}
          <Box display="flex" alignItems="center" gap={1} flex={1.2} minWidth={0}>
            <Typography sx={{ fontSize: "0.9rem", whiteSpace: "nowrap", fontWeight: 600 }}>
              తెలుగు ఫాంట్
            </Typography>

            <Select
              size="small"
              value={fontFamily}
              onChange={(e) => {
                setAgentApplied(false);
                setFontFamily(e.target.value as TeluguFont);
              }}
              sx={{
                minWidth: 180,
                flex: 1,
                height: 36,
                fontFamily: `${fontFamily}, system-ui`,
                backgroundColor: "var(--surface-elevated, #fff)",
              }}
            >
              {teluguFonts.map((f) => (
                <MenuItem
                  key={f.value}
                  value={f.value}
                  sx={{ fontFamily: `${f.value}, system-ui` }}
                >
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* 🔠 Font Size */}
          <Box
            display="flex"
            flexDirection="column"
            gap={0.5}
            flex={1}
            minWidth={{ xs: "100%", md: 220 }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
                అక్షర సైజ్
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--primary, #8b3a1f)",
                  minWidth: 42,
                  textAlign: "right",
                }}
              >
                {sizePercent}%
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="చిన్నదిగా చేయండి">
                <span>
                  <IconButton
                    size="small"
                    onClick={decrease}
                    disabled={isAtMin}
                    aria-label="Decrease font size"
                    sx={{
                      border: "1px solid",
                      borderColor: "var(--border, #e4dacb)",
                      width: 32,
                      height: 32,
                      fontSize: "0.8rem",
                      "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
                    }}
                  >
                    అ
                  </IconButton>
                </span>
              </Tooltip>

              <Slider
                size="small"
                value={fontSize}
                min={min}
                max={max}
                step={STEP}
                onChange={(_, v) => {
                  setAgentApplied(false);
                  setFontSize(v as number);
                }}
                aria-label="Font size"
                sx={{ color: "var(--primary, #8b3a1f)", mx: 0.5 }}
              />

              <Tooltip title="పెద్దదిగా చేయండి">
                <span>
                  <IconButton
                    size="small"
                    onClick={increase}
                    disabled={isAtMax}
                    aria-label="Increase font size"
                    sx={{
                      border: "1px solid",
                      borderColor: "var(--border, #e4dacb)",
                      width: 32,
                      height: 32,
                      fontSize: "1.15rem",
                      "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
                    }}
                  >
                    అ
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* ♻️ Reset */}
          <Button
            variant="outlined"
            size="small"
            onClick={restoreDefaults}
            disabled={isDefault}
            startIcon={<RestartAltIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              whiteSpace: "nowrap",
              borderColor: "var(--primary, #8b3a1f)",
              color: "var(--primary, #8b3a1f)",
              "&:hover": {
                borderColor: "var(--primary, #8b3a1f)",
                backgroundColor: "rgba(139, 58, 31, 0.08)",
              },
            }}
          >
            డిఫాల్ట్
          </Button>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 1.5 }}>
          ప్రస్తుతం <strong>{teluguFonts.length}</strong> తెలుగు ఫాంట్లు సపోర్ట్ చేయబడుతున్నాయి.
        </Typography>
      </Paper>

      {/* ⚡ Load time */}
      {loadTime !== null && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.4,
              px: 1,
              py: 0.3,
              borderRadius: "999px",
              border: "1px solid",
              borderColor: `${getSpeedColor(loadTime)}55`,
              backgroundColor: `${getSpeedColor(loadTime)}14`,
            }}
          >
            <BoltIcon sx={{ fontSize: 13, color: getSpeedColor(loadTime) }} />
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
              పేజీ లోడ్ సమయం: {(loadTime / 1000).toFixed(2)}s
            </Typography>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={10000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          icon={<RestartAltIcon fontSize="small" />}
          sx={{
            backgroundColor: "var(--primary, #8b3a1f)",
            color: "#fff",
            fontWeight: 600,
            borderRadius: "10px",
            "& .MuiAlert-icon": { color: "#fff" },
          }}
        >
          <strong>{currentFontLabel}</strong> ఫాంట్ ({sizePercent}%) వర్తించబడింది!
        </Alert>
      </Snackbar>
    </>
  );
}