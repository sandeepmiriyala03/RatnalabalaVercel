"use client";

import { useEffect, useMemo, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import { usePathname } from "next/navigation";
import {
  getReadingRecord,
  setEntryFavorite,
  subscribeToReadingChanges,
} from "@/lib/myReading";
import { getReadingModuleTitle } from "@/app/components/ReadingActivityTracker";

export default function ModuleFavoriteButton() {
  const pathname = usePathname() || "/";
  const title = getReadingModuleTitle(pathname);
  const entry = useMemo(() => ({
    id: `module:${pathname}`,
    kind: "module" as const,
    title,
    module: "మాడ్యూల్ సందర్శన",
    href: pathname,
  }), [pathname, title]);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const refresh = () => {
      void getReadingRecord(entry.id).then((record) => setFavorite(record?.favorite ?? false)).catch(() => {});
    };
    refresh();
    return subscribeToReadingChanges(refresh);
  }, [entry.id]);

  if (pathname === "/my-reading") return null;

  const label = favorite ? `${title}ను ఇష్టమైన వాటి నుంచి తొలగించండి` : `${title}ను ఇష్టమైనవిగా ఉంచండి`;
  const toggleFavorite = async () => {
    try {
      await setEntryFavorite(entry, !favorite);
    } catch {
      const record = await getReadingRecord(entry.id).catch(() => undefined);
      setFavorite(record?.favorite ?? false);
    }
  };

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => void toggleFavorite()}
        aria-label={label}
        aria-pressed={favorite}
        size="small"
        sx={{ color: favorite ? "#B4233D" : "inherit" }}
      >
        {favorite ? <FavoriteRoundedIcon fontSize="small" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}