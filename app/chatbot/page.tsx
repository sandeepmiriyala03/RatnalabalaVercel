"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";

interface Message {
  sender: "user" | "bot";
  text?: string;
  type?: "text" | "audio" | "video";
  file?: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const paragraphText = `
అసహనం, జ్ఞానం, జాప్యం, దిలీప్, దయ, దానం, దారిద్య్రం, దురాశ,
ద్రోహం, ధనం, న్యాయం, పొదుపు, పౌరుషం, పెద్దలు, బాల్యం,
రత్నాలబాల, రామకృష్ణ, లోకం, వైద్యం, సుఖం, సౌజన్యం, గౌరవం.
  `;

  /* 🔽 Auto scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    const userMessage: Message = {
      sender: "user",
      text: userText,
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText }),
      });

      const botMessage: Message = await res.json();
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
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
    <Box sx={{ maxWidth: 800, mx: "auto", px: 2, pb: 10 }}>
      <Typography variant="h4" align="center" gutterBottom>
        భావాలమాల
      </Typography>

      <Typography variant="subtitle1" align="center" gutterBottom>
        క్రింద ఉన్న పదాల నుండి ఏదైనా టైప్ చేసి అడగండి
      </Typography>

      <Typography
        variant="body2"
        align="center"
        sx={{ opacity: 0.8, mb: 3 }}
      >
        {paragraphText}
      </Typography>

      {/* 💬 Messages */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => (
          <Paper
            key={i}
            elevation={1}
            sx={{
              p: 2,
              maxWidth: "75%",
              alignSelf:
                msg.sender === "user" ? "flex-end" : "flex-start",
              bgcolor:
                msg.sender === "user"
                  ? "primary.main"
                  : "background.paper",
              color:
                msg.sender === "user"
                  ? "primary.contrastText"
                  : "text.primary",
              borderRadius: 2,
            }}
          >
            {msg.text && <Typography>{msg.text}</Typography>}

            {msg.type === "audio" && msg.file && (
              <audio controls style={{ width: "100%", marginTop: 8 }}>
                <source src={`/audio/${msg.file}`} type="audio/mpeg" />
              </audio>
            )}

            {msg.type === "video" && msg.file && (
              <video
                controls
                style={{
                  width: "100%",
                  marginTop: 8,
                  borderRadius: 8,
                }}
              >
                <source src={`/video/${msg.file}`} type="video/mp4" />
              </video>
            )}
          </Paper>
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* ✍️ Input */}
      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <TextField
          fullWidth
          label="భావాలమాల అడగండి"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
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
    </Box>
  );
}
