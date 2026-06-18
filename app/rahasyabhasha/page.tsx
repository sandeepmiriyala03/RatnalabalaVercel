"use client";

import { useState, useRef, useEffect } from "react";
// MUI Icons
import SwapVertIcon from "@mui/icons-material/SwapVert";
import CodeIcon from "@mui/icons-material/Code";
import LockOpenIcon from "@mui/icons-material/LockOpen";
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

  // Mobile layout responsiveness
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── శబ్ద ఆధారిత "కా" భాషా లాజిక్ (Syllable Sound Based Logic) ─── */
  const convertToSecret = (text: string): string => {
    return text.split(/(\s+)/).map((token) => {
      if (/^\s+$/.test(token)) return token;
      
      const syllables = token.match(/[\u0C00-\u0C7F][\u0C3E-\u0C4D]*/g) || [token];
      
      return syllables.map((syl) => {
        if (!/[\u0C00-\u0C7F]/.test(syl)) return syl;
        return "కా" + syl;
      }).join(" ");
    }).join("");
  };

  const convertToNormal = (text: string): string => {
    return text.split(/(\s+)/).map((token) => {
      if (/^\s+$/.test(token)) return token;
      
      const syllables = token.match(/[\u0C00-\u0C7F][\u0C3E-\u0C4D]*/g) || [];
      const result: string[] = [];
      
      for (let i = 0; i < syllables.length; i++) {
        if (syllables[i] === "కా") {
          if (syllables[i + 1]) {
            result.push(syllables[i + 1]);
            i++;
          }
        } else {
          result.push(syllables[i]);
        }
      }
      return result.join("");
    }).join("").replace(/\s+/g, " ").trim();
  };

  /* ─── హ్యాండ్లర్స్ (Handlers) ─── */
  const handleEncode = () => {
    if (!inputText.trim()) { setOutputText(""); return; }
    setDirection("encode");
    setOutputText(convertToSecret(inputText));
  };

  const handleDecode = () => {
    if (!inputText.trim()) { setOutputText(""); return; }
    setDirection("decode");
    setOutputText(convertToNormal(inputText));
  };

  const handleSwap = () => {
    setDirection((prev) => (prev === "encode" ? "decode" : "encode"));
    setInputText(outputText);
    setOutputText(inputText);
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

  /* ─── UI రెస్పాన్సివ్ స్టైల్స్ ─── */
  const S = {
    page: {
      minHeight: "100vh",
      backgroundColor: "#f4f6f9",
      padding: isMobile ? "1rem 0.75rem" : "2.5rem 1.5rem",
      fontFamily: "'Noto Sans Telugu', system-ui, sans-serif",
      boxSizing: "border-box" as const,
      color: "#1e293b",
    },
    wrap: {
      maxWidth: 1100,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column" as const,
      gap: 18,
    },
    card: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: isMobile ? "16px" : "24px",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.03)",
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
      fontSize: 16,
      lineHeight: 1.6,
      color: "#0f172a",
      backgroundColor: "#ffffff",
      resize: "none" as const,
      outline: "none",
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
    },
    btnAction: (type: "encode" | "decode" | "swap") => {
      let bg = "#4f46e5";
      if (type === "decode") bg = "#0284c7";
      if (type === "swap") bg = "#64748b";
      return {
        backgroundColor: bg,
        color: "#ffffff",
        border: "none",
        borderRadius: 12,
        padding: isMobile ? "14px" : "12px 20px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        width: "100%",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        fontFamily: "inherit",
      };
    },
    btnSecondary: (active = false) => ({
      backgroundColor: active ? "#ecfdf5" : "#ffffff",
      color: active ? "#059669" : "#475569",
      border: active ? "1px solid #10b981" : "1px solid #cbd5e1",
      borderRadius: 10,
      padding: "10px 16px",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontFamily: "inherit",
      flex: 1,
    }),
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* హెడర్ */}
        <div style={{ textAlign: "center", padding: "5px 0" }}>
          <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
            మ్లేచ్ఛ మాల
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            సంపూర్ణ శబ్ద ఆధారిత రహస్య భాషా వ్యవస్థ ("కా" శైలి)
          </p>
        </div>

        {/* సమాచారం (చారిత్రక నేపథ్యం మరియు నియమాలు) */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div style={{ ...S.card, backgroundColor: "#f8fafc" }}>
            <h2 style={S.label}><MenuBookIcon fontSize="small" style={{ color: "#4f46e5" }} /> చారిత్రక నేపథ్యం</h2>
            <p style={{ fontSize: 12.5, color: "#1e293b", lineHeight: 1.6, margin: "0 0 6px 0", fontStyle: "italic", fontWeight: 500 }}>
              "ఖనన శిల్పకళా ప్రౌఢుఁడనఘ!... నడవి కార్చిచ్చు గాల్చుచో నందు నక్క బిలము సొచ్చిన యలుక గాలక సుఖించు."
            </p>
            <p style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, margin: 0 }}>
              మహాభారతంలో లాక్షాగృహ దహన కుట్ర నుండి పాండవులను కాపాడటానికి విదురుడు ధర్మరాజుతో సంభాషించిన ప్రాచీన రహస్య సంకేత పద్య భాగం.
            </p>
          </div>
          <div style={S.card}>
            <h2 style={S.label}><GavelIcon fontSize="small" style={{ color: "#4f46e5" }} /> "కా-శబ్ద" నియమం</h2>
            <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              ప్రతి పూర్తి ఉచ్చారణ శబ్దానికి (Syllable) ముందు <b>'కా'</b> వచ్చి చేరుతుంది. <br />
              (ఉదాహరణకు: <b>సందీప్ ➔ కాసం కాదీ కాప్</b>).
            </p>
          </div>
        </div>

        {/* ─── ప్రధాన లేఅవుట్ [ఎడమ ఇన్‌పుట్] [మధ్య కంట్రోల్స్] [కుడి అవుట్‌పుట్] ─── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 190px 1fr",
          gap: 16,
          alignItems: "center"
        }}>
          
          {/* [ఎడమ ఇన్‌పుట్ బాక్స్] */}
          <div style={S.card}>
            <label style={{ ...S.label, color: "#0f172a" }}>
              {isEncode ? "ఇన్‌పుట్ (సాధారణ తెలుగు)" : "ఇన్‌పుట్ (రహస్య సంకేతం)"}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isEncode ? "ఇక్కడ రాయండి (ఉదా: సందీప్)..." : "ఇక్కడ రాయండి (ఉదా: కాసం కాదీ కాప్)..."}
              rows={isMobile ? 5 : 9}
              style={S.input}
            />
          </div>

          {/* [మధ్య బటన్ల ప్యానెల్] */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: isMobile ? "6px 0" : "0",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <button onClick={handleEncode} style={S.btnAction("encode")}>
              <CodeIcon fontSize="small" />
              కోడ్ చేయి ➔
            </button>
            
            <button onClick={handleSwap} style={S.btnAction("swap")} title="ఇన్‌పుట్ మరియు అవుట్‌పుట్ మార్చండి">
              <SwapVertIcon style={{ transform: isMobile ? "none" : "rotate(90deg)" }} />
              మార్చు ⇄
            </button>

            <button onClick={handleDecode} style={S.btnAction("decode")}>
              <LockOpenIcon fontSize="small" />
              డీకోడ్ చేయి ➔
            </button>
          </div>

          {/* [కుడి అవుట్‌పుట్ బాక్స్] */}
          <div style={S.card}>
            <label style={{ ...S.label, color: "#0f172a" }}>
              {isEncode ? "ఫలితం (మ్లేచ్ఛ భాష)" : "ఫలితం (సాధారణ తెలుగు)"}
            </label>
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
                  minHeight: isMobile ? 100 : 182,
                  maxHeight: 280,
                  overflowY: "auto",
                  wordBreak: "break-word"
                }}>
                  {outputText}
                </div>
                
                {/* యాక్షన్స్ */}
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
                minHeight: isMobile ? 120 : 236,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fafafa"
              }}>
                <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", margin: 0, textAlign: "center" }}>
                  బటన్లను క్లిక్ చేయగానే ఫలితం ఇక్కడ ప్రత్యక్షమవుతుంది.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* క్లియర్ బటన్ */}
        {(inputText || outputText) && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <button
              onClick={handleClear}
              style={{ ...S.btnSecondary(), maxWidth: isMobile ? "100%" : "220px", height: 46, borderRadius: 12 }}
            >
              <DeleteOutlineIcon fontSize="small" />
              అంతా క్లియర్ చేయండి
            </button>
          </div>
        )}

      </div>
    </div>
  );
}