"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Pagination,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const ITEMS_PER_PAGE = 3;

const PoemList: React.FC = () => {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewAll, setViewAll] = useState(false);

  /* 🔊 Load poems + voices */
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch("/api/poems");
        if (!res.ok) throw new Error();
        setPoems(await res.json());
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
    } else {
      setError("మీ బ్రౌజర్‌లో వచన-మాట్లాడటం మద్దతు లేదు.");
    }

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /* 🔇 Stop speech */
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  /* 🔊 Speak poem */
  const speak = (content: string) => {
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "te-IN";
    utterance.rate = 0.8;

    const voice =
      voices.find((v) => v.lang === "te-IN") ||
      voices.find((v) => v.lang === "hi-IN") ||
      voices.find((v) => v.lang.includes("en-IN"));

    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  /* 🔍 Filter poems */
  const filtered = useMemo(
    () =>
      poems.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.content.toLowerCase().includes(search.toLowerCase())
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
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
        పద్యాలవాల
      </Typography>

      <Typography variant="subtitle1" align="center" mb={2}>
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
        <Typography align="center" color="text.secondary">
          పద్యాలు లోడ్ అవుతున్నాయి...
        </Typography>
      )}

      {error && (
        <Typography align="center" color="error">
          {error}
        </Typography>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Typography align="center" color="text.secondary">
          పద్యం కనిపించలేదు.
        </Typography>
      )}

      {!loading &&
        !error &&
        current.map((poem, i) => (
          <Card key={poem.slug || i} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="h6" fontWeight={500}>
                  {poem.title}
                </Typography>

                <Box>
                  <IconButton
                    aria-label="పద్యాన్ని వినండి"
                    onClick={() => speak(poem.content)}
                    disabled={!ready}
                  >
                    <VolumeUpIcon color="primary" />
                  </IconButton>
                  <IconButton
                    aria-label="ఆపండి"
                    onClick={stopSpeech}
                    disabled={!ready}
                  >
                    <StopCircleIcon color="error" />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {poem.content}
              </Typography>
            </CardContent>
          </Card>
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
