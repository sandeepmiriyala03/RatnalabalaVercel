"use client";

import { useState, useRef } from "react";

export default function MlechhaBhashaPage() {
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [outputText, setOutputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── conversion logic ─── */
  const convertToSecret = (text: string): string =>
    text.split(/(\s+)/).map((token) => {
      if (/^\s+$/.test(token)) return token;
      const syllables = token.match(/[\u0C00-\u0C7F][\u0C3E-\u0C4D]*/g) || [token];
      return syllables.map((syl) => {
        if (!/[\u0C00-\u0C7F]/.test(syl)) return syl;
        if (syl.endsWith("్")) return syl;
        const matra = syl.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
        return syl + "క" + matra;
      }).join("");
    }).join("");

  const convertToNormal = (text: string): string =>
    text.split(/(\s+)/).map((token) => {
      if (/^\s+$/.test(token)) return token;
      const syllables = token.match(/[\u0C00-\u0C7F][\u0C3E-\u0C4D]*/g) || [];
      const result: string[] = [];
      for (let i = 0; i < syllables.length; i++) {
        const cur = syllables[i];
        const nxt = syllables[i + 1];
        if (nxt?.startsWith("క")) {
          const cm = cur.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
          const nm = nxt.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
          if (cm === nm) { result.push(cur); i++; continue; }
        }
        result.push(cur);
      }
      return result.join("");
    }).join("");

  /* ─── handlers ─── */
  const handleConvert = () => {
    if (!inputText.trim()) { setOutputText(""); return; }
    setOutputText(direction === "encode" ? convertToSecret(inputText) : convertToNormal(inputText));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleConvert();
  };

  const handleDirectionChange = (val: "encode" | "decode") => {
    setDirection(val);
    setInputText("");
    setOutputText("");
    setIsSpeaking(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const handleClear = () => {
    setInputText("");
    setOutputText("");
    setIsSpeaking(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const handleCopy = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!outputText) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(outputText);
    utt.lang = "te-IN";
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const isEncode = direction === "encode";

  /* ─── shared style tokens (all inline) ─── */
  const S = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      padding: "2rem 1.5rem",
      fontFamily: "'Noto Sans Telugu', 'Ramabhadra', sans-serif",
      boxSizing: "border-box" as const,
    },
    wrap: {
      maxWidth: 900,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column" as const,
      gap: 24,
    },
    card: (bg = "#ffffff", dashed = false) => ({
      backgroundColor: bg,
      border: `1px ${dashed ? "dashed" : "solid"} #e2e8f0`,
      borderRadius: 12,
      padding: "20px 24px",
    }),
    label: {
      fontSize: 11,
      fontWeight: 600,
      color: "#94a3b8",
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      display: "block",
      marginBottom: 6,
    },
    input: {
      width: "100%",
      border: "1px solid #cbd5e1",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 15,
      lineHeight: 1.7,
      color: "#1e293b",
      backgroundColor: "#ffffff",
      resize: "vertical" as const,
      outline: "none",
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
    },
    btnPrimary: {
      backgroundColor: "#1e293b",
      color: "#ffffff",
      border: "none",
      borderRadius: 8,
      padding: "12px 28px",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "background 0.15s",
    },
    btnSecondary: (active = false) => ({
      backgroundColor: active ? "#f1f5f9" : "#ffffff",
      color: active ? "#64748b" : "#334155",
      border: "1px solid #cbd5e1",
      borderRadius: 8,
      padding: "10px 16px",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "inherit",
      transition: "background 0.15s",
    }),
    select: {
      width: "100%",
      border: "1px solid #cbd5e1",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 15,
      color: "#1e293b",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      outline: "none",
      fontFamily: "inherit",
      boxSizing: "border-box" as const,
    },
  };

  const rules = [
    { title: 'అక్షరం తర్వాత "క"', desc: 'ప్రతి అక్షరం తర్వాత అదే మాత్రతో "క" చేర్చాలి' },
    { title: "హల్లంతం మినహాయింపు", desc: "హల్లంతం అక్షరాలకు (్) \"క\" చేర్చరు" },
    { title: "మాత్ర సమాన్య", desc: "నే → నేకే, ని → నికి, న → నక" },
    { title: "పద అంతరం", desc: "పదాల మధ్య ఖాళీ యథాతథంగా ఉంచాలి" },
  ];

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0, marginBottom: 6 }}>
            మ్లేచ్ఛ మాల
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            సాంప్రదాయ గూఢచార భాషా మార్పిడి సాధనం
          </p>
        </div>

        {/* ── Historical background ── */}
        <div style={S.card("#f8fafc")}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, marginBottom: 14 }}>
            చారిత్రక నేపథ్యం
          </h2>
          <div style={{
            borderLeft: "3px solid #94a3b8",
            paddingLeft: 14,
            backgroundColor: "#ffffff",
            borderRadius: "0 8px 8px 0",
            padding: "12px 16px",
            marginBottom: 12,
          }}>
            <p style={{ fontSize: 13, color: "#334155", fontStyle: "italic", lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>
              {`"ఖనన శిల్పకళా ప్రౌఢుఁడనఘ! నన్ను విదురుఁడంపినవాఁడ మీకెఱుఁగఁ జెప్పె\nనడవి కార్చిచ్చు గాల్చుచో నందు నక్క బిలము సొచ్చిన యలుక గాలక సుఖించు."`}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, margin: 0 }}>
            మహాభారత కాలంలో విదురుడు లాక్షాగృహ కుట్రను పాండవులకు రహస్యంగా హెచ్చరించడానికి వాడిన మ్లేచ్ఛ భాష — అడవి కార్చిచ్చులో భూమి బిలంలో ఉన్న జీవి మాత్రం సురక్షితంగా బతుకుతుంది అంటే సురంగం ద్వారా తప్పించుకోండి అని అర్థం.
          </p>
        </div>

        {/* ── Rules ── */}
        <div style={S.card("#ffffff", true)}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, marginBottom: 14 }}>
            మ్లేచ్ఛ భాష నియమాలు
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {rules.map((r) => (
              <div key={r.title} style={{ backgroundColor: "#f8fafc", borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0, marginBottom: 4 }}>{r.title}</p>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Direction selector ── */}
        <div>
          <label style={S.label}>మార్పిడి విధానం</label>
          <select
            value={direction}
            onChange={(e) => handleDirectionChange(e.target.value as "encode" | "decode")}
            style={S.select}
          >
            <option value="encode">సాధారణ తెలుగు → మ్లేచ్ఛ భాష (Encode)</option>
            <option value="decode">మ్లేచ్ఛ భాష → సాధారణ తెలుగు (Decode)</option>
          </select>
        </div>

        {/* ── I/O two-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

          {/* Input column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ ...S.label, marginBottom: 0 }}>
                {isEncode ? "సాధారణ తెలుగు పాఠ్యం" : "మ్లేచ్ఛ భాషా పాఠ్యం"}
              </label>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{inputText.length} అక్షరాలు</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEncode ? "సాధారణ తెలుగు ఇక్కడ రాయండి..." : "మ్లేచ్ఛ భాష ఇక్కడ రాయండి..."}
              rows={10}
              style={S.input}
            />
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
              Ctrl + Enter నొక్కి మార్చవచ్చు
            </p>
          </div>

          {/* Output column — only shown after conversion */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ ...S.label, marginBottom: 0 }}>ఫలితం</label>
              {outputText && (
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{outputText.length} అక్షరాలు</span>
              )}
            </div>

            {outputText ? (
              <>
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  whiteSpace: "pre-wrap",
                  overflowY: "auto",
                  minHeight: 200,
                  maxHeight: 400,
                  userSelect: "all",
                  cursor: "text",
                  wordBreak: "break-word",
                }}>
                  {outputText}
                </div>
                {/* Copy + Speak only after output exists */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={handleCopy} style={S.btnSecondary(copied)}>
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                    {copied ? "కాపీ అయింది!" : "కాపీ చేయండి"}
                  </button>
                  <button onClick={handleSpeak} style={S.btnSecondary(isSpeaking)}>
                    {isSpeaking ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                    )}
                    {isSpeaking ? "ఆపండి" : "వినండి"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 8,
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8fafc",
              }}>
                <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: 0, textAlign: "center", padding: "0 20px" }}>
                  మార్చు బటన్ నొక్కిన తర్వాత<br />ఫలితం ఇక్కడ కనిపిస్తుంది
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Primary action row ── */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
          <button
            onClick={handleConvert}
            style={S.btnPrimary}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#334155")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
          >
            {isEncode ? "మ్లేచ్ఛ భాషలోకి మార్చు" : "సాధారణ భాషలోకి పునరుద్ధరించు"}
          </button>

          {(inputText || outputText) && (
            <button
              onClick={handleClear}
              title="అన్నీ తుడిచివేయండి"
              style={S.btnSecondary()}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              తుడిచివేయండి
            </button>
          )}
        </div>

      </div>
    </div>
  );
}