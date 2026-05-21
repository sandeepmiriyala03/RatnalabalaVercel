"use client";

import React, { useRef, useEffect } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface TraceProps {
  letter: string;
}

const SIZE = 260;

const AksharaTraceBoard: React.FC<TraceProps> = ({ letter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const getCoords = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    canvas.style.width = SIZE + "px";
    canvas.style.height = SIZE + "px";

    ctx.scale(ratio, ratio);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#1976d2";
  }, []);

  const start = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    drawing.current = true;

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
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        mx: "auto",
        bgcolor: "#f7f9fc",
        borderRadius: 4,
        overflow: "hidden",
        border: "2px solid #e3e7ee",
        boxShadow: "0 3px 10px rgba(0,0,0,0.05)"
      }}
    >
      {/* Guide Letter */}
      <Typography
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "9rem",
          fontWeight: 900,
          color: "#e6eaf0",
          userSelect: "none",
          pointerEvents: "none"
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
        style={{
          position: "relative",
          zIndex: 1,
          touchAction: "none",
          width: SIZE,
          height: SIZE
        }}
      />

      {/* Clear Button */}
      <IconButton
        onClick={clearCanvas}
        size="small"
        sx={{
          position: "absolute",
          bottom: 8,
          right: 8,
          zIndex: 2,
          bgcolor: "white",
          boxShadow: 2,
          "&:hover": { bgcolor: "#fff" }
        }}
      >
        <DeleteIcon fontSize="small" color="error" />
      </IconButton>
    </Box>
  );
};

export default AksharaTraceBoard;