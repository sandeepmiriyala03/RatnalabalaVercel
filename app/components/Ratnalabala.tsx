"use client";
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
import Link from "next/link";
const navItems = [
  {
    label: "రత్నాలబాల",
    path: "/",
    intro: "తెలుగు సాహిత్యానికి సమగ్ర డిజిటల్ వేదిక",
  },
  {
    label: "మిరా",
    path: "/mirapoems",
    intro: "డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారి పద్యాలు",
  },
  {
    label: "పద్యాలవాల",
    path: "/poems",
    intro: " మిరియాల వెంకటరత్నం  గారి పద్యాలు",
  },
  {
    label: "అక్షరమాల",
    path: "/aksharamala",
    intro: "తెలుగు అక్షరాల అభ్యాసం మరియు అన్వేషణ",
  },
  {
    label: "శతకాలమాల",
    path: "/shatakamu",
    intro: "ప్రసిద్ధ తెలుగు శతకాల సేకరణ",
  },
  {
    label: "కథామాల",
    path: "/kathamala",
    intro: "నీతికథలు, చిన్న కథల డిజిటల్ సంగ్రహం",
  },
  {
    label: "సామెతలమాల",
    path: "/sametalu",
    intro: "తెలుగు సామెతలు",
  },
  //
  {
    label: "సంధి మాల",
    path: "/sandhi",
    intro: "తెలుగు సంధిల అన్వేషణ మరియు అభ్యాసం",
  },
  {
    label: "చిత్రమాల",
    path: "/chitramala",
    intro: "పద్యాలను చిత్రాలుగా మార్చే యంత్రం",
  },
  {
    label: "స్వరమాల",
    path: "/swaramala",
    intro: "చదవండి, వినండి – తెలుగు స్వరాల అనుభవం",
  },
  {
    label: "లిపిమాల",
    path: "/lipimala",
    intro: "తెలుగు లిపుల పరిచయం & రూపాంతరం OCR తో",
  },
  {
    label: "ఖతిమాల",
    path: "/khatiMala",
    intro: "50+ తెలుగు ఫాంట్లతో పాఠ్య రచన",
  },
];

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
         రత్నాలబాల -జ్ఞానమాల
      </Typography>

      <Typography
        align="center"
        sx={{ mb: 3, opacity: 0.75, fontSize: "0.95rem" }}
      >
       తెలుగు సాహిత్యానికి సంపూర్ణ సాంకేతిక వేదిక 
      </Typography>

      <Box sx={{ textAlign: "center", mb: 4 }}>
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{ display: "block", lineHeight: 1.7 }}
  >
    రత్నాలబాల · పద్యాలవాల · భావాలమాల · అక్షరమాల · శతకాలమాల · చిత్రమాల · కథామాల · సామెతలమాల · లిపిమాల · ఖతిమాల · స్వరమాల · ధ్వనిమాల · దర్శనమాల · కళామాల
  </Typography>

  <Typography
    variant="caption"
    color="text.secondary"
    sx={{
      fontStyle: "italic",
      display: "block",
      mt: 0.4,
      opacity: 0.8,
    }}
  >
    చదవండి - వినండి - రాయండి - చిత్రీకరించండి - చూడండి - సృష్టించండి - పంచుకోండి - నేర్చుకోండి - అన్వేషించండి - భద్రపరచండి
  </Typography>
</Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
           తెలుగు  అక్షరమాల పద్యం
          </Typography>

          <Typography
            sx={{
              lineHeight: 1.8,
              fontSize: "0.95rem",
              whiteSpace: "pre-line",
            }}
          >
      {`అమిత యశస్క ఆద్యయన ఇద్రుచి ఈశ్వర ఉగ్ర ఊర్జిత
      క్రమ ఋషభాంక ౠజిహర ఌస్తిత ౡస్మిత ఏకరుద్ర ఐం
      ద్రమహిత రూప ఓమితి పదద్యుతి ఔర్వ లలాట అంబికా
      సమరసభావ అఃకలిత వర్ణనుతం బసవేశ పాహిమాం!!`}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontSize: "0.85rem", opacity: 0.7 }}>
            – పాల్కురికి సోమన
          </Typography>
        </CardContent>
      </Card>

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
                  <Stack direction="column" gap={1.5}>
              {navItems.map((item) => (
                <Box
                  key={item.label}
                  component={Link}
                  href={item.path}
                  sx={{
                    textDecoration: "none",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 1.2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "#fff",
                      transform: "translateX(4px)",
                      "& .intro": {
                        color: "rgba(255,255,255,0.85)",
                      },
                    },
                  }}
                >
                  {/* Title */}
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}
                  >
                    {item.label}
                  </Typography>

                  {/* Intro */}
                  <Typography
                    className="intro"
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.2,
                      opacity: 0.75,
                    }}
                  >
                    {item.intro}
                  </Typography>
                </Box>
              ))}
            </Stack>


  

        <Typography fontWeight={800} sx={{ mb: 1 }}>
          మీరు ఇక్కడ చేయగలవి:
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
            "చూడండి",
            "సృష్టించండి"
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
          🔒 మీ గోప్యతే మా మొదటి ప్రాధాన్యత.
        </Typography>
      </Box>

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


      <Card>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 2 }}>
        🤖 సాహిత్యం × సాంకేతికత =  తెలుగు జ్ఞానానికి నూతన సాంకేతిక మార్గం.
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
