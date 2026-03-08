"use client";

import React, { useMemo, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
  Pagination,
  Container
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

/* ================= DATA ================= */
const AKSHARALU: Akshara[] = [
  // అచ్చులు (Swaralu) - 16
 
  { id: "s1", type: "swaralu", letter: "అ", word: "అరటి", image: "/akshara/1.jpg" },
  { id: "s2", type: "swaralu", letter: "ఆ", word: "ఆవు", image: "/akshara/2.jpg" },
  { id: "s3", type: "swaralu", letter: "ఇ", word: "ఇల్లు", image: "/akshara/3.jpg" },
  { id: "s4", type: "swaralu", letter: "ఈ", word: "ఈక", image: "/akshara/4.jpg" },
  { id: "s5", type: "swaralu", letter: "ఉ", word: "ఉడుత", image: "/akshara/5.jpg" },
  { id: "s6", type: "swaralu", letter: "ఊ", word: "ఊయల", image: "/akshara/6.jpg" },

  { id: "s7", type: "swaralu", letter: "ఋ", word: "ఋషి" },
  { id: "s8", type: "swaralu", letter: "ౠ", word: "ౠ" },

  { id: "s9", type: "swaralu", letter: "ఎ", word: "ఎలుక", image: "/akshara/7.jpg" },
  { id: "s10", type: "swaralu", letter: "ఏ", word: "ఏనుగు", image: "/akshara/8.jpg" },
  { id: "s11", type: "swaralu", letter: "ఐ", word: "ఐదు", image: "/akshara/9.jpg" },
  { id: "s12", type: "swaralu", letter: "ఒ", word: "ఒంటె", image: "/akshara/10.jpg" },
  { id: "s13", type: "swaralu", letter: "ఓ", word: "ఓడ", image: "/akshara/11.jpg" },
  { id: "s14", type: "swaralu", letter: "ఔ", word: "ఔషధం", image: "/akshara/12.jpg" },
  { id: "s15", type: "swaralu", letter: "అం", word: "అంకెలు", image: "/akshara/13.jpg" },
  { id: "s16", type: "swaralu", letter: "అః", word: "అంతఃపురం" },

  { id: "v1", type: "vyanjanalu", letter: "క", word: "కప్ప", image: "/akshara/14.jpg" },
  { id: "v2", type: "vyanjanalu", letter: "ఖ", word: "ఖడ్గం", image: "/akshara/15.jpg" },
  { id: "v3", type: "vyanjanalu", letter: "గ", word: "గడియారం", image: "/akshara/16.jpg" },
  { id: "v4", type: "vyanjanalu", letter: "ఘ", word: "ఘంట", image: "/akshara/17.jpg" },

  { id: "v5", type: "vyanjanalu", letter: "ఙ", word: "ఙ" },

  { id: "v6", type: "vyanjanalu", letter: "చ", word: "చక్రము", image: "/akshara/18.jpg" },
  { id: "v7", type: "vyanjanalu", letter: "ఛ", word: "ఛత్రము", image: "/akshara/19.jpg" },
  { id: "v8", type: "vyanjanalu", letter: "జ", word: "జడ", image: "/akshara/20.jpg" }

  { id: "v9", type: "vyanjanalu", letter: "ఝ", word: "ఝషం", image: "/akshara/23.jpg" },
  { id: "v10", type: "vyanjanalu", letter: "ఞ", word: "ఞ", image: "/akshara/44.jpg" }, 
  { id: "v11", type: "vyanjanalu", letter: "ట", word: "టపాకాయ", image: "/akshara/24.jpg" },
  { id: "v12", type: "vyanjanalu", letter: "ఠ", word: "కంఠం", image: "/akshara/25.jpg" },
  { id: "v13", type: "vyanjanalu", letter: "డ", word: "డమరుకం", image: "/akshara/26.jpg" },
  { id: "v14", type: "vyanjanalu", letter: "ఢ", word: "ఢంకా", image: "/akshara/27.jpg" },
  { id: "v15", type: "vyanjanalu", letter: "ణ", word: "వీణ", image: "/akshara/28.jpg" },
  { id: "v16", type: "vyanjanalu", letter: "త", word: "తబల", image: "/akshara/29.jpg" },
  { id: "v17", type: "vyanjanalu", letter: "థ", word: "రథం", image: "/akshara/30.jpg" },
  { id: "v18", type: "vyanjanalu", letter: "ద", word: "దండ", image: "/akshara/31.jpg" },
  { id: "v19", type: "vyanjanalu", letter: "ధ", word: "ధనుస్సు", image: "/akshara/32.jpg" },
  { id: "v20", type: "vyanjanalu", letter: "న", word: "నక్క", image: "/akshara/33.jpg" },
  { id: "v21", type: "vyanjanalu", letter: "ప", word: "పలక", image: "/akshara/34.jpg" },
  { id: "v22", type: "vyanjanalu", letter: "ఫ", word: "ఫలం", image: "/akshara/35.jpg" },
  { id: "v23", type: "vyanjanalu", letter: "బ", word: "బంతి", image: "/akshara/36.jpg" },
  { id: "v24", type: "vyanjanalu", letter: "భ", word: "భల్లూకం", image: "/akshara/37.jpg" },
  { id: "v25", type: "vyanjanalu", letter: "మ", word: "మరము", image: "/akshara/38.jpg" },
  { id: "v26", type: "vyanjanalu", letter: "య", word: "యంత్రం", image: "/akshara/39.jpg" },
  { id: "v27", type: "vyanjanalu", letter: "ర", word: "రథం", image: "/akshara/40.jpg" },
  { id: "v28", type: "vyanjanalu", letter: "ల", word: "లత", image: "/akshara/41.jpg" },
  { id: "v29", type: "vyanjanalu", letter: "వ", word: "వనం", image: "/akshara/45.jpg" },
];

const PAGE_SIZE = 4;

export default function AksharamalaParent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return AKSHARALU;
    return AKSHARALU.filter(
      (a) => a.letter.includes(term) || (a.word && a.word.includes(term))
    );
  }, [search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  
  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 6 }}>
        {/* HEADER & SEARCH */}
        <Box textAlign="center">
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900, 
              color: "#d32f2f", 
              mb: 2, 
              fontSize: { xs: "2.8rem", md: "4rem" } 
            }}
          >
            తెలుగు అక్షరమాల
          </Typography>
          
          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 4 }}>
            <Chip label={`మొత్తం: ${filtered.length}`} color="secondary" sx={{ fontWeight: 800 }} />
            <Chip label={`పేజీ: ${page} / ${pageCount}`} color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
          </Stack>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="అక్షరం లేదా పదం వెతకండి..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ 
              bgcolor: "white", 
              borderRadius: "12px",
              "& .MuiOutlinedInput-root": { borderRadius: "12px" }
            }}
          />
        </Box>

        {/* MODERN GRID REPLACEMENT (FLEXBOX) */}
        {filtered.length === 0 ? (
          <Box textAlign="center" sx={{ py: 10 }}>
            <Typography variant="h6" sx={{ opacity: 0.5 }}>
              క్షమించండి! ఏమీ దొరకలేదు.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              justifyContent: "center"
            }}
          >
            {visible.map((a) => (
              <Box 
                key={a.id}
                sx={{ 
                  flex: { 
                    xs: "1 1 100%",      // Mobile: full width
                    sm: "1 1 calc(50% - 16px)" // Desktop: 2 columns with gap consideration
                  },
                  maxWidth: { xs: "100%", sm: "440px" } 
                }}
              >
                <AksharaPosterCard akshara={a} enableRead={true} />
              </Box>
            ))}
          </Box>
        )}

        {/* PAGINATION */}
        {pageCount > 1 && (
          <Box display="flex" justifyContent="center" sx={{ pt: 2 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, v) => {
                setPage(v);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              color="primary"
              size="large"
              shape="rounded"
            />
          </Box>
        )}
      </Stack>
    </Container>
  );
}