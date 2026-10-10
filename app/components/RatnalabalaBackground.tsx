"use client";

/* ═══════════════════════════════════════════════════════════════
   మా కవులు — 1. మిరియాల వెంకటరత్నం గారు (రత్నాలబాల)

   ముందు: పేరు, ఒక ముఖ్య వాక్యం, 3 చిన్న విషయాలు, బటన్లు — ఒక్క చూపులో
   "ముందుమాట చదవండి" నొక్కితే: కామఋషి సత్యనారాయణవర్మ గారి పూర్తి ముందుమాట
   (పాఠ్యం మార్చలేదు — అసలు ప్రతిలో ఉన్నట్టే)
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Link from "next/link";
import { Box, Button, Chip, Collapse, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

const PREFACE = [
  "మానవజన్మ లభించేక కోరదగిన పురుషార్థాలలో ధర్మం మొదటిది మానవజాతికి ఆదర్శపురుషుడైన శ్రీరామచంద్రుని 'విగ్రహవాన్ ధర్మః' అన్నారు పెద్దలు. ముందుగా ధర్మాన్ని మనం రక్షిస్తే ఆ దర్మమే మనలను రక్షిస్తుంది.",
  "కవియైనవాడు ఆ ధర్మాన్నే నీతిరూపంలో ప్రకటిస్తాడు. లౌకిక మైన ధర్మప్రబోధం చేసే శతకవాఙ్మయం తెలుగులో సమృద్ధిగా ఉంది. శతకకవులు భిన్నభిన్న మార్గాలవలంబించారు. భాస్కర, కుమారి, సుమతి, వేమన శతకాలు బహుళ ప్రచారకలో ఉన్నాయి. సాంఘిక సమస్యలను పరామర్శించడంలో వేమన అగ్రగణ్యుడు. సంఘజీవనంలో శతకాల ప్రభావం అసదృశమైనది. ఈ పద్యాలు సాధారణంగా తేటగీతి, ఆటవెలది, కందం మొదలగు జాతీయమైన సులభచ్ఛందస్సులలో ఉండటం వలన అవి ప్రాథమిక విద్యాదశలోనే కంఠస్థయోగ్యమగుటకు అనుకూలంగా ఉంటాయి. ధూర్జటి, భాస్కరుడు మొదలైనవారు వృత్తాలను వ్రాశారు. దేని అందం దానిది: రానురాను చిన్నచిన్న పధాలతో గంభీర భావగుంఫన చేయటం ఒక సంప్రదాయంగా స్థిరపడింది. అనుదిన సంభాషణలో గూడ ఏదో ఒక పద్యరూపంలో ఉన్న సూక్తిని ఉదాహరిందడం తెలుగువారి కలవాటు: ఇది రచనాసౌలభ్యం మీద ఆధారపడి ఉంటుంది.",
  "నేను మీకు పరిచయంచేస్తున్న ఈ అర్ధశతకంవంటి కృతి నాబాల్యంలో సహాధ్యాయుడైన మిరియాల వెంకటరత్నంగారి రచన : జననం 1909. జన్మస్థలం పిఠాపురం చేరువనేగల విరవాడః (దేవులపల్లి సోదర కవులు కూచిమంచి తిమ్మకవి వంటి కవిశేఖరులు, పిఠాపురం చేరువ గ్రామాల లోనే ఉండేవారు.) మేము ఉభయులం పిఠాపురమందలి రావు చెల్లాయమ్మ రావుగారి ఉన్నత పాఠశాలలో విద్యలభ్యసించాము. తరువాత కవితా సంప్రదాయంలో పెరిగిన మా వెంకటరత్నంగారు సహజంగా కవి అయి ఎన్నో భక్తి శతకాలు వ్రాశారు. కాని ప్రకటించుటకంతగా ఉత్సహించలేదు.",
  "జీవితానుభవాలను ఏకాంతంగా ప్రకటించుకోవడానికి శతకప్రక్రియ ఎంతో ఉపకరిస్తుంది. అందులో వీరికి సులభశైలి అలవడింది. వీరి భావ ప్రకటనలో క్లిష్టత లేదు. తమ శిక్షణలో పెరుగుతున్న విద్యార్ధులకు ధర్మ ప్రబోధం చెయ్యాలని, వారందరు నై తికనిష్ఠగల ఉత్తమ పౌరులుకావాలని ఉపాధ్యాయులకు ఆకాంక్ష ఉండటం సహజం. అందు కనుగుణంగానే ఈ \"రత్నాలబాల\" పద్యాలలో భావాలు పఠనయోగ్యమై కంఠస్థం చేయటానికి అనుకూలంగా ఉన్నాయి.",
  "చెడ్డవారి చూపుపడితే శిలలే పగులుతాయి. కఠిన వాక్కు వింటే భూదేవి వణుకుతుంది. కాని “మనసు మంచిదైన మకరందములుచిమ్ము” నని 'మనసు' శీర్షికలో అన్నారీయన. 'మన యేవ మనుష్యాణాం కారణం బంధమోక్షయోః' అన్న సూక్తి ధ్వనిస్తోంది ఇందులో.",
  "'రత్నాలబాల' లోని పద్యాలన్నీ 'భావరత్నాలు'గా భాసించాయి. మిరియాల చురుకుదనం లేకుండా మధురశైలిలో నడిచాయి. ఇటువంటి పద్యాలు బాలబాలికలకు పఠనయోగ్యమై వారికి ధర్మానురక్తిని కలిగిస్తాయనటంలో సందేహం లేదు.",
];

const ACCENT = "var(--primary)";

export default function RatnalabalaBackground() {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="article"
      aria-labelledby="poet-ratnam"
      sx={{
        height: "100%",
                    boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: "var(--radius)",
        bgcolor: "var(--surface-elevated)",
        border: "1.5px solid var(--border-strong)",
        borderTop: `5px solid ${ACCENT}`,
        boxShadow: "0 6px 24px color-mix(in srgb, var(--foreground) 10%, transparent)",
      }}
    >
      {/* name row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box
          aria-hidden
          sx={{ width: 68, height: 68, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: ACCENT, color: "var(--background)", fontWeight: 800, fontSize: "1.6rem", border: "3px solid var(--accent-light)" }}
        >
          వెం
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography id="poet-ratnam" component="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.3rem", sm: "1.45rem" }, lineHeight: 1.4 }}>
            మిరియాల వెంకటరత్నం గారు
          </Typography>
          <Typography sx={{ fontSize: "1.02rem", color: "var(--muted-text)" }}>రత్నాలబాల కవి · 1909, విరవాడ</Typography>
        </Box>
      </Stack>

      {/* key line */}
      <Box component="blockquote" sx={{ m: 0, mb: 2, pl: 2, borderLeft: `4px solid var(--accent-light)` }}>
        <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.7 }}>“మనసు మంచిదైన మకరందములుచిమ్ము”</Typography>
        <Typography sx={{ fontSize: "1rem", color: "var(--muted-text)" }}>— &lsquo;మనసు&rsquo; పద్యం నుంచి</Typography>
      </Box>

      <Typography sx={{ fontSize: "1.08rem", lineHeight: 1.9, mb: 2 }}>
        ఉపాధ్యాయుడు, భక్తి శతకాల కవి. పిల్లలు సులువుగా కంఠస్థం చేసేలా, ధర్మం, నీతి నేర్పే <strong>&lsquo;రత్నాలబాల&rsquo;</strong> పద్యాలు రాశారు — &lsquo;భావరత్నాలు&rsquo;.
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
        {["34 పద్యాలు", "సులభ శైలి", "పిల్లలకు, పెద్దలకు"].map((t) => (
          <Chip key={t} label={t} sx={{ fontSize: "0.98rem", fontWeight: 700, height: 36, bgcolor: "var(--surface)", border: "1px solid var(--border-strong)" }} />
        ))}
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <Button
          component={Link}
          href="/poems"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            minHeight: 52,
            px: 2.75,
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            bgcolor: ACCENT,
            color: "var(--background)",
            "&:hover": { bgcolor: ACCENT, filter: "brightness(1.1)" },
            "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: "3px" },
          }}
        >
          📖 పద్యాలు చదవండి
        </Button>
        <Button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="ratnam-preface"
          endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          sx={{
            minHeight: 52,
            px: 2.5,
            borderRadius: "999px",
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.05rem",
            color: ACCENT,
            border: `1.5px solid ${ACCENT}`,
            "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: "3px" },
          }}
        >
          {open ? "ముందుమాట మూసివేయి" : "ముందుమాట చదవండి"}
        </Button>
      </Stack>

      <Collapse in={open} timeout={200} unmountOnExit>
        <Box id="ratnam-preface" component="section" aria-label="రత్నభావాలు – భావరత్నాలు (ముందుమాట)" sx={{ mt: 3, pt: 2.5, borderTop: "1.5px dashed var(--border-strong)" }}>
          <Typography component="h4" sx={{ fontWeight: 800, fontSize: "1.25rem", mb: 1.5 }}>
            రత్నభావాలు – భావరత్నాలు
          </Typography>
          {PREFACE.map((p) => (
            <Typography key={p.slice(0, 24)} sx={{ fontSize: "1.08rem", lineHeight: 2, mb: 1.75 }}>
              {p}
            </Typography>
          ))}
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, textAlign: "right", lineHeight: 1.8 }}>
            కామఋషి సత్యనారాయణవర్మ
            <Box component="span" sx={{ display: "block", fontWeight: 600, color: "var(--muted-text)" }}>
              కాకినాడ · 23-3-83
            </Box>
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}