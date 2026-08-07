"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, IconButton, Typography, CircularProgress, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import IconButtonWrap from "@mui/material/IconButton";

interface TraceProps {
  letter: string;
}

// Responsive sizing — clamps between a usable minimum and a sensible
// maximum, scales with the actual container width instead of a fixed
// 260px that was too small on tablets and cramped on small phones.
const MIN_SIZE = 200;
const MAX_SIZE = 340;

type CheckResult = { correct: boolean; score: number; message: string } | null;

const AksharaTraceBoard: React.FC<TraceProps> = ({ letter }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  const [size, setSize] = useState(MIN_SIZE);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult>(null);

  // Responsive size — recalculates on container resize (rotation,
  // window resize, split-screen on tablets, etc.) instead of a fixed
  // pixel value that was too small on some devices and wasted space
  // on others.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const width = container.clientWidth;
      const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, width));
      setSize(clamped);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const getCoords = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Re-setup the canvas whenever size changes (device pixel ratio
  // scaling must be redone any time the CSS size changes, or strokes
  // render blurry/misaligned on the next draw).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = size * ratio;
    canvas.height = size * ratio;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    ctx.scale(ratio, ratio);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // Slightly thicker stroke on smaller screens — touch input is
    // less precise than a mouse, thin lines are hard to see/control
    // on a phone.
    ctx.lineWidth = size < 260 ? 8 : 6;
    ctx.strokeStyle = "#1976d2";
  }, [size]);

  const start = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawing.current = true;
    hasDrawn.current = true;
    setResult(null); // clear previous check result on a new attempt

    const { x, y } = getCoords(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCoords(e.nativeEvent);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setResult(null);
  };

  // NEW — sends the drawn canvas to Python for shape comparison.
  // No LLM involved: Python renders the same letter with a real font
  // and compares pixel overlap, same cost-free approach as the
  // pronunciation check earlier.
  const checkTrace = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn.current) {
      setResult({ correct: false, score: 0, message: "ముందు అక్షరాన్ని రాయండి." });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const imageData = canvas.toDataURL("image/png");

      const res = await fetch("/api/trace_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letter,
          image_data: imageData,
          canvas_size: size,
        }),
      });

      if (!res.ok) throw new Error(`Trace check API ${res.status}`);

      const data = await res.json();
      setResult({ correct: data.correct, score: data.score, message: data.message });
    } catch (err) {
      console.error("[AksharaTraceBoard] trace check failed:", err);
      setResult({
        correct: false,
        score: 0,
        message: "తనిఖీ చేయడంలో సమస్య వచ్చింది.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Box ref={containerRef} sx={{ width: "100%", textAlign: "center" }}>
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
        {/* Guide Letter */}
        <Typography
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: `${size * 0.35}px`, // scales with canvas, not fixed
            fontWeight: 900,
            color: "#e6eaf0",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {letter}
        </Typography>

        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop} // handles interrupted touch (e.g. incoming call, notification pull-down)
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

        {/* Clear Button */}
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

      {/* NEW — check button + result feedback */}
      <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ mt: 1.5 }}>
        <IconButtonWrap
          onClick={checkTrace}
          disabled={isChecking}
          size="small"
          sx={{
            bgcolor: "primary.main",
            color: "white",
            px: 2,
            borderRadius: "999px",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          {isChecking ? (
            <CircularProgress size={18} sx={{ color: "white", mr: 1 }} />
          ) : (
            <SendIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>
            తనిఖీ చేయండి
          </Typography>
        </IconButtonWrap>
      </Stack>

      {result && (
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
      )}
    </Box>
  );
};

export default AksharaTraceBoard;