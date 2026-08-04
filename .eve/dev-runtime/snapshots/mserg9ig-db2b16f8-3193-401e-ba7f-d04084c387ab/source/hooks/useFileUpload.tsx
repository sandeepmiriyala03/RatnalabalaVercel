"use client";

import { useState, useRef, ChangeEvent } from "react";

/* ================= TYPES ================= */

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

interface Result {
  total_chunks: number;
  file_type?: string;
  analysis: Analysis[];
}

/* ================= HOOK ================= */

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);

  /* ========== RESET HELPERS ========== */

  const resetState = () => {
    setError("");
    setResult(null);
    setElapsedTime(null);
  };

  /* ========== FILE SELECT ========== */

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setDragOver(false);
    resetState();
  };

  /* ========== DRAG & DROP ========== */

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    setFile(dropped);
    resetState();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  /* ========== UPLOAD ========== */

  const handleUpload = async () => {
    if (!file) {
      setError("దయచేసి ఫైల్‌ను ఎంచుకోండి");
      return;
    }

    setLoading(true);
    resetState();
    startTimeRef.current = Date.now();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();

      let data: Result;
      try {
        data = JSON.parse(rawText);
      } catch {
        setError("సర్వర్ నుండి తప్పు స్పందన వచ్చింది");
        return;
      }

      if (!res.ok) {
        setError((data as any)?.error || "ఫైల్ అప్లోడ్ విఫలమైంది");
        return;
      }

      setResult(data);

      if (startTimeRef.current) {
        const duration =
          (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(duration);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "అనుకోని లోపం జరిగింది"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ========== RETURN ========== */

  return {
    file,
    error,
    result,
    loading,
    dragOver,
    elapsedTime,

    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUpload,
  };
}
