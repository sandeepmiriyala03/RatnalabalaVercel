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
} from "@mui/material";
import ArchitectureRoundedIcon from "@mui/icons-material/ArchitectureRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PoemListByKey from "@/app/components/PoemListByKey";

import {
  POETRY_COLLECTIONS,
  DEFAULT_POETRY_KEY,
  PoetryKey,
} from "@/types/poetry";

// ── "ఎలా పనిచేస్తుంది" — the actual real pipeline, in plain language,
// not marketing copy. Written to match what the code genuinely does:
// Next.js frontend -> Python serverless backend -> markdown files on
// disk -> (optionally) Groq for AI explanations, and separately, TTS
// engines for narration. Kept in sync with api/main.py's real
// endpoints rather than describing an idealized/aspirational flow.
const WORKFLOW_STEPS: string[] = [
  "మీరు ఒక శతకాన్ని డ్రాప్‌డౌన్ నుండి ఎంచుకుంటారు.",
  "ఫ్రంటెండ్ (Next.js) /api/main?endpoint=poems&collection=... కి రిక్వెస్ట్ పంపుతుంది.",
  "Vercel పైథాన్ సర్వర్‌లెస్ ఫంక్షన్ content/ ఫోల్డర్‌లోని .md ఫైళ్లను నేరుగా చదివి, ప్రతి పద్యం (శీర్షిక, కవి, పాఠ్యం) JSON‌గా తిరిగి పంపుతుంది — డేటాబేస్ లేదు, ఫైళ్లే మూలం.",
  "ప్రతి పద్యం ఒక కార్డ్‌గా చూపబడుతుంది — వినడానికి, వీడియోగా దాచుకోవడానికి, AI అసిస్టెంట్‌ని అడగడానికి ఆప్షన్లతో.",
  "\"వినండి\" నొక్కితే → /api/tts కి రిక్వెస్ట్ వెళ్లి, Microsoft Edge TTS లేదా Google TTS ద్వారా వాయిస్ తయారవుతుంది.",
  "\"పద్యం గురించి అడగండి (AI)\" నొక్కితే → /api/main?endpoint=poem-ai కి ప్రశ్న వెళ్లుతుంది. సర్వర్ అసలు .md ఫైల్‌ని మళ్ళీ చదివి, ఆ పాఠ్యాన్నే Groq కి పంపి సమాధానం తీసుకువస్తుంది — ఇది కల్పించి చెప్పదు, ఫైల్‌లో ఉన్నదాని ఆధారంగానే జవాబిస్తుంది.",
  "\"వీడియోగా డౌన్‌లోడ్\" పూర్తిగా మీ బ్రౌజర్‌లోనే జరుగుతుంది — పోస్టర్ ఇమేజ్ + వాయిస్ + నేపథ్య సంగీతం కలిపి ఒక వీడియోగా తయారవుతుంది. ఏ ఫైలూ సర్వర్‌కి అప్‌లోడ్ కాదు.",
];

// ── Actual technologies in use, not a generic buzzword list — written
// to match what's really in the codebase (api/main.py, PoemCardNew.tsx,
// etc.), so this stays honest if someone checks the source.
const TECH_STACK: { label: string; detail: string }[] = [
  { label: "Next.js (React)", detail: "ఫ్రంటెండ్ — పేజీలు, కార్డ్‌లు, UI మొత్తం" },
  { label: "Material UI", detail: "బటన్లు, డ్రాప్‌డౌన్‌లు, లేఅవుట్ కాంపొనెంట్లు" },
  { label: "Python (Vercel Serverless)", detail: "బ్యాక్‌ఎండ్ — api/main.py, డేటాబేస్ లేకుండా ఫైల్-ఆధారితం" },
  { label: "Markdown (.md) ఫైళ్లు", detail: "ప్రతి పద్యం ఒక ఫైల్‌గా, frontmatterలో శీర్షిక/కవి వివరాలతో" },
  { label: "Groq (LLM)", detail: "\"పద్యం గురించి అడగండి\" ఫీచర్ కోసం — పద్యం ఆధారంగా మాత్రమే సమాధానం" },
  { label: "Microsoft Edge TTS / Google TTS", detail: "పద్యం వాయిస్ నేరేషన్ కోసం" },
  { label: "html2canvas + Web Audio API", detail: "పోస్టర్ + వాయిస్ + సంగీతం కలిపి బ్రౌజర్‌లోనే వీడియో తయారీ" },
  { label: "Vercel", detail: "హోస్టింగ్ — ఫ్రంటెండ్ మరియు పైథాన్ ఫంక్షన్లు రెండూ ఇక్కడే" },
];

export default function PoemsPage() {
  const [selectedKey, setSelectedKey] =
    useState<PoetryKey>(DEFAULT_POETRY_KEY);

  const [infoOpen, setInfoOpen] = useState(false);

  /* ✅ Safe selected collection */
  const selected =
    POETRY_COLLECTIONS.find((p) => p.key === selectedKey) ??
    POETRY_COLLECTIONS[0];

  /* 📊 Platform totals */
  const totalCollections = useMemo(() => POETRY_COLLECTIONS.length, []);

  const totalPoemsAll = useMemo(
    () => POETRY_COLLECTIONS.reduce((sum, p) => sum + (p.totalPoems ?? 0), 0),
    []
  );

  /* ✅ Display poems count */
  const displayTotalPoems =
    selected.key === "Jandhyala" ? totalPoemsAll : selected.totalPoems ?? 0;

  const authorsText = Array.isArray(selected.authors)
    ? selected.authors.join(", ")
    : selected.authors;

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, px: 2, maxWidth: 1100, mx: "auto" }}>
      {/* 🌺 Title */}
        <Typography
                     variant="h3"
              
                     sx={{
                       letterSpacing: "-0.5px",
                       background: "linear-gradient(90deg, #0f172a, #2563eb)",
                       WebkitBackgroundClip: "text",
                       WebkitTextFillColor: "transparent",       fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
          textAlign: "center",  // ✅ Centers the text
                     }}>
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
          maxWidth: 720,
          mx: "auto",
          mb: 3,
          fontSize: "0.95rem",
          opacity: 0.75,
        }}
      >
        శతకాలమాల అనేది కృత్రిమ మేధ (AI) సహాయంతో రూపొందించిన తెలుగు శతకాల
        డిజిటల్ వేదిక. సంప్రదాయ సాహిత్యాన్ని ఆధునిక సాంకేతికతతో
        చదవడానికి, వినడానికి, పంచుకోవడానికి ఇది సహాయపడుతుంది.
      </Typography>

      {/* 📈 Platform Summary */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Chip label={`📚 శతకములు: ${totalCollections}`} variant="outlined" />
        <Chip
          label={`🧮 మొత్తం పద్యాలు: ${totalPoemsAll}`}
          color="success"
          variant="outlined"
        />
        <Chip label="✨ సంప్రదాయం × సాంకేతికత" variant="outlined" />
      </Stack>

      {/* ⚙️ Workflow + Technologies — how this actually works under
          the hood, and what it's built with. Collapsed by default so
          it doesn't compete with the main reading experience; anyone
          curious can expand it. */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Button
          onClick={() => setInfoOpen((v) => !v)}
          variant="text"
          startIcon={<ArchitectureRoundedIcon fontSize="small" />}
          endIcon={infoOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          ఇది ఎలా పనిచేస్తుంది? (సాంకేతిక వివరాలు)
        </Button>

        <Collapse in={infoOpen} timeout={280} unmountOnExit>
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
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
              ఎలా పనిచేస్తుంది
            </Typography>

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

            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
              వాడిన సాంకేతికతలు
            </Typography>

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
          <Typography sx={{ fontSize: "0.8rem", mb: 0.5, opacity: 0.8 }}>
            శతకము ఎంచుకోండి
          </Typography>

          <Select
            value={selectedKey}
            onChange={(e) =>
              setSelectedKey(e.target.value as PoetryKey)
            }
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
          onClick={() => setSelectedKey(DEFAULT_POETRY_KEY)}
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
        <Chip
          label={`📘 ఈ శతకంలో పద్యాలు: ${displayTotalPoems}`}
          color="primary"
          variant="outlined"
        />
        <Chip label={`✍️ కవి: ${authorsText}`} variant="outlined" />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* 📜 Poems List */}
      <PoemListByKey
        apiKey={selected.key}
        poetryName={selected.label}
        authors={selected.authors}
      />
    </Box>
  );
}