"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <html lang="te">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ marginBottom: "8px" }}>క్షమించండి, సైట్ లోడ్ అవ్వడంలో సమస్య వచ్చింది</h2>
          <p style={{ opacity: 0.75, marginBottom: "24px" }}>
            దయచేసి పేజీని రీలోడ్ చేయండి.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            మళ్ళీ ప్రయత్నించండి
          </button>
        </div>
      </body>
    </html>
  );
}