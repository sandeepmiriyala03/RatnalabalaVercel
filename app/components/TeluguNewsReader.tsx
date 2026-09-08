"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";

type VoiceOption =
  | "sarvam-te-female"
  | "sarvam-te-male"
  | "te-IN-ShrutiNeural"
  | "te-IN-MohanNeural"
  | "browser-native";

const VOICE_LABELS: Record<VoiceOption, string> = {
  "sarvam-te-female": "🇮🇳 Sarvam AI — స్త్రీ స్వరం (Anushka)",
  "sarvam-te-male": "🇮🇳 Sarvam AI — మగ స్వరం (Abhilash)",
  "te-IN-ShrutiNeural": "🎙️ Edge TTS — Shruti (స్త్రీ)",
  "te-IN-MohanNeural": "🎙️ Edge TTS — Mohan (మగ)",
  "browser-native": "📱 బ్రౌజర్ వాయిస్ (ఆఫ్‌లైన్)",
};

const TELUGU_SANITIZE_RE = /[^\u0C00-\u0C7F0-9₹%\-.?,!\u0964\u0965\s]/g;

function sanitizeTelugu(input: string): string {
  return input.replace(TELUGU_SANITIZE_RE, " ").replace(/\s+/g, " ").trim();
}

async function parseJsonSafe(res: Response): Promise<any> {
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      res.ok
        ? "సర్వర్ నుండి JSON కాకుండా వేరే రెస్పాన్స్ వచ్చింది."
        : `API రూట్ దొరకలేదు లేదా సర్వర్ ఎర్రర్ (status ${res.status}).`
    );
  }
}

// ── Sample news for one-click testing, covering a spread of common
// news types so anyone can verify voices/number-reading without
// typing anything themselves. Includes the exact temple hundi example
// (heavy on numbers/amounts) that surfaced the digit-stripping bug.
const SAMPLE_NEWS: { label: string; text: string }[] = [
  {
    label: "దేవాలయం / హుండీ (సంఖ్యలు)",
    text:
      "శృంగార వల్లభ స్వామి హుండీ ఆదాయం లెక్కింపు\n\n" +
      "పెద్దాపురం: తొలి తిరుపతి శృంగారవల్లభ స్వామి వారి దేవస్థానంలో మంగళవారం హుండీ లెక్కింపు నిర్వహించారు. 85 రోజుల కాలానికి సాధారణ హుండీ ద్వారా రూ.23,44,396, అన్నదానం హుండీ ద్వారా రూ.6,02,957 కలసి మొత్తం రూ.29,47,353 ఆదాయం సమకూరినట్లు ఈవో వడ్డి శ్రీనివాసరావు తెలిపారు. వీటితో పాటు 0.143 గ్రాముల బంగారం, 0.711 గ్రాముల వెండి కానుకలుగా వచ్చినట్లు పేర్కొన్నారు. దేవాదాయ శాఖ జిల్లా అధికారి వి. వెంకటేశ్వరరావు, డివిజనల్ ఇన్‌స్పెక్టర్ ఫణీంద్ర కుమార్, కాజులూరు ఈవో సోమరాజు, ధర్మకర్తల మండలి చైర్మన్ మొయిళ్ల సంధ్య కృష్ణమూర్తి, ఆలయ అర్చకులు, బ్యాంకు సిబ్బంది పాల్గొన్నారు.",
  },
  {
    label: "క్రీడలు",
    text:
      "టీమిండియా విజయం\n\n" +
      "సచిన్ స్టేడియంలో జరిగిన మ్యాచ్‌లో టీమిండియా 7 వికెట్ల తేడాతో ఆస్ట్రేలియాపై విజయం సాధించింది. కెప్టెన్ రోహిత్ శర్మ 87 బంతుల్లో 102 పరుగులు చేసి మ్యాన్ ఆఫ్ ద మ్యాచ్ అవార్డు అందుకున్నాడు. బౌలింగ్‌లో బుమ్రా 4 వికెట్లు తీసి రాణించాడు. తదుపరి మ్యాచ్ శుక్రవారం జరుగనుంది.",
  },
  {
    label: "వాతావరణం",
    text:
      "రాష్ట్రంలో వర్ష సూచన\n\n" +
      "వచ్చే 48 గంటల్లో ఆంధ్రప్రదేశ్, తెలంగాణలో అనేక ప్రాంతాల్లో మోస్తరు నుంచి భారీ వర్షాలు కురిసే అవకాశం ఉందని వాతావరణ శాఖ తెలిపింది. కోస్తా జిల్లాల్లో ఉష్ణోగ్రతలు 2 నుంచి 3 డిగ్రీలు తగ్గే అవకాశం ఉంది. మత్స్యకారులు సముద్రంలోకి వెళ్లవద్దని హెచ్చరించారు.",
  },
  {
    label: "ఆర్థిక వార్తలు",
    text:
      "సెన్సెక్స్ లాభాల్లో ముగింపు\n\n" +
      "బుధవారం స్టాక్ మార్కెట్ లాభాల్లో ముగిసింది. సెన్సెక్స్ 412 పాయింట్లు పెరిగి 74,586 వద్ద, నిఫ్టీ 118 పాయింట్లు పెరిగి 22,610 వద్ద స్థిరపడింది. బ్యాంకింగ్, ఐటి రంగాల షేర్లు లాభపడ్డాయి. రూపాయి డాలర్‌తో పోలిస్తే 83.12కి బలపడింది.",
  },
  {
    label: "స్థానిక వార్తలు",
    text:
      "కొత్త రోడ్డు ప్రారంభం\n\n" +
      "జిల్లా కేంద్రంలో రూ.4.5 కోట్ల వ్యయంతో నిర్మించిన నాలుగు కిలోమీటర్ల రహదారిని మంత్రి ప్రారంభించారు. ఈ రహదారి వల్ల పరిసర గ్రామాల ప్రజలకు రవాణా సౌకర్యం మెరుగుపడుతుందని అధికారులు తెలిపారు. కార్యక్రమంలో స్థానిక ప్రజాప్రతినిధులు, అధికారులు పాల్గొన్నారు.",
  },
];

export default function TeluguNewsReader() {
  const [rawText, setRawText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [voice, setVoice] = useState<VoiceOption>("te-IN-ShrutiNeural");
  const [speed, setSpeed] = useState(1.0);

  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserVoiceWarning, setBrowserVoiceWarning] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanText = sanitizeTelugu(rawText);
  const isBrowserVoice = voice === "browser-native";
  const busy = fetchingUrl || synthesizing || downloading;

  /* ───────── sample news picker ───────── */
  const loadSample = (text: string) => {
    setRawText(text);
    setError(null);
  };

  /* ───────── URL fetch ───────── */
  const handleFetchUrl = async () => {
    if (!articleUrl.trim()) return;
    setFetchingUrl(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl.trim() }),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.detail || "ఆర్టికల్ తీసుకురాలేకపోయాం.");
      setRawText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
    } catch (e: any) {
      setError(e.message || "ఆర్టికల్ తీసుకురాలేకపోయాం.");
    } finally {
      setFetchingUrl(false);
    }
  };

  /* ───────── canvas visualizer ───────── */
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(data);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const step = Math.max(1, Math.floor(bufferLength / barCount));
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const value = data[i * step] || 0;
        const barHeight = (value / 255) * height;
        ctx.fillStyle = `hsl(${210 + (value / 255) * 60}, 90%, 55%)`;
        ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
      }
    };

    render();
  }, []);

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const setupVisualizer = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;

    if (!sourceNodeRef.current) {
      sourceNodeRef.current = ctx.createMediaElementSource(audioEl);
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    }

    if (ctx.state === "suspended") ctx.resume();
    drawVisualizer();
  }, [drawVisualizer]);

  /* ───────── synthesize (server voices) — race-condition safe ───────── */
  const synthesize = async (): Promise<Blob | null> => {
    if (!cleanText) {
      setError("దయచేసి తెలుగు టెక్స్ట్ నమోదు చేయండి.");
      return null;
    }

    const requestId = ++requestIdRef.current;
    const requestedVoice = voice;
    const requestedSpeed = speed;

    setSynthesizing(true);
    setError(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: requestedVoice, speed: requestedSpeed }),
      });

      if (requestId !== requestIdRef.current) return null;

      if (!res.ok) {
        const data = await parseJsonSafe(res).catch(() => ({}));
        throw new Error(data.detail || "వాయిస్ తయారు కాలేదు.");
      }

      const blob = await res.blob();
      if (requestId !== requestIdRef.current) return null;

      audioBlobRef.current = blob;
      return blob;
    } catch (e: any) {
      if (requestId === requestIdRef.current) {
        setError(e.message || "వాయిస్ తయారు కాలేదు.");
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setSynthesizing(false);
    }
  };

  /* ───────── play / pause ───────── */
  const handlePlay = async () => {
    if (isBrowserVoice) {
      if (playing) {
        window.speechSynthesis.cancel();
        setPlaying(false);
        return;
      }
      if (!cleanText) {
        setError("దయచేసి తెలుగు టెక్స్ట్ నమోదు చేయండి.");
        return;
      }
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = "te-IN";
      utter.rate = speed;
      utter.onend = () => setPlaying(false);
      utter.onerror = () => {
        setPlaying(false);
        setError("బ్రౌజర్ వాయిస్ ప్లే కాలేదు — పైన ఉన్న గమనిక చూడండి.");
      };
      window.speechSynthesis.speak(utter);
      setPlaying(true);
      return;
    }

    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    if (audioUrlRef.current && audioRef.current) {
      setupVisualizer();
      await audioRef.current.play();
      setPlaying(true);
      return;
    }

    const blob = await synthesize();
    if (!blob || !audioRef.current) return;

    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = URL.createObjectURL(blob);
    audioRef.current.src = audioUrlRef.current;

    setupVisualizer();
    await audioRef.current.play();
    setPlaying(true);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      setPlaying(false);
      stopVisualizer();
    };
    const onPause = () => stopVisualizer();
    el.addEventListener("ended", onEnded);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  // Voice change invalidates any in-flight request AND cached audio
  // immediately, so switching voices always takes effect right away.
  useEffect(() => {
    requestIdRef.current += 1;

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      audioBlobRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
    setPlaying(false);
    setSynthesizing(false);
    setError(null);

    // Proactively warn if the browser has no Telugu voice installed —
    // rather than letting the user discover this only after clicking
    // Play and hearing nothing.
    if (voice === "browser-native" && typeof window !== "undefined" && "speechSynthesis" in window) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const hasTelugu = voices.some((v) => v.lang?.toLowerCase().startsWith("te"));
        setBrowserVoiceWarning(
          hasTelugu
            ? null
            : "మీ పరికరంలో తెలుగు బ్రౌజర్ వాయిస్ ఇన్‌స్టాల్ చేయబడలేదు — వేరే వాయిస్ ఎంచుకోండి లేదా OS సెట్టింగ్స్‌లో తెలుగు వాయిస్ జోడించండి."
        );
      };
      checkVoices();
      window.speechSynthesis.onvoiceschanged = checkVoices;
    } else {
      setBrowserVoiceWarning(null);
    }
  }, [voice]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ───────── download mp3 ───────── */
  const handleDownload = async () => {
    if (isBrowserVoice) {
      setError("బ్రౌజర్ వాయిస్‌ను MP3‌గా డౌన్‌లోడ్ చేయలేం — వేరే వాయిస్ ఎంచుకోండి.");
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const blob = audioBlobRef.current || (await synthesize());
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
      a.href = url;
      a.download = `telugu_news_${stamp}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const charCount = cleanText.length;

  return (
    <Card elevation={6} sx={{ borderRadius: 4, mb: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={800} gutterBottom>
          తెలుగు న్యూస్ రీడర్ 📰🔊
        </Typography>

        {/* sample news — one-click test data, no typing needed */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          {SAMPLE_NEWS.map((sample) => (
            <Chip
              key={sample.label}
              icon={<ArticleRoundedIcon fontSize="small" />}
              label={sample.label}
              size="small"
              variant="outlined"
              clickable
              onClick={() => loadSample(sample.text)}
              disabled={busy}
            />
          ))}
        </Stack>

        {/* URL fetch */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="న్యూస్ ఆర్టికల్ లింక్ పేస్ట్ చేయండి…"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={fetchingUrl ? <CircularProgress size={16} /> : <LinkRoundedIcon />}
            onClick={handleFetchUrl}
            disabled={busy || !articleUrl.trim()}
            sx={{ whiteSpace: "nowrap" }}
          >
            తీసుకురా
          </Button>
        </Stack>

        {/* text box */}
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={14}
          placeholder="ఇక్కడ న్యూస్ ఆర్టికల్ పేస్ట్ చేయండి లేదా టైప్ చేయండి… లేదా పైన ఒక నమూనా వార్తను ఎంచుకోండి."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          sx={{ mb: 1 }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {charCount} అక్షరాలు (శుద్ధి చేసిన తెలుగు టెక్స్ట్ — సంఖ్యలతో సహా)
          </Typography>
          <IconButton size="small" onClick={() => setRawText("")} disabled={!rawText || busy}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {error && (
          <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>
            {error}
          </Typography>
        )}

        {browserVoiceWarning && (
          <Typography variant="body2" sx={{ color: "warning.main", mb: 2 }}>
            {browserVoiceWarning}
          </Typography>
        )}

        {/* selected voice/language indicator */}
        <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
          <Chip
            label={`ఎంచుకున్నది: ${VOICE_LABELS[voice]}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* voice + speed */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>వాయిస్</InputLabel>
            <Select
              label="వాయిస్"
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceOption)}
            >
              {(Object.keys(VOICE_LABELS) as VoiceOption[]).map((v) => (
                <MenuItem key={v} value={v}>
                  {VOICE_LABELS[v]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ width: "100%", px: { sm: 1 } }}>
            <Typography variant="caption" color="text.secondary">
              వేగం: {speed.toFixed(2)}x
            </Typography>
            <Slider
              size="small"
              value={speed}
              min={0.5}
              max={2.0}
              step={0.05}
              onChange={(_, v) => setSpeed(v as number)}
            />
          </Box>
        </Stack>

        {(synthesizing || downloading) && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

        {/* visualizer */}
        <Box
          sx={{
            bgcolor: "#0f172a",
            borderRadius: 2,
            p: 1,
            mb: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <canvas
            ref={canvasRef}
            width={480}
            height={80}
            style={{ width: "100%", maxWidth: 480 }}
          />
        </Box>

        {/* controls */}
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <IconButton
            onClick={handlePlay}
            disabled={synthesizing || !cleanText}
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              width: 60,
              height: 60,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {synthesizing ? (
              <CircularProgress size={22} sx={{ color: "#fff" }} />
            ) : playing ? (
              <PauseRoundedIcon />
            ) : (
              <PlayArrowRoundedIcon />
            )}
          </IconButton>

          <Button
            variant="outlined"
            startIcon={downloading ? <CircularProgress size={16} /> : <DownloadRoundedIcon />}
            onClick={handleDownload}
            disabled={downloading || !cleanText || isBrowserVoice}
          >
            MP3 డౌన్‌లోడ్
          </Button>
        </Stack>

        {isBrowserVoice && !browserVoiceWarning && (
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            sx={{ mt: 1.5, color: "text.secondary" }}
          >
            బ్రౌజర్ వాయిస్ ఆఫ్‌లైన్‌లో పని చేస్తుంది కానీ MP3‌గా డౌన్‌లోడ్ చేయలేం.
          </Typography>
        )}

        <audio ref={audioRef} style={{ display: "none" }} />
      </CardContent>
    </Card>
  );
}