// AGENTS.md → see "FontControlsTelugu Component Rules"
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  Autocomplete,
  TextField,
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
  /** Optional manual override. Leave unset and the component figures
   * out the content type automatically from the current URL — see
   * PATH_CONTENT_TYPE below. Only pass this if a specific page needs
   * to deliberately override what auto-detection would pick. */
  contentType?: "sloka" | "ui" | "heading";
};

type FontOption = { label: string; value: TeluguFont };

// ── AUTO-DETECTION TABLE ──
// Built directly from NAV_GROUPS (Navbar.tsx) — one place to maintain
// instead of setting contentType by hand on every page.
//
// "sloka" bucket = traditional/calligraphic fonts (verse, poem,
// devotional long-form reading content) — used for the సాహిత్యం
// (Literature) group and గీతామాల (Gita)
// "ui" bucket = default, legibility-first fonts — used for వ్యాకరణం
// (Grammar/reference tools) and కళలు (Arts/gallery pages), since
// those are functional/browsing pages rather than long-form reading
const PATH_CONTENT_TYPE: { prefix: string; type: "sloka" | "ui" | "heading" }[] = [
  // సాహిత్యం (Literature) — verse/poem content
  { prefix: "/poems", type: "sloka" },
  { prefix: "/mirapoems", type: "sloka" },
  { prefix: "/shatakamu", type: "sloka" },
  { prefix: "/smruthimala", type: "sloka" },
  { prefix: "/kathamala", type: "sloka" }, // stories — narrative prose, not verse, but still long-form; revisit if this reads better as "ui"
  { prefix: "/parabhava", type: "sloka" },

  // గీతామాల (Gita)
  { prefix: "/geeta", type: "sloka" },

  // వ్యాకరణం (Grammar/reference tools) — falls through to "ui" default,
  // no entry needed: /aksharamala, /guninta, /padalamala, /sametalu,
  // /sandhi, /samasa

  // కళలు (Arts/gallery) — falls through to "ui" default, no entry
  // needed: /chitramala, /swaramala, /lipimala, /khatiMala,
  // /rahasyabhasha, /shailimala
];

function detectContentTypeFromPath(pathname: string): "sloka" | "ui" | "heading" {
  const match = PATH_CONTENT_TYPE.find((rule) => pathname.startsWith(rule.prefix));
  return match?.type ?? "ui";
}

export default function FontControlsTelugu({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  contentType: contentTypeOverride,
}: Props) {
  const pathname = usePathname();
  // Explicit prop wins if a page deliberately passes one; otherwise
  // auto-detect from the current route.
  const contentType = contentTypeOverride ?? detectContentTypeFromPath(pathname ?? "");
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [agentApplied, setAgentApplied] = useState(false);
  const [agentReason, setAgentReason] = useState<string | null>(null);
  const { min, max } = useDeviceFontBounds();

  // Font list comes from the Python backend instead of being hardcoded.
  const [teluguFonts, setTeluguFonts] = useState<FontOption[]>([]);

  useEffect(() => {
    fetch("/api/main?endpoint=fonts")
      .then((res) => res.json())
      .then((data: FontOption[]) => setTeluguFonts(data))
      .catch(() => {
        // API unreachable — leave the list empty rather than crashing.
      });
  }, []);

  // A→Z, sorted by the Telugu label the user actually reads — not
  // insertion order from the API, and not a plain JS string sort
  // either, since that sorts by raw code-point order rather than real
  // Telugu alphabetical order. localeCompare with the "te" locale
  // gives correct Telugu collation (vowels/consonants in the right
  // traditional sequence, matras ordered under their base letter, etc).
  const sortedFonts = useMemo(
    () => [...teluguFonts].sort((a, b) => a.label.localeCompare(b.label, "te")),
    [teluguFonts]
  );

  // ── THE AGENTIC PART ──
  // On mount, before the user touches anything: perceive the screen
  // width, ask the Python agent to decide a font + size, and act on
  // its answer automatically. No click required.
  useEffect(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1024;

    fetch(`/api/main?endpoint=font_agent&content_type=${contentType}&width=${width}`)
      .then((res) => res.json())
      .then((decision: { fontFamily: string; fontSizeMultiplier: number; reason: string }) => {
        setFontFamily(decision.fontFamily as TeluguFont);
        setFontSize(+(1.0 * decision.fontSizeMultiplier).toFixed(2));
        setAgentApplied(true);
        setAgentReason(decision.reason);
      })
      .catch(() => {
        // Agent unreachable — keep whatever default the parent passed in.
      });
    // Re-runs whenever the route changes, since auto-detected
    // contentType depends on pathname — navigating from /geeta to
    // /poems (client-side, no full reload) should re-ask the agent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    setAgentReason(null);
    setFontSize((v) => Math.min(max, +(v + STEP).toFixed(2)));
  };

  const decrease = () => {
    setAgentApplied(false);
    setAgentReason(null);
    setFontSize((v) => Math.max(min, +(v - STEP).toFixed(2)));
  };

  const restoreDefaults = () => {
    setAgentApplied(false);
    setAgentReason(null);
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

  // Autocomplete works with the option object, not the raw string
  // value — this finds the FontOption matching the current fontFamily
  // so the input shows the right label instead of the raw value.
  const selectedOption = sortedFonts.find((f) => f.value === fontFamily) ?? null;

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
        {agentApplied && agentReason && (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0.75,
              mb: 1.5,
              p: 1,
              borderRadius: "8px",
              backgroundColor: "rgba(139, 58, 31, 0.06)",
            }}
          >
            <SmartToyIcon sx={{ fontSize: 16, color: "var(--primary, #8b3a1f)", mt: 0.2 }} />
            <Typography variant="caption" sx={{ color: "var(--primary, #8b3a1f)", lineHeight: 1.5 }}>
              <strong>ఏజెంట్ ఎంచుకుంది:</strong> {agentReason}
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
          {/* 🔤 Font Selector — Autocomplete instead of a plain Select
              so it's actually searchable (type to filter by label),
              with options sorted A→Z above via sortedFonts. */}
          <Box display="flex" alignItems="center" gap={1} flex={1.2} minWidth={0}>
            <Typography sx={{ fontSize: "0.9rem", whiteSpace: "nowrap", fontWeight: 600 }}>
              తెలుగు ఫాంట్
            </Typography>

            <Autocomplete
              size="small"
              options={sortedFonts}
              value={selectedOption}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, newValue) => {
                if (!newValue) return;
                setAgentApplied(false);
                setAgentReason(null);
                setFontFamily(newValue.value);
              }}
              disableClearable
              sx={{
                minWidth: 180,
                flex: 1,
                backgroundColor: "var(--surface-elevated, #fff)",
              }}
              renderOption={(props, option) => (
                <MenuItem {...props} key={option.value} sx={{ fontFamily: `${option.value}, system-ui` }}>
                  {option.label}
                </MenuItem>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="ఫాంట్ వెతకండి…"
                  sx={{
                    "& .MuiInputBase-root": {
                      height: 36,
                      fontFamily: `${fontFamily}, system-ui`,
                    },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border, #e4dacb)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary, #8b3a1f)" },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary, #8b3a1f)" },
                  }}
                />
              )}
            />
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
                  setAgentReason(null);
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