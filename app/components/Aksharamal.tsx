"use client";

import React, { useMemo, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
  Pagination,
  Grid
} from "@mui/material";

import AksharaPosterCard from "@/app/components/AksharaMalaPoster";

/* ================= TYPE ================= */

type Akshara = {
  id: string;
  type: "swaralu" | "vyanjanalu" | "gunintalu";
  letter: string;
  word?: string;
  image?: string;
};

/* ================= FULL DATA (41 AKSHARALU) ================= */

const AKSHARALU: Akshara[] = [
  // అచ్చులు (Swaralu) - 16
  { id: "s1", type: "swaralu", letter: "అ", word: "అరటి", image: "/images/akshara/1.jpg" },
  { id: "s2", type: "swaralu", letter: "ఆ", word: "ఆవు", image: "/images/akshara/2.jpg" },
  { id: "s3", type: "swaralu", letter: "ఇ", word: "ఇల్లు", image: "/images/akshara/3.jpg" },
  { id: "s4", type: "swaralu", letter: "ఈ", word: "ఈక", image: "/images/akshara/4.jpg" },
  { id: "s5", type: "swaralu", letter: "ఉ", word: "ఉడుత", image: "/images/akshara/5.jpg" },
  { id: "s6", type: "swaralu", letter: "ఊ", word: "ఊయల", image: "/images/akshara/6.jpg" },
  { id: "s7", type: "swaralu", letter: "ఋ", word: "ఋషి", image: "/images/akshara/7.jpg" },
  { id: "s8", type: "swaralu", letter: "ౠ", word: "ౠ", image: "/images/akshara/42.jpg" }, // కొత్తగా చేర్చినది
  { id: "s9", type: "swaralu", letter: "ఎ", word: "ఎలుక", image: "/images/akshara/8.jpg" },
  { id: "s10", type: "swaralu", letter: "ఏ", word: "ఏనుగు", image: "/images/akshara/9.jpg" },
  { id: "s11", type: "swaralu", letter: "ఐ", word: "ఐదు", image: "/images/akshara/10.jpg" },
  { id: "s12", type: "swaralu", letter: "ఒ", word: "ఒంటె", image: "/images/akshara/11.jpg" },
  { id: "s13", type: "swaralu", letter: "ఓ", word: "ఓడ", image: "/images/akshara/12.jpg" },
  { id: "s14", type: "swaralu", letter: "ఔ", word: "ఔషధం", image: "/images/akshara/13.jpg" },
  { id: "s15", type: "swaralu", letter: "అం", word: "అంకెలు", image: "/images/akshara/14.jpg" },
  { id: "s16", type: "swaralu", letter: "అః", word: "అంతఃపురం", image: "/images/akshara/15.jpg" },

  // హల్లులు (Vyanjanalu) - 29
  { id: "v1", type: "vyanjanalu", letter: "క", word: "కప్ప", image: "/images/akshara/16.jpg" },
  { id: "v2", type: "vyanjanalu", letter: "ఖ", word: "ఖడ్గం", image: "/images/akshara/17.jpg" },
  { id: "v3", type: "vyanjanalu", letter: "గ", word: "గడియారం", image: "/images/akshara/18.jpg" },
  { id: "v4", type: "vyanjanalu", letter: "ఘ", word: "ఘంట", image: "/images/akshara/19.jpg" },
  { id: "v5", type: "vyanjanalu", letter: "ఙ", word: "ఙ", image: "/images/akshara/43.jpg" }, // కొత్తగా చేర్చినది
  { id: "v6", type: "vyanjanalu", letter: "చ", word: "చందమామ", image: "/images/akshara/20.jpg" },
  { id: "v7", type: "vyanjanalu", letter: "ఛ", word: "ఛత్రం", image: "/images/akshara/21.jpg" },
  { id: "v8", type: "vyanjanalu", letter: "జ", word: "జడ", image: "/images/akshara/22.jpg" },
  { id: "v9", type: "vyanjanalu", letter: "ఝ", word: "ఝషం", image: "/images/akshara/23.jpg" },
  { id: "v10", type: "vyanjanalu", letter: "ఞ", word: "ఞ", image: "/images/akshara/44.jpg" }, // కొత్తగా చేర్చినది
  { id: "v11", type: "vyanjanalu", letter: "ట", word: "టపాకాయ", image: "/images/akshara/24.jpg" },
  { id: "v12", type: "vyanjanalu", letter: "ఠ", word: "కంఠం", image: "/images/akshara/25.jpg" },
  { id: "v13", type: "vyanjanalu", letter: "డ", word: "డమరుకం", image: "/images/akshara/26.jpg" },
  { id: "v14", type: "vyanjanalu", letter: "ఢ", word: "ఢంకా", image: "/images/akshara/27.jpg" },
  { id: "v15", type: "vyanjanalu", letter: "ణ", word: "వీణ", image: "/images/akshara/28.jpg" },
  { id: "v16", type: "vyanjanalu", letter: "త", word: "తబల", image: "/images/akshara/29.jpg" },
  { id: "v17", type: "vyanjanalu", letter: "థ", word: "రథం", image: "/images/akshara/30.jpg" },
  { id: "v18", type: "vyanjanalu", letter: "ద", word: "దండ", image: "/images/akshara/31.jpg" },
  { id: "v19", type: "vyanjanalu", letter: "ధ", word: "ధనుస్సు", image: "/images/akshara/32.jpg" },
  { id: "v20", type: "vyanjanalu", letter: "న", word: "నక్క", image: "/images/akshara/33.jpg" },
  { id: "v21", type: "vyanjanalu", letter: "ప", word: "పలక", image: "/images/akshara/34.jpg" },
  { id: "v22", type: "vyanjanalu", letter: "ఫ", word: "ఫలం", image: "/images/akshara/35.jpg" },
  { id: "v23", type: "vyanjanalu", letter: "బ", word: "బంతి", image: "/images/akshara/36.jpg" },
  { id: "v24", type: "vyanjanalu", letter: "భ", word: "భల్లూకం", image: "/images/akshara/37.jpg" },
  { id: "v25", type: "vyanjanalu", letter: "మ", word: "మరము", image: "/images/akshara/38.jpg" },
  { id: "v26", type: "vyanjanalu", letter: "య", word: "యంత్రం", image: "/images/akshara/39.jpg" },
  { id: "v27", type: "vyanjanalu", letter: "ర", word: "రథం", image: "/images/akshara/40.jpg" },
  { id: "v28", type: "vyanjanalu", letter: "ల", word: "లత", image: "/images/akshara/41.jpg" },
  { id: "v29", type: "vyanjanalu", letter: "వ", word: "వనం", image: "/images/akshara/45.jpg" }, // కొత్తగా చేర్చినది
];
/* ================= MAIN PARENT ================= */

const PAGE_SIZE = 4; // విజువల్స్ పెద్దవి కాబట్టి పేజీకి 4 బాగుంటుంది

export default function AksharamalaParent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return AKSHARALU;
    return AKSHARALU.filter(
      (a) => a.letter.includes(term) || a.word?.includes(term)
    );
  }, [search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <Stack spacing={4} sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      {/* HEADER & SEARCH */}
      <Box textAlign="center" sx={{ mb: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: "#d32f2f", mb: 2 }}>
          తెలుగు అక్షరమాల
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
          <Chip label={`మొత్తం: ${filtered.length}`} color="secondary" />
          <Chip label={`పేజీ: ${page} / ${pageCount}`} color="primary" variant="outlined" />
        </Stack>
        <TextField
          fullWidth
          variant="filled"
          placeholder="అక్షరం లేదా పదం వెతకండి..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ bgcolor: "white", borderRadius: 2 }}
        />
      </Box>

      {/* CARDS GRID */}
      {filtered.length === 0 ? (
        <Typography align="center" sx={{ py: 10, fontSize: "1.2rem", opacity: 0.6 }}>
          క్షమించండి! వెతికిన అక్షరాలు దొరకలేదు.
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {visible.map((a) => (
            <Grid item xs={12} sm={6} key={a.id}>
              <AksharaPosterCard akshara={a} enableRead={true} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* PAGINATION */}
      {pageCount > 1 && (
        <Box display="flex" justifyContent="center" sx={{ mt: 4, pb: 6 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => {
              setPage(v);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Stack>
  );
}