"use client";

import React, { useRef, useState } from "react";
import {
  Box, Typography, Card, CardContent, Divider, IconButton, Button, Stack
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
  image?: string; // ఇమేజ్ సపోర్ట్ కోసం
};

type Props = {
  akshara: Akshara;
  enableRead?: boolean;
};

const AksharaPosterCard: React.FC<Props> = ({ akshara, enableRead = true }) => {
  const [isTracing, setIsTracing] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${akshara.letter} ... ${akshara.word || ""}`);
    utterance.lang = "te-IN";
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden", background: "white" }}>
      <CardContent sx={{ p: 0 }}>
        {/* Poster Area - దీన్ని షేర్ చేసినప్పుడు ఫోటోగా మారుతుంది */}
        <Box ref={posterRef} sx={{ p: 3, textAlign: "center", bgcolor: "#fff" }}>
          <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "primary.main", mb: 1 }}>
            తెలుగు అక్షరమాల
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ minHeight: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isTracing ? (
              <Box sx={{ width: "100%", height: "100%" }}>
                 <AksharaTraceBoard letter={akshara.letter} />
              </Box>
            ) : (
              <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
                {/* Image Display - బొమ్మ ఉంటే ఇక్కడ కనిపిస్తుంది */}
                {akshara.image && (
                  <Box
                    component="img"
                    src={akshara.image}
                    alt={akshara.word}
                    sx={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "contain",
                      borderRadius: 2,
                      mb: 1
                    }}
                  />
                )}

                {/* Letter and Word Text */}
                <Box>
                  <Typography sx={{ fontSize: "5.5rem", fontWeight: 900, lineHeight: 1, color: "#2c3e50" }}>
                    {akshara.letter}
                  </Typography>
                  <Typography sx={{ fontSize: "1.8rem", fontWeight: 700, color: "secondary.main", mt: 1 }}>
                    {akshara.word}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* Action Buttons Bar */}
        <Box sx={{ p: 2, bgcolor: "#f8f9fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <IconButton onClick={speak} color="primary" title="వినండి">
              <VolumeUpIcon fontSize="large" />
            </IconButton>
            <IconButton onClick={() => window.speechSynthesis.cancel()} color="error" title="ఆపండి">
              <StopCircleIcon />
            </IconButton>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant={isTracing ? "contained" : "outlined"}
              color={isTracing ? "secondary" : "primary"}
              startIcon={isTracing ? <CloseIcon /> : <EditIcon />}
              onClick={() => setIsTracing(!isTracing)}
              sx={{ borderRadius: 20, fontWeight: 700 }}
            >
              {isTracing ? "ముగించు" : "రాయండి"}
            </Button>
            <ShareButtons targetRef={posterRef} />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AksharaPosterCard;