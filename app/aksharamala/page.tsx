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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import EditIcon from "@mui/icons-material/Edit";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import MicIcon from "@mui/icons-material/Mic";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";

// యుక్తి AI icon — సైట్ అంతా ఒకే శోధన గుర్తు
import { SearchIcon } from "@yuktishaalaa/yuktai";

import AksharamalaParent from "@/app/components/Aksharamal";

/* ================= HELP ITEMS ================= */

type HelpItem = {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  highlight?: boolean;
};

const helpItems: HelpItem[] = [
  {
    icon: (
      <Box component="span" sx={{ color: "primary.main", display: "inline-flex", mt: 0.3 }}>
        <SearchIcon size={20} color="currentColor" />
      </Box>
    ),
    title: "వెతకడం",
    body: (
      <>
        పైన ఉన్న సెర్చ్ బాక్స్‌లో ఏదైనా అక్షరం లేదా పదం టైప్ చేయండి — ఉదాహరణకు
        &quot;ఎలుక&quot; అని టైప్ చేస్తే, ఆ పదానికి సంబంధించిన అక్షరం చూపిస్తుంది.
        దానితో పాటు, ఆ పదం ఉన్న సామెతలు కూడా కింద కనిపిస్తాయి.
      </>
    ),
  },
  {
    icon: <TableRowsRoundedIcon color="secondary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "యుక్తి AI పట్టిక",
    highlight: true,
    body: (
      <>
        సెర్చ్ బాక్స్ కింద &quot;యుక్తి AI పట్టిక&quot; నొక్కితే, అన్ని అక్షరాలు ఒకే
        పట్టికలో — చిత్రం, అక్షరం, పదం, వర్గంతో — కనిపిస్తాయి.
        <br />
        • తెలుగులో అడగండి: &quot;క పదం&quot;, &quot;క వినిపించు&quot;, &quot;క తెరువు&quot;,
        &quot;అచ్చులు&quot;, &quot;హల్లులు&quot;.
        <br />
        • వరుసపై నొక్కితే, సంబంధిత అక్షరాలు మరియు AI పదాలు పక్కన చూపిస్తుంది.
      </>
    ),
  },
  {
    icon: <CodeRoundedIcon color="secondary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "అక్షరాల విశ్లేషణ (Rust · WebAssembly)",
    highlight: true,
    body: (
      <>
        తెలుగు పదం (ఉదాహరణకు &quot;లక్ష్మి&quot; లేదా &quot;స్త్రీ&quot;) టైప్
        చేసినప్పుడు, ఆ పదంలోని అక్షరాలు మీ బ్రౌజర్‌లోనే విడదీసి చూపించబడతాయి.
        పక్కనే ఉన్న ⏱ గుర్తు ఆ పనికి పట్టిన సమయం చూపిస్తుంది.
        <br />
        • విడిపోయిన అక్షరంపై నొక్కితే ఆ అక్షరంతో వెతకవచ్చు.
        <br />
        • ఇది ఎలా జరుగుతుందో తెలుసుకోవాలంటే సెర్చ్ బాక్స్ కింద ఉన్న
        &quot;ఎలా పనిచేస్తుంది?&quot; నొక్కండి.
      </>
    ),
  },
  {
    icon: <TouchAppIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "వర్గం ఎంచుకోవడం",
    body: (
      <>
        &quot;అచ్చులు&quot; లేదా &quot;హల్లులు&quot; బటన్ నొక్కి, ఆ వర్గానికి
        చెందిన అక్షరాలు మాత్రమే చూడొచ్చు. &quot;అన్నీ&quot; నొక్కితే మళ్ళీ అన్ని
        అక్షరాలు కనిపిస్తాయి.
      </>
    ),
  },
  {
    icon: <VolumeUpIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "వినడం",
    body: (
      <>
        ప్రతి అక్షరం కార్డ్‌లో ఉన్న 🔊 బటన్ నొక్కితే, ఆ అక్షరం మరియు దాని పదం
        బిగ్గరగా చదివి వినిపిస్తుంది. ఆపాలంటే పక్కనే ఉన్న ఎరుపు బటన్ నొక్కండి.
      </>
    ),
  },
  {
    icon: <MicIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "పలకడం ప్రాక్టీస్",
    body: (
      <>
        🎤 బటన్ నొక్కి ఆ పదాన్ని చెప్పండి. పదం కింద ఉన్న అక్షరాలు 🟢 (సరిగ్గా
        చెప్పారు) లేదా 🔴 (మళ్ళీ ప్రయత్నించండి) రంగులోకి మారుతాయి — ఏ అక్షరం
        సరిచేయాలో సులభంగా తెలుస్తుంది. మీరు చెప్పింది ఏమని వినిపించిందో కూడా
        కింద కనిపిస్తుంది. (Chrome బ్రౌజర్‌లో పనిచేస్తుంది.)
      </>
    ),
  },
  {
    icon: <EditIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "రాయడం నేర్చుకోవడం",
    body: (
      <>
        &quot;రాయండి&quot; బటన్ నొక్కి, బూడిద రంగు అక్షరం మీద వేలితో లేదా
        మౌస్‌తో రాయండి. పదం కింద ఉన్న ఏదైనా అక్షరంపై నొక్కితే, ఆ అక్షరాన్నే
        రాసి ప్రాక్టీస్ చేయొచ్చు.
        <br />
        • &quot;తనిఖీ చేయండి&quot; నొక్కితే, మీరు ఎంత బాగా రాశారో వెంటనే
        చూపిస్తుంది — అక్షరం ఎంత పూర్తి అయింది, గీతలు ఎంత ఖచ్చితంగా ఉన్నాయి.
        <br />
        • &quot;ముగించు&quot; నొక్కితే మామూలు వ్యూకి తిరిగి వెళ్తుంది.
      </>
    ),
  },
  {
    icon: <TouchAppIcon color="secondary" fontSize="small" sx={{ mt: 0.3 }} />,
    title: "సంబంధిత అక్షరాలు చూడడం",
    body: (
      <>
        ఏదైనా అక్షరం కార్డ్ మీద (బటన్‌లు కాకుండా) నొక్కితే, ఆ అక్షరం వర్గానికి
        చెందిన ఇతర సంబంధిత అక్షరాలు కింద చూపిస్తుంది — కొత్త అక్షరాలు
        తెలుసుకోవడానికి ఇది ఉపయోగపడుతుంది.
      </>
    ),
  },
];

/* ================= PAGE ================= */

export default function AksharamalaPage() {
  return (
    <Box
      sx={{
        maxWidth: 1240,
        mx: "auto",
        p: 2,
      }}
    >
      {/* TITLE */}
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center",
        }}
      >
        అక్షరమాల
      </Typography>

      <Typography align="center" sx={{ opacity: 0.85, mb: 2 }}>
        వినండి • పలకండి • రాయండి • నేర్చుకోండి
      </Typography>

      {/* FEATURE CHIPS */}
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        justifyContent="center"
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Chip label="👶 పిల్లల కోసం" />
        <Chip label="🔊 వినే అవకాశం" />
        <Chip label="🎤 పలికే ప్రాక్టీస్" />
        <Chip label="✍️ రాసే ప్రాక్టీస్" />
        <Chip label="🤖 యుక్తి AI పట్టిక" color="secondary" variant="outlined" />
        <Chip label="⚡ బ్రౌజర్‌లోనే విశ్లేషణ (Rust · WASM)" color="secondary" variant="outlined" />
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
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <MenuBookIcon color="primary" fontSize="small" />
            <Typography fontWeight={700}>ఈ పేజీ గురించి • ఎలా వాడాలి</Typography>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Typography sx={{ mb: 2, opacity: 0.85 }}>
            ఇది తెలుగు అక్షరమాల నేర్చుకోవడానికి ఒక సులభమైన పేజీ — అచ్చులు,
            హల్లులు, ప్రతి అక్షరానికి ఒక పదం, మరియు ఆ పదానికి సంబంధించిన
            చిత్రం చూడొచ్చు. వినవచ్చు, పలికి చూడవచ్చు, రాసి ప్రాక్టీస్
            చేయవచ్చు. కింద ఎలా వాడాలో దశలవారీగా చూడండి.
          </Typography>

          <Stack spacing={2}>
            {helpItems.map((item) => (
              <Stack key={item.title} direction="row" spacing={1.5} alignItems="flex-start">
                {item.icon}
                <Box>
                  <Typography
                    fontWeight={600}
                    color={item.highlight ? "secondary.main" : undefined}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ opacity: 0.8 }}>
                    {item.body}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      {/* MAIN CONTENT */}
      <AksharamalaParent />
    </Box>
  );
}