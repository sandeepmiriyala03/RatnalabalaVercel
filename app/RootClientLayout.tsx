"use client";

import { useEffect, useState } from "react";
import { initWebMCP } from "@/lib/webmcp";
import ClientWrapper from "@/app/components/ClientWrapper";
import Navbar from "@/app/components/Navbar";
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import CookieConsentBanner, {
  getCookieConsent,
} from "@/app/components/CookieConsentBanner";
import FontControlsTelugu from "@/app/components/FontSelection";
import type { TeluguFont } from "@/app/types/fonts";


export type { TeluguFont };

const DEFAULT_FONT: TeluguFont = "Dhurjati";
const DEFAULT_SIZE = 1.0;

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontFamily, setFontFamily] =
    useState<TeluguFont>(DEFAULT_FONT);

  const [fontSize, setFontSize] =
    useState<number>(DEFAULT_SIZE);

  const [webmcpStatus, setWebmcpStatus] =
    useState("WebMCP initializing...");

  // ==========================================================
  // 🌐 WebMCP — Experiment 1
  // ==========================================================
  //
  // 🧠 8-Word Memory
  //
  // ఎవరు       → Agent
  // ఎక్కడ      → Browser
  // ఏ పని      → Tool
  // పేరు       → Name
  // వివరాలు    → Description
  // Input      → Input Schema
  // తర్కం      → Execute
  // Output     → Result
  //
  // ==========================================================

  useEffect(() => {
    try {
      initWebMCP();

      setWebmcpStatus(
        "🌸 WebMCP initialized — searchTeluguLiterature ready"
      );
    } catch (error) {
      console.error("WebMCP initialization failed:", error);
      setWebmcpStatus("WebMCP initialization failed");
    }
  }, []);

  // ==========================================================
  // 🔐 Cookie Consent
  // ==========================================================

  useEffect(() => {
    getCookieConsent();
  }, []);

  // ==========================================================
  // 📱 Service Worker
  // ==========================================================

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn(
          "Service worker registration failed:",
          error
        );
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  return (
    <>
      {/* ======================================================
          🧭 Main Menu
          ====================================================== */}

      <Navbar />

      {/* ======================================================
          🎨 Telugu Font Controls
          ====================================================== */}

      <FontControlsTelugu
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />

      {/* ======================================================
          🌐 WebMCP Experiment 1 UI
          ====================================================== */}

      <main
        style={{
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        <section
          style={{
            maxWidth: "800px",
            margin: "24px auto",
            padding: "24px",
            border: "1px solid var(--border-strong)",
            borderRadius: "16px",
            background: "var(--surface)",
          }}
        >
          <h1>🌐 WebMCP Experiment 1</h1>

          <p>{webmcpStatus}</p>

          <hr />

          <h2>🛠️ Available Tool</h2>

          <h3>searchTeluguLiterature</h3>

          <p>
            రత్నాలబాలలో తెలుగు సాహిత్యాన్ని వెతికే WebMCP Tool.
          </p>

          <h3>📥 Input</h3>

          <pre
            style={{
              padding: "12px",
              borderRadius: "8px",
              overflowX: "auto",
              background: "var(--surface-elevated)",
            }}
          >
{`{
  "query": "అసహనం"
}`}
          </pre>

          <h3>⚙️ Execute</h3>

          <p>
            Tool handler receives the query and executes the
            search logic.
          </p>

          <h3>📤 Result</h3>

          <pre
            style={{
              padding: "12px",
              borderRadius: "8px",
              overflowX: "auto",
              background: "var(--surface-elevated)",
            }}
          >
{`{
  "query": "అసహనం",
  "message": "అసహనం కోసం రత్నాలబాలలో వెతుకుతున్నాను."
}`}
          </pre>

          <h3>🔄 WebMCP Flow</h3>

          <p>
            AI Agent → Browser → Tool → Input → Execute → Result
          </p>
        </section>

        {/* ====================================================
            Existing application pages
            ==================================================== */}

        <ClientWrapper>{children}</ClientWrapper>
      </main>

      {/* ======================================================
          📱 PWA
          ====================================================== */}

      <PwaInstallPrompt />

      {/* ======================================================
          🍪 Cookie Consent
          ====================================================== */}

      <CookieConsentBanner />

      {/*
      ==========================================================
      🚧 Temporarily disabled for WebMCP Experiment 1

      <ReadingActivityTracker />
      <FloatingAIButton />
      <AudioPlayer />
      <MusicPlayer />
      <DownloadRingtones />
      <cacheAllPoems />
      ==========================================================
      */}
    </>
  );
}