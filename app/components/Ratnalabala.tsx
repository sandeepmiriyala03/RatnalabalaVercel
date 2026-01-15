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
        🌟 రత్నాలబాల – ముఖ్య హైలైట్ పాయింట్లు
      </Typography>

      <Typography
        align="center"
        sx={{ mb: 4, opacity: 0.75, fontSize: "0.95rem" }}
      >
        తెలుగు సాహిత్యం × ఆధునిక సాంకేతికత
      </Typography>




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
        <ListItemText primary="అన్ని శతకాలు / ఒక్కో శతకం సులభంగా ఎంపిక చేసుకునే సౌకర్యం" />
      </ListItem>
      <ListItem>
        <ListItemText primary="పద్యాల సంఖ్య, శతకాల గణాంకాలు స్పష్టంగా చూపింపు" />
      </ListItem>
      <ListItem>
        <ListItemText primary="మొబైల్ & డెస్క్‌టాప్‌కు అనుకూలమైన స్పష్టమైన పఠన అనుభూతి" />
      </ListItem>
      <ListItem>
        <ListItemText primary="తెలుగు సాహిత్యాన్ని ఆధునిక డిజిటల్ రూపంలో అందించే వేదిక" />
      </ListItem>
    </List>

    {/* 🔤 Telugu Fonts Support – inside Module 1 */}
    <Box sx={{ mt: 3 }}>
      <Typography fontWeight={600} sx={{ mb: 1 }}>
        🔤 తెలుగు ఫాంట్లు & ఫాంట్ సైజ్ మద్దతు
      </Typography>

      <List dense>
        <ListItem>
          <ListItemText
            primary="రత్నాలబాల లోని చిత్రమాల మాడ్యూల్‌లో గురజాడ, ఎన్‌టిఆర్, వేటూరి, సిరివెన్నెల, చతుర, రమణీయ, రామరాజ, రవి ప్రకాష్, టానా, తెనాలి రామకృష్ణ, తిమ్మన, పొన్నల వంటి విభిన్న తెలుగు యూనికోడ్ ఫాంట్లు అందుబాటులో ఉన్నాయి."
          />
        </ListItem>

        <ListItem>
          <ListItemText
            primary="వాడుకరి తన అవసరానికి అనుగుణంగా ఫాంట్‌ను ఎంపిక చేసుకోవచ్చు. అలాగే ఫాంట్ సైజ్‌ను కూడా మార్చుకునే సౌకర్యం ఉండటంతో పద్యాలను పఠనానికి అనుకూలంగా, ఆకర్షణీయంగా రూపకల్పన చేయవచ్చు."
          />
        </ListItem>

        <ListItem>
          <ListItemText
            primary="ఈ ఫాంట్లు శ్రీ అప్పాజీ అంబరీష్ దర్భా గారి సృజనాత్మక కృషి ఫలితం. ఆయన డిజిటల్ మీడియా నిపుణుడు, సినిమా నటుడు, అలాగే తెలుగు యూనికోడ్ ఫాంట్ల రూపకర్తగా తెలుగు భాషను డిజిటల్ ప్రపంచానికి చేరువ చేశారు."
          />
        </ListItem>
      </List>
    </Box>

    {/* 🔗 Navigate Button */}
    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
      <Button
        variant="contained"
        onClick={() => router.push("/shatakamu")}
      >
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
              <ListItemText primary="వాడుకరి తానే పద్యం రాయగలిగే సౌకర్యం" />
            </ListItem>
            <ListItem>
              <ListItemText primary="పద్యాన్ని అందమైన పోస్టర్ చిత్రంగా మార్చుకోవచ్చు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="వివిధ తెలుగు ఫాంట్లు & ఫాంట్ సైజ్ మద్దతు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="లైవ్ ప్రీవ్యూ తో చిత్ర రూపం వెంటనే చూడగలగడం" />
            </ListItem>
            <ListItem>
              <ListItemText primary="పోస్టర్‌ను డౌన్‌లోడ్ చేసి పంచుకునే అవకాశం" />
            </ListItem>
          </List>

          {/* 🔗 Navigate Button */}
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
          🔒 PRIVACY
         ========================= */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
            🔒 గోప్యత & విశ్వసనీయత
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="పద్యాలు, చిత్రాలు ఎక్కడా సేవ్ చేయబడవు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="మొత్తం డేటా వాడుకరి డివైస్‌లోనే ఉంటుంది" />
            </ListItem>
            <ListItem>
              <ListItemText primary="మీ గోప్యతే మా మొదటి ప్రాధాన్యత" />
            </ListItem>
          </List>
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
              <ListItemText primary="తెలుగు సాహిత్యానికి AI ఆధారిత డిజిటల్ మద్దతు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="పరిశోధన, అభ్యాసం, భాషాభివృద్ధి లక్ష్యంగా రూపొందింపు" />
            </ListItem>
            <ListItem>
              <ListItemText primary="సంప్రదాయ సాహిత్యాన్ని కొత్త తరం దగ్గరికి తీసుకెళ్లే ప్రయత్నం" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}
