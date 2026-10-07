"use client";

/* ═══════════════════════════════════════════════════════════════
   NAVBAR — రత్నాలబాల–జ్ఞానమాల

   • పెద్ద బార్: ఒకే వరుస (full → compact → ☰), కొలిచి నిర్ణయిస్తుంది
   • ప్రతి నొక్కే చోటు కనీసం 48px (--tap-target) — 60+ పాఠకుల కోసం
   • ఒక్క అంశమే ఉన్న గుంపు (వాచకమాల, గీతామాల) = నేరుగా link, రెండు నొక్కులు కాదు
   • ☰ మెనూ: కుడి నుండి (బటన్ ఉన్న వైపే), మూసే బటన్, వెతకడం, అన్ని గుంపులూ తెరిచే
   • ఇప్పుడున్న పేజీ: ఉప-పేజీల్లోనూ (/poems/12) హైలైట్
   • Next.js 16.4 Cache Components: usePathname() ను <Suspense> లో ఉంచాం,
     dynamic routes ఉన్నా build ఆగదు; fallback లో అదే మెనూ (హైలైట్ లేకుండా)
   ═══════════════════════════════════════════════════════════════ */

import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Drawer, List, ListItem, ListItemText, Divider,
  Menu, MenuItem, Button, ListItemButton, Tooltip, InputBase,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ModuleFavoriteButton from "@/app/components/ModuleFavoriteButton";

/* ═══════════════════════════════════════════
   NAV GROUPS
═══════════════════════════════════════════ */
type NavItem = { label: string; path: string };
type NavGroup = { label: string; icon: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "సాహిత్యం",
    icon: "📚",
    items: [
      { label: "పద్యాలమాల", path: "/poems" },
      { label: "మిరా", path: "/mirapoems" },
      { label: "శతకాలమాల", path: "/shatakamu" },
      { label: "స్మృతిమాల", path: "/smruthimala" },
      { label: "కథామాల", path: "/kathamala" },
      { label: "పరాభవమాల", path: "/parabhava" },
      { label: "నా చదువు", path: "/my-reading" },
    ],
  },
  {
    label: "వ్యాకరణం",
    icon: "📖",
    items: [
      { label: "అక్షరమాల", path: "/aksharamala" },
      { label: "గుణింతమాల", path: "/guninta" },
      { label: "పదాలమాల", path: "/padalamala" },
      { label: "సామెతలమాల", path: "/sametalu" },
      { label: "సంధిమాల", path: "/sandhi" },
      { label: "సమాసముమాల", path: "/samasa" },
    ],
  },
  {
    label: "కళలు",
    icon: "🎨",
    items: [
      { label: "చిత్రమాల", path: "/chitramala" },
      { label: "స్వరమాల", path: "/swaramala" },
      { label: "లిపిమాల", path: "/lipimala" },
      { label: "ఖతిమాల", path: "/khatiMala" },
      { label: "విదురమాల", path: "/rahasyabhasha" },
      { label: "శైలిమాల", path: "/shailimala" },
    ],
  },
  { label: "వాచకమాల", icon: "📰", items: [{ label: "తెలుగు వాచకి", path: "/news" }] },
  { label: "గీతామాల", icon: "🕉️", items: [{ label: "భగవద్గీత", path: "/geeta" }] },
  {
    label: "జ్ఞానమాల",
    icon: "🪔",
    items: [
      { label: "అన్ని మాలలు ఒకే చోట", path: "/gnanamala" },
      { label: "PDF ప్రశ్నోత్తరి", path: "/pdf-prashnottari" },
    ],
  },
];

const HOME_LABEL = "ముంగిలి"; // "home"
const TEST_LAB = { label: "పరీక్షల కేంద్రం", path: "/test-lab" };
const FEEDBACK_URL = "https://forms.gle/z4zugcnmZrW9d9cR9";

/* ఉప-పేజీలూ లెక్కే: /poems/12 లో ఉంటే "పద్యాలమాల" హైలైట్ */
const isActivePath = (path: string, pathname: string | null) =>
  !!pathname && (pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));

/* ═══════════════════════════════════════════
   COLORS — globals.css tokens (dark mode ఆటోమేటిక్)
═══════════════════════════════════════════ */
const BG = "var(--secondary)"; // forest green bar
const TEXT = "var(--background)"; // ivory text on the bar
const ACCENT = "var(--accent-light)"; // gold active pill
const ON_ACCENT = "#241f1a"; // బంగారు పై నల్లని అక్షరం, రెండు modes లోనూ (--foreground dark లో తెల్లగా మారుతుంది)
const TAP = "var(--tap-target, 48px)";
const SAFE_TOP = "env(safe-area-inset-top, 0px)";
const FOCUS = { "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 } };
const BAR_FOCUS = { "&:focus-visible": { outline: `3px solid ${ACCENT}`, outlineOffset: 2 } };

/* ═══════════════════════════════════════════
   SKIP LINK
═══════════════════════════════════════════ */
const MAIN_CONTENT_ID = "main-content";
const NAV_OFFSET_PX = 72;

function skipToMainContent(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const target = document.getElementById(MAIN_CONTENT_ID) ?? document.querySelector<HTMLElement>("main");
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.style.outline = "none";
  target.style.scrollMarginTop = `calc(${NAV_OFFSET_PX}px + ${SAFE_TOP})`;
  target.focus({ preventScroll: true });
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/* ═══════════════════════════════════════════
   THEME TOGGLE — బార్‌లోది, మెనూలోది ఎప్పుడూ ఒకే స్థితి
   (<html data-theme> ను గమనిస్తుంది)
═══════════════════════════════════════════ */
const readIsDark = () => {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr ? attr === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
};

function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(readIsDark());
    const mo = new MutationObserver(() => setIsDark(readIsDark()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const toggle = () => {
    const next = readIsDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private browsing: just won't persist */
    }
  };

  return { isDark, toggle };
}

function ThemeToggleButton({ variant = "bar" }: { variant?: "bar" | "icon" | "list" }) {
  const { isDark, toggle } = useThemeToggle();
  const label = isDark ? "లైట్ మోడ్‌కు మార్చండి" : "డార్క్ మోడ్‌కు మార్చండి";
  const icon = isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />;

  if (variant === "list") {
    return (
      <ListItemButton onClick={toggle} sx={{ borderRadius: "10px", minHeight: TAP, gap: 1.5, ...FOCUS }}>
        {icon}
        <ListItemText primary={label} primaryTypographyProps={{ fontSize: "1rem", fontWeight: 600 }} />
      </ListItemButton>
    );
  }

  if (variant === "icon") {
    return (
      <Tooltip title={label}>
        <IconButton onClick={toggle} aria-label={label} sx={{ color: TEXT, width: 44, height: 44, border: "1px solid rgba(255,255,255,0.4)", ...BAR_FOCUS }}>
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
        px: 1.6,
        minHeight: 44,
        borderRadius: "999px",
        fontSize: "0.95rem",
        fontWeight: 500,
        textTransform: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid rgba(255,255,255,0.4)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
        ...BAR_FOCUS,
      }}
    >
      {isDark ? "లైట్ మోడ్" : "డార్క్ మోడ్"}
    </Button>
  );
}

/* ═══════════════════════════════════════════
   BAR PILL
═══════════════════════════════════════════ */
const pillSx = (active: boolean, compact: boolean) => ({
  color: active ? ON_ACCENT : TEXT,
  bgcolor: active ? ACCENT : "transparent",
  px: compact ? 1.1 : 1.6,
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  fontSize: "0.95rem",
  fontWeight: active ? 800 : 500,
  textTransform: "none" as const,
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
  minWidth: 0,
  textDecoration: "none",
  "&:hover": { bgcolor: active ? ACCENT : "rgba(255,255,255,0.18)" },
  ...BAR_FOCUS,
});

function BarLink({ href, active, compact, children }: { href: string; active: boolean; compact: boolean; children: React.ReactNode }) {
  return (
    <Box component={Link} href={href} aria-current={active ? "page" : undefined} sx={pillSx(active, compact)}>
      {children}
    </Box>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP DROPDOWN (ఒక్క అంశమే ఉంటే నేరుగా link)
═══════════════════════════════════════════ */
function DesktopGroup({ group, compact, pathname }: { group: NavGroup; compact: boolean; pathname: string | null }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const isActive = group.items.some((i) => isActivePath(i.path, pathname));
  const text = compact ? group.label : `${group.icon} ${group.label}`;

  if (group.items.length === 1) {
    return (
      <Tooltip title={group.items[0].label}>
        <span>
          <BarLink href={group.items[0].path} active={isActive} compact={compact}>
            {text}
          </BarLink>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        endIcon={open ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
        sx={{ ...pillSx(isActive, compact), "& .MuiButton-endIcon": { ml: 0.25 } }}
      >
        {text}
      </Button>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "14px",
            minWidth: 220,
            py: 0.5,
            bgcolor: "var(--surface-elevated)",
            color: "var(--foreground)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        {group.items.map((item) => {
          const active = isActivePath(item.path, pathname);
          return (
            <MenuItem
              key={item.path}
              component={Link}
              href={item.path}
              onClick={() => setAnchor(null)}
              aria-current={active ? "page" : undefined}
              sx={{
                minHeight: TAP,
                fontSize: "1rem",
                fontWeight: active ? 800 : 500,
                color: "inherit",
                bgcolor: active ? `color-mix(in srgb, ${ACCENT} 40%, transparent)` : "transparent",
                boxShadow: active ? "inset 4px 0 0 var(--secondary)" : "none",
                borderRadius: "10px",
                mx: 0.75,
                my: 0.25,
                "&:hover": { bgcolor: `color-mix(in srgb, ${ACCENT} 22%, transparent)` },
                "&.Mui-focusVisible": { outline: "3px solid var(--focus-ring)", outlineOffset: -3 },
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
   DESKTOP ROW — ఒకే వరుస
═══════════════════════════════════════════ */
function DesktopNav({ compact, pathname, withFavorite }: { compact: boolean; pathname: string | null; withFavorite: boolean }) {
  return (
    <>
      <BarLink href="/" active={pathname === "/"} compact={compact}>
        {HOME_LABEL}
      </BarLink>

      {NAV_GROUPS.map((g) => (
        <DesktopGroup key={g.label} group={g} compact={compact} pathname={pathname} />
      ))}

      <BarLink href={TEST_LAB.path} active={isActivePath(TEST_LAB.path, pathname)} compact={compact}>
        {TEST_LAB.label}
      </BarLink>

      {compact ? (
        <Tooltip title="అభిప్రాయం">
          <IconButton
            component="a"
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="అభిప్రాయం (కొత్త ట్యాబ్‌లో)"
            sx={{ color: TEXT, width: 44, height: 44, border: "1px solid rgba(255,255,255,0.4)", flexShrink: 0, ...BAR_FOCUS }}
          >
            <ChatBubbleOutlineRoundedIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Box
          component="a"
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="అభిప్రాయం (కొత్త ట్యాబ్‌లో)"
          sx={{ ...pillSx(false, false), border: "1px solid rgba(255,255,255,0.4)" }}
        >
          💬 అభిప్రాయం
        </Box>
      )}

      {withFavorite && (
        <Box sx={{ flexShrink: 0, display: "flex" }}>
          <ModuleFavoriteButton />
        </Box>
      )}
      <ThemeToggleButton variant={compact ? "icon" : "bar"} />
    </>
  );
}

/* ═══════════════════════════════════════════
   ☰ మెనూ (Drawer) — అన్నీ కనిపించేలా, వెతకడంతో
═══════════════════════════════════════════ */
function DrawerItem({ item, pathname, onClose }: { item: NavItem; pathname: string | null; onClose: () => void }) {
  const active = isActivePath(item.path, pathname);
  return (
    <ListItem
      component={Link}
      href={item.path}
      onClick={onClose}
      aria-current={active ? "page" : undefined}
      sx={{
        minHeight: TAP,
        borderRadius: "10px",
        mb: 0.25,
        color: "inherit",
        bgcolor: active ? `color-mix(in srgb, ${ACCENT} 45%, transparent)` : "transparent",
        boxShadow: active ? "inset 4px 0 0 var(--secondary)" : "none",
        "&:hover": { bgcolor: active ? `color-mix(in srgb, ${ACCENT} 45%, transparent)` : "var(--surface)" },
        ...FOCUS,
      }}
    >
      <ListItemText
        primary={item.label}
        secondary={active ? "మీరు ఇక్కడ ఉన్నారు" : undefined}
        primaryTypographyProps={{ fontSize: "1.05rem", fontWeight: active ? 800 : 500 }}
        secondaryTypographyProps={{ fontSize: "0.85rem", color: "var(--muted-text)" }}
      />
    </ListItem>
  );
}

function NavDrawer({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string | null }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  // మూసినప్పుడు వెతుకుడు ఖాళీ
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const groups = useMemo(() => {
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) =>
      g.label.toLowerCase().includes(q) ? g : { ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }
    ).filter((g) => g.items.length);
  }, [q]);

  const showHome = !q || HOME_LABEL.includes(q);
  const showLab = !q || TEST_LAB.label.includes(q);
  const nothing = !groups.length && !showHome && !showLab;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 340,
          maxWidth: "90vw",
          borderRadius: "18px 0 0 18px",
          bgcolor: "var(--background)",
          color: "var(--foreground)",
          pt: SAFE_TOP,
          pb: "env(safe-area-inset-bottom, 0px)",
        },
      }}
    >
      <Box component="nav" aria-label="ప్రధాన మెనూ" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* తల: పేరు + మూసే బటన్ */}
        <Box sx={{ bgcolor: BG, color: TEXT, px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", flex: 1 }}>రత్నాలబాల–జ్ఞానమాల</Typography>
          <Button
            onClick={onClose}
            startIcon={<CloseRoundedIcon />}
            sx={{ color: TEXT, minHeight: 44, textTransform: "none", fontWeight: 700, fontSize: "0.95rem", borderRadius: "999px", ...BAR_FOCUS }}
          >
            మూసివేయండి
          </Button>
        </Box>

        {/* వెతకడం */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Box
            component="label"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              minHeight: TAP,
              borderRadius: "12px",
              border: "2px solid var(--border-strong)",
              bgcolor: "var(--surface-elevated)",
              "&:focus-within": { borderColor: "var(--focus-ring)" },
            }}
          >
            <SearchRoundedIcon sx={{ color: "var(--muted-text)" }} aria-hidden />
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="మాల పేరు వెతకండి"
              inputProps={{ "aria-label": "మాల పేరు వెతకండి", type: "search" }}
              sx={{ flex: 1, fontSize: "1.05rem", color: "inherit" }}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }}>
          <List disablePadding>
            {showHome && <DrawerItem item={{ label: HOME_LABEL, path: "/" }} pathname={pathname === "/" ? "/" : null} onClose={onClose} />}

            {groups.map((g) => (
              <Box component="li" key={g.label} sx={{ listStyle: "none", mt: 1.5 }}>
                <Typography
                  component="h2"
                  sx={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--muted-text)", px: 1, mb: 0.5, display: "flex", gap: 0.75 }}
                >
                  <span aria-hidden>{g.icon}</span>
                  {g.label}
                </Typography>
                <List disablePadding>
                  {g.items.map((item) => (
                    <DrawerItem key={item.path} item={item} pathname={pathname} onClose={onClose} />
                  ))}
                </List>
              </Box>
            ))}

            {showLab && (
              <Box sx={{ mt: 1.5 }}>
                <DrawerItem item={TEST_LAB} pathname={pathname} onClose={onClose} />
              </Box>
            )}
          </List>

          {nothing && (
            <Typography sx={{ px: 1, py: 2, color: "var(--muted-text)", lineHeight: 1.8 }}>
              &ldquo;{query}&rdquo; పేరుతో మాల దొరకలేదు. పేరులో కొంత భాగం మాత్రమే టైప్ చేసి చూడండి (ఉదా: &ldquo;పద్య&rdquo;).
            </Typography>
          )}

          <Divider sx={{ my: 2, borderColor: "var(--border-strong)" }} />
          <ThemeToggleButton variant="list" />
          <ListItemButton
            component="a"
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            sx={{ borderRadius: "10px", minHeight: TAP, gap: 1.5, ...FOCUS }}
          >
            <ChatBubbleOutlineRoundedIcon />
            <ListItemText primary="అభిప్రాయం చెప్పండి" secondary="కొత్త ట్యాబ్‌లో తెరుచుకుంటుంది" primaryTypographyProps={{ fontSize: "1rem", fontWeight: 600 }} secondaryTypographyProps={{ fontSize: "0.85rem", color: "var(--muted-text)" }} />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
}

/* ═══════════════════════════════════════════
   "ఒకే వరుసలో పడుతుందా?" — కొలిచి నిర్ణయం
   (పాఠకుడి అక్షర సైజు, తెలుగు ఫాంట్ వెడల్పు మారుస్తాయి)
     full → compact → drawer (☰)
═══════════════════════════════════════════ */
type NavMode = "full" | "compact" | "drawer";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useNavMode() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<NavMode | null>(null); // null = కొలవక ముందు (CSS fallback)

  const measure = useCallback(() => {
    const bar = toolbarRef.current;
    const brand = brandRef.current;
    if (!bar || !brand) return;
    const cs = getComputedStyle(bar);
    const GAP = 24;
    const available = bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - brand.offsetWidth - GAP;
    const full = fullRef.current?.scrollWidth ?? Infinity;
    const compact = compactRef.current?.scrollWidth ?? Infinity;
    setMode(full <= available ? "full" : compact <= available ? "compact" : "drawer");
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    [toolbarRef, brandRef, fullRef, compactRef].forEach((r) => r.current && ro.observe(r.current));
    document.fonts?.ready.then(measure).catch(() => {});
    document.fonts?.addEventListener?.("loadingdone", measure);
    return () => {
      ro.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, [measure]);

  return { mode, toolbarRef, brandRef, fullRef, compactRef };
}

function MeasureCopy({ innerRef, compact, withFavorite }: { innerRef: React.RefObject<HTMLDivElement | null>; compact: boolean; withFavorite: boolean }) {
  return (
    <Box aria-hidden sx={{ position: "absolute", width: 0, height: 0, overflow: "hidden", visibility: "hidden", pointerEvents: "none" }}>
      <Box ref={innerRef} {...{ inert: true }} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, whiteSpace: "nowrap", width: "max-content" }}>
        <DesktopNav compact={compact} pathname={null} withFavorite={withFavorite} />
      </Box>
    </Box>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
function NavbarView({ pathname, withFavorite }: { pathname: string | null; withFavorite: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mode, toolbarRef, brandRef, fullRef, compactRef } = useNavMode();
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // పేజీ మారితే ☰ మెనూ మూసుకోవాలి (వెనక్కి బటన్‌తో వెళ్ళినా)
  useEffect(() => setDrawerOpen(false), [pathname]);

  const showDesktop = mode === null ? { xs: "none", lg: "flex" } : mode === "drawer" ? "none" : "flex";
  const showDrawerButton = mode === null ? { xs: "flex", lg: "none" } : mode === "drawer" ? "flex" : "none";

  return (
    <>
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
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            minHeight: { xs: 60, md: 64 },
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Link ref={brandRef} href="/" style={{ textDecoration: "none", flexShrink: 1, minWidth: 0 }} aria-label="రత్నాలబాల–జ్ఞానమాల, ముంగిలి">
            <Typography
              component="span"
              sx={{ display: "block", fontWeight: 800, fontSize: { xs: "1.05rem", md: "1.2rem" }, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>రత్నాలబాల</Box>
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>రత్నాలబాల–జ్ఞానమాల</Box>
            </Typography>
          </Link>

          <MeasureCopy innerRef={fullRef} compact={false} withFavorite={withFavorite} />
          <MeasureCopy innerRef={compactRef} compact withFavorite={withFavorite} />

          <Box component="nav" aria-label="ప్రధాన మెనూ" sx={{ display: showDesktop, alignItems: "center", gap: 0.5, flexWrap: "nowrap", flexShrink: 0 }}>
            <DesktopNav compact={mode === "compact"} pathname={pathname} withFavorite={withFavorite} />
          </Box>

          {/* ☰: మాటతో పాటు — పెద్దవాళ్ళకు మూడు గీతలు మాత్రమే అర్థం కాకపోవచ్చు */}
          <Box sx={{ display: showDrawerButton, alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            {withFavorite && <ModuleFavoriteButton />}
            <Button
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              startIcon={<MenuIcon />}
              sx={{
                color: TEXT,
                minHeight: 44,
                px: 1.5,
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.5)",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.98rem",
                "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
                ...BAR_FOCUS,
              }}
            >
              మెనూ
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <NavDrawer open={drawerOpen} onClose={closeDrawer} pathname={pathname} />
    </>
  );
}

function NavbarWithPath() {
  return <NavbarView pathname={usePathname()} withFavorite />;
}

export default function Navbar() {
  /* Cache Components: usePathname() dynamic route లో prerender సమయంలో ఆగుతుంది.
     ఆ సమయంలో అదే మెనూ (హైలైట్, favourite లేకుండా) చూపిస్తాం — layout మారదు. */
  return (
    <Suspense fallback={<NavbarView pathname={null} withFavorite={false} />}>
      <NavbarWithPath />
    </Suspense>
  );
}