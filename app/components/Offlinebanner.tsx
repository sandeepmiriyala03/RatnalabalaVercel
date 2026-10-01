"use client";

import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import { useOffline } from "next/offline";
import { CheckIcon, CloseIcon } from "@yuktishaalaa/yuktai";

/**
 * One banner for the whole site (rendered once in app/layout.tsx).
 *
 * - Next.js `useOffline` (experimental.useOffline in next.config.ts) notices
 *   real failed requests and keeps navigations / Server Actions waiting until
 *   the connection is back. This banner just tells people what's happening.
 * - The browser's online/offline signal is a backup, so the banner still
 *   works if the experimental flag is turned off.
 */

const SHOW_AFTER_MS = 1500; // don't flash for a one-second drop
const BACK_ONLINE_MS = 3000; // how long "మళ్ళీ కనెక్ట్ అయింది" stays

/** Browser online/offline signal — usable by any component. */
export function useBrowserOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return offline;
}

/**
 * true when the app is offline — Next.js signal OR browser signal.
 * Other components can use this too (e.g. switch "వినండి" to the browser
 * voice, or disable AI buttons while offline).
 */
export function useIsOffline(): boolean {
  const nextOffline = useOffline();
  const browserOffline = useBrowserOffline();
  return nextOffline || browserOffline;
}

type BannerState = "hidden" | "offline" | "back-online";

export default function OfflineBanner() {
  const isOffline = useIsOffline();
  const [state, setState] = useState<BannerState>("hidden");
  const [dismissed, setDismissed] = useState(false);

  // Latest banner state, read inside the effect without re-running it
  const stateRef = useRef<BannerState>("hidden");
  stateRef.current = state;

  useEffect(() => {
    let timer: number | undefined;

    if (isOffline) {
      // Only show if still offline after a moment
      timer = window.setTimeout(() => {
        setDismissed(false); // a new outage shows the banner again
        setState("offline");
      }, SHOW_AFTER_MS);
    } else if (stateRef.current === "offline") {
      // Was showing "offline" → briefly confirm we're back
      setState("back-online");
      timer = window.setTimeout(() => setState("hidden"), BACK_ONLINE_MS);
    } else {
      setState("hidden");
    }

    return () => window.clearTimeout(timer);
  }, [isOffline]);

  if (state === "hidden" || (state === "offline" && dismissed)) return null;

  const offline = state === "offline";

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        // above the phone's home bar, below dialogs/snackbars
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        zIndex: 1300,
        width: "min(560px, calc(100% - 24px))",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 2,
        py: 1.25,
        borderRadius: "14px",
        color: "#fff",
        bgcolor: offline ? "#334155" : "#15803d",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        "@media (prefers-reduced-motion: no-preference)": {
          animation: "offlineIn 0.25s ease-out",
        },
        "@keyframes offlineIn": {
          from: { opacity: 0, transform: "translate(-50%, 12px)" },
          to: { opacity: 1, transform: "translate(-50%, 0)" },
        },
      }}
    >
      <Box aria-hidden sx={{ display: "flex", flexShrink: 0 }}>
        {offline ? <WifiOffRoundedIcon fontSize="small" /> : <CheckIcon size={20} label="" />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.5 }}>
          {offline ? "ఇంటర్నెట్ లేదు" : "మళ్ళీ కనెక్ట్ అయింది"}
        </Typography>
        {offline && (
          <Typography sx={{ fontSize: "0.8rem", opacity: 0.9, lineHeight: 1.6 }}>
            నెట్ వచ్చాక ఆగిన పనులు దానంతట అవే కొనసాగుతాయి. అక్షరమాల రాత, వెతుకులాట ఇప్పుడూ పనిచేస్తాయి.
          </Typography>
        )}
      </Box>

      {offline && (
        <IconButton
          size="small"
          aria-label="మూసివేయండి"
          onClick={() => setDismissed(true)}
          sx={{ color: "inherit", flexShrink: 0, width: 36, height: 36 }}
        >
          <CloseIcon size={16} label="" />
        </IconButton>
      )}
    </Box>
  );
}