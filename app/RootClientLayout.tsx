"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Fab, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import Navbar from "@/app/components/Navbar";
import ChatbotWindow from "@/app/components/ChatbotWindow";       // check path
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt"; // check path
// Put your existing import back (check the path):
// import FontControlsTelugu from "@/app/components/FontControlsTelugu";
import { FAB_EDGE, FAB_GAP, FAB_HEIGHT, FAB_Z, fabSx } from "@/lib/floating";
import NextLink from "next/link";
import { initWebMCP, isWebMCPAvailable, searchBhavalamala, TOOL_NAME, type SearchResult } from "@/lib/webmcp";

/* ═══════════════════════════════════════════
   Floating buttons on every page

   LEFT  : 🤖 భావాలమాల AI   (opens the chatbot drawer)
   RIGHT : 📲 ఇన్‌స్టాల్      (PWA, hidden once installed)
           🔍 జ్ఞానశోధన     (WebMCP search panel)

   All buttons share one size, one offset and one z-index,
   so they line up and never cover menus or drawers.
═══════════════════════════════════════════ */

/* WebMCP panel: above the floating buttons, below drawers */
const PANEL_Z = 1150;

const EDGE_LEFT = `calc(${FAB_EDGE}px + env(safe-area-inset-left, 0px))`;
const EDGE_RIGHT = `calc(${FAB_EDGE}px + env(safe-area-inset-right, 0px))`;
const EDGE_BOTTOM = `calc(${FAB_EDGE}px + env(safe-area-inset-bottom, 0px))`;

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

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  // Register the WebMCP tool once, for every page. Cleanup unregisters it.
  useEffect(() => initWebMCP(), []);

  // Stable function, so the panel's Esc listener isn't re-added on every keystroke
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    // Return focus to the button that opened the panel
    requestAnimationFrame(() => searchTriggerRef.current?.focus());
  }, []);

  return (
    <>
      <Navbar />
      {/* <FontControlsTelugu /> */}

      {/* id="main-content" = Navbar skip-link target.
          Bottom padding keeps the last lines of every page
          clear of the floating buttons. */}
      <main
        id="main-content"
        style={{ paddingBottom: `calc(${FAB_EDGE + FAB_HEIGHT * 2 + FAB_GAP * 2}px + env(safe-area-inset-bottom, 0px))` }}
      >
        {children}
      </main>

      {/* ── LEFT: భావాలమాల AI ── */}
      <Fab
        variant="extended"
        onClick={() => setChatOpen(true)}
        aria-label="భావాలమాల AI సహాయకుడు"
        aria-haspopup="dialog"
        aria-expanded={chatOpen}
        sx={{
          ...fabSx,
          position: "fixed",
          left: EDGE_LEFT,
          bottom: EDGE_BOTTOM,
          zIndex: FAB_Z,
          bgcolor: GOLD,
          color: ON_GOLD,
          "&:hover": { bgcolor: GOLD, filter: "brightness(1.05)" },
        }}
      >
        <AutoAwesomeRoundedIcon />
        {/* Shorter label on phones so left and right buttons never touch */}
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>భావాలమాల AI</Box>
        <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>AI</Box>
      </Fab>
      <ChatbotWindow open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── RIGHT: install (top) + search (bottom), stacked ── */}
      <Stack
        spacing={`${FAB_GAP}px`}
        alignItems="flex-end"
        sx={{ position: "fixed", right: EDGE_RIGHT, bottom: EDGE_BOTTOM, zIndex: FAB_Z }}
      >
        <PwaInstallPrompt />

        <Fab
          variant="extended"
          ref={searchTriggerRef}
          onClick={() => setSearchOpen(true)}
          aria-label="జ్ఞానశోధన"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          sx={{
            ...fabSx,
            bgcolor: GREEN,
            color: PAPER,
            visibility: searchOpen ? "hidden" : "visible",
            "&:hover": { bgcolor: GREEN, filter: "brightness(1.08)" },
          }}
        >
          <TravelExploreRoundedIcon />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>జ్ఞానశోధన</Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>శోధన</Box>
        </Fab>
      </Stack>

      <WebMCPPanel open={searchOpen} onClose={closeSearch} />
    </>
  );
}

/* ═══════════════════════════════════════════
   WebMCP search panel
   Phone: bottom sheet. Desktop: card above the right buttons.
═══════════════════════════════════════════ */
function WebMCPPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        left: { xs: 0, sm: "auto" },
        right: { xs: 0, sm: EDGE_RIGHT },
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