"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
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
      dp[i][j] =
        target[i] === spoken[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
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

const AksharaPosterCard: React.FC<Props> = ({
  akshara,
  enableRead = true,
  voiceGender = "male",
}) => {
  const [isTracing, setIsTracing] = useState(false);
  const [traceLetter, setTraceLetter] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [practiceResult, setPracticeResult] = useState<PracticeResult>(null);
  const [heardText, setHeardText] = useState<string | null>(null);
  const [aksharaMatches, setAksharaMatches] = useState<AksharaMatch[] | null>(null);
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
      .then((segments) => { if (active) setWordAksharas(segments); })
      .catch(() => { if (active) setWordAksharas([]); });
    return () => { active = false; };
  }, [akshara.word]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      audioRef.current?.pause();
      recognitionRef.current?.stop();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    audioRef.current?.pause();
    audioRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speakWithBrowserVoice = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const textToSpeak = akshara.word
      ? `${akshara.letter} ... ${akshara.word}`
      : akshara.letter;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "te-IN";
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [akshara.letter, akshara.word]);

  const speak = useCallback(async () => {
    stopSpeaking();
    track("speak", { letter: akshara.letter, detail: voiceGender });

    // Family voice: play the parent's own recording if this letter has one
    if (voiceGender === "family") {
      const rec = await getRecording(akshara.letter);
      if (rec) {
        const url = URL.createObjectURL(rec.blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        setIsSpeaking(true);
        try {
          await audio.play();
          return;
        } catch {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          // fall through to the computer voice
        }
      }
    }

    const ttsVoice = voiceGender === "family" ? FAMILY_FALLBACK_VOICE : voiceGender;
    const textToSpeak = akshara.word
      ? `${akshara.letter} ... ${akshara.word}`
      : akshara.letter;

    setIsLoadingVoice(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          source: CARD_VOICE_SOURCE,
          voice: ttsVoice,
        }),
      });

      if (!res.ok) throw new Error(`TTS API ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      setIsLoadingVoice(false);
      setIsSpeaking(true);
      await audio.play();
    } catch (err) {
      console.error("[AksharaPosterCard] Edge TTS failed, falling back:", err);
      setIsLoadingVoice(false);
      speakWithBrowserVoice();
    }
  }, [akshara.letter, akshara.word, voiceGender, stopSpeaking, speakWithBrowserVoice]);

  const handlePracticeClick = useCallback(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setPracticeResult({
        correct: false,
        message: "మీ బ్రౌజర్‌లో వాయిస్ గుర్తింపు లేదు (Chrome వాడండి).",
      });
      return;
    }

    setPracticeResult(null);
    setHeardText(null);
    setAksharaMatches(null);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "te-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event: any) => {
      const spokenText: string = event.results[0][0].transcript;
      const targetWord = akshara.word || akshara.letter;
      setIsListening(false);
      setIsChecking(true);
      setHeardText(spokenText);

      // 1. Local check with Rust: compare akshara by akshara (instant, works offline)
      let matches: AksharaMatch[] | null = null;
      try {
        const [targetParts, spokenParts] = await Promise.all([
          splitTeluguAksharas(targetWord),
          splitTeluguAksharas(spokenText),
        ]);
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
        setPracticeResult({ correct: result.correct, message: result.message });
        track("pronunciation", { letter: akshara.letter, success: !!result.correct, detail: "server" });
      } catch (err) {
        console.error("[AksharaPosterCard] pronunciation check failed:", err);

        if (matches && matches.length > 0) {
          const ok = matches.filter((m) => m.matched).length;
          const allOk = ok === matches.length;
          track("pronunciation", { letter: akshara.letter, success: allOk, detail: "local" });
          setPracticeResult({
            correct: allOk,
            message: allOk
              ? "సరిగ్గా చెప్పారు! 🎉"
              : `${matches.length} లో ${ok} అక్షరాలు సరిపోయాయి`,
          });
        } else {
          setPracticeResult({
            correct: false,
            message: "తనిఖీ చేయడంలో సమస్య వచ్చింది. మళ్ళీ ప్రయత్నించండి.",
          });
        }
      } finally {
        setIsChecking(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setPracticeResult({
        correct: false,
        message: "వినలేకపోయాను, మళ్ళీ ప్రయత్నించండి.",
      });
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [akshara.letter, akshara.word]);

  // Chips to show: practice results if available, otherwise the plain word split
  const displayAksharas: AksharaMatch[] =
    aksharaMatches ?? wordAksharas.map((a) => ({ akshara: a }));
  const showAksharaChips =
    displayAksharas.length > 0 && (aksharaMatches !== null || displayAksharas.length > 1);

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        overflow: "hidden",
        background: "#ffffff",
        transition: "transform 0.3s ease",
        "&:hover": { transform: "translateY(-5px)" }
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          ref={posterRef}
          sx={{
            p: { xs: 2, sm: 3 },
            textAlign: "center",
            bgcolor: "#fff",
            minHeight: { xs: 400, sm: 450 },
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 2, fontSize: "1rem" }}
          >
            తెలుగు అక్షరమాల
          </Typography>
          <Divider sx={{ my: 1.5, borderBottomWidth: 2 }} />

          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isTracing ? (
              <Box sx={{ width: "100%", height: "100%", borderRadius: 2, overflow: "hidden" }}>
                <AksharaTraceBoard
                  key={traceLetter ?? akshara.letter}
                  letter={traceLetter ?? akshara.letter}
                />
              </Box>
            ) : (
              <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
                {akshara.image && (
                  <Box
                    component="img"
                    src={akshara.image}
                    alt={akshara.word || akshara.letter}
                    sx={{
                      width: "auto",
                      maxWidth: "100%",
                      height: { xs: 180, sm: 220 },
                      objectFit: "contain",
                      filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.1))"
                    }}
                  />
                )}

                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: "5rem", sm: "6.5rem" },
                      fontWeight: 900,
                      lineHeight: 1.1,
                      color: "#1a237e"
                    }}
                  >
                    {akshara.letter}
                  </Typography>
                  {akshara.word && (
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: "secondary.dark",
                        mt: 1,
                        fontSize: { xs: "1.5rem", sm: "2rem" }
                      }}
                    >
                      {akshara.word}
                    </Typography>
                  )}

                  {/* Rust · WASM: word split into aksharas (tap one to trace it) */}
                  {showAksharaChips && (
                    <Box sx={{ mt: 1.5 }}>
                      <Stack direction="row" spacing={0.75} justifyContent="center" useFlexGap flexWrap="wrap">
                        {displayAksharas.map((m, i) => (
                          <Tooltip key={`${i}-${m.akshara}`} title={`"${m.akshara}" రాయండి`}>
                            <Chip
                              label={m.akshara}
                              clickable
                              onClick={(e) => {
                                e.stopPropagation();
                                setTraceLetter(m.akshara);
                                setIsTracing(true);
                              }}
                              color={m.matched === undefined ? "default" : m.matched ? "success" : "error"}
                              variant={m.matched === undefined ? "outlined" : "filled"}
                              sx={{ fontSize: "1.1rem", fontWeight: 700, height: 34 }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.6 }}>
                        {aksharaMatches
                          ? "🟢 సరిగ్గా చెప్పారు • 🔴 మళ్ళీ ప్రయత్నించండి"
                          : "అక్షరంపై నొక్కి రాయడం ప్రాక్టీస్ చేయండి"}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {practiceResult && (
                  <Stack alignItems="center" spacing={0.5}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "999px",
                        bgcolor: practiceResult.correct ? "success.light" : "error.light",
                      }}
                    >
                      {practiceResult.correct ? (
                        <CheckCircleIcon fontSize="small" sx={{ color: "success.dark" }} />
                      ) : (
                        <CancelIcon fontSize="small" sx={{ color: "error.dark" }} />
                      )}
                      <Typography variant="body2" fontWeight={700}>
                        {practiceResult.message}
                      </Typography>
                    </Stack>
                    {heardText && (
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        మీరు చెప్పింది: &quot;{heardText}&quot;
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: "#fcfcfc",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Stack direction="row" spacing={1}>
            <Tooltip
              title={
                voiceGender === "family"
                  ? `వినండి (${getFamilyVoiceName() || "కుటుంబ గొంతు"})`
                  : voiceGender === "male"
                    ? "వినండి (మగ స్వరం)"
                    : "వినండి (స్త్రీ స్వరం)"
              }
            >
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    speak();
                  }}
                  disabled={!enableRead || isLoadingVoice}
                  sx={{ bgcolor: "primary.light", color: "white", "&:hover": { bgcolor: "primary.main" } }}
                >
                  {isLoadingVoice ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    <VolumeUpIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="ఆపండి">
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    stopSpeaking();
                  }}
                  disabled={!isSpeaking}
                  color="error"
                >
                  <StopCircleIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="మీరు చెప్పండి">
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePracticeClick();
                  }}
                  disabled={isListening || isChecking}
                  sx={{
                    bgcolor: isListening ? "warning.main" : "secondary.light",
                    color: "white",
                    "&:hover": { bgcolor: "secondary.main" },
                  }}
                >
                  {isListening || isChecking ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : (
                    <MicIcon />
                  )}
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
              sx={{ borderRadius: 8, px: 3, fontWeight: 700, textTransform: "none" }}
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