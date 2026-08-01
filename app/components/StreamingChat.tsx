"use client";

import { useState, FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  TextField,
  IconButton,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

interface StreamingChatProps {
  api?: string;
}

export default function StreamingChat({ api = "/api/chat" }: StreamingChatProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={1.5} sx={{ maxHeight: 350, overflowY: "auto" }}>
        {messages.map((message) => (
          <Paper
            key={message.id}
            sx={{
              p: 1.5,
              maxWidth: "85%",
              alignSelf: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {message.parts.map((part, index) =>
                part.type === "text" ? <span key={index}>{part.text}</span> : null
              )}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {error && <Typography color="error">{error.message}</Typography>}

      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            value={input}
            placeholder="మీ ప్రశ్న అడగండి..."
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
          />
          <IconButton type="submit" color="primary" disabled={status !== "ready" || input.trim().length === 0}>
            <SendRoundedIcon />
          </IconButton>
        </Stack>
      </form>
    </Stack>
  );
}