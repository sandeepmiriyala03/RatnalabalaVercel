"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { Box } from "@mui/material";
import Image from "next/image";

const navItems = [
  { label: "మిరా", path: "/" },
  { label: "మిరా క్విజ్", path: "/MIRIAQuiz" },
  { label: "రత్నభావాలు", path: "/AboutAuthor" },
  { label: "పద్యాలవాల", path: "/poems" },

  { label: "అంకితం", path: "/Dedication" },
];

export default function Navbar() {
  return (
    <AppBar position="sticky" color="secondary">
      <Toolbar
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          py: 1,
        }}
      >
        {/* Logo + Title */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Image
            src="/Images/CartoonStyle.png"
            alt="Website Logo"
            width={56}
            height={56}
            style={{ borderRadius: "8px", marginRight: "12px" }}
          />
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "white" }}
          >
            మేధో సృష్టి
          </Typography>
        </Link>

        {/* Desktop Menu ONLY */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              style={{ textDecoration: "none" }}
            >
              <Typography
                variant="button"
                sx={{
                  color: "white",
                  "&:hover": {
                    textDecoration: "underline",
                    textUnderlineOffset: "4px",
                  },
                }}
              >
                {item.label}
              </Typography>
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
