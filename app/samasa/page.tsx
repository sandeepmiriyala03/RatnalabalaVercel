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
import SamasaDetectorPanel from "@/app/components/SamasaDetectorPanel";
import { SamasaGrid } from "@/app/components/TeluguDataGrid";
import { SAMASA_RULES } from "@/data/bhashaMala";
/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
// SAMASA_RULES → data/bhashaMala.ts (జ్ఞానమాల కూడా అదే వాడుతుంది)

const SAMASA_COLORS = ["#2d6a4f","#1a5276","#6c3483","#784212","#922b21","#1a5c3a"];

/* ═══════════════════════════════════════════
   SAMASA CARD
═══════════════════════════════════════════ */
function SamasaCard({ rule, colorIdx }: { rule: typeof SAMASA_RULES[0]; colorIdx: number }) {
  const [open, setOpen] = useState(false);
  const color = SAMASA_COLORS[colorIdx % SAMASA_COLORS.length];

  return (
    <Card elevation={0} sx={{
      border: `1px solid ${alpha(color, 0.2)}`, borderRadius: "14px",
      overflow: "hidden", transition: "box-shadow 0.2s",
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
            <Chip label={rule.pradhanyam} size="small" sx={{
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
          {rule.definition}
        </Typography>

        <Collapse in={open} timeout={280} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, borderStyle: "dashed", borderColor: alpha(color, 0.2) }} />

            {/* Vigraha vakya */}
            <Box sx={{ background: alpha(color, 0.05), borderLeft: `3px solid ${color}`, borderRadius: "0 8px 8px 0", px: 2, py: 1.2, mb: 2 }}>
              <Typography sx={{ fontSize: 11, color, fontWeight: 700, mb: 0.3, fontFamily: "'Noto Serif Telugu', serif" }}>విగ్రహ వాక్యం</Typography>
              <Typography sx={{ fontSize: 13, color: "text.primary", fontFamily: "'Noto Serif Telugu', serif" }}>{rule.vigrahyaVakya}</Typography>
            </Box>

            {/* Subtypes */}
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>రకాలు</Typography>
            <Stack spacing={0.6} mb={2}>
              {rule.subtypes.map((sub, i) => (
                <Stack key={i} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={1}
                  sx={{ background: alpha(color, 0.04), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif", minWidth: 180 }}>
                    {sub.name}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color, fontFamily: "'Noto Serif Telugu', serif", fontWeight: 700 }}>{sub.example}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>= {sub.vigraha}</Typography>
                </Stack>
              ))}
            </Stack>

            {/* Examples */}
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1, letterSpacing: 0.5, textTransform: "uppercase" }}>ఉదాహరణలు</Typography>
            <Stack spacing={0.8}>
              {rule.examples.map((ex, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5}
                  sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif", minWidth: 120 }}>{ex.samasa}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>=</Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>{ex.vigraha}</Typography>
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
   MAIN PAGE
═══════════════════════════════════════════ */
export default function SamasaMalaPage() {
  const [tab, setTab]       = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    SAMASA_RULES.filter(r => {
      const q = search.toLowerCase();
      return !q || r.name.includes(q) || r.definition.includes(q) ||
        r.examples.some(e => e.samasa.includes(q) || e.vigraha.includes(q));
    }), [search]);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={1}>
          <AutoStoriesRoundedIcon sx={{ color: "#2d6a4f", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "2rem" }, color: "#1a3d2b", fontFamily: "'Noto Serif Telugu', serif" }}>
            సమాస మాల
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif", lineHeight: 1.8, maxWidth: 600, mx: "auto" }}>
          తెలుగు వ్యాకరణంలో సమాస నిర్వచనాలు, రకాలు, విగ్రహ వాక్యాలతో
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
          <Tab icon={<MenuBookRoundedIcon fontSize="small" />} iconPosition="start" label="సమాస జాబితా" />
          <Tab icon={<FindInPageRoundedIcon fontSize="small" />} iconPosition="start" label="సమాస గుర్తించు" />
          <Tab icon={<TableRowsRoundedIcon fontSize="small" />} iconPosition="start" label="యుక్తి AI పట్టిక" />
        </Tabs>
      </Box>

      {/* TAB 0 — LIST */}
      {tab === 0 && (
        <Box>
          <TextField fullWidth placeholder="సమాస పేరు లేదా ఉదాహరణ వెతకండి..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
              sx: { borderRadius: "12px", fontFamily: "'Noto Serif Telugu', serif", fontSize: 15 },
            }}
            sx={{ mb: 3 }} />
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
                "{search}" కి సమాసాలు దొరకలేదు
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filtered.map((rule, i) => <SamasaCard key={rule.id} rule={rule} colorIdx={i} />)}
            </Stack>
          )}
        </Box>
      )}

      {/* TAB 1 — DETECTOR */}
      {tab === 1 && <SamasaDetectorPanel />}

      {/* TAB 2 — యుక్తి AI పట్టిక · PDF · Excel */}
      {tab === 2 && <SamasaGrid rules={SAMASA_RULES} />}

    </Box>
  );
}