"use client";

import {
  Box,
  Container,
  Typography,
  Divider,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function Footer() {
  const theme = useTheme();
  const [dateTime, setDateTime] = useState(new Date());
  const [views, setViews] = useState<number | null>(null);

  /* 📊 Increment + Fetch analytics */
useEffect(() => {
  const loadViews = async () => {
    try {
      // increment counter
      await fetch("/api/pageview", { method: "POST" });

      // fetch updated value
      const res = await fetch("/api/pageview");
      const data = await res.json();

      if (typeof data.views === "number") {
        setViews(data.views);
      } else {
        setViews(null); // API error case
      }
    } catch {
      setViews(null);
    }
  };

  loadViews();
}, []);


  /* ⏱ Date update */
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = dateTime.toLocaleDateString("te-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 1.5,
        px: 1,
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[50]
            : theme.palette.grey[900],
        borderTop: "1px solid",
        borderColor: "divider",
        textAlign: "center",
        fontSize: "0.8rem",
      }}
    >
      <Container maxWidth="md">
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
         రత్నాలబాల · పద్యాలవాల · భావాలమాల · అక్షరమాల · శతకాలమాల · చిత్రమాల · కథామాల · సామెతలమాల · లిపిమాల · ఖతిమాల · స్వరమాల · ధ్వనిమాల · దర్శనమాల · కళామాల
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontStyle: "italic", display: "block", mt: 0.3 }}
        >
         చదవండి - వినండి - రాయండి - చిత్రీకరించండి - చూడండి - సృష్టించండి - పంచుకోండి - నేర్చుకోండి - అన్వేషించండి - భద్రపరచండి      </Typography>

        <Divider sx={{ my: 0.8 }} />

        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          © {new Date().getFullYear()} — యుక్తిశాల AI
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.2 }}
        >
          👁️ మొత్తం సందర్శనలు:{" "}
          {views !== null ? views.toLocaleString("te-IN") : "…"}
          {" • "}
          🔒 గోప్యత మొదటి ప్రాధాన్యత • {formattedDate}
        </Typography>
      </Container>
    </Box>
  );
}
