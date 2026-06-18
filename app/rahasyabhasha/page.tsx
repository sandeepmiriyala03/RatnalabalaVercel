"use client";

import { useState, useRef, useEffect } from "react";
// MUI Icons
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GavelIcon from "@mui/icons-material/Gavel";

export default function MlechhaBhashaPage() {
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [outputText, setOutputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive state for pure-CSS fallback or toggle layout if needed
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── Conversion Logic ─── */
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

        if (nxt) {
          const cm = cur.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
          const expectedSecretKa = "క" + cm;

          if (nxt === expectedSecretKa) {
            result.push(cur);
            i++; 
            continue;
          }
        }
        result.push(cur);
      }
      return result.join("");
    }).join("");

  /* ─── Handlers ─── */
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

  /* ─── Premium UI/UX Design System ─── */
  const S = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f4f6f9",
      padding: isMobile ? "1rem 0.75rem" : "2rem 1.5rem",
      fontFamily: "'Noto Sans Telugu', system-ui, sans-serif",
      boxSizing: "border-box" as const,
      color: "#1e293b"
    },
    wrap: {
      maxWidth: 850,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column" as const,
      gap: 16,
    },
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: isMobile ? "16px" : "24px",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    input: {
      width: "100%",
      border: "1px solid #cbd5e1",
      borderRadius: 12,
      padding: "14px",
      fontSize: 16, // Prevents iOS auto-zoom behavior on focus
      lineHeight: 1.6,
      color: "#0f172a",
      backgroundColor: "#ffffff",
      resize: "none" as const,
      outline: "none",
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
      WebkitAppearance: "none" as const,
      transition: "border-color 0.2s, box-shadow 0.2s",
    },
    btnPrimary: {
      backgroundColor: "#4f46e5", // Indigo theme for higher fidelity feel
      color: "#ffffff",
      border: "none",
      borderRadius: 12,
      padding: "14px 28px",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
      width: isMobile ? "100%" : "auto",
    },
    btnSecondary: (active = false) => ({
      backgroundColor: active ? "#ecfdf5" : "#ffffff",
      color: active ? "#059669" : "#475569",
      border: active ? "1px solid #10b981" : "1px solid #cbd5e1",
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontFamily: "inherit",
      flex: isMobile ? 1 : "none",
    }),
    selectWrapper: {
      position: "relative" as const,
      display: "flex",
      alignItems: "center",
    },
    select: {
      width: "100%",
      border: "1px solid #cbd5e1",
      borderRadius: 12,
      padding: "14px",
      fontSize: 15,
      fontWeight: 500,
      color: "#1e293b",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      outline: "none",
      fontFamily: "inherit",
      boxSizing: "border-box" as const,
      WebkitAppearance: "none" as const,
    },
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Brand Header */}
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.02em" }}>
            మ్లేచ్ఛ మాల
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0, fontWeight: 400 }}>
            రహస్య గూఢచార భాషా మార్పిడి సాధనం
          </p>
        </div>

        {/* Responsive Mobile Layout Switcher Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16
        }}>
          
          {/* History Context (Collapsible on Mobile naturally by stacking layout) */}
          <div style={{ ...S.card, backgroundColor: "#f8fafc" }}>
            <h2 style={S.label}>
              <MenuBookIcon fontSize="small" style={{ color: "#4f46e5" }} /> చారిత్రక నేపథ్యం
            </h2>
            <div style={{
              borderLeft: "4px solid #4f46e5",
              backgroundColor: "#ffffff",
              borderRadius: "0 12px 12px 0",
              padding: "12px",
              marginBottom: 10,
            }}>
              <p style={{ fontSize: 13, color: "#334155", fontStyle: "italic", lineHeight: 1.8, margin: 0 }}>
                "ఖనన శిల్పకళా ప్రౌఢుఁడనఘ!... నడవి కార్చిచ్చు గాల్చుచో నందు నక్క బిలము సొచ్చిన యలుక గాలక సుఖించు."
              </p>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              మహాభారత కాలంలో విదురుడు లాక్షాగృహ కుట్రను పాండవులకు రహస్యంగా తెలియజేయడానికి వాడిన ప్రాచీన సంకేత భాష.
            </p>
          </div>

          {/* Quick Rules */}
          <div style={S.card}>
            <h2 style={S.label}>
              <GavelIcon fontSize="small" style={{ color: "#4f46e5" }} /> రహస్య నియమాలు
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ backgroundColor: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 2px 0" }}>అక్షరం + క</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>ప్రతి అక్షరం తర్వాత అదే మాత్రతో "క" వస్తుంది.</p>
              </div>
              <div style={{ backgroundColor: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 2px 0" }}>హల్లంతాలు</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>పొల్లు అక్షరాలకు (్) "క" నియమం వర్తించదు.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Direction Mode Selector */}
        <div style={S.card}>
          <label style={S.label}>మార్పిడి దిశను ఎంచుకోండి</label>
          <div style={S.selectWrapper}>
            <select
              value={direction}
              onChange={(e) => handleDirectionChange(e.target.value as "encode" | "decode")}
              style={S.select}
            >
              <option value="encode">సాధారణ తెలుగు ➔ మ్లేచ్ఛ భాష (Encode)</option>
              <option value="decode">మ్లేచ్ఛ భాష ➔ సాధారణ తెలుగు (Decode)</option>
            </select>
          </div>
        </div>

        {/* Input & Output Stack Matrix */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 16,
          alignItems: "start"
        }}>
          
          {/* Input Interface */}
          <div style={S.card}>
            <label style={{ ...S.label, color: "#0f172a" }}>
              {isEncode ? "సాధారణ తెలుగు పాఠ్యం" : "మ్లేచ్ఛ భాషా సంకేతం"}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEncode ? "ఇక్కడ రాయండి (ఉదా: సందీప్)..." : "ఇక్కడ రాయండి (ఉదా: సంకదీకిప్)..."}
              rows={isMobile ? 5 : 8}
              style={S.input}
            />
          </div>

          {/* Output Interface */}
          <div style={S.card}>
            <label style={{ ...S.label, color: "#0f172a" }}>పరివర్తన ఫలితం</label>
            {outputText ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "#0f172a",
                  backgroundColor: "#f8fafc",
                  whiteSpace: "pre-wrap",
                  minHeight: isMobile ? 100 : 166,
                  maxHeight: 300,
                  overflowY: "auto",
                  wordBreak: "break-word"
                }}>
                  {outputText}
                </div>
                
                {/* Action Buttons Container - Auto fluid rows for mobile */}
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <button onClick={handleCopy} style={S.btnSecondary(copied)}>
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    {copied ? "కాపీ అయింది!" : "కాపీ"}
                  </button>
                  <button onClick={handleSpeak} style={S.btnSecondary(isSpeaking)}>
                    {isSpeaking ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                    {isSpeaking ? "ఆపండి" : "వినండి"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                border: "2px dashed #e2e8f0",
                borderRadius: 12,
                minHeight: isMobile ? 120 : 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fafafa"
              }}>
                <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: 0, textAlign: "center" }}>
                  క్రింది బటన్ నొక్కిన వెంటనే<br />ఫలితం ఇక్కడ ప్రత్యక్షమవుతుంది
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Action Floating Bar Area */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" as const : "row" as const,
          gap: 10,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 8,
          marginBottom: isMobile ? 24 : 0
        }}>
          <button
            onClick={handleConvert}
            style={S.btnPrimary}
          >
            <SyncAltIcon />
            {isEncode ? "మ్లేచ్ఛ భాషలోకి మార్చు" : "సాధారణ భాషలోకి మార్చు"}
          </button>

          {(inputText || outputText) && (
            <button
              onClick={handleClear}
              style={{ ...S.btnSecondary(), width: isMobile ? "100%" : "auto", height: 50, borderRadius: 12 }}
            >
              <DeleteOutlineIcon fontSize="small" />
              అంతా క్లియర్ చేయండి
            </button>
          )}
        </div>

      </div>
    </div>
  );
}