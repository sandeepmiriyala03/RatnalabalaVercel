"use client";

import Link from "next/link";
import { Box, Button, Typography, Grid, Container } from "@mui/material";

export default function HomePage() {
  const pages = [
    { label: "Poems", href: "/poems" },
    { label: "Chatbot", href: "/chatbot" },
    { label: "Images Gallery", href: "/images" },
    { label: "Music", href: "/music" },
    { label: "Video", href: "/video" },
  ];

  return (
    <Container sx={{ mt: 8, textAlign: "center" }}>
      <Typography variant="h2" gutterBottom>
        Welcome to Ratnalabala
      </Typography>

      <Typography
        variant="body1"
        sx={{
          mb: 4,
          maxWidth: 700,
          mx: "auto",
          lineHeight: 1.7,
        }}
      >
        I’m <strong>Sandeep Miriyala</strong>, creating Ratnalabala—a digital
        project inspired by my grandfather’s 1983 Telugu poems, transformed into
        English, cartoons, and video using AI. <br /><br />
        <strong>Tools Used:</strong> ChatGPT, Suno AI for music.
      </Typography>
    </Container>
  );
}
