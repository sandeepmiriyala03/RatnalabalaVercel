"use client";

import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import Image from "next/image";

export default function ChatbotPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input) return;

    // Add user's message
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    // Call chatbot API
    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input }),
    });

    const data = await res.json();

    setMessages((prev) => [...prev, { sender: "bot", ...data }]);
    setInput("");
  };

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Typography variant="h4" gutterBottom>
        Ratnalabala Chatbot
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          label="Type your message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => (
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
            {/* TEXT */}
            {msg.type === "text" && (
              <Typography>{msg.text}</Typography>
            )}

            {/* IMAGE */}
            {msg.type === "image" && (
              <>
                <Typography>{msg.text}</Typography>
                <Image
                  src={`/images/${msg.file}`}
                  alt={msg.file}
                  width={300}
                  height={200}
                  style={{ borderRadius: "8px" }}
                />
              </>
            )}

            {/* AUDIO */}
            {msg.type === "audio" && (
              <>
                <Typography>{msg.text}</Typography>
                <audio controls style={{ width: "100%", marginTop: "10px" }}>
                  <source src={`/audio/${msg.file}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </>
            )}

            {/* VIDEO */}
            {msg.type === "video" && (
              <>
                <Typography>{msg.text}</Typography>
                <video
                  controls
                  width="400"
                  style={{ marginTop: "10px", borderRadius: "8px" }}
                >
                  <source src={`/video/${msg.file}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
