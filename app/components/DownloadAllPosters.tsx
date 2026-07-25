"use client";

import React, { useRef, useState } from "react";
import { Box, Button, LinearProgress, Typography } from "@mui/material";
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

// Telugu titles can contain characters that are fine in a filename on
// most systems but occasionally trip up zip tools / older Windows
// versions (\ / : * ? " < > |). Strip those, keep everything else
// (including Telugu script) since modern OSes handle Unicode filenames
// fine — only ASCII path-control characters are actually unsafe.
function safeFileName(title: string, index: number): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 60);
  return cleaned ? `${cleaned}.png` : `poem-${index + 1}.png`;
}

/* 📦 DownloadAllPosters
   Renders every poem's poster off-screen (hidden, but genuinely laid out
   in the DOM — html2canvas needs real layout, not display:none), one
   PoemCard per poem, then loops through them SEQUENTIALLY — not in
   parallel — capturing each with the same capturePosterAsDataUrl used by
   the single-poem download button. Sequential on purpose: each capture
   already builds/tears down its own off-screen clone internally: running
   many html2canvas passes at once risks stalling low-end/phone browsers,
   which is exactly the audience most likely to want a bulk download. */
export default function DownloadAllPosters({ poems, authors, poetryName }: Props) {
  const hiddenContainerRef = useRef<HTMLDivElement>(null);

  const [exporting, setExporting] = useState(false);
  const [renderBatch, setRenderBatch] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadAll = async () => {
    if (exporting || poems.length === 0) return;

    setErrorMsg(null);
    setExporting(true);
    setProgress({ done: 0, total: poems.length });
    setRenderBatch(true);

    // Let React actually mount the hidden PoemCards before reading them
    // from the DOM — setState doesn't render synchronously.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const roots = hiddenContainerRef.current?.querySelectorAll<HTMLElement>(
        "[data-poster-root]"
      );

      if (!roots || roots.length === 0) {
        throw new Error("Poster elements not found for export.");
      }

      for (let i = 0; i < roots.length; i++) {
        const dataUrl = await capturePosterAsDataUrl(roots[i], "social");

        if (dataUrl) {
          const base64 = dataUrl.split(",")[1];
          zip.file(safeFileName(poems[i]?.title ?? "", i), base64, {
            base64: true,
          });
        }

        setProgress({ done: i + 1, total: roots.length });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ratnalabala-poems.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Bulk poster export failed:", err);
      setErrorMsg("పోస్టర్లు తయారు చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setExporting(false);
      setRenderBatch(false);
    }
  };

  return (
    <Box sx={{ textAlign: "center", my: 2 }}>
      <Button
        variant="outlined"
        startIcon={<DownloadForOfflineRoundedIcon />}
        onClick={handleDownloadAll}
        disabled={exporting || poems.length === 0}
      >
        {exporting
          ? `పోస్టర్లు తయారవుతున్నాయి… (${progress.done}/${progress.total})`
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

      {/* Hidden, off-screen render of every poem's poster — only mounted
          during export, torn down right after. Reuses PoemCard as-is, so
          the bulk export is pixel-identical to a single manual download;
          there's no separate poster markup to maintain or drift out of
          sync. `ready={false}`/no-op speak props are fine since the
          Listen/Share/AI buttons are never interacted with here — only
          the inner [data-poster-root] node gets captured. */}
      {renderBatch && (
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
          {poems.map((poem, i) => (
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