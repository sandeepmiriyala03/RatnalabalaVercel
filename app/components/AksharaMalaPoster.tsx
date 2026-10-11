"use client";

import React, { useRef, useState, useCallback, useEffect, useId } from "react";
import {
  Box, Typography, Card, CardContent, Divider, IconButton, Button, Stack, Tooltip, CircularProgress, Chip,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import ShareButtons from "@/app/components/ShareBar";
import AksharaTraceBoard from "./AksharaTraceBoard";
import { splitTeluguAksharas } from "@/lib/telugu-akshara-wasm";
import { FAMILY_FALLBACK_VOICE, getFamilyVoiceName, getRecording } from "@/lib/family-voice";
import { track } from "@/lib/track";
import { announceVoice, isAudioBlob, NO_TELUGU_VOICE, onOtherVoice, pickTeluguVoice, TTS_TIMEOUT_MS, unlockAudio } from "@/lib/voice";

type Akshara = {
  id: string;
  type: "swaralu" | "vyanjanalu" | "gunintalu";
  letter: string;
  word?: string;
  image?: string;
};

type Props = {
  akshara: Akshara;
  enableRead?: boolean;
  /** "family" = the parent's own recordings (see FamilyVoiceRecorder) */
  voiceGender?: "male" | "female" | "family";
};

const CARD_VOICE_SOURCE = "edge";

type PracticeResult = { correct: boolean; message: string } | null;

/** matched: undefined = not practised yet, true = said correctly, false = missed */
type AksharaMatch = { akshara: string; matched?: boolean };

/** Speech-recognition errors → plain Telugu */
const MIC_ERRORS: Record<string, string> = {
  "not-allowed": "మైక్ అనుమతి లేదు. బ్రౌజర్ పైన 🔒 గుర్తు నొక్కి మైక్ \"Allow\" చేసి మళ్ళీ ప్రయత్నించండి.",
  "service-not-allowed": "మైక్ అనుమతి లేదు. బ్రౌజర్ పైన 🔒 గుర్తు నొక్కి మైక్ \"Allow\" చేసి మళ్ళీ ప్రయత్నించండి.",
  "no-speech": "ఏమీ వినిపించలేదు. మైక్ దగ్గరగా, కొంచెం గట్టిగా చెప్పండి.",
  "audio-capture": "మైక్ కనబడలేదు. మైక్ / హెడ్‌సెట్ పెట్టి మళ్ళీ ప్రయత్నించండి.",
  network: "ఇంటర్నెట్ లేదు — వాయిస్ గుర్తింపుకు ఇంటర్నెట్ కావాలి.",
};

/**
 * Marks which target aksharas appear, in order, in what was spoken.
 * Uses the longest common subsequence, so one extra or missing akshara
 * doesn't shift and break every match after it.
 */
function matchAksharas(target: string[], spoken: string[]): AksharaMatch[] {
  const m = target.length;
  const n = spoken.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = target[i] === spoken[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: AksharaMatch[] = target.map((akshara) => ({ akshara, matched: false }));
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (target[i] === spoken[j]) {
      result[i].matched = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}

/** 48px round button; colour pairs keep ≥ 4.5:1 for the white icon */
const roundBtn = (bg: string, hover: string) => ({
  width: 48,
  height: 48,
  bgcolor: bg,
  color: "common.white",
  "&:hover": { bgcolor: hover },
  "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled" },
});

const AksharaPosterCard: React.FC<Props> = ({ akshara, enableRead = true, voiceGender = "male" }) => {
  const owner = useId(); // this card's name in the "one voice at a time" channel

  const [isTracing, setIsTracing] = useState(false);
  const [traceLetter, setTraceLetter] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speakIdRef = useRef(0); // a newer tap / stop makes older answers stale
  const ttsAbortRef = useRef<AbortController | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [practiceResult, setPracticeResult] = useState<PracticeResult>(null);
  const [heardText, setHeardText] = useState<string | null>(null);
  const [aksharaMatches, setAksharaMatches] = useState<AksharaMatch[] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Rust · WASM: split the word into aksharas once per card
  const [wordAksharas, setWordAksharas] = useState<string[]>([]);

  useEffect(() => {
    const word = akshara.word?.trim();
    if (!word) {
      setWordAksharas([]);
      return;
    }
    let active = true;
    splitTeluguAksharas(word)
      .then((segments) => {
        if (active) setWordAksharas(segments);
      })
      .catch(() => {
        if (active) setWordAksharas([]);
      });
    return () => {
      active = false;
    };
  }, [akshara.word]);

  /* ---------- speaking ---------- */

  const stopSpeaking = useCallback(() => {
    speakIdRef.current++;
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current); // was leaking when a sound was cut short
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoadingVoice(false);
  }, []);

  // Another card / AI word starts → this card goes quiet. Unmount → quiet, mic off.
  useEffect(() => {
    const off = onOtherVoice(owner, stopSpeaking);
    return () => {
      off();
      stopSpeaking();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* already stopped */
      }
    };
  }, [owner, stopSpeaking]);

  // Voice changed in the page → stop the old voice
  useEffect(() => {
    stopSpeaking();
    setVoiceNotice(null);
  }, [voiceGender, stopSpeaking]);

  const textToSpeak = akshara.word ? `${akshara.letter} ... ${akshara.word}` : akshara.letter;

  /** Plays a blob on the (already unlocked) audio element */
  const playBlob = async (audio: HTMLAudioElement, blob: Blob, id: number) => {
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    audio.onended = () => {
      if (id === speakIdRef.current) stopSpeaking();
    };
    audio.src = url;
    setIsLoadingVoice(false);
    setIsSpeaking(true);
    await audio.play();
  };

  const speakWithDevice = async (id: number) => {
    if (!("speechSynthesis" in window)) {
      setVoiceNotice(NO_TELUGU_VOICE);
      return stopSpeaking();
    }
    const voice = await pickTeluguVoice(voiceGender);
    if (id !== speakIdRef.current) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    // A Telugu voice if the list shows one. Android often lists none but still
    // speaks Telugu when asked with lang "te-IN" — so try anyway.
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "te-IN";
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    const end = () => {
      if (id === speakIdRef.current) {
        setIsSpeaking(false);
        setIsLoadingVoice(false);
      }
    };
    utterance.onend = end;
    utterance.onerror = () => {
      end();
      if (id === speakIdRef.current) setVoiceNotice(NO_TELUGU_VOICE);
    };
    setIsLoadingVoice(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const speak = async () => {
    stopSpeaking();
    setVoiceNotice(null);
    announceVoice(owner); // other cards / AI words stop
    track("speak", { letter: akshara.letter, detail: voiceGender });

    const id = speakIdRef.current;
    // Unlock NOW, inside the tap — iPhone blocks play() after an await
    const audio = unlockAudio(audioRef.current);
    audioRef.current = audio;
    setIsLoadingVoice(true);

    // 1. Family voice: the parent's own recording, if this letter has one
    if (voiceGender === "family") {
      try {
        const rec = await getRecording(akshara.letter);
        if (id !== speakIdRef.current) return;
        if (rec) {
          await playBlob(audio, rec.blob, id);
          return;
        }
      } catch (err) {
        if (id !== speakIdRef.current) return;
        console.warn("[AksharaPosterCard] family recording failed, using computer voice:", err);
      }
    }

    // 2. Server voice (Edge TTS), with a time limit
    const controller = new AbortController();
    ttsAbortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text: textToSpeak,
          source: CARD_VOICE_SOURCE,
          voice: voiceGender === "family" ? FAMILY_FALLBACK_VOICE : voiceGender,
        }),
      });
      if (!res.ok) throw new Error(`TTS API ${res.status}`);
      const blob = await res.blob();
      if (id !== speakIdRef.current) return;
      if (!isAudioBlob(blob)) throw new Error(`TTS gave ${blob.type || "nothing"} (${blob.size} bytes)`);
      await playBlob(audio, blob, id);
    } catch (err) {
      if (id !== speakIdRef.current) return; // stopped or replaced — stay quiet
      console.warn("[AksharaPosterCard] Edge TTS failed, using device voice:", err);
      // 3. Device voice
      await speakWithDevice(id);
    } finally {
      clearTimeout(timer);
    }
  };

  /* ---------- pronunciation practice ---------- */

  const handlePracticeClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setPracticeResult({ correct: false, message: "ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు లేదు — Chrome లేదా Edge వాడండి." });
      return;
    }

    // The card's own voice would be "heard" by the mic — stop it first
    stopSpeaking();
    announceVoice(owner);
    setPracticeResult(null);
    setHeardText(null);
    setAksharaMatches(null);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "te-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const spokenText: string = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
      const targetWord = akshara.word || akshara.letter;
      setIsListening(false);
      if (!spokenText) {
        setPracticeResult({ correct: false, message: MIC_ERRORS["no-speech"] });
        return;
      }
      setIsChecking(true);
      setHeardText(spokenText);

      // 1. Local check with Rust: compare akshara by akshara (instant, works offline)
      let matches: AksharaMatch[] | null = null;
      try {
        const [targetParts, spokenParts] = await Promise.all([splitTeluguAksharas(targetWord), splitTeluguAksharas(spokenText)]);
        matches = matchAksharas(targetParts, spokenParts);
        setAksharaMatches(matches);
      } catch (err) {
        console.warn("[AksharaPosterCard] WASM split failed:", err);
      }

      // 2. Server check (main verdict); fall back to the local result if it fails
      try {
        const res = await fetch("/api/aksharamala?endpoint=pronunciation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_word: targetWord, spoken_text: spokenText }),
        });
        if (!res.ok) throw new Error(`Pronunciation check API ${res.status}`);
        const result = await res.json();
        if (typeof result?.correct !== "boolean") throw new Error("Pronunciation check: bad answer");
        setPracticeResult({
          correct: result.correct,
          message: String(result.message || (result.correct ? "సరిగ్గా చెప్పారు! 🎉" : "మళ్ళీ ప్రయత్నించండి")),
        });
        track("pronunciation", { letter: akshara.letter, success: result.correct, detail: "server" });
      } catch (err) {
        console.error("[AksharaPosterCard] pronunciation check failed:", err);
        if (matches && matches.length > 0) {
          const ok = matches.filter((m) => m.matched).length;
          const allOk = ok === matches.length;
          track("pronunciation", { letter: akshara.letter, success: allOk, detail: "local" });
          setPracticeResult({
            correct: allOk,
            message: allOk ? "సరిగ్గా చెప్పారు! 🎉" : `${matches.length} లో ${ok} అక్షరాలు సరిపోయాయి`,
          });
        } else {
          setPracticeResult({ correct: false, message: "తనిఖీ చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి." });
        }
      } finally {
        setIsChecking(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e?.error === "aborted") return; // we stopped it ourselves
      setPracticeResult({ correct: false, message: MIC_ERRORS[e?.error] ?? "వినలేకపోయాను, మళ్ళీ ప్రయత్నించండి." });
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (err) {
      // e.g. InvalidStateError when a previous session is still closing
      console.warn("[AksharaPosterCard] mic start failed:", err);
      setIsListening(false);
      setPracticeResult({ correct: false, message: "మైక్ మొదలుకాలేదు. ఒక్క క్షణం ఆగి మళ్ళీ నొక్కండి." });
    }
  }, [akshara.letter, akshara.word, owner, stopSpeaking]);

  // Chips to show: practice results if available, otherwise the plain word split
  const displayAksharas: AksharaMatch[] = aksharaMatches ?? wordAksharas.map((a) => ({ akshara: a }));
  const showAksharaChips = displayAksharas.length > 0 && (aksharaMatches !== null || displayAksharas.length > 1);

  const voiceName =
    voiceGender === "family" ? getFamilyVoiceName() || "కుటుంబ గొంతు" : voiceGender === "male" ? "మగ స్వరం" : "స్త్రీ స్వరం";

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 3,
        overflow: "hidden",
        // theme colours (was #fff): in dark mode the theme's light text vanished on white
        bgcolor: "background.paper",
        transition: "transform 0.3s ease",
        "@media (hover: hover)": { "&:hover": { transform: "translateY(-5px)" } },
        "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          ref={posterRef}
          sx={{
            p: { xs: 2, sm: 3 },
            textAlign: "center",
            bgcolor: "background.paper",
            minHeight: { xs: 400, sm: 450 },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 2, fontSize: "1rem" }}>
            తెలుగు అక్షరమాల
          </Typography>
          <Divider sx={{ my: 1.5, borderBottomWidth: 2 }} />

          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isTracing ? (
              <Box sx={{ width: "100%", height: "100%", borderRadius: 2, overflow: "hidden" }}>
                <AksharaTraceBoard key={traceLetter ?? akshara.letter} letter={traceLetter ?? akshara.letter} />
              </Box>
            ) : (
              <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
                {akshara.image && (
                  <Box
                    component="img"
                    src={akshara.image}
                    alt={akshara.word || akshara.letter}
                    loading="lazy"
                    sx={{
                      width: "auto",
                      maxWidth: "100%",
                      height: { xs: 180, sm: 220 },
                      objectFit: "contain",
                      filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.1))",
                    }}
                  />
                )}

                <Box>
                  <Typography
                    lang="te"
                    sx={{ fontSize: { xs: "5rem", sm: "6.5rem" }, fontWeight: 900, lineHeight: 1.25, color: "primary.main" }}
                  >
                    {akshara.letter}
                  </Typography>
                  {akshara.word && (
                    <Typography
                      variant="h4"
                      component="p"
                      lang="te"
                      sx={{ fontWeight: 700, color: "text.primary", mt: 1, fontSize: { xs: "1.5rem", sm: "2rem" }, lineHeight: 1.5 }}
                    >
                      {akshara.word}
                    </Typography>
                  )}

                  {/* Rust · WASM: word split into aksharas (tap one to trace it) */}
                  {showAksharaChips && (
                    <Box sx={{ mt: 1.5 }}>
                      <Stack direction="row" spacing={0.75} justifyContent="center" useFlexGap flexWrap="wrap">
                        {displayAksharas.map((m, i) => {
                          // ✓ / ✗ as well as colour — readable without telling green from red
                          const mark = m.matched === undefined ? "" : m.matched ? " ✓" : " ✗";
                          const state = m.matched === undefined ? "" : m.matched ? " — సరిగ్గా చెప్పారు" : " — మళ్ళీ ప్రయత్నించండి";
                          return (
                            <Tooltip key={`${i}-${m.akshara}`} title={`"${m.akshara}" రాయండి`}>
                              <Chip
                                label={`${m.akshara}${mark}`}
                                clickable
                                aria-label={`${m.akshara}${state}. రాయడానికి నొక్కండి`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTraceLetter(m.akshara);
                                  setIsTracing(true);
                                }}
                                color={m.matched === undefined ? "default" : m.matched ? "success" : "error"}
                                variant={m.matched === undefined ? "outlined" : "filled"}
                                sx={{ fontSize: "1.1rem", fontWeight: 700, height: 44, minWidth: 44 }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Stack>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.secondary" }}>
                        {aksharaMatches ? "✓ సరిగ్గా చెప్పారు • ✗ మళ్ళీ ప్రయత్నించండి" : "అక్షరంపై నొక్కి రాయడం ప్రాక్టీస్ చేయండి"}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {practiceResult && (
                  <Stack alignItems="center" spacing={0.5} role="status" aria-live="polite">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "999px",
                        border: "2px solid",
                        // border + icon carry the colour; text stays theme text (readable in both modes)
                        borderColor: practiceResult.correct ? "success.main" : "error.main",
                        color: "text.primary",
                      }}
                    >
                      {practiceResult.correct ? (
                        <CheckCircleIcon fontSize="small" color="success" />
                      ) : (
                        <CancelIcon fontSize="small" color="error" />
                      )}
                      <Typography variant="body2" fontWeight={700}>
                        {practiceResult.message}
                      </Typography>
                    </Stack>
                    {heardText && (
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        మీరు చెప్పింది: &quot;{heardText}&quot;
                      </Typography>
                    )}
                  </Stack>
                )}

                {voiceNotice && (
                  <Typography role="status" variant="body2" sx={{ color: "text.secondary", maxWidth: 320 }}>
                    🔇 {voiceNotice}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1}>
            <Tooltip title={`వినండి (${voiceName})`}>
              <span>
                <IconButton
                  aria-label={`${akshara.letter} వినండి (${voiceName})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void speak();
                  }}
                  disabled={!enableRead || isLoadingVoice}
                  sx={roundBtn("primary.main", "primary.dark")}
                >
                  {isLoadingVoice ? <CircularProgress size={20} color="inherit" aria-label="స్వరం వస్తోంది" /> : <VolumeUpIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="ఆపండి">
              <span>
                <IconButton
                  aria-label="ఆపండి"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopSpeaking();
                  }}
                  // while the voice is still loading, stopping must also work
                  disabled={!isSpeaking && !isLoadingVoice}
                  color="error"
                  sx={{ width: 48, height: 48 }}
                >
                  <StopCircleIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isListening ? "వింటున్నాను… చెప్పండి" : "మీరు చెప్పండి"}>
              <span>
                <IconButton
                  aria-label={isListening ? "వింటున్నాను — ఇప్పుడు చెప్పండి" : `${akshara.word || akshara.letter} — మీరు చెప్పండి`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePracticeClick();
                  }}
                  disabled={isListening || isChecking}
                  sx={roundBtn(isListening ? "warning.dark" : "secondary.main", "secondary.dark")}
                >
                  {isListening || isChecking ? <CircularProgress size={20} color="inherit" /> : <MicIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "center" }}>
            <Button
              variant={isTracing ? "contained" : "outlined"}
              color={isTracing ? "secondary" : "primary"}
              startIcon={isTracing ? <CloseIcon /> : <EditIcon />}
              onClick={(e) => {
                e.stopPropagation();
                if (isTracing) setTraceLetter(null);
                setIsTracing(!isTracing);
              }}
              aria-pressed={isTracing}
              sx={{ borderRadius: 8, px: 3, minHeight: 48, fontWeight: 700, textTransform: "none" }}
            >
              {isTracing ? "ముగించు" : "రాయండి"}
            </Button>

            <Box onClick={(e) => e.stopPropagation()}>
              <ShareButtons targetRef={posterRef} />
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AksharaPosterCard;
