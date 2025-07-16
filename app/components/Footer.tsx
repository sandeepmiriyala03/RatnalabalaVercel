"use client";

import { Box, Typography, Link } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
        mt: 8,
        py: 3,
        borderTop: "1px solid #ddd",
        textAlign: "center",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: "bold", mt: 2 }}>

        శ్రీ మిరియాల వెంకటరత్నం<br />
        రత్నాల బాల పద్యాలవాల భావాల మాల
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        © {new Date().getFullYear()} MIRIYALA Family Ratnalabala. All rights reserved.
      </Typography>

      <Typography variant="body2" sx={{ mt: 1 }}>
        Contact us at:{" "}
        <Link href="mailto:sandeep@example.com">sandeep@example.com</Link>
      </Typography>
    </Box>
  );
}
