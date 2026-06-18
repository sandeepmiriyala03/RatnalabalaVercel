"use client";

import { useState, useRef } from "react";

export default function MlechhaBhashaPage() {
  const [inputText, setInputText] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [outputText, setOutputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const convertToSecret = (text: string): string =>
    text
      .split(/(\s+)/)
      .map((token) => {
        if (/^\s+$/.test(token)) return token;
        const syllables = token.match(/[\u0C00-\u0C7F][\u0C3E-\u0C4D]*/g) || [token];
        return syllables
          .map((syl) => {
            if (!/[\u0C00-\u0C7F]/.test(syl)) return syl;
            if (syl.endsWith("్")) return syl;
            const matra = syl.match(/[\u0C3E-\u0C4C]/)?.[0] ?? "";
            return syl + "క" + matra;
          })
          .join("");
      })
      .join("");

  const convertToNormal = (text: string): string =>
    text
      .split(/(\s+)/)
      .map((token) => {
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
      })
      .join("");

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
    window.speechSynthesis?.cancel();
  };

  const handleClear = () => {
    setInputText("");
    setOutputText("");
    setIsSpeaking(false);
    window.speechSynthesis?.cancel();
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 font-sans">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="text-center border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            మ్లేచ్ఛ భాషా పరివర్తక
          </h1>
          <p className="text-sm text-slate-500">సాంప్రదాయ గూఢచార భాషా మార్పిడి సాధనం</p>
        </div>

        {/* Historical background */}
        <div className="bg-slate-100 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">చారిత్రక నేపథ్యం</h2>
          <div className="border-l-2 border-slate-400 pl-3 bg-white rounded-r-lg py-2 pr-3 mb-3">
            <p className="text-sm leading-relaxed text-slate-700 italic whitespace-pre-line">
              {`"ఖనన శిల్పకళా ప్రౌఢుఁడనఘ! నన్ను విదురుఁడంపినవాఁడ మీకెఱుఁగఁ జెప్పె
నడవి కార్చిచ్చు గాల్చుచో నందు నక్క బిలము సొచ్చిన యలుక గాలక సుఖించు."`}
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            మహాభారత కాలంలో విదురుడు లాక్షాగృహ కుట్రను పాండవులకు రహస్యంగా హెచ్చరించడానికి వాడిన మ్లేచ్ఛ భాష — అడవి కార్చిచ్చులో భూమి బిలంలో ఉన్న జీవి మాత్రం సురక్షితంగా బతుకుతుంది, అంటే సురంగం ద్వారా తప్పించుకోండి.
          </p>
        </div>

        {/* Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">మ్లేచ్ఛ భాష నియమాలు</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            {[
              { title: "అక్షరం తర్వాత \"క\"", desc: "ప్రతి అక్షరం తర్వాత అదే మాత్రతో \"క\" చేర్చాలి" },
              { title: "హల్లంతం మినహాయింపు", desc: "హల్లంతం అక్షరాలకు (్) \"క\" చేర్చరు" },
              { title: "మాత్ర సమాన్య", desc: "\"క\" కి అదే మాత్ర: నే → నేకే, ని → నికి" },
              { title: "పద అంతరం", desc: "పదాల మధ్య ఖాళీ యథాతథంగా ఉంచాలి" },
            ].map((r) => (
              <div key={r.title} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-800 mb-0.5">{r.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Direction selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            మార్పిడి విధానం
          </label>
          <select
            value={direction}
            onChange={(e) => handleDirectionChange(e.target.value as "encode" | "decode")}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
          >
            <option value="encode">సాధారణ తెలుగు → మ్లేచ్ఛ భాష (Encode)</option>
            <option value="decode">మ్లేచ్ఛ భాష → సాధారణ తెలుగు (Decode)</option>
          </select>
        </div>

        {/* I/O Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {isEncode ? "సాధారణ తెలుగు" : "మ్లేచ్ఛ భాష"}
              </label>
              <span className="text-xs text-slate-400">{inputText.length} అక్షరాలు</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEncode ? "సాధారణ తెలుగు ఇక్కడ రాయండి..." : "మ్లేచ్ఛ భాష ఇక్కడ రాయండి..."}
              rows={8}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm leading-relaxed text-slate-800 bg-white resize-y focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-300"
            />
            <p className="text-xs text-slate-400">Ctrl + Enter నొక్కి మార్చవచ్చు</p>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">ఫలితం</label>
            <div
              className="w-full min-h-[192px] border border-slate-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed bg-slate-50 overflow-y-auto whitespace-pre-wrap select-all"
              style={{ minHeight: "192px" }}
            >
              {outputText ? (
                <span className="text-slate-900">{outputText}</span>
              ) : (
                <span className="text-slate-300 italic">ఫలితం ఇక్కడ కనిపిస్తుంది...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleConvert}
            className="flex-1 min-w-[180px] max-w-xs bg-slate-900 hover:bg-slate-700 active:scale-[0.98] text-white text-sm font-medium rounded-lg px-5 py-3 transition-colors"
          >
            {isEncode ? "మ్లేచ్ఛ భాషలోకి మార్చు" : "సాధారణ భాషలోకి పునరుద్ధరించు"}
          </button>

          {outputText && (
            <>
              <button
                onClick={handleCopy}
                aria-label="ఫలితాన్ని కాపీ చేయండి"
                className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 bg-white hover:bg-slate-50 active:scale-[0.98] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                కాపీ
              </button>
              <button
                onClick={handleSpeak}
                aria-label="ఫలితాన్ని వినండి"
                className={`flex items-center gap-1.5 border rounded-lg px-4 py-3 text-sm bg-white active:scale-[0.98] transition-colors ${
                  isSpeaking
                    ? "border-slate-400 text-slate-500"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                )}
                {isSpeaking ? "ఆపండి" : "వినండి"}
              </button>
            </>
          )}

          <button
            onClick={handleClear}
            aria-label="అన్నీ తుడిచివేయండి"
            className="border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-500 bg-white hover:bg-slate-50 active:scale-[0.98] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>

        {/* Copy toast */}
        {copied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-md pointer-events-none animate-fade-in">
            కాపీ చేశారు ✓
          </div>
        )}
      </div>
    </div>
  );
}