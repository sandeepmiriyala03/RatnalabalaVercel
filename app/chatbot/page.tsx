"use client";

import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

interface Message {
  sender: "user" | "bot";
  text?: string;
  type?: string;
  file?: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const paragraphText = `
    అసహనం, జ్ఞానం, జాప్యం, దిలీప్, దయ, దానం, దారిద్య్రం, దురాశ, ద్రోహం, ధనం, న్యాయం, పొదుపు,
    పౌరుషం, ప్రదీప్, పెద్దలు, బాల్యం, మిరియాల, రత్నాలబాల, రామకృష్ణ, లోకం, విషం, వైద్యం, సుఖం,
    సొగసు, సౌజన్యం, గౌరవం.
  `;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input, type: "text" };
    setInput(""); // Clear input early

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input }),
    });

    const botMessage: Message = await res.json();

    setMessages((prev) => [...prev, userMessage, botMessage]); // One safe update
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        భావాలమాల
      </Typography>

      <Typography variant="subtitle1" gutterBottom align="center">
        దయచేసి క్రింద ఉన్న పదాల నుండి ఎంచుకుని ఎంటర్ చేయండి.
      </Typography>

      <Typography
        variant="body1"
        gutterBottom
        align="center"
        sx={{
          lineHeight: 1.7,
          color: "#333",
          fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
        }}
      >
        {paragraphText}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          label="భావాలమాల అడగండి"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button variant="contained" onClick={handleSend}>
          భావాలమాలకి పంపండి
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[...messages].reverse().map((msg, i) => (
          <Box
            key={i}
            sx={{
              bgcolor: msg.sender === "user" ? "#1976d2" : "#e0e0e0",
              color: msg.sender === "user" ? "white" : "black",
              p: 2,
              borderRadius: 2,
              maxWidth: "75%",
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.type === "text" && <Typography>{msg.text}</Typography>}

            {msg.type === "audio" && (
              <>
                <Typography>{msg.text}</Typography>
                <audio controls style={{ width: "100%", marginTop: "10px" }}>
                  <source src={`/audio/${msg.file}`} type="audio/mpeg" />
                </audio>
              </>
            )}

            {msg.type === "video" && (
              <>
                <Typography>{msg.text}</Typography>
                <video
                  controls
                  width="400"
                  style={{ marginTop: "10px", borderRadius: "8px" }}
                >
                  <source src={`/video/${msg.file}`} type="video/mp4" />
                </video>
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
