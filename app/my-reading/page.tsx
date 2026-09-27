"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { alpha, useTheme } from "@mui/material/styles";
import {
  getReadingRecords,
  setEntryFavorite,
  subscribeToReadingChanges,
  type ReadingRecord,
} from "@/lib/myReading";

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} నిమిషాలు` : `${seconds} సె.`;
};

export default function MyReadingPage() {
  const theme = useTheme();
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [view, setView] = useState<"favorites" | "recent">("favorites");
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [recommendation, setRecommendation] = useState<{ title: string; folder: string; reason: string } | null>(null);
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRecords(await getReadingRecords());
      setStorageError(false);
    } catch {
      setStorageError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeToReadingChanges(() => void refresh());
  }, [refresh]);

  const favoriteRecords = useMemo(
    () => records.filter((record) => record.favorite).sort((a, b) => (b.favoriteAt ?? 0) - (a.favoriteAt ?? 0)),
    [records]
  );
  const recentRecords = useMemo(
    () => records.filter((record) => record.openCount > 0).sort((a, b) => b.lastReadAt - a.lastReadAt).slice(0, 40),
    [records]
  );
  const moduleRecords = records.filter((record) => record.kind === "module" && record.openCount > 0);
  const contentReadCount = records.filter((record) => record.kind !== "module" && record.openCount > 0).length;
  const totalReadingSeconds = moduleRecords.reduce((total, record) => total + record.readingSeconds, 0);
  const visibleRecords = view === "favorites" ? favoriteRecords : recentRecords;

  const toggleFavorite = async (record: ReadingRecord) => {
    await setEntryFavorite(record, !record.favorite);
    await refresh();
  };

  const requestRecommendation = async () => {
    setRecommendationLoading(true);
    setRecommendationError("");
    setRecommendation(null);
    try {
      const response = await fetch("/api/reading_recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favorites: favoriteRecords.slice(0, 8).map(({ title, module, kind }) => ({ title, module, kind })),
          recent: recentRecords.slice(0, 8).map(({ title, module, kind }) => ({ title, module, kind })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "సూచన పొందలేకపోయాం.");
      setRecommendation(data.recommendation);
    } catch (error) {
      setRecommendationError(error instanceof Error ? error.message : "సూచన పొందలేకపోయాం.");
    } finally {
      setRecommendationLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 4 } }}>
      <Stack spacing={1} sx={{ mb: 2.5 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
          నా చదువు
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ఇష్టమైనవి, ఇటీవల చదివినవి, మీ చదువు సమయం ఈ పరికరంలోనే నిల్వ ఉంటాయి.
        </Typography>
      </Stack>

      {storageError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ఈ బ్రౌజర్‌లో చదువు వివరాలను నిల్వ చేయలేకపోయాం. బ్రౌజర్ నిల్వ అనుమతులను పరిశీలించండి.
        </Alert>
      )}

      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        flexWrap="wrap"
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ py: 1.5, mb: 2, borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Typography variant="body2"><b>{favoriteRecords.length}</b> ఇష్టమైనవి</Typography>
        <Typography variant="body2"><b>{contentReadCount}</b> చదివిన అంశాలు</Typography>
        <Typography variant="body2"><b>{moduleRecords.length}</b> చూసిన మాడ్యూల్స్</Typography>
        <Typography variant="body2"><b>{formatDuration(totalReadingSeconds)}</b> సైట్‌లో చదివిన సమయం</Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 2.5 }}>
        <Button
          onClick={() => void requestRecommendation()}
          disabled={recommendationLoading || (!favoriteRecords.length && !recentRecords.length)}
          variant="outlined"
          startIcon={recommendationLoading ? <CircularProgress size={16} /> : <AutoAwesomeRoundedIcon />}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          LangChainతో తర్వాతి పఠన సూచన
        </Button>
        <Typography variant="caption" color="text.secondary">
          సూచన కోసం మీ ఇష్టమైనవి, ఇటీవల చదివిన శీర్షికలు Python AI సేవకు పంపబడతాయి; ఈ పేజీ వాటిని సర్వర్‌లో నిల్వ చేయదు.
        </Typography>
        {recommendationError && <Alert severity="info">{recommendationError}</Alert>}
        {recommendation && (
          <Box sx={{ p: 1.5, borderLeft: `3px solid ${theme.palette.secondary.main}`, bgcolor: alpha(theme.palette.secondary.main, 0.06) }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{recommendation.title}</Typography>
            <Typography variant="body2" color="text.secondary">{recommendation.folder} · {recommendation.reason}</Typography>
            <Button component={Link} href="/poems" size="small" startIcon={<MenuBookRoundedIcon />} sx={{ mt: 0.5, textTransform: "none" }}>
              పద్యాలు చూడండి
            </Button>
          </Box>
        )}
      </Stack>

      <ToggleButtonGroup
        exclusive
        value={view}
        onChange={(_, next: "favorites" | "recent" | null) => next && setView(next)}
        size="small"
        sx={{ mb: 1.5 }}
      >
        <ToggleButton value="favorites" sx={{ px: 2, textTransform: "none" }}>ఇష్టమైనవి</ToggleButton>
        <ToggleButton value="recent" sx={{ px: 2, textTransform: "none" }}>ఇటీవల చదివినవి</ToggleButton>
      </ToggleButtonGroup>

      {loading ? (
        <CircularProgress size={24} />
      ) : visibleRecords.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3 }}>
          {view === "favorites" ? "ఇంకా ఇష్టమైనవి లేవు. ఏదైనా అంశంపై హార్ట్ నొక్కండి." : "మీరు చదివినవి ఇక్కడ కనిపిస్తాయి."}
        </Typography>
      ) : (
        <List disablePadding>
          {visibleRecords.map((record, index) => (
            <ListItem
              key={record.id}
              divider={index < visibleRecords.length - 1}
              disablePadding
              secondaryAction={(
                <IconButton
                  edge="end"
                  onClick={() => void toggleFavorite(record)}
                  aria-label={record.favorite ? "ఇష్టమైన వాటి నుంచి తొలగించండి" : "ఇష్టమైన వాటికి జోడించండి"}
                  aria-pressed={record.favorite}
                  color={record.favorite ? "error" : "default"}
                >
                  {record.favorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
                </IconButton>
              )}
            >
              <ListItemButton component={Link} href={record.href} sx={{ py: 1.25, pr: 7 }}>
                <ListItemText
                  primary={record.title}
                  secondary={`${record.module} · ${record.openCount} సార్లు · ${formatDuration(record.readingSeconds)}`}
                  primaryTypographyProps={{ fontWeight: 700, sx: { pr: 1, overflowWrap: "anywhere" } }}
                  secondaryTypographyProps={{ sx: { mt: 0.25 } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
