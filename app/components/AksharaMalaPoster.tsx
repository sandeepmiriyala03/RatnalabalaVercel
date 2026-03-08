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
import AksharaTraceBoard from "./AksharaTraceBoard"; // పైన ఉన్న ఫైల్ ని ఇంపోర్ట్ చేయండి

type Akshara = {
  id: string;
  type: "swaralu" | "vyanjanalu" | "gunintalu";
  letter: string;
  word?: string;
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
    <Card sx={{ borderRadius: 3, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", background: "white" }}>
      <CardContent>
        <Box ref={posterRef} sx={{ px: 3, py: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: 900, color: "primary.main" }}>తెలుగు అక్షరమాల</Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isTracing ? (
              <AksharaTraceBoard letter={akshara.letter} />
            ) : (
              <Box>
                <Typography sx={{ fontSize: "5rem", fontWeight: 900 }}>{akshara.letter}</Typography>
                <Typography sx={{ fontSize: "1.5rem", fontWeight: 600, color: "text.secondary" }}>{akshara.word}</Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />
        </Box>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <IconButton onClick={speak} color="primary"><VolumeUpIcon /></IconButton>
            <IconButton onClick={() => window.speechSynthesis.cancel()} color="error"><StopCircleIcon /></IconButton>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant={isTracing ? "contained" : "outlined"}
              startIcon={isTracing ? <CloseIcon /> : <EditIcon />}
              onClick={() => setIsTracing(!isTracing)}
              size="small"
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