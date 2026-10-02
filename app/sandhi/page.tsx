"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Typography, Card, CardContent, Chip,
  TextField, InputAdornment, Collapse, Divider,
  Stack, Button, alpha, Tab, Tabs,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import FindInPageRoundedIcon from "@mui/icons-material/FindInPageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";

import { SandhiGrid } from "@/app/components/TeluguDataGrid";
import { SANDHI_RULES } from "@/data/bhashaMala";

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
// SANDHI_RULES → data/bhashaMala.ts (జ్ఞానమాల కూడా అదే వాడుతుంది)

const CATEGORIES = ["అన్నీ", "స్వర సంధి", "హల్ సంధి", "విసర్గ సంధి", "తెలుగు సంధి", "ఆగమ సంధి", "సమాస సంధి"];

const CAT_COLOR: Record<string, string> = {
  "స్వర సంధి":   "#2d6a4f",
  "హల్ సంధి":    "#1a5276",
  "విసర్గ సంధి": "#784212",
  "తెలుగు సంధి": "#6c3483",
  "ఆగమ సంధి":   "#1a5c3a",
  "సమాస సంధి":  "#922b21",
};

/* ═══════════════════════════════════════════
   SANDHI DETECTOR ENGINE
═══════════════════════════════════════════ */
interface DetectResult {
  detected: boolean;
  sandhiId: number;
  sandhiName: string;
  rule: string;
  purva: string;
  para: string;
  result: string;
  category: string;
  examples: { before: string; after: string }[];
}

function detectSandhi(word: string): DetectResult {
  const NOT_FOUND: DetectResult = {
    detected: false, sandhiId: 0, sandhiName: "", rule: "",
    purva: "", para: "", result: "", category: "", examples: [],
  };

  const match = (id: number): DetectResult => {
    const r = SANDHI_RULES.find(x => x.id === id)!;
    return { detected: true, sandhiId: r.id, sandhiName: r.name, rule: r.rule,
      purva: r.purva, para: r.para, result: r.result, category: r.category, examples: r.examples };
  };

  // 4. యణాదేశ సంధి — త్య, ద్య, న్య, వ్య, మ్వ, న్వ
  if (/[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]్య|[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]్వ/.test(word))
    return match(4);

  // 26. ద్విరుక్తటకార సంధి
  if (/చిట్ట|కుట్ట|నట్ట|కట్టెద/.test(word)) return match(26);

  // 13. త్రిక సంధి
  if (/అత్తె|ఎచ్చ|ఆట్ట|ఈట్ట/.test(word)) return match(13);

  // 22. ద్విగు సమాస సంధి
  if (/ముల్ల|త్రిల్ల/.test(word)) return match(22);

  // 16. రుగాగమ సంధి
  if (/రాలు|రాలి|రాల$/.test(word)) return match(16);

  // 18. టుగాగమ సంధి
  if (/టాకు|టాకి|టాత/.test(word)) return match(18);

  // 11. యడాగమ సంధి — vowel + య + vowel pattern
  if (/[అఆఇఈఉఊఎఏఒఓ]య[అఆఇఈఉఊఎఏఒఓ]/.test(word)) return match(11);

  // 24. అల్లోప సంధి
  if (/నాది|వాది|తనది|వీడిది/.test(word) || (word.endsWith("ది") && word.length > 3)) return match(24);

  // 3. వృద్ధి సంధి — ై
  if (/ై/.test(word) && !/[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]ై/.test(word)) return match(3);

  // 2. గుణసంధి — ే + ంద్ర or ో
  if (/ేంద్ర|ేశ్వర|ేంద్రు|ోత్సవ|ోపగత|ార్షి/.test(word)) return match(2);

  // 1. సవర్ణదీర్ఘ సంధి — ీంద్ర or ూత్సవ
  if (/ీంద్ర|ూత్సవ|ారులు|ీంద్రు/.test(word)) return match(1);

  // 8. అకార సంధి — double consonant హల్లు merge
  if (/[కఖగఘచఛజఝటఠడఢణతథదధనపఫబభమయరలవశషసహళ]త్త/.test(word)) return match(8);

  // 14. గసడదవాదేశ సంధి
  if (/డుద|డుగ|డుజ|డుబ/.test(word)) return match(14);

  // 19. నుగాగమ సంధి
  if (/యున|లున|వున/.test(word)) return match(19);

  return NOT_FOUND;
}

/* ═══════════════════════════════════════════
   SANDHI CARD (for list view)
═══════════════════════════════════════════ */
function SandhiCard({ rule }: { rule: typeof SANDHI_RULES[0] }) {
  const [open, setOpen] = useState(false);
  const color = CAT_COLOR[rule.category] || "#2d6a4f";
  return (
    <Card elevation={0} sx={{
      border: `1px solid ${alpha(color, 0.2)}`, borderRadius: "14px", overflow: "hidden",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: `0 4px 20px ${alpha(color, 0.12)}` },
    }}>
      <Box sx={{ height: 4, background: color }} />
      <CardContent sx={{ p: "16px 18px", "&:last-child": { pb: "16px" } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(color, 0.7), fontFamily: "'Noto Serif Telugu', serif" }}>
                {rule.id}.
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem" }, color: "text.primary", fontFamily: "'Noto Serif Telugu', serif" }}>
                {rule.name}
              </Typography>
            </Stack>
            <Chip label={rule.category} size="small" sx={{
              fontSize: 11, height: 22, fontFamily: "'Noto Serif Telugu', serif",
              background: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.3)}`,
            }} />
          </Box>
          <Button size="small" onClick={() => setOpen(v => !v)}
            endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            sx={{
              textTransform: "none", fontWeight: 700, fontSize: 12, color,
              border: `1px solid ${alpha(color, 0.3)}`, borderRadius: "8px",
              px: 1.5, py: 0.5, minWidth: 0, "&:hover": { background: alpha(color, 0.06) },
            }}>
            {open ? "తక్కువ" : "వివరాలు"}
          </Button>
        </Stack>

        <Typography sx={{
          mt: 1.2, fontSize: 13, color: "text.secondary", lineHeight: 1.8,
          fontFamily: "'Noto Serif Telugu', serif",
          display: "-webkit-box", WebkitLineClamp: open ? "unset" : 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {rule.rule}
        </Typography>

        <Collapse in={open} timeout={280} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, borderStyle: "dashed", borderColor: alpha(color, 0.2) }} />
            <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap" useFlexGap>
              {[
                { label: "పూర్వం", value: rule.purva },
                { label: "+", value: null },
                { label: "పరం", value: rule.para },
                { label: "→", value: null },
                { label: "ఫలితం", value: rule.result },
              ].map((item, i) =>
                item.value === null ? (
                  <Typography key={i} sx={{ color: "text.secondary", fontWeight: 700 }}>{item.label}</Typography>
                ) : (
                  <Box key={i} sx={{
                    background: alpha(color, item.label === "ఫలితం" ? 0.15 : 0.1),
                    border: `1px solid ${alpha(color, item.label === "ఫలితం" ? 0.4 : 0.3)}`,
                    borderRadius: "8px", px: 1.5, py: 0.5,
                  }}>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: item.label === "ఫలితం" ? 14 : 13, fontWeight: item.label === "ఫలితం" ? 800 : 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{item.value}</Typography>
                  </Box>
                )
              )}
            </Stack>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>
              ఉదాహరణలు
            </Typography>
            <Stack spacing={0.8}>
              {rule.examples.map((ex, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5}
                  sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                  <Typography sx={{ fontSize: 14, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.before}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>→</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{ex.after}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   DETECTOR RESULT CARD
═══════════════════════════════════════════ */
function DetectorResult({ res, input }: { res: DetectResult; input: string }) {
  const color = CAT_COLOR[res.category] || "#2d6a4f";
  return (
    <Card elevation={0} sx={{ border: `2px solid ${alpha(color, 0.4)}`, borderRadius: "14px", overflow: "hidden" }}>
      <Box sx={{ height: 5, background: color }} />
      <CardContent sx={{ p: "20px 22px !important" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.4rem" }, color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {res.sandhiName}
            </Typography>
            <Chip label={res.category} size="small" sx={{
              mt: 0.5, fontFamily: "'Noto Serif Telugu', serif", fontSize: 12, height: 24,
              background: alpha(color, 0.1), color, border: `1px solid ${alpha(color, 0.3)}`,
            }} />
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", background: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color }}>{res.sandhiId}</Typography>
          </Box>
        </Stack>

        {/* Input word */}
        <Box sx={{ background: alpha(color, 0.07), borderRadius: "8px", px: 2, py: 1.2, mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", mb: 0.3 }}>మీరు ఇచ్చిన పదం</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Noto Serif Telugu', serif" }}>{input}</Typography>
        </Box>

        {/* Pattern */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2.5} flexWrap="wrap" useFlexGap>
          {[
            { label: "పూర్వం", value: res.purva },
            { label: "+", value: null },
            { label: "పరం", value: res.para },
            { label: "→", value: null },
            { label: "ఫలితం", value: res.result },
          ].map((item, i) =>
            item.value === null ? (
              <Typography key={i} sx={{ fontWeight: 700, color: "text.secondary", fontSize: 18 }}>{item.label}</Typography>
            ) : (
              <Box key={i} sx={{
                background: alpha(color, item.label === "ఫలితం" ? 0.15 : 0.08),
                border: `${item.label === "ఫలితం" ? 2 : 1}px solid ${alpha(color, item.label === "ఫలితం" ? 0.4 : 0.25)}`,
                borderRadius: "8px", px: 1.5, py: 0.8, textAlign: "center",
              }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{item.label}</Typography>
                <Typography sx={{ fontSize: item.label === "ఫలితం" ? 18 : 16, fontWeight: 800, color, fontFamily: "'Noto Serif Telugu', serif" }}>{item.value}</Typography>
              </Box>
            )
          )}
        </Stack>

        {/* Rule */}
        <Box sx={{ background: alpha(color, 0.05), borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", px: 2, py: 1.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: 11, color, fontWeight: 700, mb: 0.5, fontFamily: "'Noto Serif Telugu', serif", letterSpacing: 0.5 }}>నియమం</Typography>
          <Typography sx={{ fontSize: 14, color: "text.primary", lineHeight: 1.9, fontFamily: "'Noto Serif Telugu', serif" }}>{res.rule}</Typography>
        </Box>

        {/* Examples */}
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>ఉదాహరణలు</Typography>
        <Stack spacing={0.8}>
          {res.examples.map((ex, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1}
              sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
              <Typography sx={{ fontSize: 14, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.before}</Typography>
              <Typography sx={{ color: "text.secondary" }}>→</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>{ex.after}</Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function SandhiMalaPage() {
  const [tab, setTab] = useState(0);

  // List tab state
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("అన్నీ");

  // Detector tab state
  const [input, setInput]       = useState("");
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [tried, setTried]       = useState(false);

  const SAMPLES = ["మునీంద్ర","దేవేంద్ర","అత్యంత","మాయమ్మ","చిట్టడవి","నాది","పేదరాలు","రక్షైక","చిగురుటాకు","ముల్లోకములు"];

  const filtered = useMemo(() => {
    return SANDHI_RULES.filter(r => {
      const matchCat = category === "అన్నీ" || r.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || r.name.includes(q) || r.rule.includes(q) ||
        r.examples.some(e => e.before.includes(q) || e.after.includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const handleDetect = () => {
    if (!input.trim()) return;
    setDetectResult(detectSandhi(input.trim()));
    setTried(true);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={1}>
          <AutoStoriesRoundedIcon sx={{ color: "#2d6a4f", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "#1a3d2b", fontFamily: "'Noto Serif Telugu', serif" }}>
            సంధి మాల
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8, maxWidth: 600, mx: "auto" }}>
          తెలుగు వ్యాకరణంలో ౨౬ సంధి నియమాలు — నిర్వచనాలు, నియమాలు, ఉదాహరణలతో
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
          sx={{
            "& .MuiTab-root": { fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700, fontSize: 14, textTransform: "none" },
            "& .Mui-selected": { color: "#2d6a4f !important" },
            "& .MuiTabs-indicator": { background: "#2d6a4f" },
          }}>
          <Tab icon={<MenuBookRoundedIcon fontSize="small" />} iconPosition="start" label="సంధి జాబితా" />
          <Tab icon={<FindInPageRoundedIcon fontSize="small" />} iconPosition="start" label="సంధి గుర్తించు" />
          <Tab icon={<TableRowsRoundedIcon fontSize="small" />} iconPosition="start" label="యుక్తి AI పట్టిక" />
        </Tabs>
      </Box>

      {/* ── TAB 0: LIST ── */}
      {tab === 0 && (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <Chip label={`${SANDHI_RULES.length} సంధులు`} size="small"
              sx={{ background: alpha("#2d6a4f", 0.1), color: "#2d6a4f", fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
            <Chip label={`${filtered.length} కనిపిస్తున్నాయి`} size="small"
              sx={{ background: alpha("#1a5276", 0.1), color: "#1a5276", fontWeight: 700, fontFamily: "'Noto Serif Telugu', serif" }} />
          </Stack>

          <TextField fullWidth placeholder="సంధి పేరు లేదా ఉదాహరణ వెతకండి..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
              sx: { borderRadius: "12px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 15 },
            }}
            sx={{ mb: 2 }} />

          <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
            {CATEGORIES.map(cat => (
              <Chip key={cat} label={cat} onClick={() => setCategory(cat)}
                sx={{
                  fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", height: 34,
                  ...(category === cat
                    ? { background: "#2d6a4f", color: "white" }
                    : { background: alpha("#2d6a4f", 0.08), color: "#2d6a4f", border: `1px solid ${alpha("#2d6a4f", 0.2)}` }),
                }} />
            ))}
          </Stack>

          {filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", fontSize: "1.1rem" }}>
                "{search}" కి సంధులు దొరకలేదు
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filtered.map(rule => <SandhiCard key={rule.id} rule={rule} />)}
            </Stack>
          )}
        </Box>
      )}

      {/* ── TAB 2: యుక్తి AI పట్టిక · PDF · Excel ── */}
      {tab === 2 && <SandhiGrid rules={SANDHI_RULES} />}

      {/* ── TAB 1: DETECTOR ── */}
      {tab === 1 && (
        <Box>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: alpha("#2d6a4f", 0.2), borderRadius: "14px", mb: 2.5 }}>
            <CardContent sx={{ p: "20px !important" }}>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5, fontFamily: "'Noto Serif Telugu', serif" }}>
                తెలుగు పదం టైప్ చేయండి — సంధి automatic గా గుర్తించబడుతుంది
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth value={input}
                  onChange={e => { setInput(e.target.value); setTried(false); setDetectResult(null); }}
                  onKeyDown={e => e.key === "Enter" && handleDetect()}
                  placeholder="ఉదా: మునీంద్ర, దేవేంద్ర, అత్యంత..."
                  InputProps={{ sx: { borderRadius: "10px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 18 } }}
                />
                <Button variant="contained" disableElevation onClick={handleDetect} disabled={!input.trim()}
                  sx={{
                    borderRadius: "10px", px: 3, background: "#2d6a4f",
                    fontWeight: 700, fontSize: 14, textTransform: "none",
                    fontFamily: "'Noto Serif Telugu', serif",
                    "&:hover": { background: "#1a3d2b" },
                  }}>
                  గుర్తించు
                </Button>
              </Stack>

              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 1, fontFamily: "'Noto Serif Telugu', serif" }}>
                  ఉదాహరణలు click చేయండి:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
                  {SAMPLES.map(s => (
                    <Chip key={s} label={s} size="small"
                      onClick={() => { setInput(s); setDetectResult(null); setTried(false); }}
                      sx={{
                        fontFamily: "'Noto Serif Telugu', serif", fontSize: 13, cursor: "pointer",
                        background: alpha("#2d6a4f", 0.07), color: "#2d6a4f",
                        border: `1px solid ${alpha("#2d6a4f", 0.2)}`,
                        "&:hover": { background: alpha("#2d6a4f", 0.15) },
                      }} />
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Collapse in={tried} timeout={300}>
            {detectResult?.detected ? (
              <DetectorResult res={detectResult} input={input} />
            ) : tried && (
              <Card elevation={0} sx={{ border: "1px solid", borderColor: alpha("#e74c3c", 0.3), borderRadius: "14px" }}>
                <CardContent sx={{ p: "20px !important", textAlign: "center" }}>
                  <Typography sx={{ fontSize: "2rem", mb: 1 }}>🤔</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#e74c3c", fontFamily: "'Noto Serif Telugu', serif", mb: 0.5 }}>
                    సంధి గుర్తించలేకపోయాం
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                    "{input}" లో సంధి detect కాలేదు. వేరే పదం try చేయండి.
                  </Typography>
                  <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={0.8} mt={2} useFlexGap>
                    {["మునీంద్ర","దేవేంద్ర","చిట్టడవి"].map(s => (
                      <Chip key={s} label={s} size="small"
                        onClick={() => { setInput(s); setDetectResult(null); setTried(false); }}
                        sx={{ fontFamily: "'Noto Serif Telugu', serif", cursor: "pointer", background: alpha("#2d6a4f", 0.08), color: "#2d6a4f" }} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Collapse>
        </Box>
      )}

     
    </Box>
  );
}