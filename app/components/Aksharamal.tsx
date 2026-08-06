"use client";

import React, { useEffect, useState } from "react";
import {
  Stack,
  Typography,
  TextField,
  Chip,
  Box,
  Pagination,
  Container,
  CircularProgress,
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

type SimilarResult = {
  clicked: { letter: string; word: string };
  same_type: Akshara[];
  related_from_json: any[];
  source: string;
};
const PAGE_SIZE = 100;

// One place, easy to swap between local dev and deployed Python API
const API_BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "/api";

export default function AksharamalaParent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "swaralu" | "vyanjanalu">("all");

  // Everything below is now server-computed — no local filtering/pagination
  const [items, setItems] = useState<Akshara[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);

  // Similar-words panel state
  const [similar, setSimilar] = useState<SimilarResult | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);

  /* 📥 Fetch list — every time search/filter/page changes */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search,
          type: typeFilter,
          page: String(page),
          page_size: String(PAGE_SIZE),
        });
        const res = await fetch(`${API_BASE}/aksharamala?${params}`);
        const data = await res.json();

        setItems(data.items || []);
        setTotalCount(data.total_count || 0);
        setPageCount(data.page_count || 1);
      } catch {
        setItems([]);
        setTotalCount(0);
        setPageCount(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, typeFilter, page]);

  /* 🔗 Similar words — triggered on card click */
  const handleCardClick = async (a: Akshara) => {
    setSimilarLoading(true);
    setSimilar(null);
    try {
      const params = new URLSearchParams({
        letter: a.letter,
        word: a.word || "",
      });
      const res = await fetch(`${API_BASE}/aksharamala_similar?${params}`);
      const data = await res.json();
      setSimilar(data);
    } catch {
      setSimilar(null);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleFilter = (type: "all" | "swaralu" | "vyanjanalu") => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 6 }}>
        {/* HEADER */}
        <Box textAlign="center">
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

          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Chip
              label={`మొత్తం: ${totalCount}`}
              color="secondary"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={`పేజీ: ${page} / ${pageCount}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>

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
              "& .MuiOutlinedInput-root": { borderRadius: "12px" },
            }}
          />
        </Box>

        {/* RESULTS — purely rendering whatever the API returned */}
        {loading ? (
          <Box textAlign="center" sx={{ py: 10 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
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
              justifyContent: "center",
            }}
          >
            {items.map((a) => (
              <Box
                key={a.id}
                onClick={() => handleCardClick(a)}
                sx={{
                  cursor: "pointer",
                  flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)" },
                  maxWidth: { xs: "100%", sm: "440px" },
                }}
              >
                <AksharaPosterCard akshara={a} enableRead={true} />
              </Box>
            ))}
          </Box>
        )}

        {/* SIMILAR WORDS PANEL — appears after a card is clicked */}
        {similarLoading && (
          <Box textAlign="center" sx={{ py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {similar && !similarLoading && (
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              &quot;{similar.clicked.letter}&quot; కి సంబంధించినవి
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {similar.same_type.map((s) => (
                <Chip key={s.id} label={`${s.letter} — ${s.word || ""}`} />
              ))}
            </Stack>
          </Box>
        )}

        {/* PAGINATION — page_count comes from the API, not computed locally */}
        {pageCount > 1 && (
          <Box display="flex" justifyContent="center">
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