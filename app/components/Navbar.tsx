"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { Box } from "@mui/material";
import Image from "next/image";

const navItems = [
  { label: "మిరా", path: "/" },
  { label: "మిరా పద్యాలు", path: "/mirapoems" },
  { label: "అక్షరమాల", path: "/aksharamala" },
  { label: "పద్యాలవాల", path: "/poems" },
  { label: "శతకాలమాల", path: "/shatakamu" },
 { label: "ఖతిమాల", path: "/khatiMala" },
  { label: "చిత్రమాల", path: "/chitramala" },
  { label: "కథామాల", path: "/kathamala" },
  { label: "సామెతలమాల", path: "/sametalu" },
  { label: "లిపిమాల", path: "/lipimala" },
];

export default function Navbar() {
  return (
    <AppBar position="sticky" color="secondary" elevation={3}>
      <Toolbar
        sx={{
          flexDirection: "column",
          alignItems: "stretch",
          px: { xs: 2, md: 4 },
          py: 1,
        }}
      >
        {/* Top Row: Logo + Menu */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo + Title */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "white",
                letterSpacing: "0.5px",
              }}
            >
            రత్నాలబాల – జ్ఞానమాల
            </Typography>
             {/* Motto Row */}
      
          </Link>

          {/* Desktop Menu */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                style={{ textDecoration: "none" }}
              >
                <Typography
                  sx={{
                    color: "white",
                    fontSize: "0.95rem",
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "999px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.18)",
                    },
                  }}
                >
                  {item.label}
                </Typography>
              </Link>
            ))}
          </Box>
        </Box>

       
      </Toolbar>
    </AppBar>
  );
}
