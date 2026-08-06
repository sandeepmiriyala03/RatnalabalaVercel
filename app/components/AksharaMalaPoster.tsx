"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Divider, IconButton, Button, Stack, Tooltip, CircularProgress
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";

import ShareButtons from "@/app/components/ShareBar";
import AksharaTraceBoard from "./AksharaTraceBoard";

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
};

// Same Microsoft Edge voice used in DownloadAllVoices.tsx — "mohan"
// (male). Cards are small/frequent, so no voice picker here; just the
// better-quality voice as default, same /api/tts endpoint already
// used for bulk export.
const CARD_VOICE_SOURCE = "edge";
const CARD_VOICE_GENDER = "male";

const AksharaPosterCard: React.FC<Props> = ({ akshara, enableRead = true }) => {
  const [isTracing, setIsTracing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // పేజీ మారినప్పుడు లేదా కంపోనెంట్ క్లోజ్ అయినప్పుడు వాయిస్ ఆగిపోవడానికి
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      audioRef.current?.pause();
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

  // Fallback path — browser's built-in voice, used only if the
  // Microsoft Edge voice API call fails (offline, network error, etc.)
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

  // Primary path — Microsoft Edge voice via /api/tts, same endpoint
  // and voice quality already used in DownloadAllVoices.tsx.
  const speak = useCallback(async () => {
    stopSpeaking();

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
          voice: CARD_VOICE_GENDER,
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
      // Edge voice failed (offline, API error, etc.) — fall back to
      // the browser's built-in voice so listening still works.
      console.error("[AksharaPosterCard] Edge TTS failed, falling back:", err);
      setIsLoadingVoice(false);
      speakWithBrowserVoice();
    }
  }, [akshara.letter, akshara.word, stopSpeaking, speakWithBrowserVoice]);

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
                <AksharaTraceBoard letter={akshara.letter} />
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
                </Box>
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
            <Tooltip title="వినండి">
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
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "center" }}>
            <Button
              variant={isTracing ? "contained" : "outlined"}
              color={isTracing ? "secondary" : "primary"}
              startIcon={isTracing ? <CloseIcon /> : <EditIcon />}
              onClick={(e) => {
                e.stopPropagation();
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