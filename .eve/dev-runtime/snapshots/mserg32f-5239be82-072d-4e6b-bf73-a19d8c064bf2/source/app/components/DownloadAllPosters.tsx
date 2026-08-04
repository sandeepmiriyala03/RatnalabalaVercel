"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Typography,
} from "@mui/material";
import DownloadForOfflineRoundedIcon from "@mui/icons-material/DownloadForOfflineRounded";

import PoemCard from "@/app/components/PoemCard";
import { capturePosterAsDataUrl } from "@/lib/posterExport";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

type Props = {
  poems: Poem[];
  authors?: string | string[];
  poetryName?: string;
};

// Only this many PoemCards are ever mounted in the DOM at once — with
// 1000+ poems, mounting all of them (even off-screen) risks crashing the
// tab on mobile. Small batches keep memory flat regardless of collection
// size.
const RENDER_BATCH_SIZE = 5;

// A new .zip file starts every N poems instead of one giant archive.
// Holding a single 1000+ image zip in memory as one Blob risks running
// out of memory on phones; several smaller zips download more reliably.
const ZIP_CHUNK_SIZE = 150;

// Rough per-poster time budget for the upfront estimate shown to the
// person before they commit to a long-running export.
const ESTIMATED_SECONDS_PER_POSTER = 1.5;

function safeFileName(title: string, index: number): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 60);
  return cleaned ? `${cleaned}.png` : `poem-${index + 1}.png`;
}

function formatEstimate(totalPoems: number): string {
  const totalSeconds = totalPoems * ESTIMATED_SECONDS_PER_POSTER;
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 1) return "ఒక నిమిషం లోపు";
  if (minutes === 1) return "సుమారు 1 నిమిషం";
  return `సుమారు ${minutes} నిమిషాలు`;
}

/* 📦 DownloadAllPosters — large-collection version
   Renders only a small BATCH of poems' posters at a time (not all of
   them), captures each with the shared capturePosterAsDataUrl, adds it
   to the current zip chunk, then unmounts that batch before mounting the
   next one — so DOM size and memory stay flat no matter whether there
   are 10 poems or 10,000. Every ZIP_CHUNK_SIZE poems, the current zip is
   finalized and downloaded, and a fresh one starts, so no single
   in-memory Blob ever has to hold the entire collection. */
export default function DownloadAllPosters({ poems, authors, poetryName }: Props) {
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [batch, setBatch] = useState<Poem[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openConfirm = () => {
    if (exporting || poems.length === 0) return;
    setErrorMsg(null);
    setConfirmOpen(true);
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const runExport = async () => {
    setConfirmOpen(false);
    cancelRef.current = false;
    setExporting(true);
    setProgress({ done: 0, total: poems.length });

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
          poems.length > ZIP_CHUNK_SIZE
            ? `ratnalabala-poems-part-${chunkIndex}.zip`
            : "ratnalabala-poems.zip";
        link.click();
        URL.revokeObjectURL(url);
        zip = new JSZip();
        itemsInCurrentChunk = 0;
        chunkIndex += 1;
      };

      for (let start = 0; start < poems.length; start += RENDER_BATCH_SIZE) {
        if (cancelRef.current) break;

        const currentBatch = poems.slice(start, start + RENDER_BATCH_SIZE);
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
                safeFileName(poems[globalIndex]?.title ?? "", globalIndex),
                base64,
                { base64: true }
              );
              itemsInCurrentChunk += 1;
            }

            setProgress({ done: globalIndex + 1, total: poems.length });

            if (itemsInCurrentChunk >= ZIP_CHUNK_SIZE) {
              await downloadCurrentZip();
            }
          }
        }

        // Unmount this batch before the next one mounts — keeps DOM size
        // constant regardless of total collection size.
        setBatch([]);
      }

      // Final partial chunk (whatever's left under ZIP_CHUNK_SIZE).
      await downloadCurrentZip();

      if (cancelRef.current) {
        setErrorMsg(
          `ఆపివేయబడింది — ${progress.done}/${poems.length} పోస్టర్లు డౌన్‌లోడ్ అయ్యాయి.`
        );
      }
    } catch (err) {
      console.error("Bulk poster export failed:", err);
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
        startIcon={<DownloadForOfflineRoundedIcon />}
        onClick={exporting ? handleCancel : openConfirm}
        color={exporting ? "error" : "primary"}
        disabled={poems.length === 0}
      >
        {exporting
          ? `ఆపండి (${progress.done}/${progress.total})`
          : `అన్ని పద్యాల పోస్టర్లు (${poems.length}) ZIP గా డౌన్‌లోడ్ చేయండి`}
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

      {/* Upfront warning for large collections — 1140 poems can take
          20-40+ minutes and multiple zip downloads, so the person should
          knowingly start this rather than be surprised partway through. */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{poems.length} పోస్టర్లు తయారు చేయాలా?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ఇది పూర్తవ్వడానికి {formatEstimate(poems.length)} పట్టవచ్చు.
            {poems.length > ZIP_CHUNK_SIZE && (
              <>
                {" "}
                ప్రతి {ZIP_CHUNK_SIZE} పోస్టర్లకూ ఒక ZIP ఫైల్‌గా విడివిడిగా
                డౌన్‌లోడ్ అవుతుంది.
              </>
            )}{" "}
            ఈ సమయంలో ఈ ట్యాబ్‌ను మూసివేయవద్దు. మధ్యలో ఆపాలంటే బటన్ మళ్ళీ
            నొక్కవచ్చు.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>రద్దు చేయండి</Button>
          <Button variant="contained" onClick={runExport} autoFocus>
            ప్రారంభించండి
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden, off-screen render of only the CURRENT small batch —
          never the whole collection at once. html2canvas needs real
          layout, so this can't be display:none; it's pushed off-screen
          instead, same as the single-poster export uses. */}
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
          {batch.map((poem, i) => (
            <PoemCard
              key={poem.slug ?? `${poem.title}-${i}`}
              poem={poem}
              ready={false}
              speak={() => {}}
              stopSpeech={() => {}}
              authors={authors}
              poetryName={poetryName}
            />
          ))}
        </div>
      )}
    </Box>
  );
}