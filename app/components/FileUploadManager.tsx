"use client";

import FileUpload from "./FileUpload";
import FileInfo from "./FileInfo";
import ErrorMessageComponent from "./ErrorMessageComponent";
import AnalysisSummary from "./AnalysisSummary";
import GoToTopButton from "./GoToTopButton";

import { useFileUpload } from "@/hooks/useFileUpload";

export default function FileUploadManager() {
  const {
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
  } = useFileUpload();

  return (
    <>
      {/* 📂 PDF Upload Area */}
      <FileUpload
        file={file}
        loading={loading}
        dragOver={dragOver}
        onFileChange={handleFileChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onUpload={handleUpload}
      />

      {/* 📄 PDF File details */}
      {file && <FileInfo file={file} />}

      {/* ❌ Error (PDF related only) */}
      {error && <ErrorMessageComponent message={error} />}

      {/* 📊 PDF Analysis result */}
      {result && (
        <AnalysisSummary
          result={result}
          loading={loading}
          elapsedTime={elapsedTime}
        />
      )}

      {/* ⬆️ UX helper */}
      <GoToTopButton />
    </>
  );
}
