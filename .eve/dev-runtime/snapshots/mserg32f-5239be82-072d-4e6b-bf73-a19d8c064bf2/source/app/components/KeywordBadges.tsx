"use client";

interface KeywordBadgesProps {
  keywords: string[];
}

export default function KeywordBadges({
  keywords,
}: KeywordBadgesProps) {
  if (!keywords || keywords.length === 0) {
    return (
      <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
        కీలక పదాలు లేవు
      </p>
    );
  }

  return (
    <div
      className="badgesContainer"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 6,
      }}
    >
      {keywords.map((kw, idx) => (
        <span
          key={`${kw}-${idx}`}
          title={kw}
          aria-label={`కీలక పదం: ${kw}`}
          style={{
            padding: "4px 10px",
            fontSize: "0.8rem",
            fontWeight: 600,
            borderRadius: 999,
            background: "#eef2ff",
            color: "#3730a3",
            border: "1px solid #c7d2fe",
            cursor: "default",
            userSelect: "none",
          }}
        >
          #{kw}
        </span>
      ))}
    </div>
  );
}
