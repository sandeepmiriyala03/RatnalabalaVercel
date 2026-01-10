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

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60000); // ⏱ minute update is enough for footer
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
        py: 1.5,          // ⬇️ reduced height
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
        {/* Identity */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          రత్నాలబాల • పద్యాలవాల • భావాలమాల • శతకాలమాల • చిత్రమాల
        </Typography>

        {/* Tagline */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontStyle: "italic", display: "block", mt: 0.3 }}
        >
          చదవండి • వినండి • రాయండి • చిత్రీకరించండి • పంచుకోండి
        </Typography>

        <Divider sx={{ my: 0.8 }} />

        {/* Credits + Date */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          © {new Date().getFullYear()} సందీప్ మిరియాల — యుక్తిశాల AI
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.2 }}
        >
          🔒 గోప్యత మొదటి ప్రాధాన్యత • {formattedDate}
        </Typography>
      </Container>
    </Box>
  );
}
