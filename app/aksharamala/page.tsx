"use client";
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
                           variant="h3"
                           fontWeight={800}
                           sx={{
                             letterSpacing: "-0.5px",
                             background: "linear-gradient(90deg, #0f172a, #2563eb)",
                             WebkitBackgroundClip: "text",
                             WebkitTextFillColor: "transparent", 
                               fontWeight: 700,
                         fontSize: "calc(var(--telugu-font-size) * 1.8)" ,
                            textAlign: "center",  
                           }}>
          అక్షరమాల 
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
