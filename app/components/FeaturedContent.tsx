// AGENTS.md → see "FeaturedContent Component Rules"
"use client";

import { useState, useEffect, useRef } from "react";
import { Paper, Typography, Chip, Stack, Skeleton, Fade } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

interface FeaturedContentData {
  category: "poem" | "katha" | "sameta";
  title: string;
  text: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  poem: "పద్యం",
  katha: "కథ",
  sameta: "సామెత",
};

const ROTATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function FeaturedContent() {
  const [data, setData] = useState<FeaturedContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error();
      const json: FeaturedContentData = await res.json();

      // Fade out → swap → fade back in, avoids an abrupt jump every 5 min
      setVisible(false);
      setTimeout(() => {
        setData(json);
        hasLoadedOnce.current = true;
        setVisible(true);
      }, 200);
    } catch {
      // ⚠️ Fail gracefully: keep showing the last successfully loaded
      // content instead of wiping it. Only stay empty if we've never
      // successfully loaded anything yet.
      if (!hasLoadedOnce.current) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="100%" height={60} />
      </Paper>
    );
  }

  if (!data) return null;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        mb: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <AutoAwesomeRoundedIcon color="primary" fontSize="small" />
        <Typography fontWeight={700}>ఈ క్షణం</Typography>
        <Chip label={CATEGORY_LABELS[data.category] ?? data.category} size="small" />
      </Stack>

      <Fade in={visible} timeout={300}>
        <div>
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            {data.title}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}>
            {data.text}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 2 }}
          >
            చివరిసారి నవీకరించబడింది: {new Date(data.updatedAt).toLocaleString("te-IN")}
          </Typography>
        </div>
      </Fade>
    </Paper>
  );
}