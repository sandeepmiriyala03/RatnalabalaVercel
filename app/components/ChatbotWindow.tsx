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

/* 🔹 Suggested words (shown only once) */
const words = [
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

interface Message {
  sender: "user" | "bot";
  text?: string;
  type?: "text" | "audio" | "video";
  file?: string;
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
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* 🔽 Auto scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, type: "text" },
    ]);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText }),
      });

      const botMessage: Message = await res.json();
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "క్షమించండి, ఏదో సమస్య వచ్చింది. మళ్లీ ప్రయత్నించండి.",
          type: "text",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: { xs: 80, md: 24 },
        right: 20,
        width: { xs: "90%", sm: 360 },
        height: 520,
        zIndex: 1700,
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* 🔝 Header */}
      <Box
        sx={{
          p: 1.5,
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography fontWeight="bold">భావాలమాల</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "inherit" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 💬 Messages */}
      <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
        {/* 🔹 One-time word suggestions */}
        {messages.length === 0 && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, mb: 2 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              ఈ పదాల నుండి ఎంచుకుని అడగండి:
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {words.map((word) => (
                <Button
                  key={word}
                  size="small"
                  variant="outlined"
                  onClick={() => setInput(word)}
                >
                  {word}
                </Button>
              ))}
            </Box>
          </Paper>
        )}

        {messages.map((msg, i) => (
          <Paper
            key={i}
            sx={{
              p: 1.5,
              mb: 1,
              maxWidth: "80%",
              bgcolor:
                msg.sender === "user"
                  ? "primary.main"
                  : "background.paper",
              color:
                msg.sender === "user"
                  ? "primary.contrastText"
                  : "text.primary",
              alignSelf:
                msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.text}
          </Paper>
        ))}

        <div ref={bottomRef} />
      </Box>

      {/* ✍️ Input */}
      <Box sx={{ p: 1.5, display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="భావాలమాల అడగండి…"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "..." : "పంపండి"}
        </Button>
      </Box>
    </Paper>
  );
}
