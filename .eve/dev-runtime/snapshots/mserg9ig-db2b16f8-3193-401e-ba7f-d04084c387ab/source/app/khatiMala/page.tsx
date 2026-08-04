import { Box, Typography, Chip, Stack, Divider } from "@mui/material";
import KhatiMalaEditor from "@/app/components/KhatiMala";

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        px: { xs: 1, sm: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      {/* ================= HERO ================= */}
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{
            letterSpacing: "-0.5px",
            background: "linear-gradient(90deg, #0f172a, #2563eb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ఖతి మాల
        </Typography>

        <Typography
          sx={{
            mt: 1.5,
            opacity: 0.85,
            maxWidth: 620,
            mx: "auto",
            fontSize: { xs: "0.95rem", md: "1.05rem" },
          }}
        >
          తెలుగు అక్షరాల రాతి శైలులతో —  
          పాఠ్యం రాయండి, భద్రపరచండి, PDF / Word గా పొందండి.
        </Typography>

        {/* FEATURE CHIPS */}
        <Stack
          direction="row"
          spacing={1}
          justifyContent="center"
          flexWrap="wrap"
          sx={{ mt: 2 }}
        >
          <Chip label="💾 Auto Save (Offline)" />
          <Chip label="🔤 50+ తెలుగు ఫాంట్లు" />
          <Chip label="📄 PDF / Word Download" />
          <Chip label="🔒 Privacy First" />
        </Stack>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* ================= HOW TO USE ================= */}
      <Box
        sx={{
          maxWidth: 1000,
          mx: "auto",
          mb: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          ఎలా ఉపయోగించాలి?
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="center"
        >
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>1️⃣ శీర్షిక & పాఠ్యం</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              శీర్షిక ఇవ్వండి, తెలుగు పాఠ్యాన్ని టైప్ చేయండి లేదా పేస్ట్ చేయండి.
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>2️⃣ ఫాంట్ ఎంచుకోండి</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              50+ తెలుగు ఫాంట్లలో మీకు నచ్చిన రాతి శైలిని ఎంపిక చేయండి.
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>3️⃣ సేవ్ & డౌన్‌లోడ్</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              ఆటో సేవ్ జరుగుతుంది. PDF లేదా Word‌గా వెంటనే డౌన్‌లోడ్ చేసుకోండి.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* ================= EDITOR ================= */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          borderRadius: 3,
          bgcolor: "#ffffff",
          boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
          p: { xs: 1, sm: 2 },
        }}
      >
        <KhatiMalaEditor />
      </Box>

      {/* ================= FOOTER NOTE ================= */}
      <Typography
        align="center"
        variant="caption"
        sx={{ mt: 3, opacity: 0.6 }}
      >
        ✨ అన్ని మార్పులు మీ డివైస్‌లోనే భద్రపరచబడతాయి - మేము ఎప్పుడూ మీ డేటాను సర్వర్‌లో నిల్వ చేయము.
      </Typography>
    </Box>
  );
}



