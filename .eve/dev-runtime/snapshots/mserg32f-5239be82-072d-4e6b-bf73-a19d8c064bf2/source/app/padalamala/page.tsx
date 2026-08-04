"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Chip,
  TextField, InputAdornment, Stack, Button,
  alpha, Tabs, Tab, IconButton, Tooltip,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const TWO_LETTER: string[] = [
  "అల","అర","ఆన","ఆట","ఇల","ఈల","ఈగ","ఈక","ఉమ",
  "ఊక","ఋణ","ఎర","ఎద","ఏతం","ఐదు","ఒర","ఒక","ఓడ",
  "కల","కథ","ఖరం","గద","గంట","గంప","ఘన","చర","ఛత్రం",
  "జపం","జనం","ఝరి","జ్ఞప్తి","టపా","టక్కు","ఠీవి","ఠావు","ఠాణా",
  "డబ్బు","ఢంక","కణ","తల","దడ","దయ","ధన","నగ",
  "పగ","ఫలం","బడి","బలం","భక్తి","మర","మనం","యమ","యతి",
  "రసం","లత","వల","శరం","షట్","సజ్జ","హల","కళ","క్షమ","ఱంపం",
];

const THREE_FOUR_LETTER: string[] = [
  "అరక","ఆనప","ఇనప","ఈవల","ఉడత","ఊయల","ఎలక","ఏతము",
  "ఐదవ","ఒరగు","ఓడలు","ఔషధం","కలత","కడవ","ఖరము","గడప",
  "ఘడియ","చంచల","ఛత్రము","జలగ","ఝరము","టక్కరి","ఠీవిగ","డమరు",
  "ఢక్కము","తక్కువ","దళము","ధవళ","నఖము","పలక","ఫలము","బకము",
  "భవుడు","మరక","యక్షుడు","రవము","లవణం","వలపు","శతకం","షడ్జమం","సహనం",
  "అరమర","ఆలమంద","ఇనకులం","ఈలపాట","ఉరగము","ఊరందరు","ఎదలయ","ఏలనగ",
  "ఐరావతం","ఒకటవ","ఓడరేవు","ఔధార్యము","కమలము","ఖననము","గరళము","ఘమఘమ",
  "చదరము","ఛత్రపతి","జలజము","ఝరగానం","టక్కులాడి","డమరుకం","ఢక్కనాధం","తలగడ",
  "దవనము","ధనమదం","నగరము","పరపతి","ఫణిరాజు","బలపము","భవితము","మరకతం",
  "యవనిక","రజతము","లక్షణము","వలసలు","శరములు","షరతులు","సమరము","హరినామం","క్షవరము",
];

const SWARALU    = ["అ","ఆ","ఇ","ఈ","ఉ","ఊ","ఋ","ఎ","ఏ","ఐ","ఒ","ఓ","ఔ"];
const VYANJANALU = [
  "క","ఖ","గ","ఘ","చ","ఛ","జ","ఝ","ట","ఠ","డ","ఢ","ణ",
  "త","థ","ద","ధ","న","ప","ఫ","బ","భ","మ","య","ర","ల",
  "వ","శ","ష","స","హ","ళ","క్ష","ఱ",
];
const ALL_AKSHARALU = [...SWARALU, ...VYANJANALU];
const SWARA_COLOR    = "#2d6a4f";
const VYANJANA_COLOR = "#1a5276";

function getColor(word: string) {
  return SWARALU.includes(word[0]) ? SWARA_COLOR : VYANJANA_COLOR;
}

/* ═══════════════════════════════════════════
   TTS HOOK
═══════════════════════════════════════════ */
function useTTS() {
  const [speaking, setSpeaking] = useState<string | null>(null);

  const speak = useCallback((word: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speaking === word) { setSpeaking(null); return; }

    const u = new SpeechSynthesisUtterance(word);
    u.lang  = "te-IN";
    u.rate  = 0.8;
    u.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const teVoice = voices.find(v => v.lang.startsWith("te"));
    if (teVoice) u.voice = teVoice;

    u.onstart = () => setSpeaking(word);
    u.onend   = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);

    window.speechSynthesis.speak(u);
  }, [speaking]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(null);
  }, []);

  return { speak, stop, speaking };
}

/* ═══════════════════════════════════════════
   SPEAK ALL — reads all visible words
═══════════════════════════════════════════ */
function useSpeakAll() {
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  const speakAll = async (words: string[]) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    stopRef.current = false;
    setRunning(true);

    for (const word of words) {
      if (stopRef.current) break;
      await new Promise<void>(res => {
        const u = new SpeechSynthesisUtterance(word);
        u.lang  = "te-IN";
        u.rate  = 0.75;
        u.pitch = 1.1;
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find(v => v.lang.startsWith("te"));
        if (v) u.voice = v;
        u.onend   = () => res();
        u.onerror = () => res();
        window.speechSynthesis.speak(u);
      });
      // small pause between words
      await new Promise(r => setTimeout(r, 300));
    }
    setRunning(false);
  };

  const stopAll = () => {
    stopRef.current = true;
    window.speechSynthesis.cancel();
    setRunning(false);
  };

  return { speakAll, stopAll, running };
}

/* ═══════════════════════════════════════════
   WORD CHIP with TTS
═══════════════════════════════════════════ */
function WordChip({
  word, highlight, speak, speaking,
}: {
  word: string;
  highlight: string;
  speak: (w: string) => void;
  speaking: string | null;
}) {
  const color    = getColor(word);
  const isActive = speaking === word;

  const renderWord = () => {
    if (!highlight) return word;
    const idx = word.indexOf(highlight);
    if (idx === -1) return word;
    return (
      <>
        {word.slice(0, idx)}
        <span style={{ fontWeight: 900, textDecoration: "underline" }}>
          {word.slice(idx, idx + highlight.length)}
        </span>
        {word.slice(idx + highlight.length)}
      </>
    );
  };

  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center",
      borderRadius: "10px", overflow: "hidden",
      border: `1.5px solid ${alpha(color, isActive ? 0.9 : 0.25)}`,
      background: isActive ? color : alpha(color, 0.06),
      transition: "all 0.18s",
      "&:hover": { background: alpha(color, 0.15) },
    }}>
      {/* Word label */}
      <Typography sx={{
        fontFamily: "'Noto Serif Telugu', serif",
        fontSize: { xs: "1rem", sm: "1.1rem" },
        fontWeight: 700,
        color: isActive ? "#fff" : color,
        px: 1.5, py: 0.8,
        userSelect: "none",
        letterSpacing: 0.5,
      }}>
        {renderWord()}
      </Typography>

      {/* TTS button */}
      <Tooltip title={isActive ? "ఆపు" : "వినండి"} arrow>
        <IconButton
          size="small"
          onClick={() => speak(word)}
          sx={{
            borderRadius: 0,
            borderLeft: `1px solid ${alpha(color, isActive ? 0.5 : 0.2)}`,
            px: 0.8, py: 0.8,
            color: isActive ? "#fff" : color,
            background: isActive ? alpha("#fff", 0.15) : "transparent",
            "&:hover": { background: alpha(color, 0.2) },
            transition: "all 0.15s",
          }}
        >
          {isActive
            ? <StopRoundedIcon sx={{ fontSize: 14 }} />
            : <VolumeUpRoundedIcon sx={{ fontSize: 14 }} />
          }
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/* ═══════════════════════════════════════════
   AKSHARAMU FILTER BAR
═══════════════════════════════════════════ */
function AksharaBar({ selected, onChange }: { selected: string; onChange: (a: string) => void }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1 }}>స్వరాలు</Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap mb={1.5}>
        {SWARALU.map(a => (
          <Chip key={a} label={a} size="small" onClick={() => onChange(selected === a ? "" : a)}
            sx={{
              fontFamily: "'Noto Serif Telugu', serif", fontSize: 15,
              fontWeight: 700, cursor: "pointer", height: 34, minWidth: 36,
              ...(selected === a
                ? { background: SWARA_COLOR, color: "#fff" }
                : { background: alpha(SWARA_COLOR, 0.08), color: SWARA_COLOR, border: `1px solid ${alpha(SWARA_COLOR, 0.2)}` }),
            }} />
        ))}
      </Stack>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1 }}>వ్యంజనాలు</Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
        {VYANJANALU.map(a => (
          <Chip key={a} label={a} size="small" onClick={() => onChange(selected === a ? "" : a)}
            sx={{
              fontFamily: "'Noto Serif Telugu', serif", fontSize: 15,
              fontWeight: 700, cursor: "pointer", height: 34, minWidth: 36,
              ...(selected === a
                ? { background: VYANJANA_COLOR, color: "#fff" }
                : { background: alpha(VYANJANA_COLOR, 0.08), color: VYANJANA_COLOR, border: `1px solid ${alpha(VYANJANA_COLOR, 0.2)}` }),
            }} />
        ))}
      </Stack>
    </Box>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function PadalaMala() {
  const [tab, setTab]             = useState(0);
  const [search, setSearch]       = useState("");
  const [aksharamu, setAksharamu] = useState("");
  const { speak, stop, speaking } = useTTS();
  const { speakAll, stopAll, running } = useSpeakAll();

  const allWords = tab === 0 ? TWO_LETTER : tab === 1 ? THREE_FOUR_LETTER : [...TWO_LETTER, ...THREE_FOUR_LETTER];

  const filtered = useMemo(() =>
    allWords.filter(w => {
      const matchA = !aksharamu || w.startsWith(aksharamu);
      const matchS = !search    || w.includes(search);
      return matchA && matchS;
    }), [allWords, aksharamu, search]);

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    filtered.forEach(w => {
      if (!map[w[0]]) map[w[0]] = [];
      map[w[0]].push(w);
    });
    return map;
  }, [filtered]);

  const groupKeys = Object.keys(grouped).sort((a, b) =>
    ALL_AKSHARALU.indexOf(a) - ALL_AKSHARALU.indexOf(b));

  const isFiltered = !!aksharamu || !!search;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} mb={1}>
          <AutoStoriesRoundedIcon sx={{ color: "#2d6a4f", fontSize: 30 }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "#1a3d2b", fontFamily: "'Noto Serif Telugu', serif" }}>
            పదాల మాల
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.95rem", color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8 }}>
          తెలుగు అక్షరములతో పదములు — 🔊 ప్రతి పదం వినవచ్చు
        </Typography>
        <Stack direction="row" justifyContent="center" gap={1} mt={1.5} flexWrap="wrap" useFlexGap>
          <Chip label={`${TWO_LETTER.length} రెండక్షరాల పదాలు`} size="small"
            sx={{ background: alpha(SWARA_COLOR, 0.1), color: SWARA_COLOR, fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
          <Chip label={`${THREE_FOUR_LETTER.length} మూడు/నాలుగు అక్షరాల పదాలు`} size="small"
            sx={{ background: alpha(VYANJANA_COLOR, 0.1), color: VYANJANA_COLOR, fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
          <Chip label={`${filtered.length} కనిపిస్తున్నాయి`} size="small"
            sx={{ background: alpha("#784212", 0.1), color: "#784212", fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setAksharamu(""); setSearch(""); }}
          sx={{
            "& .MuiTab-root": { fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700, fontSize: 14, textTransform: "none" },
            "& .Mui-selected": { color: "#2d6a4f !important" },
            "& .MuiTabs-indicator": { background: "#2d6a4f" },
          }}>
          <Tab label="రెండక్షరాల పదాలు" />
          <Tab label="మూడు/నాలుగు అక్షరాలు" />
          <Tab label="అన్నీ కలిపి" />
        </Tabs>
      </Box>

      {/* Search + Speak All */}
      <Stack direction="row" spacing={1.5} mb={2.5} alignItems="center">
        <TextField fullWidth
          placeholder="పదం వెతకండి... (ఉదా: కల, అర, గంట)"
          value={search}
          onChange={e => { setSearch(e.target.value); setAksharamu(""); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
            sx: { borderRadius: "12px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 16 },
          }}
        />
        <Button
          variant="contained" disableElevation
          onClick={() => running ? stopAll() : speakAll(filtered)}
          startIcon={running ? <StopRoundedIcon /> : <VolumeUpRoundedIcon />}
          sx={{
            borderRadius: "10px", px: 2.5, py: 1.5, whiteSpace: "nowrap",
            background: running ? "#c0392b" : "#2d6a4f",
            fontWeight: 700, textTransform: "none", fontSize: 13,
            fontFamily: "'Noto Serif Telugu', serif",
            "&:hover": { background: running ? "#922b21" : "#1a3d2b" },
          }}
        >
          {running ? "ఆపు" : "అన్నీ వినండి"}
        </Button>
      </Stack>

      {/* Aksharamu Filter */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: alpha("#2d6a4f", 0.15), borderRadius: "14px", mb: 3 }}>
        <CardContent sx={{ p: "16px 18px !important" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
              అక్షరం బట్టి filter చేయండి
            </Typography>
            {aksharamu && (
              <Button size="small" onClick={() => setAksharamu("")}
                sx={{ fontSize: 12, textTransform: "none", color: "text.secondary" }}>
                Clear ✕
              </Button>
            )}
          </Stack>
          <AksharaBar selected={aksharamu} onChange={a => { setAksharamu(a); setSearch(""); }} />
        </CardContent>
      </Card>

      {/* Words */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontSize: "2rem", mb: 1 }}>🔍</Typography>
          <Typography sx={{ color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", fontSize: "1.1rem" }}>
            పదాలు దొరకలేదు
          </Typography>
        </Box>
      ) : isFiltered ? (
        <Box>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2, fontFamily: "'Noto Serif Telugu', serif" }}>
            {filtered.length} పదాలు
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
            {filtered.map(w => (
              <WordChip key={w} word={w} highlight={aksharamu || search} speak={speak} speaking={speaking} />
            ))}
          </Stack>
        </Box>
      ) : (
        <Stack spacing={3}>
          {groupKeys.map(key => {
            const color = SWARALU.includes(key) ? SWARA_COLOR : VYANJANA_COLOR;
            return (
              <Box key={key}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: "10px", background: color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#fff", fontFamily: "'Noto Serif Telugu', serif" }}>
                      {key}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "1rem", color, fontFamily: "'Noto Serif Telugu', serif" }}>
                      "{key}" తో పదాలు
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                      {grouped[key].length} పదాలు
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, height: 1, background: alpha(color, 0.2) }} />
                  {/* Speak group */}
                  <Tooltip title={`"${key}" అన్ని పదాలు వినండి`} arrow>
                    <IconButton size="small" onClick={() => speakAll(grouped[key])}
                      sx={{ color, border: `1px solid ${alpha(color, 0.3)}`, borderRadius: "8px", p: 0.8 }}>
                      <VolumeUpRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap sx={{ pl: 1 }}>
                  {grouped[key].map(w => (
                    <WordChip key={w} word={w} highlight="" speak={speak} speaking={speaking} />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Tip */}
      <Box sx={{ mt: 4, p: 2, borderRadius: "10px", background: alpha("#2d6a4f", 0.05), border: `1px dashed ${alpha("#2d6a4f", 0.2)}` }}>
        <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", textAlign: "center" }}>
          💡 పదం పక్కన 🔊 నొక్కితే ఆ పదం వినిపిస్తుంది · "అన్నీ వినండి" నొక్కితే అన్ని పదాలు వినిపిస్తాయి
        </Typography>
      </Box>

    
    </Box>
  );
}