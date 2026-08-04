import React from "react";

type LangOption = { value: string; label: string };

interface ActionsComponentProps {
  loading: boolean;
  file: File | null;
  lang: LangOption[] | null;
  onAnalyze: () => void;
  onClear: () => void;
  onCancel: () => void;
}

export function ActionsComponent({
  loading,
  file,
  lang,
  onAnalyze,
  onClear,
  onCancel,
}: ActionsComponentProps) {
  const isDisabled = !file || loading || !lang || lang.length === 0;

  return (
    <div className="actions" aria-busy={loading}>
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={`uploadButton${isDisabled ? " disabled" : ""}`}
      >
        {loading ? "🔄 OCR జరుగుతోంది…" : "🔍 OCR ప్రారంభించండి"}
      </button>

      {loading && (
        <button
          type="button"
          onClick={onCancel}
          className="uploadButton cancel"
          aria-label="OCR ప్రక్రియ ఆపండి"
        >
          ❌ ఆపండి
        </button>
      )}

      <button
        type="button"
        onClick={onClear}
        disabled={loading}
        aria-disabled={loading}
        className="uploadButton clear"
        aria-label="ఫారమ్ క్లియర్ చేయండి"
      >
        🧹 క్లియర్
      </button>
    </div>
  );
}