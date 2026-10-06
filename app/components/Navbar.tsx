"use client";

import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Drawer, List, ListItem, ListItemText, Divider,
  Menu, MenuItem, Button, Collapse, ListItemButton, Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ModuleFavoriteButton from "@/app/components/ModuleFavoriteButton";

/* ═══════════════════════════════════════════
   NAV GROUPS
═══════════════════════════════════════════ */
const NAV_GROUPS = [
  {
    label: "సాహిత్యం",
    icon: "📚",
    items: [
      { label: "పద్యాలమాల",    path: "/poems" },
      { label: "మిరా",          path: "/mirapoems" },
      { label: "శతకాలమాల",     path: "/shatakamu" },
      { label: "స్మృతిమాల",     path: "/smruthimala" },
      { label: "కథామాల",        path: "/kathamala" },
      { label: "పరాభవమాల",     path: "/parabhava" },
      { label: "నా చదువు",       path: "/my-reading" },
    ],
  },
  {
    label: "వ్యాకరణం",
    icon: "📖",
    items: [
      { label: "అక్షరమాల",     path: "/aksharamala" },
      { label: "గుణింతమాల",     path: "/guninta" },
      { label: "పదాలమాల",      path: "/padalamala" },
      { label: "సామెతలమాల",    path: "/sametalu" },
      { label: "సంధిమాల",     path: "/sandhi" },
      { label: "సమాసముమాల",   path: "/samasa" },
    ],
  },
  {
    label: "కళలు",
    icon: "🎨",
    items: [
      { label: "చిత్రమాల",     path: "/chitramala" },
      { label: "స్వరమాల",      path: "/swaramala" },
      { label: "లిపిమాల",      path: "/lipimala" },
      { label: "ఖతిమాల",       path: "/khatiMala" },
      { label: "విదురమాల",     path: "/rahasyabhasha" },
      { label: "శైలిమాల",      path: "/shailimala" },
    ],
  },
  {
    label: "వాచకమాల",
    icon: "📰",
    items: [
      { label: "తెలుగు వాచకి", path: "/news" },
    ],
  },
  {
    label: "గీతామాల",
    icon: "🕉️",
    items: [
      { label: "భగవద్గీత", path: "/geeta" },
    ],
  },
  {
    label: "జ్ఞానమాల",
    icon: "🪔",
    items: [
      { label: "అన్ని మాలలు ఒకే చోట", path: "/gnanamala" },
      { label: "PDF ప్రశ్నోత్తరి",      path: "/prashnottari" },
    ],
  },
];

type NavGroup = (typeof NAV_GROUPS)[number];

const HOME_LABEL = "ముంగిలి"; // "home" in Telugu — replaces the 🏠 + repeated site name
const FEEDBACK_URL = "https://forms.gle/z4zugcnmZrW9d9cR9";

/* ═══════════════════════════════════════════
   COLORS — brand tokens from globals.css, so
   dark mode works automatically.
═══════════════════════════════════════════ */
const BG      = "var(--secondary)";     // forest green bar
const TEXT    = "var(--background)";    // ivory text on the bar
const ACCENT  = "var(--accent-light)";  // gold active pill

/* Text ON the gold pill stays a fixed dark ink in both modes —
   --foreground flips to light ivory in dark mode (~1.4:1 on gold). */
const ON_ACCENT = "#241f1a";

/* The app uses viewportFit "cover": on iPhones the page draws under the
   notch / status bar. This keeps the bar clear of it (0 elsewhere). */
const SAFE_TOP = "env(safe-area-inset-top, 0px)";

/* ═══════════════════════════════════════════
   SKIP LINK — "ప్రధాన కంటెంట్‌కు వెళ్ళండి"
═══════════════════════════════════════════ */
const MAIN_CONTENT_ID = "main-content";
const NAV_OFFSET_PX = 72;

function skipToMainContent(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const target =
    document.getElementById(MAIN_CONTENT_ID) ??
    document.querySelector<HTMLElement>("main");
  if (!target) return;

  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.style.outline = "none";
  target.style.scrollMarginTop = `calc(${NAV_OFFSET_PX}px + ${SAFE_TOP})`;
  target.focus({ preventScroll: true });

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/* ═══════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════ */
function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark") setIsDark(true);
    else if (current === "light") setIsDark(false);
    else setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private browsing: just won't persist */
    }
    setIsDark(!isDark);
  };

  return { isDark, toggle };
}

function ThemeToggleButton({ variant = "bar" }: { variant?: "bar" | "icon" | "list" }) {
  const { isDark, toggle } = useThemeToggle();
  const label = isDark ? "లైట్ మోడ్‌కు మార్చండి" : "డార్క్ మోడ్‌కు మార్చండి";
  const icon = isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />;

  if (variant === "list") {
    return (
      <ListItemButton onClick={toggle} sx={{ borderRadius: "8px", mb: 0.3 }}>
        {isDark ? <LightModeRoundedIcon fontSize="small" sx={{ mr: 1.5 }} /> : <DarkModeRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />}
        <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.95rem" }} />
      </ListItemButton>
    );
  }

  // Compact bar: icon only, but the tooltip + aria-label still say what it does
  if (variant === "icon") {
    return (
      <Tooltip title={label}>
        <IconButton onClick={toggle} aria-label={label} sx={{ color: TEXT, border: "1px solid rgba(255,255,255,0.4)" }}>
          {icon}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={toggle}
      startIcon={isDark ? <LightModeRoundedIcon sx={{ fontSize: 18 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
      sx={{
        color: TEXT,
        px: 1.6, py: 0.8,
        borderRadius: "999px",
        fontSize: "0.9rem",
        fontWeight: 500,
        textTransform: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid rgba(255,255,255,0.4)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
      }}
    >
      {isDark ? "లైట్ మోడ్" : "డార్క్ మోడ్"}
    </Button>
  );
}

/* ═══════════════════════════════════════════
   SHARED PILL STYLE
═══════════════════════════════════════════ */
const pillSx = (active: boolean, compact: boolean) => ({
  color: active ? ON_ACCENT : TEXT,
  bgcolor: active ? ACCENT : "transparent",
  px: compact ? 1.1 : 1.6,
  py: 0.8,
  borderRadius: "999px",
  fontSize: "0.9rem",
  fontWeight: active ? 700 : 500,
  textTransform: "none" as const,
  whiteSpace: "nowrap" as const, // never break a label inside itself
  flexShrink: 0,
  minWidth: 0,
  "&:hover": { bgcolor: active ? ACCENT : "rgba(255,255,255,0.18)" },
});

/* ═══════════════════════════════════════════
   DESKTOP DROPDOWN
═══════════════════════════════════════════ */
function DesktopGroup({ group, compact }: { group: NavGroup; compact: boolean }) {
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const isActive = group.items.some((i) => i.path === pathname);

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        endIcon={open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{ ...pillSx(isActive, compact), "& .MuiButton-endIcon": { ml: 0.25 } }}
      >
        {compact ? group.label : `${group.icon} ${group.label}`}
      </Button>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1, borderRadius: "12px", minWidth: 180,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: "1px solid rgba(0,0,0,0.08)",
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        {group.items.map((item) => {
          const active = pathname === item.path;
          return (
            <MenuItem
              key={item.path}
              component={Link}
              href={item.path}
              onClick={() => setAnchor(null)}
              aria-current={active ? "page" : undefined}
              sx={{
                fontSize: "0.95rem",
                fontWeight: active ? 700 : 400,
                color: active ? "var(--secondary)" : "text.primary",
                bgcolor: active ? `color-mix(in srgb, ${ACCENT} 33%, transparent)` : "transparent",
                borderRadius: "8px", mx: 0.5, my: 0.2,
                "&:hover": { bgcolor: `color-mix(in srgb, ${ACCENT} 20%, transparent)` },
              }}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP ROW — one line, never wraps.
   compact = no emojis, theme + feedback as icons.
═══════════════════════════════════════════ */
function DesktopNav({ compact }: { compact: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }} aria-current={pathname === "/" ? "page" : undefined}>
        <Typography component="span" sx={{ ...pillSx(pathname === "/", compact), display: "inline-block" }}>
          {HOME_LABEL}
        </Typography>
      </Link>

      {NAV_GROUPS.map((g) => (
        <DesktopGroup key={g.label} group={g} compact={compact} />
      ))}

      <Link href="/test-lab" style={{ textDecoration: "none", flexShrink: 0 }} aria-current={pathname === "/test-lab" ? "page" : undefined}>
        <Typography component="span" sx={{ ...pillSx(pathname === "/test-lab", compact), display: "inline-block" }}>
          పరీక్షల కేంద్రం
        </Typography>
      </Link>

      {compact ? (
        <Tooltip title="అభిప్రాయం">
          <IconButton
            component="a"
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="అభిప్రాయం (కొత్త ట్యాబ్‌లో)"
            sx={{ color: TEXT, border: "1px solid rgba(255,255,255,0.4)", flexShrink: 0 }}
          >
            <ChatBubbleOutlineRoundedIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", flexShrink: 0 }}>
          <Typography component="span" sx={{ ...pillSx(false, false), display: "inline-block", border: "1px solid rgba(255,255,255,0.4)" }}>
            💬 అభిప్రాయం
          </Typography>
        </a>
      )}

      <Box sx={{ flexShrink: 0, display: "flex" }}>
        <ModuleFavoriteButton />
      </Box>
      <ThemeToggleButton variant={compact ? "icon" : "bar"} />
    </>
  );
}

/* ═══════════════════════════════════════════
   MOBILE GROUP (opens by itself if the current page is inside it)
═══════════════════════════════════════════ */
function MobileGroup({ group, onClose }: { group: NavGroup; onClose: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(group.items.some((i) => i.path === pathname));

  return (
    <>
      <ListItemButton onClick={() => setOpen((v) => !v)} aria-expanded={open} sx={{ borderRadius: "8px", mb: 0.3 }}>
        <ListItemText
          primary={`${group.icon} ${group.label}`}
          primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem" }}
        />
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ListItemButton>

      <Collapse in={open} timeout={200} unmountOnExit>
        <List disablePadding sx={{ pl: 2 }}>
          {group.items.map((item) => {
            const active = pathname === item.path;
            return (
              <ListItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                sx={{
                  bgcolor: active ? `color-mix(in srgb, ${ACCENT} 53%, transparent)` : "transparent",
                  borderRadius: "8px", mb: 0.3, py: 0.8,
                  color: "inherit",
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: active ? 700 : 400 }}
                />
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
}

/* ═══════════════════════════════════════════
   "DOES IT FIT ON ONE LINE?"
   Screen width alone can't answer this: the reader's font-size control
   (and Telugu fonts of different widths) change how wide the menu is.
   So the menu is measured (hidden copies) against the space left next
   to the brand, and the best layout that fits is used:
     full → compact → drawer (☰)
   Re-measured on resize, rotation, font load and font-size change.
═══════════════════════════════════════════ */
type NavMode = "full" | "compact" | "drawer";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useNavMode() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<NavMode | null>(null); // null = before first measure (CSS fallback)

  const measure = useCallback(() => {
    const bar = toolbarRef.current;
    const brand = brandRef.current;
    if (!bar || !brand) return;
    const cs = getComputedStyle(bar);
    const GAP = 24; // breathing room between brand and menu
    const available =
      bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - brand.offsetWidth - GAP;
    const full = fullRef.current?.scrollWidth ?? Infinity;
    const compact = compactRef.current?.scrollWidth ?? Infinity;
    setMode(full <= available ? "full" : compact <= available ? "compact" : "drawer");
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    [toolbarRef, brandRef, fullRef, compactRef].forEach((r) => r.current && ro.observe(r.current));
    // Telugu web fonts arriving later change widths too
    document.fonts?.ready.then(measure).catch(() => {});
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, [measure]);

  return { mode, toolbarRef, brandRef, fullRef, compactRef };
}

/* Hidden, non-interactive copy used only for measuring */
function MeasureCopy({ innerRef, compact }: { innerRef: React.RefObject<HTMLDivElement | null>; compact: boolean }) {
  return (
    <Box aria-hidden sx={{ position: "absolute", width: 0, height: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }}>
      <Box ref={innerRef} {...{ inert: true }} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, whiteSpace: "nowrap", width: "max-content" }}>
        <DesktopNav compact={compact} />
      </Box>
    </Box>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mode, toolbarRef, brandRef, fullRef, compactRef } = useNavMode();

  // Before the first measure (server render): plain screen-size fallback
  const showDesktop = mode === null ? { xs: "none", lg: "flex" } : mode === "drawer" ? "none" : "flex";
  const showDrawerButton = mode === null ? { xs: "flex", lg: "none" } : mode === "drawer" ? "flex" : "none";

  return (
    <>
      {/* Skip to main content — visible only while it has keyboard focus */}
      <Box
        component="a"
        href={`#${MAIN_CONTENT_ID}`}
        onClick={skipToMainContent}
        sx={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          "&:focus": {
            position: "fixed",
            left: 16,
            top: `calc(16px + ${SAFE_TOP})`,
            width: "auto",
            height: "auto",
            overflow: "visible",
            zIndex: 2000,
            px: 1.75,
            py: 1,
            borderRadius: "8px",
            bgcolor: ACCENT,
            color: ON_ACCENT,
            fontSize: "0.95rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          },
        }}
      >
        ప్రధాన కంటెంట్‌కు వెళ్ళండి
      </Box>

      <AppBar position="sticky" elevation={2} sx={{ bgcolor: BG, pt: SAFE_TOP }}>
        <Toolbar
          ref={toolbarRef}
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            display: "flex",
            flexWrap: "nowrap",            // ← the fix: the bar is ALWAYS one line
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            minHeight: { xs: 56, md: 60 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Brand */}
          <Link ref={brandRef} href="/" style={{ textDecoration: "none", flexShrink: 1, minWidth: 0 }}>
            <Typography
              component="span"
              sx={{
                display: "block",
                fontWeight: 800,
                fontSize: { xs: "1rem", md: "1.15rem" },
                color: TEXT,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* Very narrow phones: short name; full name everywhere else */}
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>రత్నాలబాల</Box>
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>రత్నాలబాల–జ్ఞానమాల</Box>
            </Typography>
          </Link>

          {/* Measuring copies (invisible) */}
          <MeasureCopy innerRef={fullRef} compact={false} />
          <MeasureCopy innerRef={compactRef} compact />

          {/* Desktop menu: full or compact, whichever fits */}
          <Box
            component="nav"
            aria-label="ప్రధాన మెనూ"
            sx={{ display: showDesktop, alignItems: "center", gap: 0.5, flexWrap: "nowrap", flexShrink: 0 }}
          >
            <DesktopNav compact={mode === "compact"} />
          </Box>

          {/* Narrow screens / big text: favourite + ☰ together on the right */}
          <Box sx={{ display: showDrawerButton, alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <ModuleFavoriteButton />
            <IconButton
              sx={{ color: TEXT }}
              aria-label="మెనూ తెరవండి"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer (☰) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            maxWidth: "85vw",
            borderRadius: "0 16px 16px 0",
            pt: SAFE_TOP,
            pb: "env(safe-area-inset-bottom, 0px)",
          },
        }}
      >
        <Box component="nav" aria-label="ప్రధాన మెనూ" sx={{ p: 2 }}>
          <Box sx={{ bgcolor: BG, borderRadius: "12px", px: 2, py: 1.5, mb: 2 }}>
            <Typography sx={{ fontWeight: 800, color: TEXT, fontSize: "1rem" }}>రత్నాలబాల–జ్ఞానమాల</Typography>
          </Box>

          <List disablePadding>
            <ListItem
              component={Link}
              href="/"
              onClick={() => setDrawerOpen(false)}
              aria-current={pathname === "/" ? "page" : undefined}
              sx={{
                bgcolor: pathname === "/" ? `color-mix(in srgb, ${ACCENT} 53%, transparent)` : "transparent",
                borderRadius: "8px", mb: 0.5, color: "inherit",
              }}
            >
              <ListItemText primary={HOME_LABEL} primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem" }} />
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {NAV_GROUPS.map((g) => (
              <MobileGroup key={g.label} group={g} onClose={() => setDrawerOpen(false)} />
            ))}

            <ListItem
              component={Link}
              href="/test-lab"
              onClick={() => setDrawerOpen(false)}
              aria-current={pathname === "/test-lab" ? "page" : undefined}
              sx={{
                bgcolor: pathname === "/test-lab" ? `color-mix(in srgb, ${ACCENT} 53%, transparent)` : "transparent",
                borderRadius: "8px", mb: 0.5, color: "inherit",
              }}
            >
              <ListItemText primary="పరీక్షల కేంద్రం" primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem" }} />
            </ListItem>

            <Divider sx={{ my: 1 }} />
            <ThemeToggleButton variant="list" />
            <Divider sx={{ my: 1 }} />

            <ListItem
              component="a"
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerOpen(false)}
              sx={{ borderRadius: "8px", color: "inherit" }}
            >
              <ListItemText primary="💬 అభిప్రాయం" primaryTypographyProps={{ fontSize: "0.95rem" }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}