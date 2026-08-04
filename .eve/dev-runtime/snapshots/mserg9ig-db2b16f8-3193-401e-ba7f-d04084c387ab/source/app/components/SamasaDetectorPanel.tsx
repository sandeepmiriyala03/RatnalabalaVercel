"use client";

import React, { useState } from "react";
import {
  Box, Typography, Card, CardContent, Chip,
  TextField, Stack, Button, alpha, Collapse,
} from "@mui/material";
import { detectSamasa, DetectResult } from "./samasaDetector";

const SAMASA_COLORS = [
  "#2d6a4f","#1a5276","#6c3483","#784212","#922b21","#1a5c3a",
];

const SAMPLES = [
  "పెద్ద గుఱ్ఱము","రాజభటుడు","చెట్టుకొమ్మ","పీతాంబరుడు",
  "త్రిలోకి","రామకృష్ణులు","అజ్ఞానము","యథావిధి",
  "కమలాక్షుడు","తల్లిదండ్రులు","దేవాలయము","మంచి బాలుడు",
  "గజాననుడు","పంచభూతాలు","విద్యాధనము","చిగురుకేలు",
];

/* ═══════════════════════════════════════════
   RESULT CARD
═══════════════════════════════════════════ */
function ResultCard({ res, input }: { res: DetectResult; input: string }) {
  const color = SAMASA_COLORS[(res.samasaId - 1) % SAMASA_COLORS.length];

  return (
    <Card elevation={0} sx={{
      border: `2px solid ${alpha(color, 0.4)}`,
      borderRadius: "14px", overflow: "hidden",
    }}>
      <Box sx={{ height: 5, background: color }} />
      <CardContent sx={{ p: "20px 22px !important" }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography sx={{
              fontWeight: 800, fontSize: { xs: "1.2rem", sm: "1.4rem" },
              color, fontFamily: "'Noto Serif Telugu', serif",
            }}>
              {res.samasaName}
            </Typography>
            <Chip label={res.subtype} size="small" sx={{
              mt: 0.5, fontFamily: "'Noto Serif Telugu', serif",
              fontSize: 12, height: 24,
              background: alpha(color, 0.1), color,
              border: `1px solid ${alpha(color, 0.3)}`,
            }} />
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: "50%",
            background: alpha(color, 0.12),
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color }}>
              {res.samasaId}
            </Typography>
          </Box>
        </Stack>

        {/* Input word */}
        <Box sx={{
          background: alpha(color, 0.07), borderRadius: "8px",
          px: 2, py: 1.2, mb: 2,
        }}>
          <Typography sx={{
            fontSize: 12, color: "text.secondary",
            fontFamily: "'Noto Serif Telugu', serif", mb: 0.3,
          }}>
            మీరు ఇచ్చిన పదం
          </Typography>
          <Typography sx={{
            fontSize: 22, fontWeight: 800, color,
            fontFamily: "'Noto Serif Telugu', serif",
          }}>
            {input}
          </Typography>
        </Box>

        {/* పూర్వపదం + ఉత్తరపదం */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2.5} flexWrap="wrap" useFlexGap>
          <Box sx={{
            background: alpha(color, 0.08),
            border: `1px solid ${alpha(color, 0.25)}`,
            borderRadius: "8px", px: 1.5, py: 0.8, textAlign: "center",
          }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
              పూర్వపదం
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {res.purvapadam}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, color: "text.secondary", fontSize: 20 }}>+</Typography>
          <Box sx={{
            background: alpha(color, 0.08),
            border: `1px solid ${alpha(color, 0.25)}`,
            borderRadius: "8px", px: 1.5, py: 0.8, textAlign: "center",
          }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
              ఉత్తరపదం
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {res.uttarapadam}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, color: "text.secondary", fontSize: 20 }}>→</Typography>
          <Box sx={{
            background: alpha(color, 0.15),
            border: `2px solid ${alpha(color, 0.4)}`,
            borderRadius: "8px", px: 1.5, py: 0.8, textAlign: "center",
          }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Noto Serif Telugu', serif" }}>
              ప్రాధాన్యత
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Noto Serif Telugu', serif" }}>
              {res.pradhanyam}
            </Typography>
          </Box>
        </Stack>

        {/* విగ్రహ వాక్యం */}
        <Box sx={{
          background: alpha(color, 0.05),
          borderLeft: `3px solid ${color}`,
          borderRadius: "0 8px 8px 0",
          px: 2, py: 1.5, mb: 2,
        }}>
          <Typography sx={{
            fontSize: 11, color, fontWeight: 700, mb: 0.5,
            fontFamily: "'Noto Serif Telugu', serif",
          }}>
            విగ్రహ వాక్యం
          </Typography>
          <Typography sx={{
            fontSize: 16, fontWeight: 700, color: "text.primary",
            fontFamily: "'Noto Serif Telugu', serif",
          }}>
            {res.vigraha}
          </Typography>
        </Box>

        {/* నిర్వచనం */}
        <Box sx={{
          background: alpha(color, 0.04),
          borderLeft: `3px solid ${alpha(color, 0.4)}`,
          borderRadius: "0 8px 8px 0",
          px: 2, py: 1.2, mb: 2.5,
        }}>
          <Typography sx={{
            fontSize: 11, color, fontWeight: 700, mb: 0.3,
            fontFamily: "'Noto Serif Telugu', serif",
          }}>
            నిర్వచనం
          </Typography>
          <Typography sx={{
            fontSize: 13, color: "text.secondary", lineHeight: 1.9,
            fontFamily: "'Noto Serif Telugu', serif",
          }}>
            {res.definition}
          </Typography>
        </Box>

        {/* ఉదాహరణలు */}
        <Typography sx={{
          fontSize: 12, fontWeight: 700, color: "text.secondary",
          mb: 1, letterSpacing: 0.5, textTransform: "uppercase",
        }}>
          మరిన్ని ఉదాహరణలు
        </Typography>
        <Stack spacing={0.8}>
          {res.examples.map((ex, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5}
              sx={{ background: alpha(color, 0.05), borderRadius: "8px", px: 1.5, py: 0.8 }}>
              <Typography sx={{
                fontSize: 14, fontWeight: 700, color,
                fontFamily: "'Noto Serif Telugu', serif", minWidth: 120,
              }}>
                {ex.samasa}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>=</Typography>
              <Typography sx={{
                fontSize: 13, color: "text.secondary",
                fontFamily: "'Noto Serif Telugu', serif",
              }}>
                {ex.vigraha}
              </Typography>
            </Stack>
          ))}
        </Stack>

      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   MAIN PANEL
═══════════════════════════════════════════ */
export default function SamasadetectorPanel() {
  const [input, setInput]   = useState("");
  const [result, setResult] = useState<DetectResult | null>(null);
  const [tried, setTried]   = useState(false);

  const handleDetect = () => {
    if (!input.trim()) return;
    setResult(detectSamasa(input.trim()));
    setTried(true);
  };

  const handleReset = () => {
    setInput(""); setResult(null); setTried(false);
  };

  return (
    <Box>
      {/* Input card */}
      <Card elevation={0} sx={{
        border: "1px solid", borderColor: alpha("#2d6a4f", 0.2),
        borderRadius: "14px", mb: 2.5,
      }}>
        <CardContent sx={{ p: "20px !important" }}>
          <Typography sx={{
            fontSize: 13, color: "text.secondary", mb: 1.5,
            fontFamily: "'Noto Serif Telugu', serif",
          }}>
            తెలుగు పదం లేదా రెండు పదాల phrase రాయండి — సమాసం automatic గా గుర్తించబడుతుంది
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth value={input}
              onChange={e => { setInput(e.target.value); setTried(false); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && handleDetect()}
              placeholder="ఉదా: పెద్ద గుఱ్ఱము, రాజభటుడు, త్రిలోకి..."
              InputProps={{
                sx: {
                  borderRadius: "10px",
                  fontFamily: "'Noto Serif Telugu', serif",
                  fontSize: 18,
                },
              }}
            />
            <Button
              variant="contained" disableElevation
              onClick={handleDetect} disabled={!input.trim()}
              sx={{
                borderRadius: "10px", px: 3, background: "#2d6a4f",
                fontWeight: 700, fontSize: 14, textTransform: "none",
                fontFamily: "'Noto Serif Telugu', serif",
                "&:hover": { background: "#1a3d2b" },
              }}
            >
              గుర్తించు
            </Button>
            {tried && (
              <Button
                variant="outlined" onClick={handleReset}
                sx={{
                  borderRadius: "10px", px: 2,
                  fontWeight: 700, fontSize: 13, textTransform: "none",
                  borderColor: alpha("#2d6a4f", 0.4), color: "#2d6a4f",
                  fontFamily: "'Noto Serif Telugu', serif",
                }}
              >
                Clear
              </Button>
            )}
          </Stack>

          {/* Sample chips */}
          <Box sx={{ mt: 2 }}>
            <Typography sx={{
              fontSize: 11, color: "text.secondary", mb: 1,
              fontFamily: "'Noto Serif Telugu', serif",
            }}>
              ఉదాహరణలు click చేయండి:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.8} useFlexGap>
              {SAMPLES.map(s => (
                <Chip key={s} label={s} size="small"
                  onClick={() => { setInput(s); setResult(null); setTried(false); }}
                  sx={{
                    fontFamily: "'Noto Serif Telugu', serif",
                    fontSize: 13, cursor: "pointer",
                    background: alpha("#2d6a4f", 0.07), color: "#2d6a4f",
                    border: `1px solid ${alpha("#2d6a4f", 0.2)}`,
                    "&:hover": { background: alpha("#2d6a4f", 0.15) },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Result */}
      <Collapse in={tried} timeout={300}>
        {result?.detected
          ? <ResultCard res={result} input={input} />
          : tried && (
            <Card elevation={0} sx={{
              border: "1px solid", borderColor: alpha("#e74c3c", 0.3),
              borderRadius: "14px",
            }}>
              <CardContent sx={{ p: "20px !important", textAlign: "center" }}>
                <Typography sx={{ fontSize: "2rem", mb: 1 }}>🤔</Typography>
                <Typography sx={{
                  fontWeight: 700, fontSize: "1.1rem", color: "#e74c3c",
                  fontFamily: "'Noto Serif Telugu', serif", mb: 0.5,
                }}>
                  సమాసం గుర్తించలేకపోయాం
                </Typography>
                <Typography sx={{
                  fontSize: 13, color: "text.secondary",
                  fontFamily: "'Noto Serif Telugu', serif",
                }}>
                  వేరే పదం లేదా రెండు పదాల phrase try చేయండి
                </Typography>
              </CardContent>
            </Card>
          )
        }
      </Collapse>
    </Box>
  );
}