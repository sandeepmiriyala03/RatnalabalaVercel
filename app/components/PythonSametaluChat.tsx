

"use client";

import { useState, FormEvent } from "react";
import { TextField, IconButton, Stack, Typography, Paper, CircularProgress } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export default function PythonSametaluChat() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const word = input.trim();
    if (!word || loading) return;

    setTurns((prev) => [...prev, { role: "user", content: word }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sametalu_agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "సమస్య వచ్చింది.");
      }

      setTurns((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="caption" color="text.secondary">
        (పైథాన్ + LangGraph agent — ప్రతిసారి ఒక పదం అడగండి)
      </Typography>

      <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: "auto" }}>
        {turns.map((t, i) => (
          <Paper
            key={i}
            sx={{
              p: 1.5,
              maxWidth: "85%",
              alignSelf: t.role === "user" ? "flex-end" : "flex-start",
              bgcolor: t.role === "user" ? "primary.50" : "grey.100",
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {t.content}
            </Typography>
          </Paper>
        ))}
        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: "flex-start" }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              వెతుకుతోంది...
            </Typography>
          </Stack>
        )}
      </Stack>

      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="ఒక పదం టైప్ చేయండి..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <IconButton type="submit" color="primary" disabled={loading || !input.trim()}>
            <SendRoundedIcon />
          </IconButton>
        </Stack>
      </form>
    </Stack>
  );
}