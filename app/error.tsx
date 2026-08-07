"use client";
// app/error.tsx
//
// SITE-WIDE error boundary — Next.js automatically wraps EVERY route
// under app/ with this, per Next.js App Router convention. If ANY
// page throws a JS error during render, this shows instead of a
// blank/broken page.
//
// IMPORTANT LIMITATION: this catches JavaScript errors only. A true
// browser "Out of Memory" crash (the "Aw, Snap!" screen) kills the
// tab at the OS/browser level BEFORE any JS — including this file —
// can run. Nothing in Next.js can intercept that specific crash type.
// This page protects against everything else: failed fetches that
// throw, broken component logic, null reference errors, etc.

import { useEffect } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logs to Vercel's function/runtime logs — same place we checked
    // via `vercel logs` throughout today's debugging.
    console.error("[Site Error Boundary]", error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 3,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />

      <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
        క్షమించండి, ఏదో తప్పు జరిగింది
      </Typography>

      <Typography sx={{ opacity: 0.75, mb: 3, maxWidth: 480 }}>
        ఈ పేజీ లోడ్ అవ్వడంలో సమస్య వచ్చింది. దయచేసి మళ్ళీ ప్రయత్నించండి,
        లేదా హోమ్‌పేజీకి తిరిగి వెళ్ళండి.
      </Typography>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => reset()}
        >
          మళ్ళీ ప్రయత్నించండి
        </Button>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          href="/"
        >
          హోమ్‌పేజీకి వెళ్ళండి
        </Button>
      </Stack>

      {process.env.NODE_ENV === "development" && (
        <Typography
          variant="caption"
          sx={{ mt: 3, opacity: 0.5, fontFamily: "monospace", maxWidth: 600 }}
        >
          {error.message}
        </Typography>
      )}
    </Box>
  );
}