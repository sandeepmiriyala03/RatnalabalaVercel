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
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
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

type VoiceOption = "mohan" | "shruti" | "google";

const VOICE_LABELS: Record<VoiceOption, string> = {
  mohan: "🎙️ మగ స్వరం (Mohan)",
  shruti: "👩 స్త్రీ స్వరం (Shruti)",
  google: "🔊 Google TTS",
};

const BG_MUSIC_SRC = "/audio/bg-music-guitar-loop.wav";
const BG_MUSIC_VOLUME = 0.18;

type Props = {
  poems: Poem[];
  authors?: string | string[];
  poetryName?: string;
};

// Small on purpose — poster capture + video recording are both heavier
// than poster-only or audio-only export, so the hidden DOM batch stays
// tiny regardless of collection size.
const RENDER_BATCH_SIZE = 3;

// Videos are far bigger files than PNGs or MP3s — small chunks so no
// single zip/download gets unwieldy.
const ZIP_CHUNK_SIZE = 20;

// Rough per-poem seconds — THIS IS THE HONEST NUMBER: video recording is
// real-time bound (a poem takes as long to record as it takes to read),
// unlike poster capture (instant) or voice generation (a few seconds).
// This is a rough average poem-length guess, not a guarantee.
const ESTIMATED_SECONDS_PER_POEM = 20;

function safeFileName(title: string, index: number): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 50);
  return cleaned ? `${cleaned}.webm` : `poem-${index + 1}.webm`;
}

async function fetchTtsAudioWithRetry(
  text: string,
  voice: VoiceOption
): Promise<Blob | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          source: voice === "google" ? "google" : "edge",
          voice: voice === "shruti" ? "female" : "male",
        }),
      });
      if (res.ok) return await res.blob();
    } catch {
      // fall through to retry / eventual null
    }
  }
  return null;
}

/* Records ONE video: a static poster image held for the full narration
   duration, combined with the voice audio (+ optional looped background
   music). This MUST run in real time — a 20-second poem takes 20 seconds
   to record. There is no way to speed this up client-side; this is a
   real recording, not a file re-encode. This single fact is why bulk
   video is fundamentally slower than bulk posters or bulk audio, and
   should be communicated honestly rather than hidden. */
async function recordPosterVideo(
  posterImageUrl: string,
  voiceBlob: Blob,
  includeBgMusic: boolean,
  bgBuffer: AudioBuffer | null,
  audioCtx: AudioContext
): Promise<Blob> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Poster image failed to load"));
    img.src = posterImageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  // Static image, but some browsers stop delivering canvas-stream frames
  // if nothing visibly changes — a periodic redraw keeps the video track
  // alive without actually changing what's shown.
  const videoStream = canvas.captureStream(5);
  const redrawInterval = setInterval(() => ctx.drawImage(img, 0, 0), 200);

  const voiceArrayBuffer = await voiceBlob.arrayBuffer();
  const voiceBuffer = await audioCtx.decodeAudioData(voiceArrayBuffer);

  const destination = audioCtx.createMediaStreamDestination();

  const voiceSource = audioCtx.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  voiceSource.connect(destination);

  let bgSource: AudioBufferSourceNode | null = null;
  if (includeBgMusic && bgBuffer) {
    bgSource = audioCtx.createBufferSource();
    bgSource.buffer = bgBuffer;
    bgSource.loop = true;
    const bgGain = audioCtx.createGain();
    bgGain.gain.value = BG_MUSIC_VOLUME;
    bgSource.connect(bgGain).connect(destination);
  }

  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...destination.stream.getAudioTracks(),
  ]);

  const recorder = new MediaRecorder(combinedStream, { mimeType: "video/webm" });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  recorder.start();
  voiceSource.start(0);
  bgSource?.start(0);

  // The unavoidable real-time wait.
  await new Promise((resolve) =>
    setTimeout(resolve, voiceBuffer.duration * 1000 + 300)
  );

  recorder.stop();
  bgSource?.stop();
  clearInterval(redrawInterval);

  return recordingDone;
}

/* 📦 DownloadAllVideos
   Same UX pattern as DownloadAllVoices.tsx / DownloadAllPosters.tsx —
   pick a voice, click one button, get a chunked ZIP. Internally combines
   both: captures each poem's poster (reusing capturePosterAsDataUrl,
   same as DownloadAllPosters) and its narration (same /api/tts call as
   DownloadAllVoices), then records them together into a video. Slower
   than either of those alone, for the real-time reason explained above —
   the confirmation dialog states this plainly before anything starts. */
export default function DownloadAllVideos({ poems, authors, poetryName }: Props) {
  const hiddenContainerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  const [voiceChoice, setVoiceChoice] = useState<VoiceOption>("mohan");
  const [includeBgMusic, setIncludeBgMusic] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [batch, setBatch] = useState<Poem[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failedCount, setFailedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClick = () => {
    if (exporting) {
      cancelRef.current = true;
      return;
    }
    if (poems.length === 0) return;
    setErrorMsg(null);
    setConfirmOpen(true);
  };

  const runExport = async () => {
    setConfirmOpen(false);
    cancelRef.current = false;
    setExporting(true);
    setFailedCount(0);
    setProgress({ done: 0, total: poems.length });

    const audioCtx = new AudioContext();
    let bgBuffer: AudioBuffer | null = null;

    if (includeBgMusic) {
      try {
        const res = await fetch(BG_MUSIC_SRC);
        const arrBuf = await res.arrayBuffer();
        bgBuffer = await audioCtx.decodeAudioData(arrBuf);
      } catch {
        bgBuffer = null;
      }
    }

    try {
      const JSZip = (await import("jszip")).default;
      let zip = new JSZip();
      let chunkIndex = 1;
      let itemsInCurrentChunk = 0;
      let failures = 0;

      const downloadCurrentZip = async () => {
        if (itemsInCurrentChunk === 0) return;
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          poems.length > ZIP_CHUNK_SIZE
            ? `ratnalabala-videos-${voiceChoice}-part-${chunkIndex}.zip`
            : `ratnalabala-videos-${voiceChoice}.zip`;
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
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));

        const roots = hiddenContainerRef.current?.querySelectorAll<HTMLElement>(
          "[data-poster-root]"
        );

        if (roots && roots.length > 0) {
          for (let i = 0; i < roots.length; i++) {
            if (cancelRef.current) break;

            const globalIndex = start + i;
            const poem = poems[globalIndex];

            try {
              const posterUrl = await capturePosterAsDataUrl(roots[i], "social");
              const text = `${poem.title}. ${poem.content}`;
              const voiceBlob = posterUrl
                ? await fetchTtsAudioWithRetry(text, voiceChoice)
                : null;

              if (posterUrl && voiceBlob) {
                const videoBlob = await recordPosterVideo(
                  posterUrl,
                  voiceBlob,
                  includeBgMusic,
                  bgBuffer,
                  audioCtx
                );
                zip.file(safeFileName(poem.title, globalIndex), videoBlob);
                itemsInCurrentChunk += 1;
              } else {
                failures += 1;
                setFailedCount(failures);
              }
            } catch (err) {
              console.error("Video generation failed for poem:", poem.title, err);
              failures += 1;
              setFailedCount(failures);
            }

            setProgress({ done: globalIndex + 1, total: poems.length });

            if (itemsInCurrentChunk >= ZIP_CHUNK_SIZE) {
              await downloadCurrentZip();
            }
          }
        }

        setBatch([]);
      }

      await downloadCurrentZip();

      if (cancelRef.current) {
        setErrorMsg(
          `ఆపివేయబడింది — ${progress.done}/${poems.length} వీడియోలు ప్రాసెస్ అయ్యాయి.`
        );
      } else if (failures > 0) {
        setErrorMsg(
          `${failures} పద్యాల వీడియోలు తయారు చేయడంలో విఫలమయ్యాయి (స్కిప్ చేయబడ్డాయి).`
        );
      }
    } catch (err) {
      console.error("Bulk video export failed:", err);
      setErrorMsg("వీడియోలు తయారు చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setExporting(false);
      setBatch([]);
      audioCtx.close();
    }
  };

  const estimateMinutes = Math.round(
    (poems.length * ESTIMATED_SECONDS_PER_POEM) / 60
  );

  return (
    <Box sx={{ textAlign: "center", my: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="center"
        alignItems="center"
      >
        <FormControl size="small" sx={{ minWidth: 200 }} disabled={exporting}>
          <InputLabel id="bulk-video-voice-select">స్వరం</InputLabel>
          <Select
            labelId="bulk-video-voice-select"
            label="స్వరం"
            value={voiceChoice}
            onChange={(e) => setVoiceChoice(e.target.value as VoiceOption)}
          >
            {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
              <MenuItem key={v} value={v}>
                {VOICE_LABELS[v]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          color={exporting ? "error" : "primary"}
          startIcon={<DownloadForOfflineRoundedIcon />}
          onClick={handleClick}
          disabled={poems.length === 0}
        >
          {exporting
            ? `ఆపండి (${progress.done}/${progress.total})`
            : `అన్ని పద్యాల వీడియోలు (${poems.length}) ZIP గా డౌన్‌లోడ్ చేయండి`}
        </Button>
      </Stack>

      <FormControlLabel
        sx={{ mt: 1 }}
        control={
          <Switch
            size="small"
            checked={includeBgMusic}
            disabled={exporting}
            onChange={(e) => setIncludeBgMusic(e.target.checked)}
          />
        }
        label={
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
            🎵 నేపథ్య సంగీతం కూడా చేర్చండి
          </Typography>
        }
      />

      {exporting && (
        <LinearProgress
          variant="determinate"
          value={progress.total ? (progress.done / progress.total) * 100 : 0}
          sx={{ mt: 1, maxWidth: 320, mx: "auto" }}
        />
      )}

      {exporting && failedCount > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {failedCount} విఫలమయ్యాయి, కొనసాగుతోంది…
        </Typography>
      )}

      {errorMsg && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {errorMsg}
        </Typography>
      )}

      {/* Honest, prominent warning — video recording is real-time bound,
          fundamentally different from the near-instant poster/voice
          exports, and the person should know that before starting. */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{poems.length} వీడియోలు తయారు చేయాలా?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            ⚠️ <strong>ముఖ్యమైన విషయం:</strong> వీడియో తయారీ పోస్టర్/వాయిస్
            కన్నా చాలా నెమ్మది — ప్రతి పద్యం యొక్క వీడియో ఆ పద్యం నిడివి
            అంతసేపు నిజ-సమయంలో రికార్డ్ అవ్వాలి (ఉదా. 20 సెకన్ల పద్యానికి
            సుమారు 20 సెకన్లు పడుతుంది — దీన్ని వేగవంతం చేయలేము).
            <br />
            <br />
            మీ {poems.length} పద్యాలకూ సుమారు <strong>{estimateMinutes} నిమిషాలు</strong>{" "}
            పట్టవచ్చు. ఈ సమయమంతా ఈ ట్యాబ్‌ను తెరిచే ఉంచాలి — మూసివేయవద్దు.
            {poems.length > ZIP_CHUNK_SIZE && (
              <>
                {" "}
                ప్రతి {ZIP_CHUNK_SIZE} వీడియోలకూ ఒక ZIP ఫైల్‌గా విడిగా
                డౌన్‌లోడ్ అవుతుంది.
              </>
            )}
            <br />
            <br />
            <strong>సూచన:</strong> మొదట కొన్ని పద్యాలతో (సెర్చ్ చేసి
            తక్కువ చేసి) టెస్ట్ చేయండి, తర్వాత పూర్తి జాబితాకు వాడండి.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>రద్దు చేయండి</Button>
          <Button variant="contained" onClick={runExport} autoFocus>
            ప్రారంభించండి
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden, off-screen render of only the current small batch —
          reuses PoemCard as-is, same as DownloadAllPosters.tsx, so the
          captured poster image matches the live card exactly. */}
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