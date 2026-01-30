import { Box, Typography } from "@mui/material";
import KhatiMalaEditor from "@/app/components/KhatiMala";

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fafafa",
        px: { xs: 1, sm: 2, md: 4 },
        py: 3,
      }}
    >
      {/* 🔰 PAGE HEADER */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          ఖతి మాల
        </Typography>

        <Typography sx={{ mt: 1, opacity: 0.7 }}>
          తెలుగు అక్షరాల రాతి శైలిని ఎంచుకుని పాఠ్యం రూపొందించండి
        </Typography>
      </Box>

      {/* 🧩 MAIN COMPONENT */}
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <KhatiMalaEditor />
      </Box>
    </Box>
  );
}
