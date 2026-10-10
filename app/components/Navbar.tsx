"use client";

/* ═══════════════════════════════════════════════════════════════
   NAVBAR — రత్నాలబాల–జ్ఞానమాల

   • ఒకే వరుస (full → compact → ☰), కొలిచి నిర్ణయిస్తుంది
   • 3 గుంపులు, 23 మాలలు — lib/malas.ts నుంచి (ముఖ పేజీ కూడా అదే)
   • నొక్కే ప్రతి చోటు ≥ 44px; ☰ మెనూ కుడి నుండి, వెతకడంతో
   • ఇప్పుడున్న పేజీ ఉప-పేజీల్లోనూ (/poems/12) హైలైట్
   • Inline styles లేవు — globals.css §14 (rb-nav-*, rb-drawer-*)
   • బార్ రంగు = --secondary (globals.css §1 RB-THEME)
   • Cache Components: usePathname() <Suspense> లో
   ═══════════════════════════════════════════════════════════════ */

import { AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText, Divider, Menu, MenuItem, Button, ListItemButton, Tooltip, InputBase } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ModuleFavoriteButton from "@/app/components/ModuleFavoriteButton";
import { MALA_GROUPS, type MalaGroup } from "@/lib/malas";

type NavItem = { label: string; path: string };
type NavGroup = { label: string; icon: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = MALA_GROUPS.map((g: MalaGroup) => ({
  label: g.label,
  icon: g.emoji,
  items: g.items.map((m) => ({ label: m.navLabel ?? m.label, path: m.path })),
}));

const HOME_LABEL = "ముంగిలి";
const FEEDBACK_URL = "https://forms.gle/z4zugcnmZrW9d9cR9";
const MAIN_CONTENT_ID = "main-content";

const isActivePath = (path: string, pathname: string | null) => !!pathname && (pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ─── skip link ─── */
function skipToMainContent(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const target = document.getElementById(MAIN_CONTENT_ID) ?? document.querySelector<HTMLElement>("main");
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/* ─── theme toggle (bar + drawer stay in sync via <html data-theme>) ─── */
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
      /* private browsing */
    }
  };
  return { isDark, toggle };
}

function ThemeToggleButton({ variant = "bar" }: { variant?: "bar" | "icon" | "list" }) {
  const { isDark, toggle } = useThemeToggle();
  const label = isDark ? "లైట్ మోడ్‌కు మార్చండి" : "డార్క్ మోడ్‌కు మార్చండి";
  const icon = isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />;

  if (variant === "list")
    return (
      <ListItemButton onClick={toggle} className="rb-drawer__row">
        {icon}
        <ListItemText primary={label} />
      </ListItemButton>
    );

  if (variant === "icon")
    return (
      <Tooltip title={label}>
        <IconButton onClick={toggle} aria-label={label} className="rb-nav__icon-btn">
          {icon}
        </IconButton>
      </Tooltip>
    );

  return (
    <Button onClick={toggle} startIcon={icon} className="rb-nav__pill rb-nav__outline">
      {isDark ? "లైట్ మోడ్" : "డార్క్ మోడ్"}
    </Button>
  );
}

/* ─── bar link ─── */
function BarLink({ href, active, compact, children }: { href: string; active: boolean; compact: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cx("rb-nav__pill", compact && "is-compact", active && "is-active")}>
      {children}
    </Link>
  );
}

/* ─── dropdown group ─── */
function DesktopGroup({ group, compact, pathname }: { group: NavGroup; compact: boolean; pathname: string | null }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const isActive = group.items.some((i) => isActivePath(i.path, pathname));
  const text = compact ? group.label : `${group.icon} ${group.label}`;

  if (group.items.length === 1)
    return (
      <Tooltip title={group.items[0].label}>
        <span>
          <BarLink href={group.items[0].path} active={isActive} compact={compact}>
            {text}
          </BarLink>
        </span>
      </Tooltip>
    );

  return (
    <>
      <Button
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={open}
        endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        className={cx("rb-nav__pill", compact && "is-compact", isActive && "is-active")}
      >
        {text}
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { className: "rb-nav-menu" } }}
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
              className={cx("rb-nav-menu__item", active && "is-active")}
            >
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

/* ─── one row of the bar ─── */
function DesktopNav({ compact, pathname, withFavorite }: { compact: boolean; pathname: string | null; withFavorite: boolean }) {
  return (
    <>
      <BarLink href="/" active={pathname === "/"} compact={compact}>
        {HOME_LABEL}
      </BarLink>

      {NAV_GROUPS.map((g) => (
        <DesktopGroup key={g.label} group={g} compact={compact} pathname={pathname} />
      ))}

      {compact ? (
        <Tooltip title="అభిప్రాయం">
          <IconButton component="a" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" aria-label="అభిప్రాయం (కొత్త ట్యాబ్‌లో)" className="rb-nav__icon-btn">
            <ChatBubbleOutlineRoundedIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" aria-label="అభిప్రాయం (కొత్త ట్యాబ్‌లో)" className="rb-nav__pill rb-nav__outline">
          💬 అభిప్రాయం
        </a>
      )}

      {withFavorite && <ModuleFavoriteButton />}
      <ThemeToggleButton variant={compact ? "icon" : "bar"} />
    </>
  );
}

/* ─── ☰ drawer ─── */
function DrawerItem({ item, pathname, onClose }: { item: NavItem; pathname: string | null; onClose: () => void }) {
  const active = isActivePath(item.path, pathname);
  return (
    <ListItem component={Link} href={item.path} onClick={onClose} aria-current={active ? "page" : undefined} className={cx("rb-drawer__item", active && "is-active")}>
      <ListItemText primary={item.label} secondary={active ? "మీరు ఇక్కడ ఉన్నారు" : undefined} />
    </ListItem>
  );
}

function NavDrawer({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string | null }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const groups = useMemo(() => {
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => (g.label.toLowerCase().includes(q) ? g : { ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) })).filter((g) => g.items.length);
  }, [q]);

  const showHome = !q || HOME_LABEL.includes(q);
  const nothing = !groups.length && !showHome;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { className: "rb-drawer" } }}>
      <nav aria-label="ప్రధాన మెనూ" className="rb-drawer__nav">
        <div className="rb-drawer__head">
          <p className="rb-drawer__title">రత్నాలబాల–జ్ఞానమాల</p>
          <Button onClick={onClose} startIcon={<CloseRoundedIcon />} className="rb-drawer__close">
            మూసివేయండి
          </Button>
        </div>

        <div className="rb-drawer__search-wrap">
          <label className="rb-drawer__search">
            <SearchRoundedIcon aria-hidden />
            <InputBase value={query} onChange={(e) => setQuery(e.target.value)} placeholder="మాల పేరు వెతకండి" inputProps={{ "aria-label": "మాల పేరు వెతకండి", type: "search" }} />
          </label>
        </div>

        <div className="rb-drawer__body">
          <List disablePadding>
            {showHome && <DrawerItem item={{ label: HOME_LABEL, path: "/" }} pathname={pathname === "/" ? "/" : null} onClose={onClose} />}
            {groups.map((g) => (
              <li key={g.label} className="rb-drawer__group">
                <h2 className="rb-drawer__group-title">
                  <span aria-hidden>{g.icon}</span>
                  {g.label}
                </h2>
                <List disablePadding>
                  {g.items.map((item) => (
                    <DrawerItem key={item.path} item={item} pathname={pathname} onClose={onClose} />
                  ))}
                </List>
              </li>
            ))}
          </List>

          {nothing && (
            <p className="rb-drawer__empty">
              &ldquo;{query}&rdquo; పేరుతో మాల దొరకలేదు. పేరులో కొంత భాగం మాత్రమే టైప్ చేసి చూడండి (ఉదా: &ldquo;పద్య&rdquo;).
            </p>
          )}

          <Divider className="rb-drawer__divider" />
          <ThemeToggleButton variant="list" />
          <ListItemButton component="a" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" onClick={onClose} className="rb-drawer__row">
            <ChatBubbleOutlineRoundedIcon />
            <ListItemText primary="అభిప్రాయం చెప్పండి" secondary="కొత్త ట్యాబ్‌లో తెరుచుకుంటుంది" />
          </ListItemButton>
        </div>
      </nav>
    </Drawer>
  );
}

/* ─── "does it fit on one row?" — measured (font & text size change widths) ─── */
type NavMode = "full" | "compact" | "drawer";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useNavMode() {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<NavMode | null>(null);

  const measure = useCallback(() => {
    const bar = toolbarRef.current;
    const brand = brandRef.current;
    if (!bar || !brand) return;
    const cs = getComputedStyle(bar);
    const available = bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - brand.offsetWidth - 24;
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
    <div aria-hidden className="rb-nav__measure">
      <div ref={innerRef} {...{ inert: true }} className="rb-nav__measure-inner">
        <DesktopNav compact={compact} pathname={null} withFavorite={withFavorite} />
      </div>
    </div>
  );
}

/* ─── navbar ─── */
function NavbarView({ pathname, withFavorite }: { pathname: string | null; withFavorite: boolean }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mode, toolbarRef, brandRef, fullRef, compactRef } = useNavMode();
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <>
      <a href={`#${MAIN_CONTENT_ID}`} onClick={skipToMainContent} className="rb-skip-link">
        ప్రధాన కంటెంట్‌కు వెళ్ళండి
      </a>

      <AppBar position="sticky" elevation={0} className="rb-nav">
        <Toolbar ref={toolbarRef} disableGutters className="rb-nav__bar" data-mode={mode ?? "auto"}>
          <Link ref={brandRef} href="/" aria-label="రత్నాలబాల–జ్ఞానమాల, ముంగిలి" className="rb-nav__brand">
            <span className="rb-nav__brand-text">
              <span className="rb-show-xs">రత్నాలబాల</span>
              <span className="rb-hide-xs">రత్నాలబాల–జ్ఞానమాల</span>
            </span>
          </Link>

          <MeasureCopy innerRef={fullRef} compact={false} withFavorite={withFavorite} />
          <MeasureCopy innerRef={compactRef} compact withFavorite={withFavorite} />

          <nav aria-label="ప్రధాన మెనూ" className="rb-nav__desktop">
            <DesktopNav compact={mode === "compact"} pathname={pathname} withFavorite={withFavorite} />
          </nav>

          {/* ☰ with a word — three lines alone may not be clear to older readers */}
          <div className="rb-nav__compact-tools">
            {withFavorite && <ModuleFavoriteButton />}
            <Button onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-haspopup="dialog" startIcon={<MenuIcon />} className="rb-nav__pill rb-nav__outline">
              మెనూ
            </Button>
          </div>
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
  return (
    <Suspense fallback={<NavbarView pathname={null} withFavorite={false} />}>
      <NavbarWithPath />
    </Suspense>
  );
}
