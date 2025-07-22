// components/Navbar.tsx
"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import Link from "next/link";
import { Box } from "@mui/material"; 

import Image from 'next/image';
const navItems = [
  { label: "పరిశోధన స్రవంతి", path: "/" },
  { label: "రత్నభావాలు - భావరత్నాలు", path: "/AboutAuthor" },
  { label: "పద్యాలవాల", path: "/poems" },
  { label: "భావాలమాల", path: "/chatbot" },
  { label: "పదాలు", path: "/PoemTitles" },
    {label:"ధ్వని దృశ్యం",path:"/images"},
  { label: "అంకితం", path: "/Dedication" },
];

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" color="secondary">
      <Toolbar
        // Essential flexbox properties for the Toolbar to distribute content
        sx={{
          justifyContent: 'space-between', // Pushes items to the ends with space in between
          alignItems: 'center', // Vertically centers all items in the toolbar
          flexWrap: 'wrap', // Allows items to wrap onto the next line if space is too constrained
          py: 1, // Add some vertical padding to the toolbar
        }}
      >
     
        <Link href="/" passHref style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          {/* Logo */}

         <Image
        src="/Images/Author.png"
        alt="Website Logo"
        width={60} // <--- **CHANGE THIS** - Direct prop, numeric value
        height={60} // <--- **CHANGE THIS** - Direct prop, numeric value
        style={{
          // width: "60px",   <--- REMOVE THESE LINES FROM STYLE
          // height: "60px",  <--- REMOVE THESE LINES FROM STYLE
          borderRadius: "8px",
          marginRight: "16px", // Space between logo and text
        }}
  // Consider adding 'priority' if this is a critical image (like a logo in the header)
  // priority
/>
          
          <Box sx={{ flexGrow: 1, textAlign: 'center', minWidth: { xs: '120px', sm: '150px' } }}> {/* Added minWidth for responsiveness */}
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'white' }}>
          మేధో సృష్టి
            </Typography>
           
          </Box>
        </Link>

        
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, ml: 2 }}> {/* ml: 2 for spacing from title */}
          {navItems.map((item) => (
            <Link key={item.label} href={item.path} passHref style={{ textDecoration: 'none' }}>
              <Typography
                variant="button"
                sx={{
                  color: "white",
                  textDecoration: "none", // Ensure no default underline
                  "&:hover": { textDecoration: "underline", textUnderlineOffset: '4px' }, // Subtle hover effect
                }}
              >
                {item.label}
              </Typography>
            </Link>
          ))}
        </Box>

        <Box sx={{ display: { xs: "flex", md: "none" }, ml: 2 }}> {/* ml: 2 for spacing from title */}
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {navItems.map((item) => (
              <MenuItem
                key={item.label}
                component={Link}
                href={item.path}
                onClick={handleClose}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}