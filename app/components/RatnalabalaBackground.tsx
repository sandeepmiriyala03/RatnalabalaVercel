"use client";

import { Container, Card, CardContent, Typography, Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";

const ratnalabalaText = `
మానవజన్మ లభించేక కోరదగిన పురుషార్థాలలో ధర్మం మొదటిది మానవజాతికి ఆదర్శపురుషుడైన శ్రీరామచంద్రుని 'విగ్రహవాన్ ధర్మః' అన్నారు పెద్దలు. ముందుగా ధర్మాన్ని మనం రక్షిస్తే ఆ దర్మమే మనలను రక్షిస్తుంది.

కవియైనవాడు ఆ ధర్మాన్నే నీతిరూపంలో ప్రకటిస్తాడు. లౌకిక మైన ధర్మప్రబోధం చేసే శతకవాఙ్మయం తెలుగులో సమృద్ధిగా ఉంది. శతకకవులు భిన్నభిన్న మార్గాలవలంబించారు. భాస్కర, కుమారి, సుమతి, వేమన శతకాలు బహుళ ప్రచారకలో ఉన్నాయి. సాంఘిక సమస్యలను పరామర్శించడంలో వేమన అగ్రగణ్యుడు. సంఘజీవనంలో శతకాల ప్రభావం అసదృశమైనది. ఈ పద్యాలు సాధారణంగా తేటగీతి, ఆటవెలది, కందం మొదలగు జాతీయమైన సులభచ్ఛందస్సులలో ఉండటం వలన అవి ప్రాథమిక విద్యాదశలోనే కంఠస్థయోగ్యమగుటకు అనుకూలంగా ఉంటాయి. ధూర్జటి, భాస్కరుడు మొదలైనవారు వృత్తాలను వ్రాశారు. దేని అందం దానిది: రానురాను చిన్నచిన్న పధాలతో గంభీర భావగుంఫన చేయటం ఒక సంప్రదాయంగా స్థిరపడింది. అనుదిన సంభాషణలో గూడ ఏదో ఒక పద్యరూపంలో ఉన్న సూక్తిని ఉదాహరిందడం తెలుగువారి కలవాటు: ఇది రచనాసౌలభ్యం మీద ఆధారపడి ఉంటుంది.

నేను మీకు పరిచయంచేస్తున్న ఈ అర్ధశతకంవంటి కృతి నాబాల్యంలో సహాధ్యాయుడైన మిరియాల వెంకటరత్నంగారి రచన : జననం 1909. జన్మస్థలం పిఠాపురం చేరువనేగల విరవాడః (దేవులపల్లి సోదర కవులు కూచిమంచి తిమ్మకవి వంటి కవిశేఖరులు, పిఠాపురం చేరువ గ్రామాల లోనే ఉండేవారు.) మేము ఉభయులం పిఠాపురమందలి రావు చెల్లాయమ్మ రావుగారి ఉన్నత పాఠశాలలో విద్యలభ్యసించాము. తరువాత కవితా సంప్రదాయంలో పెరిగిన మా వెంకటరత్నంగారు సహజంగా కవి అయి ఎన్నో భక్తి శతకాలు వ్రాశారు. కాని ప్రకటించుటకంతగా ఉత్సహించలేదు.

జీవితానుభవాలను ఏకాంతంగా ప్రకటించుకోవడానికి శతకప్రక్రియ ఎంతో ఉపకరిస్తుంది. అందులో వీరికి సులభశైలి అలవడింది. వీరి భావ ప్రకటనలో క్లిష్టత లేదు. తమ శిక్షణలో పెరుగుతున్న విద్యార్ధులకు ధర్మ ప్రబోధం చెయ్యాలని, వారందరు నై తికనిష్ఠగల ఉత్తమ పౌరులుకావాలని ఉపాధ్యాయులకు ఆకాంక్ష ఉండటం సహజం. అందు కనుగుణంగానే ఈ "రత్నాలబాల" పద్యాలలో భావాలు పఠనయోగ్యమై కంఠస్థం చేయటానికి అనుకూలంగా ఉన్నాయి.

చెడ్డవారి చూపుపడితే శిలలే పగులుతాయి. కఠిన వాక్కు వింటే భూదేవి వణుకుతుంది. కాని “మనసు మంచిదైన మకరందములుచిమ్ము” నని 'మనసు' శీర్షికలో అన్నారీయన. 'మన యేవ మనుష్యాణాం కారణం బంధమోక్షయోః' అన్న సూక్తి ధ్వనిస్తోంది ఇందులో.

'రత్నాలబాల' లోని పద్యాలన్నీ 'భావరత్నాలు'గా భాసించాయి. మిరియాల చురుకుదనం లేకుండా మధురశైలిలో నడిచాయి. ఇటువంటి పద్యాలు బాలబాలికలకు పఠనయోగ్యమై వారికి ధర్మానురక్తిని కలిగిస్తాయనటంలో సందేహం లేదు.

కామఋషి సత్యనారాయణవర్మ  
కాకినాడ  
23-3-83
`;

export default function RatnalabalaBackground() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Card
        sx={{
          bgcolor: "var(--surface-elevated)",
          border: "1.5px solid var(--border-strong)",
          borderRadius: "var(--radius)",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            fontWeight={700}
            sx={{ color: "var(--foreground)", fontFamily: "'Noto Serif Telugu', serif" }}
          >
            రత్నభావాలు – భావరత్నాలు
          </Typography>

          <Typography
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              lineHeight: 1.8,
              color: "var(--foreground)",
            }}
          >
            {ratnalabalaText}
          </Typography>

          {/* 🔗 CTA BUTTON — explicitly styled with the brand's primary
              maroon/terracotta. Left as plain variant="contained" this
              renders MUI's own default theme blue, since the site's CSS
              variables don't reach MUI's palette unless a custom
              ThemeProvider is set up (see note below the component). */}
          <Box textAlign="center" sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/poems")}
              sx={{
                bgcolor: "var(--primary)",
                color: "var(--background)",
                fontWeight: 700,
                borderRadius: "999px",
                px: 4,
                "&:hover": { filter: "brightness(1.1)", bgcolor: "var(--primary)" },
                "&:focus-visible": { outline: "3px solid var(--primary)", outlineOffset: "4px" },
              }}
            >
              📖 పద్యాలు చదవండి
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}