import AccordionChunk from "./AccordionChunk";

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

interface Props {
  result: Result;
  loading: boolean;
  elapsedTime: number | null;
}

export default function AnalysisSummary({
  result,
  loading,
  elapsedTime,
}: Props) {
  if (!result) return null;

  return (
    <section
      className="analysisSection"
      aria-labelledby="analysis-title"
      style={{
        marginTop: 24,
        padding: "16px",
        borderRadius: "12px",
        background: "#fafafa",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* 🔍 Title */}
      <h2
        id="analysis-title"
        className="analysisTitle"
        style={{
          fontSize: "1.3rem",
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        📊 విశ్లేషణ సారాంశం
      </h2>

      {/* 📄 File meta */}
      <p
        className="fileDetails"
        style={{
          fontSize: "0.9rem",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        {result.file_type && (
          <>
            <b>ఫైల్ రకం:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;
          </>
        )}
        <b>భాగాలు:</b> {result.total_chunks}
      </p>

      {/* 🚫 No results */}
      {result.analysis.length === 0 && (
        <p
          className="noResults"
          style={{
            textAlign: "center",
            opacity: 0.7,
            padding: "12px 0",
          }}
        >
          విశ్లేషణ ఫలితాలు లభించలేదు.
        </p>
      )}

      {/* 📚 Analysis chunks */}
      {result.analysis.map((chunk) => (
        <AccordionChunk
          key={chunk.chunk_number}
          chunk={chunk}
        />
      ))}

      {/* ⏱ Processing time */}
      {elapsedTime !== null && (
        <p
          className="processingTime"
          style={{
            marginTop: 16,
            fontSize: "0.85rem",
            textAlign: "right",
            opacity: 0.7,
          }}
        >
          ⏱ ప్రాసెసింగ్ సమయం: {elapsedTime.toFixed(2)} సెకన్లు
        </p>
      )}

      {/* 🔄 Loading hint */}
      {loading && (
        <p
          style={{
            marginTop: 8,
            fontSize: "0.85rem",
            color: "#2563eb",
          }}
        >
          🔄 విశ్లేషణ జరుగుతోంది…
        </p>
      )}
    </section>
  );
}
