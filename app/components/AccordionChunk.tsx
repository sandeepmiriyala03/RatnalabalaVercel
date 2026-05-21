"use client";

import { useState } from "react";
import KeywordBadges from "./KeywordBadges";

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

export default function AccordionChunk({
  chunk,
}: {
  chunk: Analysis;
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  return (
    <div
      className="accordionChunk"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        marginBottom: 12,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {/* 🔽 Header */}
      <div
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className="accordionHeader"
        style={{
          cursor: "pointer",
          padding: "12px 16px",
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8fafc",
        }}
      >
        <span>📄 భాగం {chunk.chunk_number}</span>
        <span style={{ fontSize: "0.9rem" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* 📖 Content */}
      {open && (
        <div
          className="accordionContent"
          style={{
            padding: "14px 16px",
            fontSize: "0.95rem",
          }}
        >
          {/* 🧠 Summary */}
          <h4 style={{ marginBottom: 6 }}>🧠 సారాంశం</h4>
          <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
            {chunk.summary.length > 0 ? (
              chunk.summary.map((line, i) => (
                <li key={i}>{line}</li>
              ))
            ) : (
              <li style={{ opacity: 0.7 }}>
                సారాంశం లభించలేదు
              </li>
            )}
          </ul>

          {/* 🔑 Keywords */}
          <h4 style={{ marginBottom: 6 }}>🔑 కీలక పదాలు</h4>
          {chunk.keywords.length > 0 ? (
            <KeywordBadges keywords={chunk.keywords} />
          ) : (
            <p style={{ opacity: 0.7 }}>
              కీలక పదాలు లేవు
            </p>
          )}

          {/* ✨ Highlights */}
          <h4 style={{ marginTop: 16, marginBottom: 6 }}>
            ✨ ముఖ్యాంశాలు
          </h4>
          <ul style={{ paddingLeft: 18 }}>
            {chunk.highlights.length > 0 ? (
              chunk.highlights.map((hl, i) => (
                <li key={i}>{hl}</li>
              ))
            ) : (
              <li style={{ opacity: 0.7 }}>
                ముఖ్యాంశాలు లేవు
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
