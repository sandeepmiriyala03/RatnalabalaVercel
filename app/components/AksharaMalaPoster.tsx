"use client";

import React, { useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  IconButton,
} from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";

import ShareButtons from "@/app/components/ShareBar";

/* ================= INLINE TYPE ================= */

type Akshara = {
  id: string;
  type: "swaralu" | "vyanjanalu" | "gunintalu";
  letter: string;
  word?: string;
};




/* ================= PROPS ================= */

type Props = {
  akshara: Akshara;
  enableRead?: boolean;
};

/* ================= COMPONENT ================= */

const AksharaPosterCard: React.FC<Props> = ({
  akshara,
  enableRead = true,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);

  /* 🔊 Telugu TTS */
  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const text = `${akshara.letter}${
      akshara.word ? " … " + akshara.word : ""
    }`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "te-IN";
    utterance.rate = 0.7;

    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang?.startsWith("te"));

    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        background: "linear-gradient(135deg,#f7fbff,#fff)",
      }}
    >
      <CardContent>
        <Box
          ref={posterRef}
          sx={{ px: 3, py: 4, textAlign: "center" }}
        >
          <Typography sx={{ fontSize: "1.25rem", fontWeight: 900 }}>
            తెలుగు అక్షరమాల
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontSize: "3.5rem", fontWeight: 900 }}>
            {akshara.letter}
          </Typography>

          {akshara.word && (
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
              {akshara.word}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontSize: "0.8rem", opacity: 0.8 }}>
           చదవండి - వినండి - రాయండి - చిత్రీకరించండి - పంచుకోండి - నేర్చుకోండి - అన్వేషించండి - భద్రపరచండి
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {enableRead && (
            <Box>
              <IconButton onClick={speak}>
                <VolumeUpIcon color="primary" />
              </IconButton>
              <IconButton onClick={stop}>
                <StopCircleIcon color="error" />
              </IconButton>
            </Box>
          )}

          <ShareButtons targetRef={posterRef} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AksharaPosterCard;
