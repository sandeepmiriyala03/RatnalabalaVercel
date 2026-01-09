"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Pagination,
} from "@mui/material";
import PoemCard from "@/app/components/PoemCard";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const ITEMS_PER_PAGE = 10;

/* 🔖 SINGLE SOURCE OF TRUTH */
const POETRY_NAME = " వేమన పద్యాలు";
const AUTHORS: string | string[] = "యోగి వేమన";

const PoemList: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

  /* 📥 Load poems + voices */
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch("/api/vemana");
        if (!res.ok) throw new Error();

        const data: Record<string, string> = await res.json();

      const poemArray: Poem[] = Object.entries(data)
  .map(([title, content]) => ({
    title,
    content,
    slug: title,
  }))
  .sort((a, b) => {
    // title నుంచి సంఖ్య తీసుకోవడం (ఉదా: "వేమన శతకం పద్యం 10")
    const getNumber = (t: string) => {
      const match = t.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    return getNumber(a.title) - getNumber(b.title);
  });
        setPoems(poemArray);
      } catch {
        setError("పద్యాలను లోడ్ చేయడంలో లోపం సంభవించింది.");
      } finally {
        setLoading(false);
      }
    };

    fetchPoems();

    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length) {
          setVoices(v);
          setReady(true);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /* 🔊 Speech helpers */
  const stopSpeech = () => window.speechSynthesis.cancel();

  const speak = (content: string) => {
    stopSpeech();
    const u = new SpeechSynthesisUtterance(content);
    u.lang = "te-IN";
    u.rate = 0.8;

    const voice = voices.find((v) => v.lang === "te-IN");
    if (voice) u.voice = voice;

    window.speechSynthesis.speak(u);
  };

  /* 🔍 Filter poems */
  const filtered = useMemo(
    () =>
      poems.filter(
        (p) =>
          p.title.includes(search) ||
          p.content.includes(search)
      ),
    [poems, search]
  );

  const itemsPerPage = viewAll ? filtered.length : ITEMS_PER_PAGE;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const current = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1);
    stopSpeech();
  }, [search, viewAll]);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 900,
        mx: "auto",
        fontFamily: "var(--telugu-font-family)",
        fontSize: "var(--telugu-font-size)",
        lineHeight: 1.8,
      }}
    >
      <Typography
        align="center"
        gutterBottom
        sx={{
          fontWeight: 700,
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
        }}
      >
    {POETRY_NAME}
      </Typography>

      <Typography align="center" sx={{ mb: 2 }}>
        మొత్తం పద్యాల సంఖ్య: <strong>{filtered.length}</strong>
      </Typography>

      <TextField
        label="పద్యం కోసం వెతకండి..."
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 4 }}
      />

      <Box textAlign="center" mb={3}>
        <Button
          variant={viewAll ? "outlined" : "contained"}
          onClick={() => setViewAll((v) => !v)}
          disabled={filtered.length === 0}
        >
          {viewAll ? "పేజీలవారీగా చూడండి" : "అన్ని పద్యాలు చూడండి"}
        </Button>
      </Box>

      {loading && (
        <Typography align="center">
          పద్యాలు లోడ్ అవుతున్నాయి…
        </Typography>
      )}

      {error && (
        <Typography align="center" color="error">
          {error}
        </Typography>
      )}

      {!loading &&
        !error &&
        current.map((poem) => (
          <PoemCard
            key={poem.slug}
            poem={poem}
            ready={ready}
            speak={speak}
            stopSpeech={stopSpeech}
            authors={AUTHORS}          // ✅ future-proof
            poetryName={POETRY_NAME}  // ✅ single source
          />
        ))}

      {!loading && !error && !viewAll && filtered.length > ITEMS_PER_PAGE && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => {
              setPage(val);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default PoemList;
