"use client";

import {
  AppBar, Toolbar, Typography, Box, IconButton,
  Drawer, List, ListItem, ListItemText, Divider,
  Menu, MenuItem, Button, Collapse, ListItemButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
      { label: "కథామాల",        path: "/kathamala" },
      { label: "పరాభవమాల",     path: "/parabhava" },
    ],
  },
  {
    label: "వ్యాకరణం",
    icon: "📖",
    items: [
      { label: "అక్షరమాల",     path: "/aksharamala" },
      { label: "సంధి మాల",     path: "/sandhi" },
      { label: "సమాసము మాల",   path: "/samasa" },
      { label: "సామెతలమాల",    path: "/sametalu" },
      { label: "పదాల మాల ",      path: "/padalamala" },
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
   COLORS
═══════════════════════════════════════════ */
const BG      = "#1E5A8A";
const TEXT    = "#FFFFFF";
const ACCENT  = "#FFD166";

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
          color: isActive ? BG : TEXT,
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
                color: active ? BG : "text.primary",
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
          e.currentTarget.style.cssText = `left:16px;top:16px;width:auto;height:auto;padding:8px 12px;background:${ACCENT};color:#000;z-index:2000;position:fixed;`;
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
                color: pathname === "/" ? BG : TEXT,
                bgcolor: pathname === "/" ? ACCENT : "transparent",
                px: 1.6, py: 0.8, borderRadius: "999px",
                fontSize: "0.9rem", fontWeight: pathname === "/" ? 700 : 500,
                "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
              }}>
                🏠 హోమ్
              </Typography>
            </Link>

            {/* Groups */}
            {NAV_GROUPS.map(g => <DesktopGroup key={g.label} group={g} />)}

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
              <ListItemText primary="🏠 రత్నాలబాల"
                primaryTypographyProps={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Noto Serif Telugu', serif" }} />
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {/* Groups */}
            {NAV_GROUPS.map(g => (
              <MobileGroup key={g.label} group={g} onClose={() => setDrawerOpen(false)} />
            ))}

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