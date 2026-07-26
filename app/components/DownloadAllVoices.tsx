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

// Same background track/volume as the per-poem player in PoemCard.tsx —
// kept in sync manually since this is a separate, self-contained
// component (same pattern as the duplicated fetchTtsAudio helper).
const BG_MUSIC_SRC = "/audio/bg-music-guitar-loop.wav";
const BG_MUSIC_VOLUME = 0.18;

type Props = {
  poems: Poem[];
};

// Audio files are bigger than poster PNGs, and each one costs a real
// live server call (unlike poster capture, which is free/instant in the
// browser) — kept modest so no single zip/download gets unwieldy.
const ZIP_CHUNK_SIZE = 100;

// Rough per-poem time budget for the upfront estimate — live TTS
// generation + network round trip, not instant like poster capture.
// Background-music mixing adds a bit more per-poem time on top of this.
const ESTIMATED_SECONDS_PER_POEM = 3;

function safeFileName(title: string, index: number, ext: "mp3" | "wav"): string {
  const cleaned = title.trim().replace(/[\\/:*?"<>|]+/g, "").slice(0, 60);
  return cleaned ? `${cleaned}.${ext}` : `poem-${index + 1}.${ext}`;
}

function formatEstimate(totalPoems: number): string {
  const totalSeconds = totalPoems * ESTIMATED_SECONDS_PER_POEM;
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 1) return "ఒక నిమిషం లోపు";
  if (minutes === 1) return "సుమారు 1 నిమిషం";
  return `సుమారు ${minutes} నిమిషాలు`;
}

// One retry on failure — a live network call is more failure-prone than
// local poster capture (cold starts, brief TTS-provider hiccups), so a
// single retry meaningfully cuts down on skipped poems without turning
// one bad request into an infinite loop.
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

// Encodes a rendered AudioBuffer as a playable WAV Blob — no browser
// ships a built-in MP3 encoder, so mixed (voice + background music)
// output comes out as WAV instead. Standard, well-known technique.
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

// Mixes the voice clip with a LOOPED background track using an
// OfflineAudioContext (renders faster than real-time, doesn't play
// audibly during export) — same volume the person hears live via the
// per-poem toggle. bgBuffer is decoded ONCE outside the per-poem loop
// and reused, since re-fetching/decoding the same short loop 1000+
// times would be wasted work.
async function mixWithBackgroundMusic(
  voiceBlob: Blob,
  bgBuffer: AudioBuffer,
  audioCtx: AudioContext
): Promise<Blob> {
  const voiceArrayBuffer = await voiceBlob.arrayBuffer();
  const voiceBuffer = await audioCtx.decodeAudioData(voiceArrayBuffer);

  const sampleRate = voiceBuffer.sampleRate;
  const duration = voiceBuffer.duration;
  const offlineCtx = new OfflineAudioContext(
    2,
    Math.ceil(duration * sampleRate),
    sampleRate
  );

  const voiceSource = offlineCtx.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  voiceSource.connect(offlineCtx.destination);
  voiceSource.start(0);

  const bgSource = offlineCtx.createBufferSource();
  bgSource.buffer = bgBuffer;
  bgSource.loop = true;
  const bgGain = offlineCtx.createGain();
  bgGain.gain.value = BG_MUSIC_VOLUME;
  bgSource.connect(bgGain).connect(offlineCtx.destination);
  bgSource.start(0);
  bgSource.stop(duration); // background stops exactly when the voice ends

  const renderedBuffer = await offlineCtx.startRendering();
  return audioBufferToWavBlob(renderedBuffer);
}

/* 📦 DownloadAllVoices
   Same UX pattern as DownloadAllPosters.tsx (chunked zips, cancel button,
   upfront time-estimate confirmation) but far simpler internally — no
   hidden DOM rendering needed, since this just calls /api/tts directly
   per poem and zips the resulting audio blobs. */
export default function DownloadAllVoices({ poems }: Props) {
  const cancelRef = useRef(false);

  const [voiceChoice, setVoiceChoice] = useState<VoiceOption>("mohan");
  const [includeBgMusic, setIncludeBgMusic] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
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

    try {
      const JSZip = (await import("jszip")).default;

      let zip = new JSZip();
      let chunkIndex = 1;
      let itemsInCurrentChunk = 0;
      let failures = 0;

      // Decode the background track ONCE, reused for every poem's mix —
      // re-fetching/decoding the same short loop 1000+ times would be
      // pure waste. Only created if the toggle is actually on.
      let audioCtx: AudioContext | null = null;
      let bgBuffer: AudioBuffer | null = null;

      if (includeBgMusic) {
        audioCtx = new AudioContext();
        const bgRes = await fetch(BG_MUSIC_SRC);
        const bgArrayBuffer = await bgRes.arrayBuffer();
        bgBuffer = await audioCtx.decodeAudioData(bgArrayBuffer);
      }

      const downloadCurrentZip = async () => {
        if (itemsInCurrentChunk === 0) return;
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          poems.length > ZIP_CHUNK_SIZE
            ? `ratnalabala-voices-${voiceChoice}-part-${chunkIndex}.zip`
            : `ratnalabala-voices-${voiceChoice}.zip`;
        link.click();
        URL.revokeObjectURL(url);
        zip = new JSZip();
        itemsInCurrentChunk = 0;
        chunkIndex += 1;
      };

      for (let i = 0; i < poems.length; i++) {
        if (cancelRef.current) break;

        const poem = poems[i];
        const text = `${poem.title}. ${poem.content}`;
        const voiceBlob = await fetchTtsAudioWithRetry(text, voiceChoice);

        if (voiceBlob) {
          try {
            const finalBlob =
              includeBgMusic && bgBuffer && audioCtx
                ? await mixWithBackgroundMusic(voiceBlob, bgBuffer, audioCtx)
                : voiceBlob;

            zip.file(
              safeFileName(poem.title, i, includeBgMusic ? "wav" : "mp3"),
              finalBlob
            );
            itemsInCurrentChunk += 1;
          } catch (mixErr) {
            // Mixing failed for this one poem (rare — bad decode, etc.)
            // — fall back to the plain voice-only clip rather than
            // dropping the poem entirely.
            console.error("Background music mix failed, using voice-only:", mixErr);
            zip.file(safeFileName(poem.title, i, "mp3"), voiceBlob);
            itemsInCurrentChunk += 1;
          }
        } else {
          failures += 1;
          setFailedCount(failures);
        }

        setProgress({ done: i + 1, total: poems.length });

        if (itemsInCurrentChunk >= ZIP_CHUNK_SIZE) {
          await downloadCurrentZip();
        }
      }

      await downloadCurrentZip();
      audioCtx?.close();

      if (cancelRef.current) {
        setErrorMsg(
          `ఆపివేయబడింది — ${progress.done}/${poems.length} వాయిస్‌లు ప్రాసెస్ అయ్యాయి.`
        );
      } else if (failures > 0) {
        setErrorMsg(
          `${failures} పద్యాల వాయిస్‌లు తయారు చేయడంలో విఫలమయ్యాయి (స్కిప్ చేయబడ్డాయి). మిగతావన్నీ ZIPలో ఉన్నాయి.`
        );
      }
    } catch (err) {
      console.error("Bulk voice export failed:", err);
      setErrorMsg("వాయిస్‌లు తయారు చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ textAlign: "center", my: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="center"
        alignItems="center"
      >
        <FormControl size="small" sx={{ minWidth: 200 }} disabled={exporting}>
          <InputLabel id="bulk-voice-select">స్వరం</InputLabel>
          <Select
            labelId="bulk-voice-select"
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
            : `అన్ని పద్యాల వాయిస్‌లు (${poems.length}) ZIP గా డౌన్‌లోడ్ చేయండి`}
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
            🎵 నేపథ్య సంగీతం కూడా చేర్చండి (ఆన్‌గా ఉంటే వెబ్‌సైట్‌లో వినేదే
            డౌన్‌లోడ్ అవుతుంది)
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

      {/* Upfront warning — unlike poster export (free/instant in-browser),
          EVERY poem here triggers a real live server TTS call, so a large
          collection genuinely takes real time and hits your TTS engines
          repeatedly. The person should knowingly start this. */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{poems.length} వాయిస్‌లు తయారు చేయాలా?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ఇది పూర్తవ్వడానికి {formatEstimate(poems.length)} పట్టవచ్చు — ప్రతి
            పద్యం సర్వర్‌పై నిజ సమయంలో తయారవుతుంది (పోస్టర్ డౌన్‌లోడ్ లాగా
            తక్షణం కాదు).
            {includeBgMusic && (
              <>
                {" "}
                నేపథ్య సంగీతం కూడా చేర్చడం వల్ల ఫైళ్ళు{" "}
                <strong>.wav</strong> ఫార్మాట్‌లో (mp3 కన్నా పెద్దవిగా)
                డౌన్‌లోడ్ అవుతాయి.
              </>
            )}
            {poems.length > ZIP_CHUNK_SIZE && (
              <>
                {" "}
                ప్రతి {ZIP_CHUNK_SIZE} వాయిస్‌లకూ ఒక ZIP ఫైల్‌గా విడివిడిగా
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
    </Box>
  );
}