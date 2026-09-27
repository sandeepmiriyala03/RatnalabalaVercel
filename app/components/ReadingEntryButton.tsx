"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import {
  addReadingTime,
  getReadingRecord,
  recordEntryOpen,
  setEntryFavorite,
  type ReadingEntryInput,
} from "@/lib/myReading";

type Props = {
  entry: ReadingEntryInput;
};

export default function ReadingEntryButton({ entry }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [favorite, setFavorite] = useState(false);
  const entryId = entry.id;
  const entryKind = entry.kind;
  const entryTitle = entry.title;
  const entryModule = entry.module;
  const entryHref = entry.href;

  useEffect(() => {
    const saved = getReadingRecord(entryId);
    saved.then((record) => setFavorite(record?.favorite ?? false)).catch(() => {});

    let visible = false;
    let activeSeconds = 0;
    let counted = false;
    const target = buttonRef.current?.closest("[data-reading-entry]") ?? buttonRef.current;
    if (!target) return;

    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([intersection]) => {
          visible = intersection.isIntersecting && intersection.intersectionRatio >= 0.35;
        }, { threshold: [0, 0.35] });
    if (observer) observer.observe(target);
    else visible = true;

    const timer = window.setInterval(() => {
      if (!visible || document.visibilityState !== "visible") return;
      activeSeconds += 5;

      const currentEntry = {
        id: entryId,
        kind: entryKind,
        title: entryTitle,
        module: entryModule,
        href: entryHref,
      } satisfies ReadingEntryInput;

      if (!counted && activeSeconds >= 10) {
        counted = true;
        void recordEntryOpen(currentEntry).catch(() => {});
        void addReadingTime(currentEntry, activeSeconds).catch(() => {});
      } else if (counted) {
        void addReadingTime(currentEntry, 5).catch(() => {});
      }
    }, 5000);

    return () => {
      observer?.disconnect();
      window.clearInterval(timer);
    };
  }, [entryHref, entryId, entryKind, entryModule, entryTitle]);

  const handleToggle = async () => {
    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    try {
      await setEntryFavorite(entry, nextFavorite);
    } catch {
      setFavorite(!nextFavorite);
    }
  };

  const label = favorite ? "ఇష్టమైన వాటి నుంచి తొలగించండి" : "ఇష్టమైన వాటికి జోడించండి";

  return (
    <Tooltip title={label}>
      <IconButton
        ref={buttonRef}
        onClick={handleToggle}
        aria-label={`${label}: ${entry.title}`}
        aria-pressed={favorite}
        size="small"
        sx={{
          width: 40,
          height: 40,
          color: favorite ? "#B4233D" : "text.secondary",
          border: "1px solid",
          borderColor: favorite ? "#B4233D55" : "divider",
          bgcolor: favorite ? "#B4233D0D" : "transparent",
          "&:hover": { bgcolor: favorite ? "#B4233D18" : "action.hover" },
        }}
      >
        {favorite ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}