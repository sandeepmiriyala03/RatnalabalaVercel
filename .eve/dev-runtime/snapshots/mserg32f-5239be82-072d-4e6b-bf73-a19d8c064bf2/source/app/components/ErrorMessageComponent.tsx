interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessageComponent({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="errorMsg"
      style={{
        marginTop: "12px",
        padding: "10px 14px",
        borderRadius: "8px",
        backgroundColor: "#fff1f1",
        color: "#b91c1c",
        border: "1px solid #fecaca",
        fontSize: "0.95rem",
        lineHeight: 1.6,
      }}
    >
      <strong>⚠️ లోపం:</strong>{" "}
      {message || "ఏదో లోపం జరిగింది. మళ్లీ ప్రయత్నించండి."}
    </div>
  );
}
