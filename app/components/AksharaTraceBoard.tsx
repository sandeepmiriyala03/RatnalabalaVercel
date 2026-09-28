"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, IconButton, Typography, CircularProgress, Stack, Button, useTheme } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";

import { getTraceMaskSide, scoreTraceMasks } from "@/lib/telugu-akshara-wasm";

interface TraceProps {
  letter: string;
}

/* ================= CONSTANTS ================= */

const MIN_SIZE = 200;
const MAX_SIZE = 340;
const GUIDE_SCALE = 0.35;    // guide font size relative to the board
const GUIDE_MAX_FILL = 0.8;  // long conjuncts (క్ష్మి) shrink to fit 80% of the board
const GUIDE_COLOR = "#e6eaf0";
const STROKE_COLOR = "#1976d2";
const PASS_PERCENT = 60;
const GREAT_PERCENT = 80;

type CheckResult = {
  correct: boolean;
  score: number;
  message: string;
  coverage?: number;
  precision?: number;
  ms?: number;
  source?: "rust" | "server";
} | null;

/* ================= HELPERS ================= */

function formatDuration(ms: number): string {
  if (ms <= 0) return "< 0.1 ms";
  if (ms < 1) return `${Math.round(ms * 1000)} µs`;
  return `${ms.toFixed(1)} ms`;
}

/**
 * Draws the letter centred by its real glyph bounds, shrinking it if it's too big.
 * The on-screen guide AND the Rust target mask both use this, so they match exactly.
 */
function drawCenteredLetter(
  ctx: CanvasRenderingContext2D,
  letter: string,
  side: number,
  fontFamily: string,
  color: string
) {
  ctx.clearRect(0, 0, side, side);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let fontSize = side * GUIDE_SCALE;
  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  let m = ctx.measureText(letter);

  const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const shrink = Math.min(
    1,
    (side * GUIDE_MAX_FILL) / Math.max(width, 1),
    (side * GUIDE_MAX_FILL) / Math.max(height, 1)
  );
  if (shrink < 1) {
    fontSize *= shrink;
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    m = ctx.measureText(letter);
  }

  const x = side / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  const y = side / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  ctx.fillText(letter, x, y);
}

function readAlpha(ctx: CanvasRenderingContext2D, side: number): Uint8Array {
  const { data } = ctx.getImageData(0, 0, side, side);
  const mask = new Uint8Array(side * side);
  for (let i = 0; i < mask.length; i++) {
    mask[i] = data[i * 4 + 3];
  }
  return mask;
}

function makeGridContext(side: number): CanvasRenderingContext2D {
  const off = document.createElement("canvas");
  off.width = side;
  off.height = side;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D not available");
  return ctx;
}

/** Child's drawing → side×side ink grid. */
function drawingToMask(canvas: HTMLCanvasElement, side: number): Uint8Array {
  const ctx = makeGridContext(side);
  ctx.drawImage(canvas, 0, 0, side, side);
  return readAlpha(ctx, side);
}

/** Letter shape → side×side ink grid (same layout as the guide). */
function letterToMask(letter: string, side: number, fontFamily: string): Uint8Array {
  const ctx = makeGridContext(side);
  drawCenteredLetter(ctx, letter, side, fontFamily, "#000");
  return readAlpha(ctx, side);
}

function describeTrace(coverage: number, precision: number) {
  const score = Math.round((coverage + precision) / 2);
  const correct = coverage >= PASS_PERCENT && precision >= PASS_PERCENT;

  let message: string;
  if (coverage >= GREAT_PERCENT && precision >= GREAT_PERCENT) {
    message = "అద్భుతం! చాలా బాగా రాశారు 🎉";
  } else if (correct) {
    message = "బాగుంది! 👍";
  } else if (coverage < PASS_PERCENT && precision >= PASS_PERCENT) {
    message = "కొంత భాగం మిగిలిపోయింది — అక్షరం పూర్తిగా రాయండి";
  } else if (precision < PASS_PERCENT && coverage >= PASS_PERCENT) {
    message = "గీతలు అక్షరం బయటకు వెళ్లాయి — జాగ్రత్తగా రాయండి";
  } else {
    message = "మళ్ళీ ప్రయత్నించండి — బూడిద రంగు అక్షరం మీద రాయండి";
  }
  return { correct, score, message };
}

/* ================= COMPONENT ================= */

const AksharaTraceBoard: React.FC<TraceProps> = ({ letter }) => {
  const theme = useTheme();
  const fontFamily = String(theme.typography.fontFamily ?? "sans-serif");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const guideRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const [size, setSize] = useState(MIN_SIZE);
  const [fontsReady, setFontsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  // Responsive size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const width = container.clientWidth;
      setSize(Math.max(MIN_SIZE, Math.min(MAX_SIZE, width)));
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Wait for web fonts, so the guide isn't drawn with a fallback font
  useEffect(() => {
    if (!document.fonts) {
      setFontsReady(true);
      return;
    }
    let active = true;
    document.fonts.ready.then(() => {
      if (active) setFontsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Guide letter (drawn on its own canvas, same function as the Rust target)
  useEffect(() => {
    const canvas = guideRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawCenteredLetter(ctx, letter, size, fontFamily, GUIDE_COLOR);
  }, [size, letter, fontFamily, fontsReady]);

  // Drawing canvas setup (resizing a canvas clears it, so reset state too)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = size < 260 ? 8 : 6; // thicker on small touch screens
    ctx.strokeStyle = STROKE_COLOR;

    hasDrawn.current = false;
    setResult(null);
  }, [size]);

  const getCoords = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const start = (e: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    drawing.current = true;
    hasDrawn.current = true;
    setResult(null);

    const { x, y } = getCoords(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoords(e.nativeEvent);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    hasDrawn.current = false;
    setResult(null);
  };

  // Fallback: the original server check
  const checkOnServer = async (canvas: HTMLCanvasElement): Promise<CheckResult> => {
    try {
      const res = await fetch("/api/aksharamala?endpoint=trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letter,
          image_data: canvas.toDataURL("image/png"),
          canvas_size: size,
        }),
      });
      if (!res.ok) throw new Error(`Trace check API ${res.status}`);
      const data = await res.json();
      return { correct: data.correct, score: data.score, message: data.message, source: "server" };
    } catch (err) {
      console.error("[AksharaTraceBoard] server trace check failed:", err);
      return { correct: false, score: 0, message: "తనిఖీ చేయడంలో సమస్య వచ్చింది." };
    }
  };

  // Main check: Rust in the browser first, server only if that fails
  const checkTrace = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn.current) {
      setResult({ correct: false, score: 0, message: "ముందు అక్షరాన్ని రాయండి." });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const t0 = performance.now();
      const side = await getTraceMaskSide();
      const drawn = drawingToMask(canvas, side);
      const target = letterToMask(letter, side, fontFamily);
      const { coverage, precision } = await scoreTraceMasks(drawn, target);
      const ms = performance.now() - t0;

      setResult({ ...describeTrace(coverage, precision), coverage, precision, ms, source: "rust" });
    } catch (err) {
      console.warn("[AksharaTraceBoard] Rust check failed, using server:", err);
      setResult(await checkOnServer(canvas));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    // stopPropagation: drawing here must not trigger the parent card's onClick
    <Box
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      sx={{ width: "100%", textAlign: "center" }}
    >
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          mx: "auto",
          bgcolor: "#f7f9fc",
          borderRadius: 4,
          overflow: "hidden",
          border: "2px solid #e3e7ee",
          boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
        }}
      >
        {/* Guide letter */}
        <canvas
          ref={guideRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: size,
            height: size,
            pointerEvents: "none",
          }}
        />

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          aria-label={`${letter} అక్షరం రాయడానికి బోర్డు`}
          style={{
            position: "relative",
            zIndex: 1,
            touchAction: "none",
            width: size,
            height: size,
            cursor: "crosshair",
          }}
        />

        <IconButton
          onClick={clearCanvas}
          size="small"
          aria-label="తుడిచివేయండి"
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            zIndex: 2,
            bgcolor: "white",
            boxShadow: 2,
            "&:hover": { bgcolor: "#fff" },
          }}
        >
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </Box>

      <Stack direction="row" justifyContent="center" sx={{ mt: 1.5 }}>
        <Button
          variant="contained"
          size="small"
          onClick={checkTrace}
          disabled={isChecking}
          startIcon={isChecking ? <CircularProgress size={16} sx={{ color: "white" }} /> : <SendIcon fontSize="small" />}
          sx={{ borderRadius: "999px", px: 2.5, fontWeight: 700, textTransform: "none" }}
        >
          తనిఖీ చేయండి
        </Button>
      </Stack>

      {result && (
        <>
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="center"
            sx={{
              mt: 1,
              mx: "auto",
              width: "fit-content",
              px: 1.5,
              py: 0.5,
              borderRadius: "999px",
              bgcolor: result.correct ? "success.light" : "error.light",
            }}
          >
            {result.correct ? (
              <CheckCircleIcon fontSize="small" sx={{ color: "success.dark" }} />
            ) : (
              <CancelIcon fontSize="small" sx={{ color: "error.dark" }} />
            )}
            <Typography variant="body2" fontWeight={700}>
              {result.message}
            </Typography>
          </Stack>

          {result.source === "rust" && result.coverage !== undefined && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.75 }}>
              పూర్తి: {result.coverage}% • ఖచ్చితత్వం: {result.precision}%
              {result.ms !== undefined && ` • ⏱ ${formatDuration(result.ms)} (Rust · WASM)`}
            </Typography>
          )}
          {result.source === "server" && (
            <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.6 }}>
              సర్వర్ ద్వారా తనిఖీ చేయబడింది
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default AksharaTraceBoard;