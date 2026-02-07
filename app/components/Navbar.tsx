"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Switch,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* ================= NAV ITEMS ================= */
const navItems = [
  { label: "రత్నాలబాల", path: "/" },
  { label: "మిరా", path: "/mirapoems" },
  { label: "పద్యాలవాల", path: "/poems" },
  { label: "అక్షరమాల", path: "/aksharamala" },
  { label: "శతకాలమాల", path: "/shatakamu" },
  { label: "కథామాల", path: "/kathamala" },
  { label: "సామెతలమాల", path: "/sametalu" },
  { label: "చిత్రమాల", path: "/chitramala" },
  { label: "స్వరమాల", path: "/swaramala" },
  { label: "లిపిమాల", path: "/lipimala" },
  { label: "ఖతిమాల", path: "/khatiMala" },
];

export default function Navbar() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);

  const bgColor = highContrast ? "#0B3C5D" : "#1E5A8A";
  const textColor = "#FFFFFF";
  const highlightColor = "#FFD166";

  return (
    <>
      {/* ===== Skip to Content (WCAG) ===== */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: "-999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "16px";
          e.currentTarget.style.top = "16px";
          e.currentTarget.style.width = "auto";
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.padding = "8px 12px";
          e.currentTarget.style.background = highlightColor;
          e.currentTarget.style.color = "#000";
          e.currentTarget.style.zIndex = "2000";
        }}
      >
        Skip to content
      </a>

      <AppBar position="sticky" elevation={2} sx={{ bgcolor: bgColor }}>
        <Toolbar
          sx={{
            px: { xs: 2, md: 4 },
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {/* ===== Brand ===== */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: `${1.2 * fontScale}rem`,
                color: textColor,
              }}
            >
              రత్నాలబాల–జ్ఞానమాల
            </Typography>
           
          </Link>

          {/* ===== Desktop Nav ===== */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.label}
                  href={item.path}
                  style={{ textDecoration: "none" }}
                >
                  <Typography
                    tabIndex={0}
                    sx={{
                      color: active ? bgColor : textColor,
                      backgroundColor: active
                        ? highlightColor
                        : "transparent",
                      px: 1.6,
                      py: 0.8,
                      borderRadius: "999px",
                      fontSize: `${0.9 * fontScale}rem`,
                      fontWeight: active ? 700 : 500,
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.18)",
                      },
                      "&:focus-visible": {
                        outline: `2px solid ${highlightColor}`,
                      },
                    }}
                  >
                    {item.label}
                  </Typography>
                </Link>
              );
            })}
          </Box>

          {/* ===== Mobile Menu Button ===== */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: textColor }}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ================= Mobile Drawer ================= */}
      <Drawer open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, p: 2 }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.label}
                component={Link}
                href={item.path}
                onClick={() => setOpen(false)}
                sx={{
                  bgcolor:
                    pathname === item.path ? highlightColor : "transparent",
                  borderRadius: 1,
                }}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>

       
        </Box>
      </Drawer>
    </>
  );
}
