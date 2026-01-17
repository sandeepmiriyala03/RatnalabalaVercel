"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

/* =========================
   📦 TYPES
   ========================= */

type PoemData = {
  title?: string;
  poet?: string;
  lines: string[];
};

type Props = {
  onGenerate: (data: PoemData) => void;
  onReset: () => void; // ✅ ADD THIS
};

const MIN_LINES = 1;
const MAX_LINES = 8;

export default function PoemInput({
  onGenerate,
  onReset,
}: Props) {
  const [poet, setPoet] = useState("");
  const [lineCount, setLineCount] = useState<number | "">("");
  const [lines, setLines] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  /* Line count change */
  const handleLineCount = (value: number) => {
    setLineCount(value);
    setLines(Array(value).fill(""));
  };

  /* Update line */
  const updateLine = (index: number, value: string) => {
    const updated = [...lines];
    updated[index] = value;
    setLines(updated);
  };

  /* Generate poster */
  const handleGenerate = () => {
    const cleanedLines = lines.map((l) => l.trim());

    if (!poet.trim()) {
      setError("కవి పేరు ఇవ్వండి");
      return;
    }

    if (cleanedLines.some((l) => !l)) {
      setError("అన్ని పాదాలు నింపండి");
      return;
    }

    setError("");

    onGenerate({
      poet: poet.trim(),
      title: title.trim() || undefined,
      lines: cleanedLines,
    });
  };

  /* 🔄 FULL RESET (child + parent) */
  const handleReset = () => {
    setPoet("");
    setLineCount("");
    setLines([]);
    setTitle("");
    setError("");

    onReset(); // ✅ IMPORTANT
  };

  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: "auto",
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Typography variant="h6" textAlign="center" sx={{ mb: 2 }}>
        చిత్రమాల – పద్యం ఇవ్వండి
      </Typography>

      {/* Poet */}
      <label>కవి పేరు *</label>
      <input
        value={poet}
        onChange={(e) => setPoet(e.target.value)}
        placeholder="ఉదా: శ్రీ వేమన"
        style={inputStyle}
      />

      {/* Line count */}
      <label style={{ marginTop: 12, display: "block" }}>
        పాదాల సంఖ్య *
      </label>
      <input
        type="number"
        min={MIN_LINES}
        max={MAX_LINES}
        value={lineCount}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v >= MIN_LINES && v <= MAX_LINES) {
            handleLineCount(v);
          } else {
            setLineCount("");
            setLines([]);
          }
        }}
        placeholder="1 – 8 మధ్య సంఖ్య ఇవ్వండి"
        style={inputStyle}
      />

      {/* Lines */}
      {lines.length > 0 && (
        <>
          <label style={{ marginTop: 12, display: "block" }}>
            పద్యం
          </label>

          {lines.map((line, i) => (
            <input
              key={i}
              value={line}
              onChange={(e) => updateLine(i, e.target.value)}
              placeholder={`పాదం ${i + 1}`}
              style={{ ...inputStyle, marginTop: 6 }}
            />
          ))}
        </>
      )}

      {/* Title */}
      {lines.length > 0 && (
        <>
          <label style={{ marginTop: 12, display: "block" }}>
            పద్య శీర్షిక
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ఉదా: జీవన సత్యం"
            style={inputStyle}
          />
        </>
      )}

      {/* Error */}
      {error && (
        <Typography color="error" sx={{ mt: 1, fontSize: "0.9rem" }}>
          {error}
        </Typography>
      )}

      {/* Actions */}
      {lines.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button fullWidth variant="contained" onClick={handleGenerate}>
            పోస్టర్ చూపించండి
          </Button>

          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleReset}
          >
            రీసెట్
          </Button>
        </Box>
      )}
    </Box>
  );
}

/* ✅ Shared responsive input style */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "1rem",
  borderRadius: 6,
  border: "1px solid #ccc",
  marginTop: 6,
};
