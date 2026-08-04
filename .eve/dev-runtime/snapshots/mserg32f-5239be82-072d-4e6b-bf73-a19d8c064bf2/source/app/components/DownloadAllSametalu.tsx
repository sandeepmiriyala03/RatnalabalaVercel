"use client";

import React, { useRef, useState } from "react";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";

import SametaPosterCard from "@/app/components/SametaCard";
import { capturePosterAsDataUrl } from "@/lib/posterExport";
import type { Sameta } from "@/app/types/sametalu";

type Props = {
  sametalu: Sameta[];
};

// Sametalu don't have a separate "title" field like poems do — just
// `text` (the proverb itself) — so the filename is built from the start
// of the proverb text instead.
function safeFileName(text: string, index: number): string {
  const cleaned = text.trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 50);
  return cleaned ? `${cleaned}.png` : `sameta-${index + 1}.png`;
}

// Only this many SametaPosterCards are ever mounted in the hidden DOM at
// once — sameta collections can run into the thousands, so this keeps
// memory flat regardless of total count (same reasoning as
// DownloadAllPosters.tsx's RENDER_BATCH_SIZE).
const RENDER_BATCH_SIZE = 10;

// A new zip starts every this-many sametalu, so one giant collection
// never has to sit in memory as a single archive.
const ZIP_CHUNK_SIZE = 300;

/* 📦 DownloadAllSametalu
   Same approach as DownloadAllPosters.tsx: only a small BATCH of sametalu
   posters is mounted off-screen at any time (not the whole collection),
   captured one at a time with the shared capturePosterAsDataUrl, using
   the REAL SametaPosterCard component so output is guaranteed identical
   to a manual single download. Zips are finalized/downloaded in chunks
   rather than one giant archive. */
export default function DownloadAllSametalu({ sametalu }: Props) {
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  const [exporting, setExporting] = useState(false);
  const [batch, setBatch] = useState<Sameta[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = () => {
    if (exporting) {
      cancelRef.current = true;
      return;
    }
    runExport();
  };

  const runExport = async () => {
    if (sametalu.length === 0) return;

    setErrorMsg(null);
    cancelRef.current = false;
    setExporting(true);
    setProgress({ done: 0, total: sametalu.length });

    try {
      const JSZip = (await import("jszip")).default;

      let zip = new JSZip();
      let chunkIndex = 1;
      let itemsInCurrentChunk = 0;

      const downloadCurrentZip = async () => {
        if (itemsInCurrentChunk === 0) return;
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          sametalu.length > ZIP_CHUNK_SIZE
            ? `ratnalabala-sametalu-part-${chunkIndex}.zip`
            : "ratnalabala-sametalu.zip";
        link.click();
        URL.revokeObjectURL(url);
        zip = new JSZip();
        itemsInCurrentChunk = 0;
        chunkIndex += 1;
      };

      for (let start = 0; start < sametalu.length; start += RENDER_BATCH_SIZE) {
        if (cancelRef.current) break;

        const currentBatch = sametalu.slice(start, start + RENDER_BATCH_SIZE);
        setBatch(currentBatch);

        // Let React mount this small batch before reading it from the DOM.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const roots = hiddenContainerRef.current?.querySelectorAll<HTMLElement>(
          "[data-poster-root]"
        );

        if (roots && roots.length > 0) {
          for (let i = 0; i < roots.length; i++) {
            if (cancelRef.current) break;

            const globalIndex = start + i;
            const dataUrl = await capturePosterAsDataUrl(roots[i], "social");

            if (dataUrl) {
              const base64 = dataUrl.split(",")[1];
              zip.file(
                safeFileName(sametalu[globalIndex]?.text ?? "", globalIndex),
                base64,
                { base64: true }
              );
              itemsInCurrentChunk += 1;
            }

            setProgress({ done: globalIndex + 1, total: sametalu.length });

            if (itemsInCurrentChunk >= ZIP_CHUNK_SIZE) {
              await downloadCurrentZip();
            }
          }
        }

        // Unmount this batch before the next mounts — keeps DOM size flat.
        setBatch([]);
      }

      await downloadCurrentZip();

      if (cancelRef.current) {
        setErrorMsg(
          `ఆపివేయబడింది — ${progress.done}/${sametalu.length} పోస్టర్లు డౌన్‌లోడ్ అయ్యాయి.`
        );
      }
    } catch (err) {
      console.error("Bulk sameta poster export failed:", err);
      setErrorMsg("పోస్టర్లు తయారు చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setExporting(false);
      setBatch([]);
    }
  };

  return (
    <Box sx={{ textAlign: "center", my: 2 }}>
      <Button
        variant="outlined"
        color={exporting ? "error" : "primary"}
        startIcon={<DownloadForOfflineRoundedIcon />}
        onClick={handleClick}
        disabled={sametalu.length === 0}
      >
        {exporting
          ? `ఆపండి (${progress.done}/${progress.total})`
          : `అన్ని సామెతల పోస్టర్లు (${sametalu.length}) ZIP గా డౌన్‌లోడ్ చేయండి`}
      </Button>

      {exporting && (
        <LinearProgress
          variant="determinate"
          value={progress.total ? (progress.done / progress.total) * 100 : 0}
          sx={{ mt: 1, maxWidth: 320, mx: "auto" }}
        />
      )}

      {errorMsg && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {errorMsg}
        </Typography>
      )}

      {/* Hidden, off-screen render of only the CURRENT small batch — never
          the whole collection at once. Reuses SametaPosterCard as-is, so
          output is pixel-identical to a manual single-poster download. */}
      {batch.length > 0 && (
        <div
          ref={hiddenContainerRef}
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {batch.map((s, i) => (
            <SametaPosterCard key={`${s.id}-${i}`} sameta={s} enableRead={false} />
          ))}
        </div>
      )}
    </Box>
  );
}