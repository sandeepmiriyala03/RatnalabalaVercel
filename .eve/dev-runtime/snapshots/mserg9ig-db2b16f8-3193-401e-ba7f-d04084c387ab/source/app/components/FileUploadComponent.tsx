import React from "react";

interface FileUploadComponentProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export function FileUploadComponent({
  file,
  onFileChange,
  loading,
}: FileUploadComponentProps) {
  return (
    <div
      className="uploadArea"
      style={{
        border: "2px dashed #bbb",
        borderRadius: 12,
        padding: 20,
        textAlign: "center",
        cursor: loading ? "not-allowed" : "pointer",
        background: "#fafafa",
      }}
    >
      <input
        type="file"
        accept="image/*"
        id="file-upload"
        onChange={onFileChange}
        className="fileInput"
        disabled={loading}
        aria-label="చిత్రం ఎంచుకోండి"
        style={{ display: "none" }}
      />

      <label
        htmlFor="file-upload"
        className={`fileInputLabel${loading ? " disabled" : ""}`}
        style={{
          display: "block",
          fontWeight: 600,
          color: loading ? "#999" : "#333",
        }}
      >
        {file ? (
          <>
            📷 ఎంపిక చేసిన చిత్రం:
            <br />
            <strong>{file.name}</strong>
          </>
        ) : (
          <>
            📂 చిత్రం ఎంచుకోండి
            <br />
            <span style={{ fontSize: 13, opacity: 0.7 }}>
              (PNG / JPG / JPEG)
            </span>
          </>
        )}
      </label>

      {loading && (
        <p style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
          OCR జరుగుతోంది… దయచేసి వేచి ఉండండి
        </p>
      )}
    </div>
  );
}
