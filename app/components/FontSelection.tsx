// AGENTS.md → see "FontControlsTelugu Component Rules"
"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  Link,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MyFontsDialog from "./MyFontsDialog";
// YuktAI icons wherever one fits; MUI only where YuktAI has no matching icon
import { SearchIcon, CheckIcon, CloseIcon } from "@yuktishaalaa/yuktai";
import type { TeluguFont } from "@/app/types/fonts";
import { useDeviceFontBounds } from "./useDeviceFontBounds";
// Fonts come only from main.py; a font's file loads only when it's chosen
import { DEFAULT_FONT as API_DEFAULT_FONT, fontStack, loadTeluguFont, setFontListFromApi, useTeluguFonts } from "@/lib/teluguFonts";

type ContentType = "sloka" | "ui" | "heading";
type Device = "phone" | "tablet" | "desktop";

type Props = {
  fontFamily: TeluguFont;
  setFontFamily: React.Dispatch<React.SetStateAction<TeluguFont>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  /** Optional manual override; normally detected from the URL (PATH_CONTENT_TYPE). */
  contentType?: ContentType;
};

type FontOption = { label: string; value: TeluguFont; group?: string };

const GROUP_MINE = "నా ఫాంట్లు";
const GROUP_SITE = "రత్నాలబాల ఫాంట్లు";

type AgentDecision = { fontFamily: TeluguFont; fontSizeMultiplier: number; reason: string };

/* ================================================================== */
/* DEFAULTS                                                           */
/* ================================================================== */

// What "డిఫాల్ట్" restores. Use the SAME values as the parent's initial
// fontFamily / fontSize state (RootClientLayout), DEFAULT_FONT in the
// Python API, and --telugu-font-family in globals.css.
const DEFAULT_FONT: TeluguFont = API_DEFAULT_FONT as TeluguFont;
const DEFAULT_SIZE = 1.0;

// "100%" = this many rem (globals.css default). 1.125rem ≈ 18px, a
// senior-friendly base. Writing plain `${size}rem` used to shrink the
// whole site to 16px the moment this component loaded.
const BASE_REM = 1.125;

// true  → the agent picks a font + size for the page type and the device.
// false → everyone sees DEFAULT_FONT / DEFAULT_SIZE until they choose.
const USE_FONT_AGENT = true;

const STEP = 0.1;

/**
 * Nothing is stored in the browser. Once the person picks a font or size
 * (or presses "డిఫాల్ట్"), the agent stops changing it for the rest of this
 * visit — even across page changes. A reload starts fresh.
 * (Module-level, so it also survives this component re-mounting.)
 */
let manualChoiceThisVisit = false;

/* ================================================================== */
/* CONTENT TYPE FROM THE URL                                          */
/* ================================================================== */

// "sloka" = traditional fonts for verse/poems/Gita; everything else "ui".
const PATH_CONTENT_TYPE: { prefix: string; type: ContentType }[] = [
  { prefix: "/poems", type: "sloka" },
  { prefix: "/mirapoems", type: "sloka" },
  { prefix: "/shatakamu", type: "sloka" },
  { prefix: "/smruthimala", type: "sloka" },
  { prefix: "/kathamala", type: "sloka" },
  { prefix: "/parabhava", type: "sloka" },
  { prefix: "/geeta", type: "sloka" },
];

function detectContentTypeFromPath(pathname: string): ContentType {
  return PATH_CONTENT_TYPE.find((rule) => pathname.startsWith(rule.prefix))?.type ?? "ui";
}

/* ================================================================== */
/* DEVICE + LOCAL AGENT (same rules as the Python API)                */
/* ================================================================== */

// Keep in sync with device_for_width() in api/main.py
function deviceForWidth(width: number): Device {
  if (width < 600) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

const DEVICE_TE: Record<Device, string> = { phone: "ఫోన్", tablet: "ట్యాబ్లెట్", desktop: "కంప్యూటర్" };

// Keep in sync with PREFERRED_FONTS / SIZE_BY_DEVICE in api/main.py.
// Used when the API is unreachable (e.g. `next dev`) or answers badly.
const LOCAL_RULES: Record<ContentType, { font: TeluguFont; size: Record<Device, number>; te: string }> = {
  sloka: {
    font: "Annamayya" as TeluguFont,
    size: { phone: 1.0, tablet: 1.05, desktop: 1.1 },
    te: "పద్య/శ్లోక కంటెంట్ — సంప్రదాయ, కళాత్మక ఫాంట్",
  },
  ui: {
    font: "Mandali-Regular" as TeluguFont,
    size: { phone: 1.0, tablet: 1.0, desktop: 1.0 },
    te: "సాధారణ పేజీ — స్పష్టంగా చదవగలిగే ఫాంట్",
  },
  heading: {
    font: "Chathura-ExtraBold" as TeluguFont,
    size: { phone: 1.05, tablet: 1.1, desktop: 1.2 },
    te: "శీర్షికలు — బోల్డ్, ప్రభావవంతమైన ఫాంట్",
  },
};

function localDecideFont(contentType: ContentType, device: Device): AgentDecision {
  const rule = LOCAL_RULES[contentType];
  const size = rule.size[device];
  return {
    fontFamily: rule.font,
    fontSizeMultiplier: size,
    reason: `${rule.te}, ${DEVICE_TE[device]} స్క్రీన్‌కు తగిన సైజ్ (${Math.round(size * 100)}%).`,
  };
}

function isValidDecision(d: unknown): d is AgentDecision {
  const x = d as Partial<AgentDecision> | null;
  return (
    !!x &&
    typeof x.fontFamily === "string" &&
    x.fontFamily.trim() !== "" &&
    typeof x.fontSizeMultiplier === "number" &&
    Number.isFinite(x.fontSizeMultiplier) &&
    x.fontSizeMultiplier >= 0.5 &&
    x.fontSizeMultiplier <= 2 &&
    typeof x.reason === "string"
  );
}

// useLayoutEffect on the client (runs before paint → no flash), useEffect on the server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== */
/* COMPONENT                                                          */
/* ================================================================== */

export default function FontControlsTelugu({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  contentType: contentTypeOverride,
}: Props) {
  const pathname = usePathname();
  const contentType = contentTypeOverride ?? detectContentTypeFromPath(pathname ?? "");

  /* ---------- device bounds (guarded) ---------- */
  const bounds = useDeviceFontBounds();
  // Guard against inverted or broken bounds (would loop the clamp forever)
  const lo = Number.isFinite(bounds.min) ? Math.min(bounds.min, bounds.max) : 0.8;
  const hi = Number.isFinite(bounds.max) ? Math.max(bounds.min, bounds.max) : 1.6;

  const clampSize = useCallback(
    (size: number) => {
      const value = Number.isFinite(size) ? size : DEFAULT_SIZE;
      return round2(Math.min(hi, Math.max(lo, value)));
    },
    [lo, hi]
  );
  // Latest clamp for async callbacks (agent answers arrive later)
  const clampRef = useRef(clampSize);
  clampRef.current = clampSize;

  // "డిఫాల్ట్" on THIS device: 100%, or the nearest size the device allows
  const defaultSize = clampSize(DEFAULT_SIZE);

  /* ---------- state ---------- */
  // జాబితా main.py నుండి (visit అంతా ఒక్కసారే)
  const { fonts: fontList, loading: fontsLoading, failed: fontsFailed, retry: retryFonts } = useTeluguFonts();
  const fonts = useMemo<FontOption[]>(
    () =>
      fontList.map((f) => ({
        label: f.label,
        value: f.value as TeluguFont,
        group: f.kind === "upload" || f.kind === "device" ? GROUP_MINE : GROUP_SITE,
      })),
    [fontList]
  );
  const [myFontsOpen, setMyFontsOpen] = useState(false);

  // A removed "my font" that was in use → back to the default
  useEffect(() => {
    const siteLoaded = fontList.some((f) => f.kind === "site");
    if (siteLoaded && !fontList.some((f) => f.value === fontFamily)) setFontFamily(DEFAULT_FONT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontList]);
  const [device, setDevice] = useState<Device | null>(null);
  const [agentReason, setAgentReason] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  /* ---------- 1. Device class, known before the first paint ---------- */
  useIsomorphicLayoutEffect(() => {
    setDevice(deviceForWidth(window.innerWidth));
  }, []);

  /* ---------- 2. Follow the device (rotation, resizing) ---------- */
  useEffect(() => {
    const update = () => setDevice(deviceForWidth(window.innerWidth));
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  /* ---------- 4. Agent: page type + device → font + size ---------- */
  // Runs on first load, on page change and when the device class changes
  // (phone ↔ tablet ↔ desktop) — until the person makes their own choice.
  useEffect(() => {
    if (!device || manualChoiceThisVisit) return;

    if (!USE_FONT_AGENT) {
      setFontFamily(DEFAULT_FONT);
      setFontSize(clampRef.current(DEFAULT_SIZE));
      return;
    }

    const controller = new AbortController();
    setAgentReason(null); // don't show the previous page's reason meanwhile

    (async () => {
      // Local rules first: used if the API is down or answers badly
      let decision = localDecideFont(contentType, device);
      try {
        const res = await fetch(
          `/api/main?endpoint=font_agent&content_type=${contentType}&width=${window.innerWidth}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data: unknown = await res.json();
          if (isValidDecision(data)) decision = data;
          // agent జవాబులో పూర్తి జాబితా కూడా ఉంటుంది — fonts API ఆలస్యమైనా ఇది చాలు
          setFontListFromApi((data as { fonts?: unknown } | null)?.fonts);
        }
      } catch {
        if (controller.signal.aborted) return;
      }

      const usable = await loadTeluguFont(decision.fontFamily);
      if (controller.signal.aborted || manualChoiceThisVisit) return;

      const font = usable ? decision.fontFamily : DEFAULT_FONT;
      setFontFamily(font);
      setFontSize(clampRef.current(decision.fontSizeMultiplier));
      setAgentReason(usable ? decision.reason : `${decision.reason} (ఆ ఫాంట్ లోడ్ కాలేదు — ధూర్జటి వాడుతున్నాను)`);
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, device]);

  /* ---------- 5. CSS variables (before paint, with Telugu fallbacks) ---------- */
  // The variable is set at once (a Telugu system font shows meanwhile);
  // the chosen font's file loads now and swaps in when it arrives.
  useIsomorphicLayoutEffect(() => {
    document.documentElement.style.setProperty("--telugu-font-family", fontStack(fontFamily));
  }, [fontFamily]);

  useEffect(() => {
    void loadTeluguFont(fontFamily);
  }, [fontFamily, fontList]);

  useIsomorphicLayoutEffect(() => {
    const safe = Number.isFinite(fontSize) ? fontSize : DEFAULT_SIZE;
    // 100% = BASE_REM (≈18px), matching globals.css
    document.documentElement.style.setProperty("--telugu-font-size", `${round2(safe * BASE_REM)}rem`);
  }, [fontSize]);

  /* ---------- 6. Keep the size inside the device bounds ---------- */
  useEffect(() => {
    const fixed = clampSize(fontSize);
    if (fixed !== fontSize) setFontSize(fixed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, clampSize]);

  /* ---------- 7. Page load time (measured AFTER load finishes) ---------- */
  useEffect(() => {
    let timer: number | undefined;

    const measure = () => {
      // loadEventEnd is only filled in once all load handlers have run,
      // so read it on the next tick (reading it inside the handler gave 0.00s)
      timer = window.setTimeout(() => {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const end = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : nav?.domContentLoadedEventEnd || performance.now();
        setLoadTime(Math.max(1, Math.round(end - (nav?.startTime ?? 0))));
      }, 0);
    };

    if (document.readyState === "complete") measure();
    else window.addEventListener("load", measure, { once: true });

    return () => {
      window.removeEventListener("load", measure);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  /* ---------- actions ---------- */
  const markManual = () => {
    manualChoiceThisVisit = true;
    setAgentReason(null);
  };

  const changeSize = (next: number) => {
    markManual();
    setFontSize(clampSize(next));
  };

  const restoreDefaults = () => {
    markManual();
    setFontFamily(DEFAULT_FONT);
    setFontSize(defaultSize);
    setSnackbarOpen(true);
  };

  /* ---------- derived ---------- */
  const isAtMin = fontSize <= lo;
  const isAtMax = fontSize >= hi;
  const isDefault = fontFamily === DEFAULT_FONT && Math.abs(fontSize - defaultSize) < 0.001;
  const sizePercent = Math.round((Number.isFinite(fontSize) ? fontSize : DEFAULT_SIZE) * 100);

  // Telugu A→Z; the current font is always an option (so the box is never blank)
  const options = useMemo(() => {
    const list = [...fonts];
    if (!list.some((f) => f.value === fontFamily)) list.push({ label: fontFamily, value: fontFamily, group: GROUP_SITE });
    // "నా ఫాంట్లు" first, then the site's; Telugu A→Z inside each group
    return list.sort(
      (a, b) =>
        Number(a.group !== GROUP_MINE) - Number(b.group !== GROUP_MINE) || a.label.localeCompare(b.label, "te")
    );
  }, [fonts, fontFamily]);

  const selectedOption = options.find((f) => f.value === fontFamily)!;
  const currentFontLabel = selectedOption?.label ?? fontFamily;

  const getSpeedColor = (ms: number) => (ms < 800 ? "#22c55e" : ms < 2000 ? "#eab308" : "#ef4444");

  // 44px: easy to tap for older readers (WCAG 2.5.5)
  const sizeButtonSx = {
    border: "1.5px solid",
    borderColor: "var(--border-strong, #7a6650)",
    width: 44,
    height: 44,
    color: "var(--foreground)",
    "&:hover": { borderColor: "var(--primary, #8b3a1f)" },
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: "var(--radius, 14px)",
          borderColor: "var(--border, #e4dacb)",
          backgroundColor: "var(--surface, #f7f2ea)",
          color: "var(--foreground)",
        }}
      >
        {agentReason && (
          <Box
            role="status"
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0.75,
              mb: 1.5,
              p: 1,
              borderRadius: "8px",
              backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
            }}
          >
            <SmartToyIcon sx={{ fontSize: 18, color: "var(--primary, #8b3a1f)", mt: 0.3 }} />
            <Typography sx={{ fontSize: "0.9rem", color: "var(--primary, #8b3a1f)", lineHeight: 1.6 }}>
              <strong>ఏజెంట్ ఎంచుకుంది:</strong> {agentReason}
            </Typography>
          </Box>
        )}

        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={{ xs: 2, md: 2.5 }}
        >
          {/* 🔤 Font — searchable, Telugu A→Z */}
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} flex={1.2} minWidth={0}>
            <Typography sx={{ fontSize: "0.95rem", whiteSpace: "nowrap", fontWeight: 700 }}>తెలుగు ఫాంట్</Typography>

            <Autocomplete
              size="small"
              options={options}
              value={selectedOption}
              getOptionLabel={(option) => option.label}
              groupBy={(option) => option.group ?? GROUP_SITE}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(_, newValue) => {
                if (!newValue) return;
                markManual();
                setFontFamily(newValue.value);
              }}
              // జాబితా తెరిచినప్పుడు ఇంకా 8 మాత్రమే ఉంటే, వెంటనే మళ్ళీ ప్రయత్నించు
              onOpen={() => {
                if (fontsFailed) retryFonts();
              }}
              loading={fontsLoading}
              loadingText="ఫాంట్లు లోడ్ అవుతున్నాయి…"
              disableClearable
              sx={{ minWidth: 180, flex: 1, backgroundColor: "var(--surface-elevated, #fff)", borderRadius: "var(--radius-sm, 10px)" }}
              renderOption={(props, option) => (
                <FontOptionItem {...props} key={option.value} option={option} />
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="ఫాంట్ వెతకండి…"
                  inputProps={{ ...params.inputProps, "aria-label": "తెలుగు ఫాంట్ ఎంచుకోండి" }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <Box component="span" aria-hidden sx={{ display: "flex", ml: 0.5, color: "var(--muted-text)" }}>
                          <SearchIcon size={18} label="" />
                        </Box>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  data-telugu-font=""
                  sx={{
                    "& .MuiInputBase-root": { minHeight: 44, fontFamily: fontStack(fontFamily), borderRadius: "var(--radius-sm, 10px)" },
                  }}
                />
              )}
            />

            {/* ➕ Reader's own font: upload (any device) or computer fonts */}
            <Tooltip title="మీ సొంత ఫాంట్ జోడించండి">
              <Button
                onClick={() => setMyFontsOpen(true)}
                startIcon={<AddRoundedIcon />}
                aria-haspopup="dialog"
                sx={{
                  minHeight: 44,
                  flexShrink: 0,
                  px: 1.5,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  borderRadius: "var(--radius-sm, 10px)",
                  border: "1.5px solid var(--secondary)",
                  color: "var(--secondary)",
                }}
              >
                నా ఫాంట్
              </Button>
            </Tooltip>
          </Box>

          {/* 🔠 Size */}
          <Box display="flex" flexDirection="column" gap={0.5} flex={1} minWidth={{ xs: "100%", md: 240 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700 }}>అక్షర సైజ్</Typography>
              <Typography
                aria-live="polite"
                sx={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary, #8b3a1f)", minWidth: 48, textAlign: "right" }}
              >
                {sizePercent}%
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="చిన్నదిగా చేయండి">
                <span>
                  <IconButton
                    onClick={() => changeSize(fontSize - STEP)}
                    disabled={isAtMin}
                    aria-label="అక్షరాలు చిన్నవి చేయండి"
                    sx={{ ...sizeButtonSx, fontSize: "0.85rem" }}
                  >
                    అ
                  </IconButton>
                </span>
              </Tooltip>

              {/* Medium slider: a bigger handle is easier to grab */}
              <Slider
                value={Number.isFinite(fontSize) ? fontSize : defaultSize}
                min={lo}
                max={hi}
                step={STEP}
                onChange={(_, v) => {
                  markManual();
                  setFontSize(clampSize(v as number));
                }}
                aria-label="అక్షర సైజ్"
                getAriaValueText={(v) => `${Math.round(v * 100)}%`}
                sx={{ color: "var(--primary, #8b3a1f)", mx: 1 }}
              />

              <Tooltip title="పెద్దదిగా చేయండి">
                <span>
                  <IconButton
                    onClick={() => changeSize(fontSize + STEP)}
                    disabled={isAtMax}
                    aria-label="అక్షరాలు పెద్దవి చేయండి"
                    sx={{ ...sizeButtonSx, fontSize: "1.25rem" }}
                  >
                    అ
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* ♻️ Default */}
          <Button
            variant="outlined"
            onClick={restoreDefaults}
            disabled={isDefault}
            startIcon={<RestartAltIcon fontSize="small" />}
            sx={{
              minHeight: 44,
              fontSize: "0.95rem",
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              borderRadius: "var(--radius-sm, 10px)",
              borderWidth: "1.5px",
              borderColor: "var(--primary, #8b3a1f)",
              color: "var(--primary, #8b3a1f)",
              "&:hover": {
                borderWidth: "1.5px",
                borderColor: "var(--primary, #8b3a1f)",
                backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
              },
            }}
          >
            డిఫాల్ట్
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mt: 1.5,
          }}
        >
          <Typography sx={{ fontSize: "0.85rem", color: "var(--muted-text)", lineHeight: 1.6 }}>
            {fonts.length > 0 ? (
              <>
                ప్రస్తుతం <strong>{fonts.length}</strong> తెలుగు ఫాంట్లు సపోర్ట్ చేయబడుతున్నాయి.
              </>
            ) : fontsLoading ? (
              <>ఫాంట్ల జాబితా లోడ్ అవుతోంది…</>
            ) : (
              <>
                ఫాంట్ల జాబితా లోడ్ కాలేదు.{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={retryFonts}
                  sx={{ fontSize: "inherit", fontWeight: 700, verticalAlign: "baseline", color: "var(--accent-text)" }}
                >
                  మళ్ళీ ప్రయత్నించండి
                </Link>
              </>
            )}
            {device && <> · {DEVICE_TE[device]}</>}
          </Typography>

          {/* ⚡ Load time — small, on the same line, so it doesn't add height */}
          {loadTime !== null && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                px: 1,
                py: 0.25,
                borderRadius: "999px",
                border: "1px solid",
                borderColor: `${getSpeedColor(loadTime)}66`,
                backgroundColor: `${getSpeedColor(loadTime)}14`,
              }}
            >
              <BoltIcon sx={{ fontSize: 15, color: getSpeedColor(loadTime) }} />
              <Typography sx={{ fontSize: "0.8rem", color: "var(--muted-text)" }}>
                పేజీ లోడ్ సమయం: {(loadTime / 1000).toFixed(2)}s
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <MyFontsDialog
        open={myFontsOpen}
        onClose={() => setMyFontsOpen(false)}
        current={fontFamily}
        onPick={(value) => {
          markManual();
          setFontFamily(value as TeluguFont);
        }}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={<CheckIcon size={18} label="" />}
          action={
            <IconButton size="small" aria-label="మూసివేయండి" onClick={() => setSnackbarOpen(false)} sx={{ color: "inherit" }}>
              <CloseIcon size={16} label="" />
            </IconButton>
          }
          sx={{
            // --secondary + --background: readable in light AND dark mode
            // (white text on dark-mode --primary was only ~2.5:1)
            backgroundColor: "var(--secondary, #1a3d2b)",
            color: "var(--background, #fdfaf5)",
            fontWeight: 700,
            fontSize: "0.95rem",
            borderRadius: "10px",
            "& .MuiAlert-icon": { color: "inherit" },
          }}
        >
          <strong>{currentFontLabel}</strong> ఫాంట్ ({sizePercent}%) వర్తించబడింది!
        </Alert>
      </Snackbar>
    </>
  );
}

/* ================================================================== */
/* ONE OPTION — shows its name in its own font. The font's file loads   */
/* only when the option scrolls into view, so opening the list never   */
/* downloads all fonts at once.                                         */
/* ================================================================== */

function FontOptionItem({
  option,
  ...props
}: React.HTMLAttributes<HTMLLIElement> & { option: FontOption }) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      void loadTeluguFont(option.value);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        void loadTeluguFont(option.value);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [option.value]);

  return (
    <MenuItem {...props} ref={ref} data-telugu-font="" sx={{ fontFamily: fontStack(option.value), minHeight: 48 }}>
      {option.label}
    </MenuItem>
  );
}