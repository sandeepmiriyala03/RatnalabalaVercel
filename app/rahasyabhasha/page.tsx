"use client";

import { useState, useRef, useEffect } from "react";

export default function MlechhaBhashaPage() {
  const [inputText, setInputText]   = useState("");
  const [direction, setDirection]   = useState<"encode" | "decode">("encode");
  const [outputText, setOutputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [isMobile, setIsMobile]     = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ─── conversion ─── */
  const convertToSecret = (text: string): string =>
    text.split(/(\s+)/).map((token) => {
      if (/^\s+$/.test(token)) return token;
      const syllables = token.match(/[\u0C00-\u0C7F][\u0C3E-\u0C4D]*/g) || [token];
      return syllables.map((syl) => {
        if (!/[\u0C00-\u0C7F]/.test(syl)) return syl;
        if (syl.endsWith("్")) return syl;
        const matra = syl.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
        return "క" + matra + syl;
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
        if (cur.startsWith("క") && nxt) {
          const cm = cur.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
          const nm = nxt.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
          if (cm === nm) { result.push(nxt); i++; continue; }
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
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(outputText);
    utt.lang = "te-IN";
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const isEncode = direction === "encode";

  /* ─── design tokens ─── */
  const color = {
    bg:        "#f8fafc",
    surface:   "#ffffff",
    surfaceAlt:"#f1f5f9",
    border:    "#e2e8f0",
    borderMid: "#cbd5e1",
    text:      "#0f172a",
    textMid:   "#334155",
    textMuted: "#64748b",
    textFaint: "#94a3b8",
    primary:   "#1e293b",
    primaryHov:"#334155",
    green:     "#22c55e",
  };

  const font = "'Noto Sans Telugu', 'Ramabhadra', system-ui, sans-serif";

  /* ─── reusable style builders ─── */
  const card = (bg = color.surface, dashed = false): React.CSSProperties => ({
    backgroundColor: bg,
    border: `1px ${dashed ? "dashed" : "solid"} ${color.border}`,
    borderRadius: 12,
    padding: isMobile ? "16px" : "20px 24px",
  });

  const fieldLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: color.textFaint,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin: 0,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${color.borderMid}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 15,
    lineHeight: 1.75,
    color: color.text,
    backgroundColor: color.surface,
    resize: "vertical",
    outline: "none",
    fontFamily: font,
    WebkitAppearance: "none",
  };

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: font,
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.15s, opacity 0.15s",
    WebkitTapHighlightColor: "transparent",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    backgroundColor: color.primary,
    color: "#ffffff",
    padding: isMobile ? "0 20px" : "0 28px",
    fontSize: 15,
    fontWeight: 600,
    flexGrow: isMobile ? 1 : 0,
  };

  const btnSecondary = (active = false): React.CSSProperties => ({
    ...btnBase,
    backgroundColor: active ? color.surfaceAlt : color.surface,
    color: active ? color.textMuted : color.textMid,
    border: `1px solid ${color.borderMid}`,
    padding: "0 14px",
  });

  const selectStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${color.borderMid}`,
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 15,
    color: color.text,
    backgroundColor: color.surface,
    cursor: "pointer",
    outline: "none",
    fontFamily: font,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 36,
  };

  const rules = [
    { title: "క ముందు చేర్చాలి",        desc: "ప్రతి అక్షరం ముందు అదే మాత్రతో \"క\" చేర్చాలి" },
    { title: "హల్లంతం మినహాయింపు",       desc: "హల్లంతం (్) తో అంతమయ్యే అక్షరానికి \"క\" వేయరు" },
    { title: "మాత్ర సమాన్య",            desc: "నే → కేనే, ని → కిని, న → కన" },
    { title: "పద అంతరం",               desc: "పదాల మధ్య ఖాళీ యథాతథంగా ఉంచాలి" },
  ];

  /* ─── SVG icons ─── */
  const IconCopy = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
  const IconCheck = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  const IconPlay = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
  const IconStop = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  );
  const IconTrash = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: color.bg, padding: isMobile ? "1.25rem 1rem" : "2rem 1.5rem", fontFamily: font, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobile ? 16 : 24 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", borderBottom: `1px solid ${color.border}`, paddingBottom: isMobile ? 16 : 20 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: color.text, margin: 0, marginBottom: 6 }}>
            మ్లేచ్ఛ భాషా పరివర్తక
          </h1>
          <p style={{ fontSize: 13, color: color.textMuted, margin: 0 }}>
            సాంప్రదాయ గూఢచార భాషా మార్పిడి సాధనం
          </p>
        </div>

        {/* ── Historical background ── */}
        <div style={card(color.bg)}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: color.text, margin: "0 0 12px" }}>
            చారిత్రక నేపథ్యం
          </h2>
          {/* verse — fixed: use padding not paddingLeft so border-left shows */}
          <div style={{ borderLeft: `3px solid ${color.borderMid}`, paddingLeft: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: color.textMid, fontStyle: "italic", lineHeight: 1.9, margin: 0, whiteSpace: "pre-line" }}>
              {`"ఖనన శిల్పకళా ప్రౌఢుఁడనఘ! నన్ను విదురుఁడంపినవాఁడ మీకెఱుఁగఁ జెప్పె\nనడవి కార్చిచ్చు గాల్చుచో నందు నక్క బిలము సొచ్చిన యలుక గాలక సుఖించు."`}
            </p>
          </div>
          <p style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.8, margin: 0 }}>
            మహాభారత కాలంలో విదురుడు లాక్షాగృహ కుట్రను పాండవులకు రహస్యంగా హెచ్చరించడానికి వాడిన మ్లేచ్ఛ భాష — అడవి కార్చిచ్చులో భూమి బిలంలో ఉన్న జీవి మాత్రం సురక్షితంగా బతుకుతుంది అంటే సురంగం ద్వారా తప్పించుకోండి అని అర్థం.
          </p>
        </div>

        {/* ── Rules ── */}
        <div style={card(color.surface, true)}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: color.text, margin: "0 0 12px" }}>
            మ్లేచ్ఛ భాష నియమాలు
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 8 }}>
            {rules.map((r) => (
              <div key={r.title} style={{ backgroundColor: color.bg, borderRadius: 8, padding: "11px 14px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: color.text, margin: "0 0 3px" }}>{r.title}</p>
                <p style={{ fontSize: 13, color: color.textMuted, margin: 0, lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Direction selector ── */}
        <div>
          <p style={{ ...fieldLabel, marginBottom: 6 }}>మార్పిడి విధానం</p>
          <select
            value={direction}
            onChange={(e) => handleDirectionChange(e.target.value as "encode" | "decode")}
            style={selectStyle}
          >
            <option value="encode">సాధారణ తెలుగు → మ్లేచ్ఛ భాష (Encode)</option>
            <option value="decode">మ్లేచ్ఛ భాష → సాధారణ తెలుగు (Decode)</option>
          </select>
        </div>

        {/* ── I/O layout — 2-col desktop, stacked mobile ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16, alignItems: "start" }}>

          {/* Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={fieldLabel}>{isEncode ? "సాధారణ తెలుగు పాఠ్యం" : "మ్లేచ్ఛ భాషా పాఠ్యం"}</p>
              <span style={{ fontSize: 12, color: color.textFaint }}>{inputText.length} అక్షరాలు</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEncode ? "సాధారణ తెలుగు ఇక్కడ రాయండి..." : "మ్లేచ్ఛ భాష ఇక్కడ రాయండి..."}
              rows={isMobile ? 6 : 10}
              style={inputStyle}
            />
            {!isMobile && (
              <p style={{ fontSize: 12, color: color.textFaint, margin: 0 }}>
                Ctrl + Enter నొక్కి మార్చవచ్చు
              </p>
            )}
          </div>

          {/* Output */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={fieldLabel}>ఫలితం</p>
              {outputText && <span style={{ fontSize: 12, color: color.textFaint }}>{outputText.length} అక్షరాలు</span>}
            </div>

            {outputText ? (
              <>
                <div style={{
                  border: `1px solid ${color.border}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: color.text,
                  backgroundColor: color.bg,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowY: "auto",
                  minHeight: isMobile ? 120 : 200,
                  maxHeight: 400,
                  userSelect: "all",
                  cursor: "text",
                }}>
                  {outputText}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={handleCopy} style={btnSecondary(copied)}>
                    {copied ? <IconCheck /> : <IconCopy />}
                    {copied ? "కాపీ అయింది!" : "కాపీ చేయండి"}
                  </button>
                  <button onClick={handleSpeak} style={btnSecondary(isSpeaking)}>
                    {isSpeaking ? <IconStop /> : <IconPlay />}
                    {isSpeaking ? "ఆపండి" : "వినండి"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                border: `1px dashed ${color.borderMid}`,
                borderRadius: 8,
                minHeight: isMobile ? 80 : 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: color.bg,
              }}>
                <p style={{ fontSize: 13, color: color.textFaint, fontStyle: "italic", margin: 0, textAlign: "center", padding: "0 20px", lineHeight: 1.7 }}>
                  మార్చు బటన్ నొక్కిన తర్వాత<br />ఫలితం ఇక్కడ కనిపిస్తుంది
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action bar ── */}
        <div style={{ display: "flex", gap: 10, justifyContent: isMobile ? "stretch" : "center", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleConvert}
            style={btnPrimary}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.primaryHov; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.primary; }}
          >
            {isEncode ? "మ్లేచ్ఛ భాషలోకి మార్చు" : "సాధారణ భాషలోకి పునరుద్ధరించు"}
          </button>

          {(inputText || outputText) && (
            <button
              onClick={handleClear}
              title="అన్నీ తుడిచివేయండి"
              style={btnSecondary()}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.surfaceAlt; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = color.surface; }}
            >
              <IconTrash />
              {isMobile ? "" : "తుడిచివేయండి"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}