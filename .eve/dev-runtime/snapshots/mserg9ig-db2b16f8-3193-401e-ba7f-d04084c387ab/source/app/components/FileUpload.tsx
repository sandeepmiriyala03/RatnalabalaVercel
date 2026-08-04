import { ChangeEvent } from "react";

interface FileUploadProps {
  file: File | null;
  loading: boolean;
  dragOver: boolean;

  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onUpload: () => void;
}

export default function FileUpload({
  file,
  loading,
  dragOver,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onUpload,
}: FileUploadProps) {
  return (
    <div
      role="button"
      aria-label="PDF upload area"
      tabIndex={0}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDragLeave={onDragLeave}
      className={`uploadArea ${dragOver ? "dragOver" : ""}`}
    >
      {/* 📂 Hidden native input – PDF ONLY */}
      <input
        type="file"
        id="pdf-upload"
        className="fileInput"
        accept="application/pdf,.pdf"
        onChange={onFileChange}
        disabled={loading}
      />

      {/* 🖱 Custom upload label */}
      <label
        htmlFor="pdf-upload"
        className={`fileInputLabel ${loading ? "disabled" : ""}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        {file ? "📄 PDF మార్చండి" : "📄 PDF ఫైల్ ఎంచుకోండి"}
      </label>

      {/* 🚀 Document analysis trigger */}
      <button
        type="button"
        className={`uploadButton ${
          loading || !file ? "disabled" : ""
        }`}
        onClick={onUpload}
        disabled={loading || !file}
        aria-disabled={loading || !file}
      >
        {loading ? "📊 విశ్లేషణ జరుగుతోంది…" : "📊 విశ్లేషణ ప్రారంభించండి"}
      </button>
    </div>
  );
}
