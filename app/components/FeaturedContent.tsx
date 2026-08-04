"use client";

import { useState, useEffect } from "react";
import { Paper, Typography, Chip, Stack, Skeleton } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

interface FeaturedContentData {
  category: "poem" | "katha" | "sameta";
  title: string;
  text: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  poem: "poem",
  katha: "katha",
  sameta: "sameta",
};

export default function FeaturedContent() {
  const [data, setData] = useState<FeaturedContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/featured-content");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="100%" height={60} />
      </Paper>
    );
  }

  if (error || !data) return null;

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <AutoAwesomeRoundedIcon color="primary" fontSize="small" />
        <Typography fontWeight={700}>Featured</Typography>
        <Chip label={CATEGORY_LABELS[data.category] ?? data.category} size="small" />
      </Stack>
      <Typography fontWeight={600} sx={{ mb: 1 }}>{data.title}</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>{data.text}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        Updated: {new Date(data.updatedAt).toLocaleString()}
      </Typography>
    </Paper>
  );
}
