"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Divider, IconButton, Button, Stack, Tooltip
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

const AksharaPosterCard: React.FC<Props> = ({ akshara, enableRead = true }) => {
  const [isTracing, setIsTracing] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // పేజీ మారినప్పుడు లేదా కంపోనెంట్ క్లోజ్ అయినప్పుడు వాయిస్ ఆగిపోవడానికి
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    
    window.speechSynthesis.cancel(); // పాత సౌండ్‌ని క్లియర్ చేస్తుంది
    
    const textToSpeak = akshara.word 
      ? `${akshara.letter} ... ${akshara.word}` 
      : akshara.letter;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "te-IN";
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    
    window.speechSynthesis.speak(utterance);
  }, [akshara.letter, akshara.word]);

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
                    alt={akshara.word || akshara.letter} // Word లేకపోతే Letter ని Alt టెక్స్ట్ గా వాడుతుంది
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
              <IconButton 
                onClick={speak} 
                disabled={!enableRead}
                sx={{ bgcolor: "primary.light", color: "white", "&:hover": { bgcolor: "primary.main" } }}
              >
                <VolumeUpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="ఆపండి">
              <IconButton 
                onClick={() => window.speechSynthesis.cancel()} 
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
              onClick={() => setIsTracing(!isTracing)}
              sx={{ borderRadius: 8, px: 3, fontWeight: 700, textTransform: "none" }}
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