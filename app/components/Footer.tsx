'use client';

import { Box, Container, Typography, useTheme, Divider } from "@mui/material";
import { useEffect, useState } from "react";

export default function Footer() {
  const theme = useTheme();
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
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
        py: 3,
        px: 2,
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
        textAlign: "center",
        borderRadius: "8px",
      }}
    >
      <Container maxWidth="sm">
        {/* Title */}
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          రత్నాలబాల – పద్యాలవాల • భావాలమాల
        </Typography>

        {/* Tagline */}
        <Typography
          variant="body2"
          sx={{ mt: 0.5, fontStyle: "italic" }}
          color="text.secondary"
        >
          చదవండి • వినండి • పంచుకోండి
        </Typography>

        {/* Date */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          ఈ రోజు: <strong>{formattedDate}</strong>
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Credits */}
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} మిరియాల కుటుంబం – రత్నాలబాల  
          <br />
          అన్ని హక్కులు ప్రత్యేకించబడ్డాయి
        </Typography>

        <Typography
          variant="body2"
          sx={{ mt: 1, fontWeight: 500 }}
          color="text.secondary"
        >
          అభివృద్ధి & రూపకల్పన: సందీప్ మిరియాల  
          <br />
          యుక్తిశాల AI
        </Typography>
      </Container>
    </Box>
  );
}
