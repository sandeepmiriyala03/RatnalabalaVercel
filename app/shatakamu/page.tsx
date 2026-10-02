"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Stack,
  Chip,
  Divider,
  Collapse,
  Grid,
  Paper,
} from "@mui/material";
import ArchitectureRoundedIcon from "@mui/icons-material/ArchitectureRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MovieCreationRoundedIcon from "@mui/icons-material/MovieCreationRounded";

import PoemBrowser from "@/app/components/PoemBrowser";
import {
  POETRY_COLLECTIONS,
  DEFAULT_POETRY_KEY,
  authorsToText,
  type PoetryKey,
} from "@/types/poetry";

// ── ఫ్లాట్‌ఫామ్ ముఖ్యమైన ఫీచర్లు
const FEATURES = [
  {
    icon: <MenuBookRoundedIcon color="primary" fontSize="large" />,
    title: "డిజిటల్ పఠనం",
    description:
      "సుమతి, శ్రీకాళహస్తీశ్వర వంటి అనేక శతకాలలోని పద్యాలను స్పష్టమైన తెలుగు లిపిలో, మొబైల్ మరియు కంప్యూటర్ స్క్రీన్లకు అనుకూలంగా చదువుకోవచ్చు.",
  },
  {
    icon: <RecordVoiceOverRoundedIcon color="secondary" fontSize="large" />,
    title: "వాయిస్ నేరేషన్ (TTS)",
    description:
      "పద్యాలను వినాలనుకునే వారి కోసం Microsoft Edge TTS / Google TTS సాంకేతికతల ద్వారా స్పష్టమైన గొంతుతో పద్యాల ఆలపనను వినవచ్చు.",
  },
  {
    icon: <AutoAwesomeRoundedIcon color="warning" fontSize="large" />,
    title: "AI అసిస్టెంట్ (Groq LLM)",
    description:
      "పద్యం యొక్క భావం, అంతరార్థం లేదా కవి వివరాలను తెలుసుకోవడానికి AI అసిస్టెంట్‌ను ప్రశ్నలు అడగవచ్చు. ఇది అసలు పద్యం ఆధారంగా మాత్రమే వివరణ ఇస్తుంది.",
  },
  {
    icon: <MovieCreationRoundedIcon color="success" fontSize="large" />,
    title: "వీడియో, PDF & Excel",
    description:
      "బ్రౌజర్‌లోనే పద్యాల పోస్టర్లు, వీడియోలు తయారు చేయవచ్చు. యుక్తి AI పట్టిక నుండి పద్యాలను PDF లేదా Excel గా డౌన్‌లోడ్ చేసుకోవచ్చు.",
  },
];

// ── "ఎలా పనిచేస్తుంది" Pipeline steps
const WORKFLOW_STEPS: string[] = [
  "మీరు ఒక శతకాన్ని డ్రాప్‌డౌన్ నుండి ఎంచుకుంటారు.",
  "ఫ్రంటెండ్ (Next.js) /api/getpoems?poet_id=... కి రిక్వెస్ట్ పంపుతుంది.",
  "సర్వర్ PostgreSQL డేటాబేస్ నుండి ఆ కవి పద్యాలను (శీర్షిక, పాఠ్యం, ప్రత్యేక పంక్తి) వరుస క్రమంలో JSON‌గా తిరిగి పంపుతుంది.",
  "ప్రతి పద్యం ఒక కార్డ్‌గా చూపబడుతుంది — వినడానికి, వీడియోగా దాచుకోవడానికి, AI అసిస్టెంట్‌ని అడగడానికి ఆప్షన్లతో. \"యుక్తి AI\" ఎంచుకుంటే అవే పద్యాలు పట్టికగా వస్తాయి.",
  "\"వినండి\" నొక్కితే → /api/tts కి రిక్వెస్ట్ వెళ్లి, Microsoft Edge TTS లేదా Google TTS ద్వారా వాయిస్ తయారవుతుంది.",
  "\"పద్యం గురించి అడగండి (AI)\" నొక్కితే → ప్రశ్న, అసలు పద్యం Groq కి వెళ్లి సమాధానం వస్తుంది — పద్యంలో ఉన్నదాని ఆధారంగానే జవాబిస్తుంది.",
  "వీడియో, PDF, Excel అన్నీ మీ బ్రౌజర్‌లోనే తయారవుతాయి. ఏ ఫైలూ సర్వర్‌కి అప్‌లోడ్ కాదు.",
];

// ── Actual technologies in use
const TECH_STACK: { label: string; detail: string }[] = [
  { label: "Next.js (React)", detail: "ఫ్రంటెండ్ — పేజీలు, కార్డ్‌లు, UI మొత్తం" },
  { label: "Material UI", detail: "బటన్లు, డ్రాప్‌డౌన్‌లు, లేఅవుట్ కాంపొనెంట్లు" },
  { label: "PostgreSQL", detail: "పద్యాలు, కవులు, ప్రత్యేక పంక్తులు — ఒకే డేటాబేస్" },
  { label: "యుక్తి AI Grid", detail: "పద్యాల పట్టిక, తెలుగు AI సహాయకుడు, WebMCP" },
  { label: "Groq (LLM)", detail: "\"పద్యం గురించి అడగండి\" ఫీచర్ కోసం — పద్యం ఆధారంగా మాత్రమే సమాధానం" },
  { label: "Microsoft Edge TTS / Google TTS", detail: "పద్యం వాయిస్ నేరేషన్ కోసం" },
  { label: "html2canvas + Web Audio API", detail: "పోస్టర్ + వాయిస్ + సంగీతం కలిపి బ్రౌజర్‌లోనే వీడియో తయారీ" },
  { label: "SheetJS + Browser Print", detail: "Excel మరియు PDF డౌన్‌లోడ్ — తెలుగు అక్షరాలు సరిగ్గా" },
  { label: "Vercel", detail: "హోస్టింగ్ — ఫ్రంటెండ్ మరియు API రెండూ ఇక్కడే" },
];

export default function PoemsPage() {
  const [selectedKey, setSelectedKey] = useState<PoetryKey>(DEFAULT_POETRY_KEY);
  const [infoOpen, setInfoOpen] = useState(false);
  /** Live count from the database for the selected shatakam (null while loading) */
  const [liveCount, setLiveCount] = useState<number | null>(null);

  const selected = useMemo(
    () => POETRY_COLLECTIONS.find((p) => p.key === selectedKey) ?? POETRY_COLLECTIONS[0],
    [selectedKey]
  );

  /* 📊 Platform totals */
  const totalCollections = POETRY_COLLECTIONS.length;
  const totalPoemsAll = useMemo(
    () => POETRY_COLLECTIONS.reduce((sum, p) => sum + (p.totalPoems ?? 0), 0),
    []
  );

  /* ✅ This shatakam's count: database first, config as fallback */
  const displayTotalPoems = liveCount ?? selected.totalPoems ?? 0;

  const changeCollection = (key: PoetryKey) => {
    setLiveCount(null);
    setSelectedKey(key);
  };

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: 2, maxWidth: 1100, mx: "auto" }}>
      {/* 🌺 Title */}
      <Typography
        variant="h3"
        sx={{
          letterSpacing: "-0.5px",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size, 1rem) * 1.8)",
          textAlign: "center",
        }}
      >
        శతకాలమాల
      </Typography>

      {/* 🌼 Tagline */}
      <Typography align="center" sx={{ mt: 1, mb: 2, opacity: 0.85 }}>
        📖 చదవండి &nbsp;–&nbsp; 🎧 వినండి &nbsp;–&nbsp; 📤 పంచుకోండి
      </Typography>

      {/* 🧠 Description */}
      <Typography
        align="center"
        sx={{
          maxWidth: 800,
          mx: "auto",
          mb: 4,
          fontSize: { xs: "0.95rem", sm: "1.05rem" },
          color: "text.secondary",
          lineHeight: 1.8,
        }}
      >
        <strong>శతకాలమాల</strong> అనేది కృత్రిమ మేధ (AI) మరియు ఆధునిక సాంకేతికత సహాయంతో రూపొందించిన తెలుగు శతకాల డిజిటల్ వేదిక. శతాబ్దాల నాటి సంప్రదాయ సాహిత్యాన్ని నేటి డిజిటల్ యుగానికి తగినట్లుగా <strong>చదవడానికి, వినడానికి, పంచుకోవడానికి</strong> ఇది సహాయపడుతుంది.
      </Typography>

      {/* 🌟 Features Grid */}
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={2.5}>
          {FEATURES.map((feature) => (
            <Grid key={feature.title} size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: "100%",
                  borderRadius: "14px",
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: "10px",
                      bgcolor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: "1rem" }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "0.875rem" }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 📈 Platform Summary */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Chip label={`📚 శతకములు: ${totalCollections}`} variant="outlined" />
        <Chip label={`🧮 మొత్తం పద్యాలు: ${totalPoemsAll}`} color="success" variant="outlined" />
        <Chip label="✨ సంప్రదాయం × సాంకేతికత" variant="outlined" />
      </Stack>

      {/* ⚙️ Workflow + Technologies */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Button
          onClick={() => setInfoOpen((v) => !v)}
          variant="text"
          startIcon={<ArchitectureRoundedIcon fontSize="small" />}
          endIcon={infoOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          aria-expanded={infoOpen}
          aria-controls="architecture-info-collapse"
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          ఇది ఎలా పనిచేస్తుంది? (సాంకేతిక వివరాలు)
        </Button>

        <Collapse id="architecture-info-collapse" in={infoOpen} timeout={280} unmountOnExit>
          <Box
            sx={{
              mt: 2,
              p: { xs: 2, sm: 3 },
              borderRadius: "14px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              textAlign: "left",
              maxWidth: 780,
              mx: "auto",
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>ఎలా పనిచేస్తుంది</Typography>

            <Stack spacing={1.25} sx={{ mb: 3 }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                      mt: 0.2,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>వాడిన సాంకేతికతలు</Typography>

            <Stack spacing={1}>
              {TECH_STACK.map((tech) => (
                <Stack key={tech.label} direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                  <Chip label={tech.label} size="small" color="primary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    {tech.detail}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Collapse>
      </Box>

      {/* 🎛 Controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <Typography sx={{ fontSize: "0.8rem", mb: 0.5, opacity: 0.8 }}>శతకము ఎంచుకోండి</Typography>
          <Select
            value={selectedKey}
            onChange={(e) => changeCollection(e.target.value as PoetryKey)}
            aria-label="శతకము ఎంచుకోండి"
          >
            {POETRY_COLLECTIONS.map((p) => (
              <MenuItem key={p.key} value={p.key}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          disabled={selectedKey === DEFAULT_POETRY_KEY}
          onClick={() => changeCollection(DEFAULT_POETRY_KEY)}
        >
          డీఫాల్ట్
        </Button>
      </Stack>

      {/* 📊 Selected Info */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Chip label={`📘 ఈ శతకంలో పద్యాలు: ${displayTotalPoems}`} color="primary" variant="outlined" />
        <Chip label={`✍️ కవి: ${authorsToText(selected.authors)}`} variant="outlined" />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 📜 Poems — same component as మిరా పద్యాలు.
          key = శతకం → changing it starts fresh (search, page, grid, radio). */}
      <PoemBrowser
        key={selected.key}
        poetId={selected.poetId}
        poetryName={selected.label}
        authors={selected.authors}
        toolName={`shatakam_${selected.poetId}`}
        onCountChange={setLiveCount}
      />
    </Box>
  );
}