"use client";

import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Drawer, List, ListItem, ListItemText, Divider,
  Menu, MenuItem, Button, Collapse, ListItemButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════
   NAV GROUPS
═══════════════════════════════════════════ */
const NAV_GROUPS = [
  {
    label: "సాహిత్యం",
    icon: "📚",
    items: [
      { label: "పద్యాలవాల",    path: "/poems" },
      { label: "మిరా",          path: "/mirapoems" },
      { label: "శతకాలమాల",     path: "/shatakamu" },
      { label: "స్మృతిమాల",     path: "/smruthimala" },
      { label: "కథామాల",        path: "/kathamala" },
      { label: "పరాభవమాల",     path: "/parabhava" },
    ],
  },
  {
    label: "వ్యాకరణం",
    icon: "📖",
    items: [
      { label: "అక్షరమాల",     path: "/aksharamala" },
      { label: "గుణింతమాల",     path: "/guninta" },
      { label: "పదాలమాల ",      path: "/padalamala" },
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
      { label: "విదురమాల", path: "/rahasyabhasha" },
      { label: "శైలిమాల", path: "/shailimala" },
    ],
  },
  {
    label: "గీతామాల",
    icon: "🕉️",
    items: [
      { label: "భగవద్గీత", path: "/geeta" },
    ],
  },
];

const SINGLE_ITEMS = [
  { label: "రత్నాలబాల", path: "/" },
  {
    label: "అభిప్రాయం",
    path: "https://forms.gle/z4zugcnmZrW9d9cR9",
    external: true,
  },
];

/* ═══════════════════════════════════════════
   COLORS — reused from globals.css's brand tokens
   (forest green / gold / ivory) instead of a
   one-off blue-and-yellow scheme unrelated to the
   rest of the site. Using the CSS variables means
   this bar also adapts correctly in dark mode for
   free, since --secondary/--background/--accent-light
   are already redefined there.
═══════════════════════════════════════════ */
const BG      = "var(--secondary)";     // forest green bar — matches the brand identity used everywhere else
const TEXT    = "var(--background)";    // ivory (or dark-ivory in dark mode) — 11.6:1 / 8.2:1 against BG
const ACCENT  = "var(--accent-light)";  // gold — same active-route highlight color used sitewide

/* Text drawn ON TOP of the gold ACCENT pill needs its OWN fixed
   color, not a mode-flipping variable. --accent-light is a similarly
   bright/mid-tone gold in BOTH light mode (#e0a838) and dark mode
   (#f0c675) — it's designed to read as a foreground accent against
   the page background, not to host text on top of itself. Pairing it
   with --foreground (which flips to a LIGHT ivory in dark mode) would
   put light text on a light pill and fail badly (checked: ~1.4:1). A
   constant dark ink stays readable against the gold pill either way
   (7.7:1 in light-mode nav, 10.2:1 in dark-mode nav). */
const ON_ACCENT = "#241f1a";

/* ═══════════════════════════════════════════
   THEME TOGGLE
   Reads whatever [data-theme] is already on <html> (set by the
   blocking script in layout.tsx before paint, or left unset to follow
   the OS setting), and lets the person override it either way. The
   choice is saved to localStorage so it persists across visits.
═══════════════════════════════════════════ */
function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark") {
      setIsDark(true);
    } else if (current === "light") {
      setIsDark(false);
    } else {
      // No explicit choice saved yet — reflect the OS setting so the
      // button's icon/label starts in sync with what's actually shown.
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing may block storage — the choice just won't
      // persist across visits, which is a reasonable fallback.
    }
    setIsDark(!isDark);
  };

  return { isDark, toggle };
}

/* Labeled, not icon-only — a plain sun/moon icon can be ambiguous
   about what tapping it does; the Telugu label removes that doubt
   before the first tap, same reasoning as the install FAB. */
function ThemeToggleButton({ variant = "bar" }: { variant?: "bar" | "list" }) {
  const { isDark, toggle } = useThemeToggle();

  if (variant === "list") {
    return (
      <ListItemButton onClick={toggle} sx={{ borderRadius: "8px", mb: 0.3 }}>
        {isDark ? <LightModeRoundedIcon fontSize="small" sx={{ mr: 1.5 }} /> : <DarkModeRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />}
        <ListItemText
          primary={isDark ? "లైట్ మోడ్‌కు మార్చండి" : "డార్క్ మోడ్‌కు మార్చండి"}
          primaryTypographyProps={{ fontSize: "0.95rem", fontFamily: "'Noto Serif Telugu', serif" }}
        />
      </ListItemButton>
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
        border: "1px solid rgba(255,255,255,0.4)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
      }}
    >
      {isDark ? "లైట్ మోడ్" : "డార్క్ మోడ్"}
    </Button>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP DROPDOWN
═══════════════════════════════════════════ */
function DesktopGroup({ group }: { group: typeof NAV_GROUPS[0] }) {
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const isActive = group.items.some(i => i.path === pathname);

  return (
    <>
      <Button
        onClick={e => setAnchor(e.currentTarget)}
        endIcon={open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{
          color: isActive ? ON_ACCENT : TEXT,
          bgcolor: isActive ? ACCENT : "transparent",
          px: 1.6, py: 0.8,
          borderRadius: "999px",
          fontSize: "0.9rem",
          fontWeight: isActive ? 700 : 500,
          textTransform: "none",
          minWidth: 0,
          "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
        }}
      >
        {group.icon} {group.label}
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
        {group.items.map(item => {
          const active = pathname === item.path;
          return (
            <MenuItem
              key={item.path}
              component={Link}
              href={item.path}
              onClick={() => setAnchor(null)}
              sx={{
                fontFamily: "'Noto Serif Telugu', serif",
                fontSize: "0.95rem",
                fontWeight: active ? 700 : 400,
                /* Menu popovers render on a light Paper regardless of
                   page theme, so the forest-green brand color (not
                   ON_ACCENT) is the right high-contrast text here. */
                color: active ? "var(--secondary)" : "text.primary",
                bgcolor: active ? `${ACCENT}55` : "transparent",
                borderRadius: "8px", mx: 0.5, my: 0.2,
                "&:hover": { bgcolor: `${ACCENT}33` },
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
   MOBILE GROUP
═══════════════════════════════════════════ */
function MobileGroup({
  group, onClose,
}: {
  group: typeof NAV_GROUPS[0];
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton
        onClick={() => setOpen(v => !v)}
        sx={{ borderRadius: "8px", mb: 0.3 }}
      >
        <ListItemText
          primary={`${group.icon} ${group.label}`}
          primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Noto Serif Telugu', serif" }}
        />
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ListItemButton>

      <Collapse in={open} timeout={200} unmountOnExit>
        <List disablePadding sx={{ pl: 2 }}>
          {group.items.map(item => {
            const active = pathname === item.path;
            return (
              <ListItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={onClose}
                sx={{
                  bgcolor: active ? `${ACCENT}88` : "transparent",
                  borderRadius: "8px", mb: 0.3,
                  py: 0.8,
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    fontWeight: active ? 700 : 400,
                    fontFamily: "'Noto Serif Telugu', serif",
                  }}
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
   NAVBAR
═══════════════════════════════════════════ */
export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Skip to content */}
      <a
        href="#main-content"
        style={{ position: "absolute", left: "-999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
        onFocus={e => {
          e.currentTarget.style.cssText = `left:16px;top:16px;width:auto;height:auto;padding:8px 12px;background:${ACCENT};color:${ON_ACCENT};z-index:2000;position:fixed;`;
        }}
      >
        Skip to content
      </a>

      <AppBar position="sticky" elevation={2} sx={{ bgcolor: BG }}>
        <Toolbar sx={{ px: { xs: 2, md: 3 }, display: "flex", justifyContent: "space-between", minHeight: { xs: 56, md: 60 } }}>

          {/* Brand */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1rem", md: "1.15rem" }, color: TEXT, whiteSpace: "nowrap" }}>
              రత్నాలబాల–జ్ఞానమాల
            </Typography>
          </Link>

          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>

            {/* Home */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <Typography sx={{
                color: pathname === "/" ? ON_ACCENT : TEXT,
                bgcolor: pathname === "/" ? ACCENT : "transparent",
                px: 1.6, py: 0.8, borderRadius: "999px",
                fontSize: "0.9rem", fontWeight: pathname === "/" ? 700 : 500,
                "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
              }}>
                🏠  రత్నాలబాల–జ్ఞానమాల
              </Typography>
            </Link>

            {/* Groups */}
            {NAV_GROUPS.map(g => <DesktopGroup key={g.label} group={g} />)}

            <Link href="/test-lab" style={{ textDecoration: "none" }}>
              <Typography sx={{
                color: pathname === "/test-lab" ? ON_ACCENT : TEXT,
                bgcolor: pathname === "/test-lab" ? ACCENT : "transparent",
                px: 1.6, py: 0.8, borderRadius: "999px",
                fontSize: "0.9rem", fontWeight: pathname === "/test-lab" ? 700 : 500,
                "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
              }}>
                పరీక్షల కేంద్రం
              </Typography>
            </Link>

            {/* Feedback */}
            <a href="https://forms.gle/z4zugcnmZrW9d9cR9" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Typography sx={{
                px: 1.6, py: 0.8, borderRadius: "999px",
                fontSize: "0.9rem", fontWeight: 500, color: TEXT,
                border: `1px solid rgba(255,255,255,0.4)`,
                "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
              }}>
                💬 అభిప్రాయం
              </Typography>
            </a>

            <ThemeToggleButton variant="bar" />
          </Box>

          {/* Mobile menu button */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: TEXT }}
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, borderRadius: "0 16px 16px 0" } }}
      >
        <Box sx={{ p: 2 }}>

          {/* Drawer header */}
          <Box sx={{ bgcolor: BG, borderRadius: "12px", px: 2, py: 1.5, mb: 2 }}>
            <Typography sx={{ fontWeight: 800, color: TEXT, fontSize: "1rem", fontFamily: "'Noto Serif Telugu', serif" }}>
              రత్నాలబాల–జ్ఞానమాల
            </Typography>
          </Box>

          <List disablePadding>
            {/* Home */}
            <ListItem
              component={Link} href="/"
              onClick={() => setDrawerOpen(false)}
              sx={{ bgcolor: pathname === "/" ? `${ACCENT}88` : "transparent", borderRadius: "8px", mb: 0.5 }}
            >
              <ListItemText primary="🏠 రత్నాలబాల–జ్ఞానమాల"
                primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Noto Serif Telugu', serif" }} />
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {/* Groups */}
            {NAV_GROUPS.map(g => (
              <MobileGroup key={g.label} group={g} onClose={() => setDrawerOpen(false)} />
            ))}

            <ListItem
              component={Link} href="/test-lab"
              onClick={() => setDrawerOpen(false)}
              sx={{ bgcolor: pathname === "/test-lab" ? `${ACCENT}88` : "transparent", borderRadius: "8px", mb: 0.5 }}
            >
              <ListItemText primary="పరీక్షల కేంద్రం"
                primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem" }} />
            </ListItem>

            <Divider sx={{ my: 1 }} />

            <ThemeToggleButton variant="list" />

            <Divider sx={{ my: 1 }} />

            {/* Feedback */}
            <ListItem
              component="a"
              href="https://forms.gle/z4zugcnmZrW9d9cR9"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerOpen(false)}
              sx={{ borderRadius: "8px" }}
            >
              <ListItemText primary="💬 అభిప్రాయం"
                primaryTypographyProps={{ fontSize: "0.95rem", fontFamily: "'Noto Serif Telugu', serif" }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}