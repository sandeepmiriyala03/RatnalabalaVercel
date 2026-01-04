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

/* 🔹 SINGLE SOURCE OF TRUTH */
const WORDS = [
  "అసహనం",
  "జ్ఞానం",
  "జాప్యం",
  "దయ",
  "దానం",
  "దారిద్య్రం",
  "దురాశ",
  "ద్రోహం",
  "ధనం",
  "న్యాయం",
  "పొదుపు",
  "పౌరుషం",
  "పెద్దలు",
  "బాల్యం",
  "రత్నాలబాల",
  "రామకృష్ణ",
  "లోకం",
  "వైద్యం",
  "సుఖం",
  "సౌజన్యం",
  "గౌరవం",
];

/* 🔹 English / phonetic aliases → MUST map ONLY to WORDS */
const NLP_DICT: Record<string, string> = {
  /* అసహనం */
  asahanam: "అసహనం",
  asahanamu: "అసహనం",
  ashanam: "అసహనం",
  asharanam: "అసహనం",
  asharanamu: "అసహనం",

  /* జ్ఞానం */
  gnanam: "జ్ఞానం",
  jnanam: "జ్ఞానం",
  gyanam: "జ్ఞానం",

  /* జాప్యం */
  japyam: "జాప్యం",
  jaapyam: "జాప్యం",

  /* దయ */
  daya: "దయ",
  dhaya: "దయ",

  /* దానం */
  danam: "దానం",
  daanam: "దానం",

  /* దారిద్య్రం */
  daridryam: "దారిద్య్రం",
  daridram: "దారిద్య్రం",

  /* దురాశ */
  durasha: "దురాశ",
  duraasha: "దురాశ",

  /* ద్రోహం */
  droham: "ద్రోహం",
  drohham: "ద్రోహం",

  /* ధనం */
  dhanam: "ధనం",
  dhanamu: "ధనం",

  /* న్యాయం */
  nyayam: "న్యాయం",
  nyaayam: "న్యాయం",

  /* పొదుపు */
  podupu: "పొదుపు",

  /* పౌరుషం */
  pourusham: "పౌరుషం",
  paurusham: "పౌరుషం",

  /* పెద్దలు */
  peddalu: "పెద్దలు",

  /* బాల్యం */
  balyam: "బాల్యం",
  baalyam: "బాల్యం",

  /* రత్నాలబాల */
  ratnalabala: "రత్నాలబాల",
  rathnalabala: "రత్నాలబాల",
  ratnalaabala: "రత్నాలబాల",
  bala: "రత్నాలబాల",

  /* రామకృష్ణ */
  ramakrishna: "రామకృష్ణ",
  ramaakrishna: "రామకృష్ణ",
  rama: "రామకృష్ణ",
  krishna: "రామకృష్ణ",

  /* లోకం */
  lokam: "లోకం",

  /* వైద్యం */
  vaidyam: "వైద్యం",
  vaidya: "వైద్యం",

  /* సుఖం */
  sukham: "సుఖం",

  /* సౌజన్యం */
  soujanyam: "సౌజన్యం",
  saujanyam: "సౌజన్యం",

  /* గౌరవం */
  gouravam: "గౌరవం",
  gauravam: "గౌరవం",
};

/* 🔹 Resolver */
function resolveWord(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const teluguMatch = WORDS.find((w) => w.includes(raw));
  if (teluguMatch) return teluguMatch;

  const lower = raw.toLowerCase();
  const key = Object.keys(NLP_DICT).find((k) =>
    k.includes(lower)
  );

  return key ? NLP_DICT[key] : null;
}

interface Message {
  sender: "user" | "bot";
  text: string;
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
  const [loadingPoems, setLoadingPoems] = useState(true);

  const topRef = useRef<HTMLDivElement>(null);

  /* 🔹 Load poems once */
  useEffect(() => {
    let mounted = true;

    async function loadPoems() {
      const res = await fetch("/api/poems");
      const raw = await res.json();

      const normalized: Record<string, string> = {};
      Object.keys(raw).forEach((k) => {
        normalized[k.trim()] = raw[k];
      });

      if (mounted) {
        setPoems(normalized);
        setLoadingPoems(false);
      }
    }

    loadPoems();
    return () => {
      mounted = false;
    };
  }, []);

  /* 🔹 Scroll to TOP (LIFO) */
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

    const userText = input;
    setInput("");

    if (loadingPoems) {
      setMessages((p) => [
        {
          sender: "bot",
          text: "దయచేసి వేచిచూడండి… డేటా లోడ్ అవుతోంది.",
        },
        ...p,
      ]);
      return;
    }

    const matchedWord = resolveWord(userText);
    const poem = matchedWord ? poems[matchedWord] : null;

    setMessages((p) => [
      {
        sender: "bot",
        text: poem
          ? `📌 ${matchedWord}\n\n${poem}`
          : "ఈ పదానికి సంబంధించిన భావం కనబడలేదు.",
      },
      { sender: "user", text: userText },
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
              bgcolor:
                msg.sender === "user"
                  ? "primary.main"
                  : "background.paper",
              color:
                msg.sender === "user"
                  ? "primary.contrastText"
                  : "text.primary",
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
          placeholder="తెలుగు లేదా English phonetic టైప్ చేయండి…"
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
