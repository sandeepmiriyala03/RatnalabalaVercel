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

  { "id": "v5", "type": "vyanjanalu", "letter": "ఙ", word: " జ్ఞానము" },

  { id: "v6", type: "vyanjanalu", letter: "చ", word: "చక్రము", image: "/akshara/18.jpg" },
  { id: "v7", type: "vyanjanalu", letter: "ఛ", word: "ఛత్రము", image: "/akshara/19.jpg" },
  { id: "v8", type: "vyanjanalu", letter: "జ", word: "జడ", image: "/akshara/20.jpg" },

{ "id": "v9", "type": "vyanjanalu", "letter": "ఝ", word: "ఝషము", "image": "/akshara/21.jpg" },
{ "id": "v10", "type": "vyanjanalu", "letter": "ఞ", "word": "ఞ" },
{ "id": "v11", "type": "vyanjanalu", "letter": "ట", "word": "టపాకాయ", "image": "/akshara/22.jpg" },
{ "id": "v12", "type": "vyanjanalu", "letter": "ఠ", "word": "కంఠము", "image": "/akshara/23.jpg" },
{ "id": "v13", "type": "vyanjanalu", "letter": "డ", "word": "డప్పు", "image": "/akshara/24.jpg" },
{ "id": "v14", "type": "vyanjanalu", "letter": "ఢ", "word": "ఢంకా", "image": "/akshara/25.jpg" },
{ "id": "v15", "type": "vyanjanalu", "letter": "ణ", "word": "వీణ", "image": "/akshara/26.jpg" },
{ "id": "v16", "type": "vyanjanalu", "letter": "త", "word": "తల", "image": "/akshara/27.jpg" },
{ "id": "v17", "type": "vyanjanalu", "letter": "థ", "word": "రథము", "image": "/akshara/28.jpg" },
{ "id": "v18", "type": "vyanjanalu", "letter": "ద", "word": "దంతము", "image": "/akshara/29.jpg" },
{ "id": "v19", "type": "vyanjanalu", "letter": "ధ", "word": "ధనుస్సు", "image": "/akshara/30.jpg" },

 { "id": "v20", "type": "vyanjanalu", "letter": "న", "word": "నత్త", "image": "/akshara/31.jpg" },
{ "id": "v21", "type": "vyanjanalu", "letter": "ప", "word": "పడవ", "image": "/akshara/32.jpg" },
{ "id": "v22", "type": "vyanjanalu", "letter": "ఫ", "word": "ఫలము", "image": "/akshara/33.jpg" },
{ "id": "v23", "type": "vyanjanalu", "letter": "బ", "word": "బండి", "image": "/akshara/34.jpg" },
{ "id": "v24", "type": "vyanjanalu", "letter": "భ", "word": "భవనము", "image": "/akshara/35.jpg" },
{ "id": "v25", "type": "vyanjanalu", "letter": "మ", "word": "మద్దెల", "image": "/akshara/36.jpg" },
{ "id": "v26", "type": "vyanjanalu", "letter": "య", "word": "యంత్రము", "image": "/akshara/37.jpg" },
{ "id": "v27", "type": "vyanjanalu", "letter": "ర", "word": "రంగులు", "image": "/akshara/38.jpg" },
{ "id": "v28", "type": "vyanjanalu", "letter": "ల", "word": "లత", "image": "/akshara/39.jpg" },
{ "id": "v29", "type": "vyanjanalu", "letter": "వ", "word": "వల", "image": "/akshara/40.jpg" },
{ id: "v30", type: "vyanjanalu", letter: "శ", word: "శంఖము", image: "/akshara/41.jpg" },
{ id: "v31", type: "vyanjanalu", letter: "ష", word: "షట్పదము", image: "/akshara/42.jpg" },
{ id: "v32", type: "vyanjanalu", letter: "స", word: "సంచి", image: "/akshara/43.jpg" },
{ id: "v33", type: "vyanjanalu", letter: "హ", word: "హంస", image: "/akshara/44.jpg" },
{ id: "v34", type: "vyanjanalu", letter: "ళ", word: "తాళము", image: "/akshara/45.jpg" },
{ id: "v35", type: "vyanjanalu", letter: "క్ష", word: "వృక్షము" },
{ id: "v36", type: "vyanjanalu", letter: "ఱ", word: "ఱంపము" }
];


const PAGE_SIZE = 4;

export default function AksharamalaParent() {

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "swaralu" | "vyanjanalu">("all");

  const filtered = useMemo(() => {

    const term = search.trim();

    return AKSHARALU.filter((a) => {

      const matchesSearch =
        !term ||
        a.letter.includes(term) ||
        (a.word && a.word.includes(term));

      const matchesType =
        typeFilter === "all" || a.type === typeFilter;

      return matchesSearch && matchesType;

    });

  }, [search, typeFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleFilter = (type: "all" | "swaralu" | "vyanjanalu") => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <Container maxWidth="md">

      <Stack spacing={4} sx={{ py: 6 }}>

        {/* HEADER */}
        <Box textAlign="center">

          {/* FILTER BUTTONS */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ mb: 2 }}
          >
            <Chip
              label="అన్నీ"
              clickable
              color={typeFilter === "all" ? "primary" : "default"}
              onClick={() => handleFilter("all")}
            />

            <Chip
              label="అచ్చులు"
              clickable
              color={typeFilter === "swaralu" ? "primary" : "default"}
              onClick={() => handleFilter("swaralu")}
            />

            <Chip
              label="హల్లులు"
              clickable
              color={typeFilter === "vyanjanalu" ? "primary" : "default"}
              onClick={() => handleFilter("vyanjanalu")}
            />
          </Stack>

          {/* INFO */}
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Chip
              label={`మొత్తం: ${filtered.length}`}
              color="secondary"
              sx={{ fontWeight: 800 }}
            />

            <Chip
              label={`పేజీ: ${page} / ${pageCount || 1}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          {/* SEARCH */}
          <TextField
            fullWidth
            placeholder="అక్షరం లేదా పదం వెతకండి..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{
              bgcolor: "white",
              borderRadius: "12px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px"
              }
            }}
          />

        </Box>

        {/* RESULTS */}
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
              gap: 3,
              justifyContent: "center"
            }}
          >
            {visible.map((a) => (
              <Box
                key={a.id}
                sx={{
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 16px)"
                  },
                  maxWidth: {
                    xs: "100%",
                    sm: "440px"
                  }
                }}
              >
                <AksharaPosterCard
                  akshara={a}
                  enableRead={true}
                />
              </Box>
            ))}
          </Box>

        )}

        {/* PAGINATION */}
        {pageCount > 1 && (

          <Box display="flex" justifyContent="center">

            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, v) => {
                setPage(v);
                window.scrollTo({
                  top: 0,
                  behavior: "smooth"
                });
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