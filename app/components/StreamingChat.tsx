// app/components/StreamingChat.tsx
//
// FIXED for AI SDK 5's actual API. The version installed no longer
// manages input state internally — useChat() only returns
// {messages, sendMessage, status, error, ...}, not input/handleSubmit/
// handleInputChange like the older (4.x) API this was first written
// against. Input is now plain React state you manage yourself.
//
// Messages also changed shape: each message has a `parts` array
// (supporting text/tool-call/tool-result parts) instead of a flat
// `content` string — rendering now maps over parts and picks out the
// text ones.

"use client";

import { useState, FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { Box, TextField, IconButton, Stack, Typography, Paper } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

export default function StreamingChat() {
  // Input is now YOUR state, not the hook's — this is the actual fix.
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <Stack spacing={2}>
      {/* Message history — renders token-by-token as the response streams in */}
      <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: "auto" }}>
        {messages.map((m) => (
          <Paper
            key={m.id}
            sx={{
              p: 1.5,
              maxWidth: "85%",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              bgcolor: m.role === "user" ? "primary.50" : "grey.100",
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {/* NEW — messages have a parts array now, not a flat
                  content string. Text parts are what we render here;
                  tool-call/tool-result parts (if you want to show
                  "searching..." indicators later) would be handled as
                  separate part.type cases. */}
              {m.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {error && (
        <Typography variant="caption" color="error">
          {error.message || "సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి."}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="మీ ప్రశ్న..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
          />
          <IconButton type="submit" color="primary" disabled={status !== "ready" || !input.trim()}>
            <SendRoundedIcon />
          </IconButton>
        </Stack>
      </form>
    </Stack>
  );
}