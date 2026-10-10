"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, ClickAwayListener, Fab, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import Navbar from "@/app/components/Navbar";
import ChatbotWindow from "@/app/components/ChatbotWindow";       // check path
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt"; // check path
import FontControlsTelugu from "@/app/components/FontSelection";
import Footer from "@/app/components/Footer";
import GoToTopButton from "@/app/components/GoToTopButton";
import type { TeluguFont } from "@/app/types/fonts";
import { FAB_EDGE, FAB_GAP, FAB_HEIGHT, FAB_Z, fabSx } from "@/lib/floating";
import NextLink from "next/link";
import { initWebMCP, isWebMCPAvailable, searchBhavalamala, TOOL_NAME, type SearchResult } from "@/lib/webmcp";

/* ═══════════════════════════════════════════
   Floating buttons on every page — ONE button, one group

   Before: AI on the left, పైకి / ఇన్‌స్టాల్ / శోధన stacked on the right —
   up to 4 buttons covering the text on a phone.
   Now   : a single "సహాయం" button. Tap → the group opens above it:
             🤖 భావాలమాల AI
             🔍 జ్ఞానశోధన
             📲 ఇన్‌స్టాల్      (only until the app is installed)
             ⇆ ఎడమ / కుడి వైపుకి   (moves the button; remembered on this device)
           Tap again, Esc, or tap anywhere outside → the group hides.
   ⬆ పైకి stays OUTSIDE the group: it appears by itself after scrolling
   down, just above the సహాయం button.

   The group stays mounted while hidden (inert + invisible), so the
   install prompt keeps its state and nothing re-downloads.
═══════════════════════════════════════════ */

type Side = "left" | "right";
const SIDE_KEY = "rb-fab-side";

/* WebMCP panel: above the floating buttons, below drawers */
const PANEL_Z = 1150;

const EDGE_LEFT = `calc(${FAB_EDGE}px + env(safe-area-inset-left, 0px))`;
const EDGE_RIGHT = `calc(${FAB_EDGE}px + env(safe-area-inset-right, 0px))`;
const EDGE_BOTTOM = `calc(${FAB_EDGE}px + env(safe-area-inset-bottom, 0px))`;

/* Space at the bottom of the page for the launcher + the "పైకి" button above it
   (at the page end you have scrolled, so పైకి is showing). The footer adds it so
   its last line is never covered (the open group floats over the page on purpose). */
const FAB_SPACE = `calc(${FAB_EDGE + FAB_HEIGHT * 2 + FAB_GAP * 2}px + env(safe-area-inset-bottom, 0px))`;

/* Brand tokens from globals.css */
const GREEN = "var(--secondary)";
const GOLD = "var(--accent-light)";
const INK = "var(--foreground)";
const PAPER = "var(--background)";
const ON_GOLD = "var(--on-accent)";
const ERROR = "var(--error)";
const LINE = "var(--border-strong)";
const SOFT = "color-mix(in srgb, var(--foreground) 6%, transparent)";

const STEPS = ["Agent", "Browser", "Tool", "Name", "Description", "Input", "Execute", "Result"];

type Status = "idle" | "loading" | "done" | "error";

/* Must match DEFAULT_FONT / DEFAULT_SIZE in FontControlsTelugu.tsx
   (and the default --telugu-font-family in globals.css) */
const DEFAULT_FONT: TeluguFont = "Dhurjati" as TeluguFont;
const DEFAULT_SIZE = 1.0;

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  // Font + size live here, so the choice stays the same on every page
  const [fontFamily, setFontFamily] = useState<TeluguFont>(DEFAULT_FONT);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);

  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [side, setSide] = useState<Side>("right");
  const launcherRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Left or right — the reader's choice, kept on this device (read after mount: no SSR mismatch)
  useEffect(() => {
    try {
      if (localStorage.getItem(SIDE_KEY) === "left") setSide("left");
    } catch {
      /* storage blocked: stays on the right */
    }
  }, []);
  const switchSide = () => {
    const next: Side = side === "right" ? "left" : "right";
    setSide(next);
    try {
      localStorage.setItem(SIDE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const closeMenu = useCallback((returnFocus = true) => {
    setMenuOpen(false);
    if (returnFocus) requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  // Open: focus the first item. Esc closes and returns focus to the button.
  useEffect(() => {
    if (!menuOpen) return;
    requestAnimationFrame(() => firstItemRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu]);

  const edge = side === "right" ? { right: EDGE_RIGHT } : { left: EDGE_LEFT };
  const align = side === "right" ? "flex-end" : "flex-start";

  // Register the WebMCP tool once, for every page. Cleanup unregisters it.
  useEffect(() => initWebMCP(), []);

  // Stable function, so the panel's Esc listener isn't re-added on every keystroke
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    // Return focus to the one floating button
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  return (
    <>
      <Navbar />

      {/* id="main-content" = Navbar skip-link target (and where the "పైకి" button sends focus) */}
      <main id="main-content">
        {/* Font + size controls: first thing under the menu on every page.
            Inside <main>, so the skip link lands here and readers can fix
            the text size before they start reading. */}
        <Box
          component="section"
          aria-label="అక్షరాల సెట్టింగ్‌లు"
          sx={{
            maxWidth: 1200,
            mx: "auto",
            px: { xs: 1.5, sm: 2, md: 3 },
            pt: { xs: 1.5, md: 2 },
            pb: { xs: 1, md: 1.5 },
          }}
        >
          <FontControlsTelugu
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        </Box>

        {children}
      </main>

      {/* Footer on every page; its bottom padding keeps the last line clear of the floating buttons */}
      <Footer bottomSpace={FAB_SPACE} />

      {/* ── ONE floating button + its group ── */}
      <ClickAwayListener onClickAway={() => menuOpen && closeMenu(false)}>
        <Stack
          spacing={`${FAB_GAP}px`}
          alignItems={align}
          sx={{ position: "fixed", ...edge, bottom: EDGE_BOTTOM, zIndex: FAB_Z }}
        >
          {/* The group (stays mounted; hidden = invisible + inert) */}
          <Box
            id="floating-group"
            role="group"
            aria-label="సహాయ బటన్లు"
            inert={!menuOpen}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: align,
              gap: `${FAB_GAP}px`,
              opacity: menuOpen ? 1 : 0,
              visibility: menuOpen ? "visible" : "hidden",
              transform: menuOpen ? "none" : "translateY(12px) scale(0.96)",
              transformOrigin: side === "right" ? "bottom right" : "bottom left",
              transition: "opacity .18s ease, transform .18s ease, visibility 0s linear " + (menuOpen ? "0s" : ".18s"),
              "@media (prefers-reduced-motion: reduce)": { transition: "none", transform: "none" },
              // leave room for the search/install cards that open from this corner
              maxHeight: "calc(100dvh - 160px)",
            }}
          >
            <Fab
              ref={firstItemRef}
              variant="extended"
              onClick={() => {
                closeMenu(false);
                setChatOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={chatOpen}
              sx={{ ...fabSx, bgcolor: GOLD, color: ON_GOLD, "&:hover": { bgcolor: GOLD, filter: "brightness(1.05)" } }}
            >
              <AutoAwesomeRoundedIcon />
              భావాలమాల AI
            </Fab>

            <Fab
              variant="extended"
              onClick={() => {
                closeMenu(false);
                setSearchOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              sx={{ ...fabSx, bgcolor: GREEN, color: PAPER, "&:hover": { bgcolor: GREEN, filter: "brightness(1.08)" } }}
            >
              <TravelExploreRoundedIcon />
              జ్ఞానశోధన
            </Fab>

            {/* Shows itself only until the app is installed */}
            <PwaInstallPrompt />

            <Fab
              variant="extended"
              size="medium"
              onClick={switchSide}
              aria-label={side === "right" ? "బటన్‌ను ఎడమ వైపుకి జరపండి" : "బటన్‌ను కుడి వైపుకి జరపండి"}
              sx={{
                ...fabSx,
                bgcolor: "var(--surface-elevated)",
                color: INK,
                border: `2px solid ${LINE}`,
                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "var(--surface)" },
              }}
            >
              <SwapHorizRoundedIcon />
              {side === "right" ? "ఎడమ వైపుకి" : "కుడి వైపుకి"}
            </Fab>
          </Box>

          {/* ⬆ పైకి — NOT inside the group: appears by itself after scrolling down,
              right above the సహాయం button, so it is always one tap away */}
          <GoToTopButton />

          {/* The one button: opens / hides the group */}
          <Fab
            ref={launcherRef}
            variant="extended"
            onClick={() => (menuOpen ? closeMenu(false) : setMenuOpen(true))}
            aria-expanded={menuOpen}
            aria-controls="floating-group"
            aria-label={menuOpen ? "సహాయ బటన్లు దాచండి" : "సహాయ బటన్లు చూపించండి: AI, శోధన, ఇన్‌స్టాల్"}
            sx={{
              ...fabSx,
              bgcolor: menuOpen ? INK : GREEN,
              color: PAPER,
              visibility: searchOpen ? "hidden" : "visible",
              "&:hover": { bgcolor: menuOpen ? INK : GREEN, filter: "brightness(1.08)" },
              "&:focus-visible": { outline: `3px solid ${GOLD}`, outlineOffset: 3 },
            }}
          >
            {menuOpen ? <CloseRoundedIcon /> : <AppsRoundedIcon />}
            {menuOpen ? "దాచు" : "సహాయం"}
          </Fab>
        </Stack>
      </ClickAwayListener>

      <ChatbotWindow open={chatOpen} onClose={() => setChatOpen(false)} />

      <WebMCPPanel open={searchOpen} onClose={closeSearch} side={side} />
    </>
  );
}

/* ═══════════════════════════════════════════
   WebMCP search panel
   Phone: bottom sheet. Desktop: card in the floating button's corner.
═══════════════════════════════════════════ */
function WebMCPPanel({ open, onClose, side }: { open: boolean; onClose: () => void; side: Side }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setAvailable(isWebMCPAvailable()), []);

  // Focus the input on open; Esc closes
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reached =
    status === "done" ? 7 : status === "loading" || status === "error" ? 6 : query.trim() ? 5 : 4;

  const run = async () => {
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      setResult(await searchBhavalamala(query));
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ఏదో పొరపాటు జరిగింది. మళ్ళీ ప్రయత్నించండి.");
      setStatus("error");
    }
  };

  return (
    <Box
      role="dialog"
      aria-labelledby="webmcp-title"
      sx={{
        position: "fixed",
        zIndex: PANEL_Z,
        /* Desktop: opens in the same corner as the floating button */
        left: { xs: 0, sm: side === "left" ? EDGE_LEFT : "auto" },
        right: { xs: 0, sm: side === "right" ? EDGE_RIGHT : "auto" },
        bottom: { xs: 0, sm: EDGE_BOTTOM },
        width: { xs: "100%", sm: 420 },
        maxHeight: { xs: "85dvh", sm: "min(640px, calc(100dvh - 120px))" },
        display: "flex",
        flexDirection: "column",
        bgcolor: PAPER,
        color: INK,
        border: `1.5px solid ${LINE}`,
        borderRadius: { xs: "20px 20px 0 0", sm: "var(--radius)" },
        boxShadow: "0 12px 40px rgba(0,0,0,0.28)",
        pb: { xs: "env(safe-area-inset-bottom, 0px)", sm: 0 },
        /* The whole panel scrolls, so on short screens the header
           scrolls away and the search box stays reachable */
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: 2, py: 1.5, bgcolor: GREEN, color: PAPER }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id="webmcp-title" component="h2" sx={{ fontWeight: 800, fontSize: "1.15rem" }}>
            జ్ఞానశోధన
          </Typography>
          {available !== null && (
            <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
              {available
                ? "WebMCP ఉంది: AI ఏజెంట్లు కూడా వెతకగలవు"
                : "ఈ బ్రౌజర్‌లో WebMCP లేదు: శోధన మామూలుగా పనిచేస్తుంది"}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="శోధన మూసివేయండి" sx={{ color: PAPER, flexShrink: 0 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      {/* Body (scrolls) */}
      <Box sx={{ p: 2 }}>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); void run(); }}>
          <Stack direction="row" spacing={1} alignItems="stretch">
            <TextField
              inputRef={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              label="ఏమి వెతకాలి?"
              placeholder="ఉదా: అసహనం"
              fullWidth
              autoComplete="off"
              sx={{ "& .MuiOutlinedInput-root": { bgcolor: PAPER, borderRadius: "var(--radius-sm)", color: INK } }}
            />
            <Button
              type="submit"
              disabled={status === "loading" || !query.trim()}
              sx={{
                flexShrink: 0,
                px: 2.5,
                minWidth: 96,
                borderRadius: "var(--radius-sm)",
                bgcolor: GREEN,
                color: PAPER,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                "&:hover": { bgcolor: GREEN, filter: "brightness(1.08)" },
                /* stays readable when disabled */
                "&.Mui-disabled": { bgcolor: SOFT, color: "var(--muted-text)" },
              }}
            >
              {status === "loading" ? <CircularProgress size={22} sx={{ color: "inherit" }} /> : "వెతకండి"}
            </Button>
          </Stack>
        </Box>

        {/* Lifecycle: lights up as the search runs */}
        <Box
          component="ol"
          aria-label="WebMCP దశలు"
          sx={{ listStyle: "none", p: 0, m: "16px 0 0", display: "flex", flexWrap: "wrap", gap: 0.75 }}
        >
          {STEPS.map((step, i) => {
            const current = i === reached;
            const isError = status === "error" && current;
            return (
              <Box
                component="li"
                key={step}
                aria-current={current ? "step" : undefined}
                sx={{
                  px: 1.25,
                  py: 0.4,
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: `1.5px solid ${isError ? ERROR : current ? GOLD : "var(--border)"}`,
                  bgcolor: current && !isError ? GOLD : i < reached ? SOFT : "transparent",
                  color: isError ? ERROR : current ? ON_GOLD : i <= reached ? INK : "var(--muted-text)",
                }}
              >
                {isError ? `✕ ${step}` : i < reached ? `✓ ${step}` : step}
              </Box>
            );
          })}
        </Box>

        {/* Result */}
        <Box sx={{ mt: 2 }} aria-live="polite">
          {status === "idle" && (
            <Typography sx={{ fontSize: "0.95rem", color: "var(--muted-text)", lineHeight: 1.8 }}>
              ఒక పదం లేదా ప్రశ్న రాసి &ldquo;వెతకండి&rdquo; నొక్కండి. AI ఏజెంట్లు వాడే <code>{TOOL_NAME}</code> టూల్‌నే ఇది వాడుతుంది.
            </Typography>
          )}
          {status === "loading" && (
            <Typography sx={{ fontSize: "0.95rem", color: "var(--muted-text)" }}>వెతుకుతోంది…</Typography>
          )}
          {status === "error" && (
            <Box role="alert" sx={{ p: 1.5, borderRadius: "var(--radius-sm)", border: `1.5px solid ${ERROR}`, color: ERROR, fontSize: "0.95rem" }}>
              {error}
            </Box>
          )}
          {status === "done" && result && (
            <Box>
              {result.results.length === 0 ? (
                <Typography sx={{ fontSize: "0.95rem", color: "var(--muted-text)" }}>
                  ఈ పదానికి సరిపోయే పద్యాలు దొరకలేదు. వేరే పదంతో ప్రయత్నించండి.
                </Typography>
              ) : (
                <Stack component="ol" spacing={1} sx={{ listStyle: "none", p: 0, m: 0 }}>
                  {result.results.map((src, i) => (
                    <Box
                      component="li"
                      key={`${src.title}-${i}`}
                      sx={{ p: 1.25, border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)" }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          {src.link ? (
                            <Typography
                              component={NextLink}
                              href={src.link}
                              onClick={onClose}
                              sx={{ fontWeight: 700, color: "var(--accent-text)", textDecoration: "underline", textUnderlineOffset: "3px" }}
                            >
                              {src.title}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontWeight: 700 }}>{src.title}</Typography>
                          )}
                          {src.mala && (
                            <Typography sx={{ fontSize: "0.9rem", color: "var(--muted-text)" }}>{src.mala}</Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontWeight: 800, whiteSpace: "nowrap", color: src.matchPercent >= 85 ? "var(--success)" : "var(--muted-text)" }}>
                          {src.matchPercent}%
                        </Typography>
                      </Stack>
                      {src.snippet && (
                        <Typography sx={{ mt: 0.75, fontSize: "0.95rem", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                          {src.snippet}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}

              {/* What an AI agent receives from the same tool */}
              <Box component="details" sx={{ mt: 1.5 }}>
                <Box component="summary" sx={{ cursor: "pointer", fontSize: "0.9rem", color: "var(--muted-text)", py: 0.5 }}>
                  AI ఏజెంట్‌కు వెళ్ళే డేటా (JSON)
                </Box>
                <Box
                  component="pre"
                  sx={{
                    m: 0, mt: 1, p: 1.5, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", bgcolor: SOFT,
                    fontFamily: "inherit", fontSize: "0.85rem", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    maxHeight: 260, overflow: "auto",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}