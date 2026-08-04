"use client";

import {
  Box,
  Typography,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from "@mui/material";
import { useState } from "react";

// --- Language-specific Content Constants ---
const teluguIntro = `
మానవజన్మ లభించేక కోరదగిన పురుషార్థాలలో ధర్మం మొదటిది మానవజాతికి ఆదర్శపురుషుడైన శ్రీరామచంద్రుని 'విగ్రహవాన్ ధర్మః' అన్నారు పెద్దలు. ముందుగా ధర్మాన్ని మనం రక్షిస్తే ఆ దర్మమే మనలను రక్షిస్తుంది.

కవియైనవాడు ఆ ధర్మాన్నే నీతిరూపంలో ప్రకటిస్తాడు. లౌకిక మైన ధర్మప్రబోధం చేసే శతకవాఙ్మయం తెలుగులో సమృద్ధిగా ఉంది. శతకకవులు భిన్నభిన్న మార్గాలవలంబించారు. భాస్కర, కుమారి, సుమతి, వేమన శతకాలు బహుళ ప్రచారకలో ఉన్నాయి. సాంఘిక సమస్యలను పరామర్శించడంలో వేమన అగ్రగణ్యుడు. సంఘజీవనంలో శతకాల ప్రభావం అసదృశమైనది. ఈ పద్యాలు సాధారణంగా తేటగీతి, ఆటవెలది, కందం మొదలగు జాతీయమైన సులభచ్ఛందస్సులలో ఉండటం వలన అవి ప్రాథమిక విద్యాదశలోనే కంఠస్థయోగ్యమగుటకు అనుకూలంగా ఉంటాయి. ధూర్జటి, భాస్కరుడు మొదలైనవారు వృత్తాలను వ్రాశారు. దేని అందం దానిది: రానురాను చిన్నచిన్న పధాలతో గంభీర భావగుంఫన చేయటం ఒక సంప్రదాయంగా స్థిరపడింది. అనుదిన సంభాషణలో గూడ ఏదో ఒక పద్యరూపంలో ఉన్న సూక్తిని ఉదాహరిందడం తెలుగువారి కలవాటు: ఇది రచనాసౌలభ్యం మీద ఆధారపడి ఉంటుంది.

నేను మీకు పరిచయంచేస్తున్న ఈ అర్ధశతకంవంటి కృతి నాబాల్యంలో సహాధ్యాయుడైన మిరియాల వెంకటరత్నంగారి రచన : జననం 1909. జన్మస్థలం పిఠాపురం చేరువనేగల విరవాడః (దేవులపల్లి సోదర కవులు కూచిమంచి తిమ్మకవి వంటి కవిశేఖరులు, పిఠాపురం చేరువ గ్రామాల లోనే ఉండేవారు.) మేము ఉభయులం పిఠాపురమందలి రావు చెల్లాయమ్మ

రావుగారి ఉన్నత పాఠశాలలో విద్యలభ్యసించాము. తరువాత కవితా సంప్రదాయంలో పెరిగిన మా వెంకటరత్నంగారు సహజంగా కవి అయి ఎన్నో భక్తి శతకాలు వ్రాశారు. కాని ప్రకటించుటకంతగా ఉత్సహించలేదు.

జీవితానుభవాలను ఏకాంతంగా ప్రకటించుకోవడానికి శతకప్రక్రియ ఎంతో ఉపకరిస్తుంది. అందులో వీరికి సులభశైలి అలవడింది. వీరి భావ ప్రకటనలో క్లిష్టత లేదు. తమ శిక్షణలో పెరుగుతున్న విద్యార్ధులకు ధర్మ ప్రబోధం చెయ్యాలని, వారందరు నై తికనిష్ఠగల ఉత్తమ పౌరులుకావాలని ఉపాధ్యాయులకు ఆకాంక్ష ఉండటం సహజం. అందు కనుగుణంగానే ఈ " ర త్నా ల బా ల ” పద్యాలలో భావాలు పఠనయోగ్యమై కంఠస్థం చేయటానికి అనుకూలంగా ఉన్నాయి.

చెడ్డవారి చూపుపడితే. శిలలే పగులుతాయి. కఠిన వాక్కు వింటే భూదేవి వణుకుతుంది. కాని “మనసు మంచిదైన మకరందములుచిమ్ము” నని 'మనసు' శీర్షికలో అన్నారీయన. 'మన యేవ మనుష్యాణాం కార ణం బంధమోక్షయోః' అన్న సూక్తి ధ్వనిస్తోంది ఇందులో.

'రత్నాల బాల' లోని పద్యాలన్నీ 'భావరత్నాలు'గా భాసించాయి. మిరియాల చురుకుదనం లేకుండా మధురశైలిలో నడిచాయి. ఇటువంటి పద్యాలు బాలబాలికలకు పఠనయోగ్యమై వారికి ధర్మానురక్తిని కలిగిస్తా యనటంలో సందేహం లేదు.

కామఋషి సత్యనారాయణవర్మ

కాకి నా డ

23-3-83

`;

const englishIntro = `Among the efforts that are desirable before taking human birth, Dharma is the first. Elders have said that Dharma is the ideal man for mankind, Sri Rama Chandra. If we protect Dharma first, that Dharma will protect us.

A poet proclaims that Dharma in the form of righteousness. Telugu is rich in Shatakavamya that preaches secular Dharma. Shatakavam poets have adopted different methods. Bhaskara, Kumari, Sumathi, and Vemana Shatakas are in multiple circulations. Vemana is the foremost in discussing social problems. The influence of Shatakas on social life is unparalleled. Since these poems are generally in national easy rhymes like Tetageethi, Aateveladi, Kandam, etc., they are suitable for memorization at the primary education level. Dhurjati, Bhaskara etc. have written poems. The beauty of it is this: It has become a tradition to express serious feelings in small verses. It is the custom of the Telugu people to cite some verse in their daily conversations: it depends on the ease of writing.

This half-century-old work that I am introducing to you is the work of Miriyala Venkataratnanga, a classmate in my childhood: Born in 1909. Birthplace: Pithapuram Cheruvanegala Viravada (Kavishekaras like Devulapalli brother poets Kuchimanchi Thimmakavi, lived in villages near Pithapuram.) We both studied at Pithapuramandali Rao Chellayamma

Rao's high school. Later, our Venkataratnamgaru, who grew up in the tradition of poetry, became a natural poet and wrote many devotional satakas. But he was not enthusiastic enough to preach.

The sataka process is very useful for privately expressing life experiences. He has developed an easy style in it. There is no difficulty in expressing his feelings. It is natural for teachers to have a desire to preach Dharma to the students growing up under their training and for them all to become good citizens with moral integrity. Therefore, the feelings in these "Ratna La Ba La" poems are readable and suitable for memorization.

When the eyes of the wicked appear, rocks break. When harsh words are heard, the earth trembles. But "May the mind exude nectar that is good," as Ariyana added in the title of 'Manasu'. The saying 'Mana yeva manushyanam karanam bandhamokshayoh' is heard in it.

All the verses in 'Ratnala Bala' are like 'Bhavratnalu'. They are sung in a sweet style without any piquantness. There is no doubt that such poems are suitable for children and will make them religious.

Kamarishi Satyanarayanavarma

KakiNaDa

23-3-83`;

// Headings for the dedication page
const teluguHeading = "రత్నభావాలు - భావరత్నాలు";
const englishHeading = "Ratnabhavalu - Bhavaratnalu";

// --- HomePage Component ---
export default function AboutAuthor() {
  const [lang, setLang] = useState<"te" | "en">("te");

  // All speech-related state, effects, and functions have been removed.

  return (
    <Container sx={{ mt: 6 }}>
      {/* --- Language Toggle --- */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_, newLang) => {
            if (newLang) {
              setLang(newLang);
            }
          }}
          aria-label="language selection"
        >
          <ToggleButton value="te" aria-label="Telugu">తెలుగు</ToggleButton>
          <ToggleButton value="en" aria-label="English">English</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* --- Main Content Card (Heading and Intro Text) --- */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {lang === "te" ? teluguHeading : englishHeading}
        </Typography>

        <CardContent>
          <Typography variant="h6" sx={{ whiteSpace: "pre-line", textAlign: "center" }}>
            {lang === "te" ? teluguIntro : englishIntro}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}