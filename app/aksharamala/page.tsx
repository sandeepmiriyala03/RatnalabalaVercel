"use client";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
// ఒకే icon library — @mui/icons-material
import { ExpandMore as ExpandMoreIcon } from "@/lib/yuktai-icons";
import { VolumeUp as VolumeUpIcon } from "@/lib/yuktai-icons";
import { Edit as EditIcon } from "@/lib/yuktai-icons";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { MenuBook as MenuBookIcon } from "@/lib/yuktai-icons";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import { Mic as MicIcon } from "@/lib/yuktai-icons";
import { TableRowsRounded as TableRowsRoundedIcon } from "@/lib/yuktai-icons";
import { SearchRounded as SearchRoundedIcon } from "@/lib/yuktai-icons";
import { RecordVoiceOverRounded as RecordVoiceOverRoundedIcon } from "@/lib/yuktai-icons";
import { AutoAwesomeRounded as AutoAwesomeRoundedIcon } from "@/lib/yuktai-icons";

import AksharamalaParent from "@/app/components/Aksharamal";

/* ================= HELP ITEMS ================= */

type HelpItem = {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  highlight?: boolean;
};

const iconSx = { mt: 0.3 } as const;

const helpItems: HelpItem[] = [
  {
    icon: <SearchRoundedIcon color="primary" fontSize="small" sx={iconSx} />,
    title: "వెతకడం",
    body: (
      <>
        పైన ఉన్న సెర్చ్ బాక్స్‌లో ఏదైనా అక్షరం లేదా పదం టైప్ చేయండి. ఉదాహరణకు &quot;ఎలుక&quot; అని టైప్ చేస్తే,
        ఆ పదానికి సంబంధించిన అక్షరం కనిపిస్తుంది. ఆ పదం ఉన్న సామెతలు కూడా కింద కనిపిస్తాయి.
      </>
    ),
  },
  {
    icon: <TouchAppIcon color="primary" fontSize="small" sx={iconSx} />,
    title: "వర్గం ఎంచుకోవడం",
    body: (
      <>
        &quot;అచ్చులు&quot; లేదా &quot;హల్లులు&quot; బటన్ నొక్కితే ఆ వర్గం అక్షరాలు మాత్రమే కనిపిస్తాయి.
        &quot;అన్నీ&quot; నొక్కితే మళ్ళీ అన్ని అక్షరాలు కనిపిస్తాయి.
      </>
    ),
  },
  {
    icon: <VolumeUpIcon color="primary" fontSize="small" sx={iconSx} />,
    title: "వినడం",
    body: (
      <>
        ప్రతి అక్షరం కార్డ్‌లో ఉన్న 🔊 బటన్ నొక్కితే, ఆ అక్షరం, దాని పదం బిగ్గరగా వినిపిస్తాయి. ఆపాలంటే పక్కనే
        ఉన్న ఎరుపు బటన్ నొక్కండి.
        <br />• పైన &quot;🔊 స్వరం&quot; దగ్గర <strong>మగ స్వరం</strong> లేదా <strong>స్త్రీ స్వరం</strong> ఎంచుకోండి.
        <br />• ఒకసారి ఒక్క స్వరమే వినిపిస్తుంది — కొత్తది నొక్కితే పాతది ఆగుతుంది.
        <br />• ఇంటర్నెట్ నెమ్మదిగా ఉంటే మీ ఫోన్ / కంప్యూటర్‌లోని తెలుగు స్వరం వినిపిస్తుంది. అదీ లేకపోతే
        పేజీ పైన తెలుగులో సందేశం వస్తుంది.
      </>
    ),
  },
  {
    icon: <RecordVoiceOverRoundedIcon color="primary" fontSize="small" sx={iconSx} />,
    title: "మీ గొంతుతో (కుటుంబ గొంతు)",
    body: (
      <>
        &quot;మీ గొంతుతో రికార్డ్ చేయండి&quot; నొక్కి, అమ్మ, నాన్న, తాతయ్య, అమ్మమ్మ గొంతుతో అక్షరాలు రికార్డ్
        చేయండి. తర్వాత &quot;🔊 స్వరం&quot; దగ్గర 🏠 ఎంచుకుంటే, పిల్లలు ఆ గొంతుతోనే వింటారు.
        <br />• రికార్డింగ్‌లు ఈ పరికరంలోనే ఉంటాయి — ఎక్కడికీ పంపబడవు.
        <br />• రికార్డ్ చేయని అక్షరాలు, AI పదాలు కంప్యూటర్ స్వరంలో వినిపిస్తాయి.
      </>
    ),
  },
  {
    icon: <MicIcon color="primary" fontSize="small" sx={iconSx} />,
    title: "పలకడం ప్రాక్టీస్",
    body: (
      <>
        🎤 బటన్ నొక్కి ఆ పదాన్ని చెప్పండి. పదం కింద ఉన్న అక్షరాలు 🟢 (సరిగ్గా చెప్పారు) లేదా 🔴 (మళ్ళీ
        ప్రయత్నించండి) గా మారుతాయి — ఏ అక్షరం సరిచేయాలో సులభంగా తెలుస్తుంది. మీరు చెప్పింది ఏమని
        వినిపించిందో కూడా కింద కనిపిస్తుంది.
        <br />• Chrome, Edge బ్రౌజర్‌లలో బాగా పనిచేస్తుంది. మొదటిసారి మైక్ అనుమతి అడిగితే &quot;Allow&quot;
        నొక్కండి.
      </>
    ),
  },
  {
    icon: <EditIcon color="primary" fontSize="small" sx={iconSx} />,
    title: "రాయడం నేర్చుకోవడం",
    body: (
      <>
        &quot;రాయండి&quot; బటన్ నొక్కి, బూడిద రంగు అక్షరం మీద వేలితో లేదా మౌస్‌తో రాయండి. పదం కింద ఉన్న ఏదైనా
        అక్షరంపై నొక్కితే, ఆ అక్షరాన్నే రాసి ప్రాక్టీస్ చేయొచ్చు.
        <br />• &quot;తనిఖీ చేయండి&quot; నొక్కితే మీరు ఎంత బాగా రాశారో వెంటనే చూపిస్తుంది — అక్షరం ఎంత పూర్తి
        అయింది, గీతలు ఎంత ఖచ్చితంగా ఉన్నాయి.
        <br />• &quot;ముగించు&quot; నొక్కితే మామూలు రూపానికి తిరిగి వెళ్తుంది.
      </>
    ),
  },
  {
    icon: <TouchAppIcon color="secondary" fontSize="small" sx={iconSx} />,
    title: "సంబంధిత అక్షరాలు, AI పదాలు",
    body: (
      <>
        అక్షరం కార్డ్ మీద (బటన్‌లు కాకుండా) నొక్కితే, అదే వర్గం అక్షరాలు, ఆ అక్షరంతో మొదలయ్యే AI పదాలు
        పక్కన (ఫోన్‌లో కింద) కనిపిస్తాయి.
        <br />• AI పదంపై నొక్కితే వినిపిస్తుంది (🔊 గుర్తు కనిపిస్తుంది). మళ్ళీ నొక్కితే ఆగుతుంది.
      </>
    ),
  },
  {
    icon: <TableRowsRoundedIcon color="secondary" fontSize="small" sx={iconSx} />,
    title: "యుక్తి AI పట్టిక",
    highlight: true,
    body: (
      <>
        సెర్చ్ బాక్స్ కింద &quot;యుక్తి AI పట్టిక&quot; నొక్కితే, అన్ని అక్షరాలు ఒకే పట్టికలో — చిత్రం, అక్షరం,
        పదం, వర్గంతో — కనిపిస్తాయి.
        <br />• తెలుగులో అడగండి: &quot;క పదం&quot;, &quot;క వినిపించు&quot;, &quot;క తెరువు&quot;, &quot;అచ్చులు&quot;,
        &quot;హల్లులు&quot;.
        <br />• వరుసపై నొక్కితే, ఆ అక్షరం కార్డ్, సంబంధిత అక్షరాలు, AI పదాలు పక్కన కనిపిస్తాయి.
        <br />• PDF, Excel బటన్‌లతో పట్టికను దాచుకోవచ్చు.
      </>
    ),
  },
  {
    icon: <CodeRoundedIcon color="secondary" fontSize="small" sx={iconSx} />,
    title: "అక్షరాల విశ్లేషణ (Rust · WebAssembly)",
    highlight: true,
    body: (
      <>
        తెలుగు పదం (ఉదాహరణకు &quot;లక్ష్మి&quot; లేదా &quot;స్త్రీ&quot;) టైప్ చేసినప్పుడు, ఆ పదంలోని అక్షరాలు
        మీ బ్రౌజర్‌లోనే విడదీసి చూపించబడతాయి. పక్కనే ఉన్న ⏱ గుర్తు ఆ పనికి పట్టిన సమయం చూపిస్తుంది.
        <br />• విడిపోయిన అక్షరంపై నొక్కితే ఆ అక్షరంతో వెతకవచ్చు.
        <br />• ఇది ఎలా జరుగుతుందో తెలుసుకోవాలంటే సెర్చ్ బాక్స్ కింద &quot;ఎలా పనిచేస్తుంది?&quot; నొక్కండి.
      </>
    ),
  },
];

/* ================= PAGE ================= */

export default function AksharamalaPage() {
  return (
    <Box sx={{ maxWidth: 1240, mx: "auto", p: 2 }}>
      {/* TITLE — one h1 per page; plain brand colour (the old dark gradient vanished in dark mode) */}
      <Typography
        variant="h3"
        component="h1"
        fontWeight={800}
        sx={{
          color: "primary.main",
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          lineHeight: 1.4,
          textAlign: "center",
        }}
      >
        అక్షరమాల
      </Typography>

      <Typography align="center" sx={{ color: "text.secondary", mb: 2 }}>
        వినండి • పలకండి • రాయండి • నేర్చుకోండి
      </Typography>

      {/* FEATURE CHIPS */}
      <Stack component="ul" direction="row" spacing={1} useFlexGap justifyContent="center" flexWrap="wrap" sx={{ mb: 2, p: 0, listStyle: "none" }} aria-label="ఈ పేజీలో ఏమి ఉన్నాయి">
        {[
          { label: "👶 పిల్లలకు, 👵 పెద్దలకు" },
          { label: "🔊 మగ / స్త్రీ స్వరం" },
          { label: "🏠 కుటుంబ గొంతు" },
          { label: "🎤 పలికే ప్రాక్టీస్" },
          { label: "✍️ రాసే ప్రాక్టీస్" },
          { label: "🤖 యుక్తి AI పట్టిక", accent: true },
          { label: "⚡ బ్రౌజర్‌లోనే విశ్లేషణ (Rust · WASM)", accent: true },
        ].map((c) => (
          <li key={c.label}>
            <Chip label={c.label} {...(c.accent ? { color: "secondary" as const, variant: "outlined" as const } : {})} />
          </li>
        ))}
      </Stack>

      {/* ABOUT + HOW TO USE */}
      <Accordion
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="aksharamala-help" id="aksharamala-help-head" sx={{ minHeight: 56 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <MenuBookIcon color="primary" fontSize="small" />
            <Typography component="h2" fontWeight={700}>
              ఈ పేజీ గురించి • ఎలా వాడాలి
            </Typography>
          </Stack>
        </AccordionSummary>

        <AccordionDetails id="aksharamala-help">
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            ఇది తెలుగు అక్షరమాల నేర్చుకోవడానికి ఒక సులభమైన పేజీ — అచ్చులు, హల్లులు, ప్రతి అక్షరానికి ఒక పదం, ఆ
            పదానికి ఒక చిత్రం. వినవచ్చు, పలికి చూడవచ్చు, రాసి ప్రాక్టీస్ చేయవచ్చు. కింద ఎలా వాడాలో దశలవారీగా
            చూడండి.
          </Typography>

          <Stack spacing={2}>
            {helpItems.map((item) => (
              <Stack key={item.title} direction="row" spacing={1.5} alignItems="flex-start">
                <Box component="span" aria-hidden sx={{ display: "inline-flex", flexShrink: 0 }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography component="h3" fontWeight={700} color={item.highlight ? "secondary.main" : undefined}>
                    {item.title}
                  </Typography>
                  {/* text.secondary instead of opacity: faded text fell below the 7:1 reading contrast */}
                  <Typography variant="body2" component="div" sx={{ color: "text.secondary", lineHeight: 1.9 }}>
                    {item.body}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <AutoAwesomeRoundedIcon color="secondary" fontSize="small" aria-hidden />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              AI పదాలు Groq ద్వారా వస్తాయి; చూపే ముందు Rust తో సరిచూస్తాం.
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      {/* MAIN CONTENT */}
      <AksharamalaParent />
    </Box>
  );
}