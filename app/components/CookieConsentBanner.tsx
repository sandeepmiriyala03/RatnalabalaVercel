"use client";

import { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

const CONSENT_KEY = "cookie_consent"; // "accepted" | "rejected"

export function getCookieConsent(): "accepted" | "rejected" | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if the person hasn't made a choice yet — never
    // re-show once they've accepted or rejected, on this or any
    // future visit, until localStorage is cleared.
    if (getCookieConsent() === null) {
      setVisible(true);
    }
  }, []);

  const choose = (choice: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
    // Reload so any code gating on getCookieConsent() (e.g. the
    // pageview analytics call) picks up the fresh choice immediately,
    // rather than only applying from the next navigation onward.
    window.location.reload();
  };

  if (!visible) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        p: 2,
        borderRadius: 0,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ maxWidth: 900, mx: "auto" }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ఈ వెబ్‌సైట్ కుకీలు వాడుతుంది
          </Typography>
          <Typography variant="caption" color="text.secondary">
            సైట్‌ని మెరుగుపరచడానికి, వాడకాన్ని అర్థం చేసుకోవడానికి కుకీలు ఉపయోగిస్తాము.
            మీ ఫాంట్ ప్రాధాన్యతలు వాడకానికి అవసరమైనవి కాబట్టి ఎప్పుడూ సేవ్ అవుతాయి — దిగువ ఎంపిక
            కేవలం అనలిటిక్స్ కోసమే.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button variant="outlined" size="small" onClick={() => choose("rejected")}>
            తిరస్కరించు
          </Button>
          <Button variant="contained" size="small" onClick={() => choose("accepted")}>
            అన్నీ ఆమోదించు
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}