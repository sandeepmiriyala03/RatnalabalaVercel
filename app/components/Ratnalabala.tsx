"use client";

import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import { useRouter } from "next/navigation";

export default function RatnalabalaHighlights() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>

      {/* =========================
          🌟 TITLE
         ========================= */}
      <Typography
        align="center"
        fontSize={{ xs: "1.8rem", md: "2.4rem" }}
        fontWeight={900}
        sx={{ mb: 1 }}
      >
         రత్నాలబాల – జ్ఞానమాల
      </Typography>

      <Typography
        align="center"
        sx={{ mb: 3, opacity: 0.75, fontSize: "0.95rem" }}
      >
        తెలుగు సాహిత్యం × ఆధునిక సాంకేతికత
      </Typography>

      {/* =========================
          📚 MODULES + ACTIONS (NEW)
         ========================= */}
      <Box
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 4,
          borderRadius: 3,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e5e7eb",
        }}
      >
        <Typography fontWeight={800} sx={{ mb: 1 }}>
          📚 అందుబాటులో ఉన్న మాలలు
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          {[
            "రత్నాలబాల",
            "పద్యాలవాల",
            "భావాలమాల",
            "అక్షరమాల",
            "శతకాలమాల",
            "చిత్రమాల",
            "కథామాల",
            "సామెతలమాల",
            "లిపిమాల",
            "ఖతిమాల",
            "స్వరమాల",
          ].map((item) => (
            <Chip key={item} label={item} variant="outlined" />
          ))}
        </Stack>

        <Typography fontWeight={800} sx={{ mb: 1 }}>
          ✨ మీరు ఇక్కడ చేయగలవి
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {[
            "చదవండి",
            "వినండి",
            "రాయండి",
            "చిత్రీకరించండి",
            "పంచుకోండి",
            "నేర్చుకోండి",
            "అన్వేషించండి",
            "భద్రపరచండి",
          ].map((action) => (
            <Chip key={action} color="secondary" label={action} />
          ))}
        </Stack>

        <Typography
          sx={{
            mt: 2,
            fontSize: "0.8rem",
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          🔒 మీ గోప్యతే మా మొదటి ప్రాధాన్యత
        </Typography>
      </Box>

      {/* =========================
          📚 MODULE 1
         ========================= */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            📚 మాడ్యూల్ 1: శతకాలమాల
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="తెలుగు శతకాలను ఒకే వేదికపై సమగ్రంగా చదవచ్చు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="అన్ని శతకాలు / ఒక్కో శతకం సులభంగా ఎంపిక" />
            </ListItem>
            <ListItem>
              <ListItemText primary="పద్యాల సంఖ్య, గణాంకాలు స్పష్టంగా చూపింపు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="మొబైల్ & డెస్క్‌టాప్‌కు అనుకూల UI" />
            </ListItem>
          </List>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => router.push("/shatakamu")}>
              శతకాలమాల చూడండి →
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* =========================
          🎨 MODULE 2
         ========================= */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            🎨 మాడ్యూల్ 2: చిత్రమాల – పద్య యంత్రం
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="వాడుకరి తానే పద్యం రాయగలడు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="పద్యాన్ని పోస్టర్ చిత్రంగా మార్చుకోవచ్చు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="లైవ్ ప్రీవ్యూ & డౌన్‌లోడ్" />
            </ListItem>
          </List>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => router.push("/chitramala")}
            >
              చిత్రమాల ప్రారంభించండి →
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* =========================
          🧠 BHAVAMALA
         ========================= */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            🧠 భావాలమాల – పద్య అన్వేషణ
          </Typography>

          <Typography sx={{ mb: 2, fontSize: "0.95rem" }}>
            భావం, పదం లేదా సంఖ్య ఆధారంగా సరైన పద్యాన్ని
            వెంటనే కనుగొనే తెలివైన సహాయకుడు.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontSize: "0.9rem" }}>
            jan 10 • సుమతి 5 • దయ • 1
          </Typography>
        </CardContent>
      </Card>

      {/* =========================
          🤖 AI NOTE
         ========================= */}
      <Card>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            🤖 సాహిత్యం × సాంకేతికత
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="AI ఆధారిత తెలుగు సాహిత్య వేదిక" />
            </ListItem>
            <ListItem>
              <ListItemText primary="పరిశోధన & అభ్యాసానికి అనుకూలంగా రూపకల్పన" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}
