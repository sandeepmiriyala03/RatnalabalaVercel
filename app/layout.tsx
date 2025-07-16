"use client";

import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
  Typography,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/app/components/Footer";
import { useEffect, useState } from "react";



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppBar position="fixed" color="default" elevation={2}>
          <Toolbar
            sx={{
              justifyContent: "space-between",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* LEFT SIDE: Logo + Poem Text */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Image
                src="/images/logo.png"
                alt="Ratnalabala Logo"
                width={100}
                height={50}
              />

              {/* POEM TEXT */}
              <Box sx={{ display: "flex", flexDirection: "column" }}>
            
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "primary.main",
                    lineHeight: 1.2,
                  }}
                >
                  శ్రీ మిరియాల వెంకటరత్నం
                  రత్నాల బాల పద్యాలవాల   భావాల మాల
                </Typography>
               
              </Box>
            </Box>

            {/* RIGHT SIDE: Nav Buttons + Clock */}
            <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
        
              <Button component={Link} href="/" color="inherit">
                Home
              </Button>
              <Button component={Link} href="/chatbot" color="inherit">
                Chatbot
              </Button>
              <Button component={Link} href="/images" color="inherit">
                Images
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Toolbar />
        <Container sx={{ my: 4 }}>{children}</Container>
        <Footer />
      </body>
    </html>
  );
}
