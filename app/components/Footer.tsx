'use client';

import { Box, Container, Typography, useTheme } from "@mui/material";
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

  const formattedDate = dateTime.toLocaleDateString('te-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
        <Typography variant="body2" sx={{ fontWeight: "bold", mt: 2 }}>
          రత్నాలబాల పద్యాలవాల భావాలమాల
        </Typography>

        <Typography variant="body2" sx={{ mt: 1 }}>
          ఈ రోజు: <strong>{formattedDate}</strong>
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
  © {new Date().getFullYear()} మిరియాల కుటుంబం రత్నాలబాల. అన్ని హక్కులు ప్రత్యేకించబడ్డాయి. <br />
  అభివృద్ధి చేసినవారు: సందీప్ మిరియాల
</Typography>

    
      </Container>
    </Box>
  );
}
