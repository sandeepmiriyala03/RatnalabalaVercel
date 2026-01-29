"use client";

import React from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
} from "@mui/material";

import AksharamalaParent from "@/app/components/Aksharamal";

/* ================= PAGE ================= */

export default function AksharamalaPage() {
  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        p: 2,
      }}
    >
      {/* 🌼 TITLE */}
      <Typography
        align="center"
        fontSize={{ xs: "1.8rem", sm: "2.2rem" }}
        fontWeight={900}
      >
        🌸 తెలుగు అక్షరమాల 🌸
      </Typography>

      <Typography
        align="center"
        sx={{ opacity: 0.85, mb: 2 }}
      >
        వినండి • చదవండి • నేర్చుకోండి
      </Typography>

      {/* 🧠 SIMPLE INFO */}
      <Stack direction="row" spacing={1} justifyContent="center" mb={2}>
        <Chip label="👶 పిల్లల కోసం" />
        <Chip label="🔊 వినే అవకాశం" />
        <Chip label="📱 సులభం" />
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* 📜 MAIN CONTENT */}
      <AksharamalaParent />
    </Box>
  );
}
