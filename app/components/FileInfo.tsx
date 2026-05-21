interface FileInfoProps {
  file: File | null;
}

export default function FileInfo({ file }: FileInfoProps) {
  if (!file) return null;

  const sizeMB = file.size / (1024 * 1024);

  return (
    <div className="fileInfo">
      <p>
        <strong>📄 ఎంపిక చేసిన ఫైల్:</strong> {file.name}
      </p>

      <p>
        <strong>📦 పరిమాణం:</strong>{" "}
        {sizeMB >= 1
          ? `${sizeMB.toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`}
      </p>

      <p>
        <strong>📁 రకం:</strong> PDF డాక్యుమెంట్
      </p>
    </div>
  );
}
