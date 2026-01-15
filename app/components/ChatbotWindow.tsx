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
  "తెలుగుబాల": "Jandhyala",
  "సుమతి": "Sumati",
  "శ్రీకాళహస్తీశ్వర": "SriKalahastheeswara",
  "కృష్ణ": "KrishnaSatakam",
  "నారాయణ": "NarayanaSatakam",

  jan: "Jandhyala",
  j: "Jandhyala",
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

/* 🧠 Intent */
function parseIntent(input: string) {
  const parts = normalize(input);
  let collection: string | null = null;
  let number: number | null = null;

  for (const p of parts) {
    if (COLLECTION_ALIASES[p]) collection = COLLECTION_ALIASES[p];
    if (/^\d+$/.test(p)) number = Number(p);
  }

  if (!collection && parts.length === 1) {
    const m = parts[0].match(/^([a-z]+)(\d+)$/);
    if (m && COLLECTION_ALIASES[m[1]]) {
      collection = COLLECTION_ALIASES[m[1]];
      number = Number(m[2]);
    }
  }

  return { collection, number };
}

/* 🔍 Search */
function searchPoems(
  query: string,
  poems: Record<string, string>,
  limit = 3
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return Object.entries(poems)
    .filter(([_, c]) => c.toLowerCase().includes(q))
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
  const [botTyping, setBotTyping] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  const DISPLAY_LIMIT = Infinity; // 🔁 change if needed

  /* Load poems */
  useEffect(() => {
    let active = true;

    fetch("/api/shatakamu?key=all")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success) {
          setPoems(d.poems || {});
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  /* Scroll to TOP (LIFO) */
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  if (!open) return null;

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const question = input.trim();
    setInput("");

    /* USER MESSAGE FIRST */
    setMessages((p) => [...p, { sender: "user", text: question }]);

    if (loading) {
      setMessages((p) => [
        ...p,
        {
          sender: "bot",
          text: "⏳ పద్యాలు లోడ్ అవుతున్నాయి… దయచేసి వేచిచూడండి.",
        },
      ]);
      return;
    }

    const { collection, number } = parseIntent(question);
    let reply = "";

    if (!collection && number) {
      const hits = Object.keys(poems).filter((t) =>
        t.includes(String(number))
      );

      reply =
        hits.length > 0
          ? hits
              .map(
                (k, i) =>
                  `📜 ${i + 1}. ${k}\n━━━━━━━━━━━━━━\n${poems[k]}`
              )
              .join("\n\n")
          : "ఈ సంఖ్యకు సంబంధించిన పద్యాలు లభించలేదు.";
    } else if (collection && number) {
      const key = Object.keys(poems).find(
        (t) => t.includes(collection) && t.includes(String(number))
      );

      reply = key
        ? `📜 ${key}\n━━━━━━━━━━━━━━\n${poems[key]}`
        : "ఈ పద్యం కనబడలేదు.";
    } else {
      const res = searchPoems(question, poems, 3);

      reply =
        res.length > 0
          ? res
              .map(
                (r, i) =>
                  `📜 ${i + 1}. ${r.title}\n━━━━━━━━━━━━━━\n${r.content}`
              )
              .join("\n\n")
          : "సరిపోయే పద్యం లేదు 😊\nఉదాహరణ: j1, sumati5, kr10";
    }

    setBotTyping(true);

    setTimeout(() => {
      setBotTyping(false);
      setMessages((p) => [...p, { sender: "bot", text: reply }]);
    }, 350);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: { xs: 0, sm: 24 },
        right: { xs: 0, sm: 20 },
        width: { xs: "100%", sm: 360 },
        height: { xs: "90vh", sm: 520 },
        display: "flex",
        flexDirection: "column",
        borderRadius: { xs: "16px 16px 0 0", sm: 3 },
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
          <IconButton onClick={handleClear} size="small" sx={{ color: "inherit" }}>
            <DeleteSweepIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ color: "inherit" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages – LIFO */}
      <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
        <div ref={topRef} />

        {messages
          .slice(
            DISPLAY_LIMIT === Infinity ? 0 : -DISPLAY_LIMIT * 2
          )
          .reverse()
          .map((m, i) => (
            <Paper
              key={i}
              sx={{
                p: 1.2,
                mb: 1,
                maxWidth: "90%",
                fontSize: "0.9rem",
                whiteSpace: "pre-line",
                bgcolor: m.sender === "user" ? "primary.main" : "grey.100",
                color:
                  m.sender === "user"
                    ? "primary.contrastText"
                    : "text.primary",
                alignSelf:
                  m.sender === "user" ? "flex-end" : "flex-start",
              }}
            >
              {m.text}
            </Paper>
          ))}

        {botTyping && (
          <Typography sx={{ fontSize: "0.8rem", opacity: 0.6 }}>
            భావాలమాల ఆలోచిస్తోంది…
          </Typography>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ p: 1, display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="j1 / sumati5 / పద్యం పదం"
          value={input}
          aria-label="పద్యం అడగండి"
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
