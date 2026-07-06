"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
type AgentResult = {
  success: boolean;
  poem: {
    folder: string;
    title: string;
    content: string;
  };
  agentReason: string;
  sampleSize: number;
  totalScanned: number;
};

export default function AgentPoemButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const askAgent = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agent/pick-poem");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "నిర్ణయాత్మక మాల నుండి జవాబు రాలేదు.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ఏదో తప్పు జరిగింది."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ my: 3, textAlign: "center" }}>
      <Button
        onClick={askAgent}
        disabled={loading}
        variant="contained"
        size="large"
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <AutoAwesomeRoundedIcon />
          )
        }
        sx={{
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 700,
          px: 3,
        }}
      >
        {loading ? "నిర్ణయాత్మక  ఆలోచిస్తోంది…" : "నిర్ణయాత్మక   మాల  ‌ని అడగండి"}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2, textAlign: "left" }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card sx={{ mt: 3, textAlign: "left" }} elevation={0}
          style={{ border: "1px solid #e5e7eb", borderRadius: 12 }}
        >
          <CardContent>
            <Box
              sx={{
                mb: 1.5,
                pb: 1,
                borderBottom: "1px dashed #d1d5db",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>
                ✅ నిర్ణయాత్మక   మాల   పనిచేస్తోంది
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.65 }}>
                మొత్తం స్కాన్ చేసిన పద్యాలు: <strong>{result.totalScanned}</strong>
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Chip
                size="small"
                color="secondary"
                label={result.poem.folder}
              />
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {result.sampleSize} పద్యాలలో నుండి ఎంపిక చేయబడింది
              </Typography>
            </Box>

            <Typography fontWeight={800} sx={{ mb: 1.5 }}>
              {result.poem.title}
            </Typography>

            <Typography
              sx={{ whiteSpace: "pre-line", lineHeight: 1.8, mb: 2 }}
            >
              {result.poem.content}
            </Typography>

            <Alert severity="info" icon={<AutoAwesomeRoundedIcon fontSize="small" />}>
              <strong>నిర్ణయాత్మక   మాల   ఎందుకు ఎంచుకుందంటే:</strong> {result.agentReason}
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}