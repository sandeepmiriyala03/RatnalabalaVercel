"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AccessibilityRoundedIcon from "@mui/icons-material/AccessibilityRounded";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRoundedIcon";
import PauseRoundedIcon from "@mui/icons-material/PauseRoundedIcon";

const G = "#10b981";

// Apply accessibility styles to the document
const applyAccessibilityStyles = (options: {
  enabled: boolean;
  highContrast?: boolean;
  reduceMotion?: boolean;
  fontSizeMultiplier?: number;
  colorBlindMode?: string;
  keyboardHints?: boolean;
}) => {
  const root = document.documentElement;
  
  if (!options.enabled) {
    root.style.filter = "";
    root.style.fontSize = "16px";
    return;
  }

  // Apply font size
  if (options.fontSizeMultiplier) {
    root.style.fontSize = `${16 * options.fontSizeMultiplier}px`;
  }

  // Apply high contrast
  if (options.highContrast) {
    root.style.filter = (root.style.filter || "") + " contrast(1.5)";
  }

  // Apply color blindness filter
  const colorFilters: Record<string, string> = {
    deuteranopia: "url(#deuteranopia-filter)",
    protanopia: "url(#protanopia-filter)",
    tritanopia: "url(#tritanopia-filter)",
    achromatopsia: "grayscale(100%)",
  };

  if (options.colorBlindMode && options.colorBlindMode !== "none") {
    root.style.filter = (root.style.filter || "") + " " + colorFilters[options.colorBlindMode];
  }

  // Apply reduce motion
  if (options.reduceMotion) {
    const style = document.getElementById("a11y-reduce-motion-style");
    if (!style) {
      const styleEl = document.createElement("style");
      styleEl.id = "a11y-reduce-motion-style";
      styleEl.textContent = `
        * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `;
      document.head.appendChild(styleEl);
    }
  } else {
    const style = document.getElementById("a11y-reduce-motion-style");
    if (style) style.remove();
  }

  // Apply keyboard hints
  if (options.keyboardHints) {
    const style = document.getElementById("a11y-keyboard-style");
    if (!style) {
      const styleEl = document.createElement("style");
      styleEl.id = "a11y-keyboard-style";
      styleEl.textContent = `
        *:focus { outline: 3px solid #4f46e5 !important; outline-offset: 2px !important; }
        button:focus, a:focus, input:focus, select:focus, textarea:focus { box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5) !important; }
      `;
      document.head.appendChild(styleEl);
    }
  } else {
    const style = document.getElementById("a11y-keyboard-style");
    if (style) style.remove();
  }
};

export default function YuktAIWrapper() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia'>('none');
  const [keyboardHints, setKeyboardHints] = useState(false);
  const [message, setMessage] = useState("ADA controls are ready.");
  const [isMobile, setIsMobile] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        applyAccessibilityStyles({
          enabled,
          highContrast,
          reduceMotion,
          fontSizeMultiplier,
          colorBlindMode,
          keyboardHints,
        });

        if (enabled) {
          setMessage("ADA enabled.");
          console.log("♿ Accessibility features applied");
        } else {
          setMessage("ADA disabled.");
        }

        (window as any).runWCAG = () =>
          applyAccessibilityStyles({
            enabled: true,
            highContrast,
            reduceMotion,
            fontSizeMultiplier,
            colorBlindMode,
            keyboardHints,
          });
      } catch (e) {
        console.error("Accessibility setup failed:", e);
        setMessage("Accessibility setup failed. See console.");
      }
    };

    run();
  }, [pathname, enabled, highContrast, reduceMotion, fontSizeMultiplier, colorBlindMode, keyboardHints]);

  return (
    <>
      {!panelVisible && (
        <button
          onClick={() => setPanelVisible(true)}
          style={{
            position: "fixed",
            bottom: 24,
            left: 24,
            zIndex: 10000,
            width: 48,
            height: 48,
            borderRadius: 24,
            border: "none",
            background: G,
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
            transition: "0.2s",
          }}
          aria-label="Open ADA accessibility controls"
        >
          <AccessibilityRoundedIcon style={{ fontSize: 24 }} />
        </button>
      )}

      {panelVisible && (
        <div style={{
          position: "fixed",
          bottom: 16,
          left: isMobile ? 16 : 16, // Adjust for mobile
          zIndex: 9999,
          width: isMobile ? "calc(100vw - 32px)" : 280, // Full width on mobile minus padding
          maxWidth: 320,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(15, 23, 42, 0.12)",
          borderRadius: 16,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
          padding: 16,
          fontFamily: "Inter, sans-serif",
          color: "#111827",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AccessibilityRoundedIcon style={{ fontSize: 18 }} />
              ADA accessibility
            </div>
            <button
              onClick={() => setPanelVisible(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                fontSize: 18,
              }}
              aria-label="Close ADA controls"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setEnabled(!enabled); setPanelVisible(false); }}
            style={{
              width: "100%",
              marginBottom: 12,
              padding: "12px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: enabled ? "#d1fae5" : "#eff6ff",
              color: enabled ? "#064e3b" : "#1d4ed8",
              fontWeight: 700,
              transition: "all 0.2s ease",
              fontSize: isMobile ? 14 : 13,
              minHeight: 44, // Touch-friendly
            }}
          >
            {enabled ? "Disable ADA" : "Enable ADA"}
          </button>

          {enabled && (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13, cursor: "pointer", minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={e => setHighContrast(e.target.checked)}
                  style={{ accentColor: "#0f766e", width: 18, height: 18 }}
                />
                <ContrastRoundedIcon style={{ fontSize: 18, color: "#64748b" }} />
                High contrast
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13, cursor: "pointer", minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={reduceMotion}
                  onChange={e => setReduceMotion(e.target.checked)}
                  style={{ accentColor: "#0f766e", width: 18, height: 18 }}
                />
                <PauseRoundedIcon style={{ fontSize: 18, color: "#64748b" }} />
                Reduce motion
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13 }}>
                Font size: {fontSizeMultiplier.toFixed(1)}x
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={fontSizeMultiplier}
                  onChange={e => setFontSizeMultiplier(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "#0f766e" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 13 }}>
                Color blindness:
                <select
                  value={colorBlindMode}
                  onChange={e => setColorBlindMode(e.target.value as any)}
                  style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #ccc" }}
                >
                  <option value="none">None</option>
                  <option value="deuteranopia">Deuteranopia</option>
                  <option value="protanopia">Protanopia</option>
                  <option value="tritanopia">Tritanopia</option>
                  <option value="achromatopsia">Achromatopsia</option>
                </select>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, cursor: "pointer", minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={keyboardHints}
                  onChange={e => setKeyboardHints(e.target.checked)}
                  style={{ accentColor: "#0f766e", width: 18, height: 18 }}
                />
                Keyboard navigation hints
              </label>
            </>
          )}

          <div style={{ fontSize: 11, lineHeight: 1.4, color: "#475569" }}>
            {message}
          </div>
        </div>
      )}
    </>
  );
}