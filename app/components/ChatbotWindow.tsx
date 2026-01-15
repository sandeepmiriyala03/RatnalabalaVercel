"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";

interface Message {
  sender: "user" | "bot";
  text: string;
}

/* 🔑 Collection aliases */
const COLLECTION_ALIASES: Record<string, string> = {
  // Telugu
  "తెలుగుబాల": "Jandhyala",
  "సుమతి": "Sumati",
  "శ్రీకాళహస్తీశ్వర": "SriKalahastheeswara",
  "కృష్ణ": "KrishnaSatakam",
  "నారాయణ": "NarayanaSatakam",

  // English shortcuts
  jan: "Jandhyala",
  j: "Jandhyala",
  ja: "Jandhyala",

  sumati: "Sumati",
  s: "Sumati",

  krishna: "KrishnaSatakam",
  kr: "KrishnaSatakam",

  narayana: "NarayanaSatakam",
  na: "NarayanaSatakam",

  kalahasti: "SriKalahastheeswara",
  sk: "SriKalahastheeswara",
};

/* 🔤 Normalize */
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
}

/* 🧠 Parse user intent */
function parseIntent(input: string) {
  const parts = normalize(input);

  let collection: string | null = null;
  let number: number | null = null;

  parts.forEach((p) => {
    if (COLLECTION_ALIASES[p]) collection = COLLECTION_ALIASES[p];
    if (!isNaN(Number(p))) number = Number(p);
  });

  // support j1 / s5 / kr100
  if (!collection && parts.length === 1) {
    const m = parts[0].match(/^([a-z]+)(\d+)$/);
    if (m && COLLECTION_ALIASES[m[1]]) {
      collection = COLLECTION_ALIASES[m[1]];
      number = Number(m[2]);
    }
  }

  return { collection, number };
}

/* 🔍 SIMPLE search (grid filter style) */
function searchPoems(
  query: string,
  poems: Record<string, string>,
  limit = 3
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return Object.entries(poems)
    .filter(([_, content]) =>
      content.toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map(([title, content]) => ({ title, content }));
}

export default function ChatbotWindow({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [poems, setPoems] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const topRef = useRef<HTMLDivElement>(null);

  /* 📥 Load ALL poems once */
  useEffect(() => {
    let mounted = true;

    async function loadPoems() {
      const res = await fetch("/api/shatakamu?key=all");
      const data = await res.json();

      if (mounted && data.success) {
        setPoems(data.poems || {});
        setLoading(false);
      }
    }

    loadPoems();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const question = input;
    setInput("");

    if (loading) {
      setMessages((p) => [
        { sender: "bot", text: "దయచేసి వేచిచూడండి… పద్యాలు లోడ్ అవుతున్నాయి." },
        ...p,
      ]);
      return;
    }

    const { collection, number } = parseIntent(question);
    let reply = "";

    /* 🎯 CASE 0: only number → all shatakams */
    if (!collection && number) {
      const matches = Object.keys(poems).filter((t) =>
        t.match(new RegExp(`\\b${number}\\b`))
      );

      reply =
        matches.length > 0
          ? matches
              .map(
                (k, i) =>
                  `📜 ${i + 1}. ${k}\n\n${poems[k]}`
              )
              .join("\n\n────────────\n\n")
          : "ఈ సంఖ్యకు సంబంధించిన పద్యాలు ఏ శతకంలోనూ లభించలేదు.";
    }

    /* 🎯 CASE 1: collection + number */
    else if (collection && number) {
      const key = Object.keys(poems).find(
        (t) =>
          t.includes(collection) &&
          t.match(new RegExp(`\\b${number}\\b`))
      );

      reply = key
        ? `📜 ${key}\n\n${poems[key]}`
        : "ఈ సంఖ్యకు సంబంధించిన పద్యం కనబడలేదు.";
    }

    /* 🎯 CASE 2: keyword search (DEFAULT) */
    else {
      const results = searchPoems(question, poems, 3);

      reply =
        results.length > 0
          ? results
              .map(
                (r, i) =>
                  `📜 ${i + 1}. ${r.title}\n\n${r.content}`
              )
              .join("\n\n────────────\n\n")
          : "ఈ ప్రశ్నకు సంబంధించిన పద్యాలు లభించలేదు.";
    }

    setMessages((p) => [
      { sender: "bot", text: reply },
      { sender: "user", text: question },
      ...p,
    ]);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 20,
        width: 360,
        height: 520,
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        zIndex: 1700,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography fontWeight="bold">భావాలమాల</Typography>
        <Box>
          <IconButton size="small" onClick={handleClear} sx={{ color: "inherit" }}>
            <DeleteSweepIcon />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: "inherit" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
        <div ref={topRef} />
        {messages.map((msg, i) => (
          <Paper
            key={i}
            sx={{
              p: 1.5,
              mb: 1,
              maxWidth: "85%",
              whiteSpace: "pre-line",
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.text}
          </Paper>
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ p: 1.5, display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="1 / j1 / jan 10 / sumati5 / kr100 / na50/ పద్యం... "
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" onClick={handleSend}>
          పంపండి
        </Button>
      </Box>
    </Paper>
  );
}
