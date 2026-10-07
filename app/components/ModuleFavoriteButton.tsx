"use client";

/* ═══════════════════════════════════════════════════════════════
   ఇష్టమైనవి ♥ — Navbar ఆకుపచ్చ బార్‌లో, ఇప్పుడున్న మాలను "నా చదువు" లో గుర్తుంచుతుంది

   • 44px — బార్‌లోని మిగతా బటన్లతో సమానం (60+ పాఠకుల కోసం)
   • స్థితి ఆకారంతో: నిండిన ♥ = ఇష్టం, గీత ♥ = కాదు. రంగు బార్ అక్షరం రంగే
     (ఎరుపు #B4233D ఆకుపచ్చ బార్‌పై 1.7:1 — కనిపించదు; dark mode లోనూ సమస్య)
   • నొక్కగానే మారుతుంది (optimistic), సేవ్ విఫలమైతే వెనక్కి + సందేశం
   • చిన్న సందేశం: "నా చదువు లో చేర్చాం" + అక్కడికి వెళ్ళే link
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Snackbar, Tooltip } from "@mui/material";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getReadingRecord, setEntryFavorite, subscribeToReadingChanges } from "@/lib/myReading";
import { getReadingModuleTitle } from "@/app/components/ReadingActivityTracker";

const MY_READING = "/my-reading";

export default function ModuleFavoriteButton() {
  const pathname = usePathname() || "/";
  const title = getReadingModuleTitle(pathname);
  const entry = useMemo(
    () => ({
      id: `module:${pathname}`,
      kind: "module" as const,
      title,
      module: "మాడ్యూల్ సందర్శన",
      href: pathname,
    }),
    [pathname, title]
  );

  const [favorite, setFavorite] = useState(false);
  const [toast, setToast] = useState<{ text: string; link: boolean } | null>(null);
  const saving = useRef(false); // సేవ్ అవుతుండగా పాత విలువ తిరిగి రాకుండా

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (saving.current) return;
      void getReadingRecord(entry.id)
        .then((record) => alive && setFavorite(record?.favorite ?? false))
        .catch(() => {});
    };
    refresh();
    const unsubscribe = subscribeToReadingChanges(refresh);
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [entry.id]);

  if (pathname === MY_READING) return null;

  const label = favorite ? `${title}ను ఇష్టమైన వాటి నుంచి తొలగించండి` : `${title}ను ఇష్టమైనవిగా ఉంచండి`;

  const toggleFavorite = async () => {
    if (saving.current) return;
    const next = !favorite;
    setFavorite(next); // వెంటనే తెరపై మార్పు
    saving.current = true;
    try {
      await setEntryFavorite(entry, next);
      setToast(next ? { text: `${title}ను "నా చదువు" లో ఇష్టమైనవిగా చేర్చాం.`, link: true } : { text: `${title}ను ఇష్టమైన వాటి నుంచి తీసేశాం.`, link: false });
    } catch {
      const record = await getReadingRecord(entry.id).catch(() => undefined);
      setFavorite(record?.favorite ?? !next);
      setToast({ text: "సేవ్ కాలేదు. మళ్ళీ ప్రయత్నించండి.", link: false });
    } finally {
      saving.current = false;
    }
  };

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          onClick={() => void toggleFavorite()}
          aria-label={label}
          aria-pressed={favorite}
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            color: "inherit",
            border: "1px solid rgba(255,255,255,0.4)",
            bgcolor: favorite ? "rgba(255,255,255,0.16)" : "transparent",
            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
            "&:focus-visible": { outline: "3px solid var(--accent-light)", outlineOffset: 2 },
          }}
        >
          {favorite ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
        </IconButton>
      </Tooltip>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== "clickaway" && setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={toast?.text}
        action={
          toast?.link ? (
            <Box
              component={Link}
              href={MY_READING}
              onClick={() => setToast(null)}
              sx={{
                color: "var(--accent-light)",
                fontWeight: 800,
                fontSize: "1rem",
                px: 1.5,
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "8px",
                textDecoration: "underline",
                "&:focus-visible": { outline: "3px solid var(--accent-light)", outlineOffset: 2 },
              }}
            >
              చూడండి
            </Box>
          ) : undefined
        }
        ContentProps={{
          sx: {
            fontSize: "1rem",
            lineHeight: 1.6,
            bgcolor: "#241f1a",
            color: "#fdfaf5",
            borderRadius: "12px",
            mb: "env(safe-area-inset-bottom, 0px)",
          },
        }}
      />
    </>
  );
}