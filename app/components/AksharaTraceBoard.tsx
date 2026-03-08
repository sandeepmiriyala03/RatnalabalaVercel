"use client";

import React, { useRef, useEffect, useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface TraceProps {
  letter: string;
}

const AksharaTraceBoard: React.FC<TraceProps> = ({ letter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#2196f3"; // Blue color for tracing
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    ctx?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
  };

  return (
    <Box sx={{ position: "relative", width: "250px", height: "250px", mx: "auto", bgcolor: "#f0f4f8", borderRadius: 4, overflow: "hidden", border: "2px solid #e0e0e0" }}>
      {/* Background Guide Letter */}
      <Typography
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "8rem",
          fontWeight: 900,
          color: "#dee2e6",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {letter}
      </Typography>

      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ position: "relative", zIndex: 1, touchAction: "none" }}
      />

      <IconButton 
        onClick={clearCanvas} 
        size="small" 
        sx={{ position: "absolute", bottom: 5, right: 5, zIndex: 2, bgcolor: "white", boxShadow: 1 }}
      >
        <DeleteIcon fontSize="small" color="error" />
      </IconButton>
    </Box>
  );
};

export default AksharaTraceBoard;