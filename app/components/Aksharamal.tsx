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
import SearchIcon from "@mui/icons-material/Search";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import EditIcon from "@mui/icons-material/Edit";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MicIcon from "@mui/icons-material/Mic";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";

import AksharamalaParent from "@/app/components/Aksharamal";

/* ================= PAGE ================= */

export default function AksharamalaPage() {
  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        p: 2,
      }}
    >
      {/* 🌼 TITLE */}
      <Typography
        variant="h3"
        fontWeight={800}
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center",
        }}
      >
        అక్షరమాల
      </Typography>

      <Typography align="center" sx={{ opacity: 0.85, mb: 2 }}>
        వినండి • చదవండి • నేర్చుకోండి
      </Typography>

      {/* 🧠 SIMPLE INFO */}
      <Stack direction="row" spacing={1} justifyContent="center" mb={2} flexWrap="wrap">
        <Chip label="👶 పిల్లల కోసం" />
        <Chip label="🔊 వినే అవకాశం" />
        <Chip label="🎤 ఉచ్చారణ సాధన" />
        <Chip label="✍️ రాయడం సాధన" />
        <Chip label="📱 సులభం" />
      </Stack>

      {/* 📖 ఈ పేజీ గురించి + ఎలా వాడాలి — end user కోసం, simple language */}
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
            <Typography fontWeight={700}>
              ఈ పేజీ గురించి • ఎలా వాడాలి
            </Typography>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Typography sx={{ mb: 2, opacity: 0.85 }}>
            ఇది తెలుగు అక్షరమాల నేర్చుకోవడానికి ఒక సులభమైన పేజీ — అచ్చులు,
            హల్లులు, ప్రతి అక్షరానికి ఒక పదం, మరియు ఆ పదానికి సంబంధించిన
            చిత్రం చూడొచ్చు. వినడం, చెప్పడం, రాయడం మూడూ ప్రాక్టీస్
            చేయొచ్చు. కింద ఎలా వాడాలో దశలవారీగా చూడండి.
          </Typography>

          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <SearchIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>వెతకడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  పైన ఉన్న సెర్చ్ బాక్స్‌లో ఏదైనా అక్షరం లేదా పదం టైప్
                  చేయండి — ఉదాహరణకు &quot;ఎలుక&quot; అని టైప్ చేస్తే, ఆ
                  పదానికి సంబంధించిన అక్షరం చూపిస్తుంది. దానితో పాటు, ఆ
                  పదం ఉన్న సామెతలు కూడా కింద కనిపిస్తాయి.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <TouchAppIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>వర్గం ఎంచుకోవడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  &quot;అచ్చులు&quot; లేదా &quot;హల్లులు&quot; బటన్ నొక్కి,
                  ఆ వర్గానికి చెందిన అక్షరాలు మాత్రమే చూడొచ్చు.
                  &quot;అన్నీ&quot; నొక్కితే మళ్ళీ అన్ని అక్షరాలు
                  కనిపిస్తాయి.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <RecordVoiceOverIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>స్వరం ఎంచుకోవడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  జాబితా పైన &quot;మగ స్వరం&quot; లేదా &quot;స్త్రీ
                  స్వరం&quot; ఎంచుకోవచ్చు — మీరు ఎంచుకున్న స్వరంలోనే
                  అన్ని అక్షరాలు వినిపిస్తాయి.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <VolumeUpIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>వినడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  ప్రతి అక్షరం కార్డ్‌లో ఉన్న 🔊 బటన్ నొక్కితే, ఆ అక్షరం
                  మరియు దాని పదం బిగ్గరగా చదివి వినిపిస్తుంది. ఆపాలంటే
                  పక్కనే ఉన్న ఎరుపు బటన్ నొక్కండి.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <MicIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>మీరు చెప్పి ప్రాక్టీస్ చేయడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  🎤 బటన్ నొక్కి, అక్షరం లేదా పదాన్ని బిగ్గరగా చెప్పండి —
                  మీరు సరిగ్గా పలికారో లేదో వెంటనే చూపిస్తుంది. తప్పైతే
                  మళ్ళీ ప్రయత్నించవచ్చు. (దీనికి మైక్రోఫోన్ అనుమతి
                  కావాలి, మరియు Chrome బ్రౌజర్‌లో బాగా పనిచేస్తుంది.)
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <EditIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>రాయడం నేర్చుకోవడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  &quot;రాయండి&quot; బటన్ నొక్కితే, ఆ అక్షరాన్ని మీ
                  స్క్రీన్ మీద వేలితో లేదా మౌస్‌తో రాసి ప్రాక్టీస్
                  చేయొచ్చు. రాసిన తర్వాత &quot;తనిఖీ చేయండి&quot; నొక్కితే
                  మీరు ఎంత బాగా రాశారో చూపిస్తుంది. తప్పైతే తుడిచి మళ్ళీ
                  ప్రయత్నించండి. &quot;ముగించు&quot; నొక్కితే మామూలు
                  వ్యూకి తిరిగి వెళ్తుంది.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <TouchAppIcon color="secondary" fontSize="small" sx={{ mt: 0.3 }} />
              <Box>
                <Typography fontWeight={600}>సంబంధిత అక్షరాలు చూడడం</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  ఏదైనా అక్షరం కార్డ్ మీద (బటన్‌లు కాకుండా) నొక్కితే, ఆ
                  అక్షరం వర్గానికి చెందిన ఇతర సంబంధిత అక్షరాలు కింద
                  చూపిస్తుంది — కొత్త అక్షరాలు తెలుసుకోవడానికి ఇది
                  ఉపయోగపడుతుంది.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      {/* 📜 MAIN CONTENT */}
      <AksharamalaParent />
    </Box>
  );
}