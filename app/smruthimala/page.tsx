"use client";

/* ═══════════════════════════════════════════════════════════════
   స్మృతిమాల — పింగళి సీతమామ జ్ఞాపకాలు

   • కథల మాల: ప్రతి కథ ఒక పూస. ఇప్పుడు చదువుతున్నది ఎరుపు,
     చదివినవి బంగారు, చదవనివి తెలుపు — ఒక్క చూపులో ఎక్కడున్నామో తెలుస్తుంది
   • ఒకసారి ఒక కథ, పుస్తకం పేజీలా · ?katha=3 తో నేరుగా ఆ కథకు
   • వినండి: చదువుతున్న పేరా హైలైట్ · ఆపు / కొనసాగించు · 3 వేగాలు
   • పోస్టర్: పొడవైన కథకు అక్షరాలు సర్దుబాటు; ఫోన్‌లో నేరుగా WhatsApp కి పంచుకోవచ్చు
   • ఫాంట్లు main.py API నుండే (lib/teluguFonts) — Google Fonts link లేదు
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import StopRounded from "@mui/icons-material/StopRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";

import seethamalaData from "@/data/Pingali_Seethamama.json";
import { GridSection, SmruthiGrid } from "@/app/components/TeluguDataGrid";
import { fontStack, loadTeluguFont } from "@/lib/teluguFonts";

interface Story {
  story_id: string;
  title: string;
  subtitle: string;
  story_text: string[];
}

const DISPLAY_FONT = "Ramabhadra"; // శీర్షికలు — బలమైన, పుస్తకం లాంటి అక్షరం
const POSTER_BODY_FONT = "Mandali-Regular"; // పోస్టర్ పాఠ్యం — చిన్న సైజులోనూ స్పష్టం
const SITE_URL = "ratnalabala.vercel.app";

const SPEEDS = [
  { label: "నెమ్మదిగా", rate: 0.8 },
  { label: "మామూలుగా", rate: 0.95 },
  { label: "వేగంగా", rate: 1.1 },
];

const STORE = { last: "smruthimala-last", read: "smruthimala-read", rate: "smruthimala-rate" };

/* localStorage: private window లో పని చేయకపోయినా పేజీ ఆగదు */
function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* నిల్వ లేకపోయినా పరవాలేదు */
  }
}

/* పొడవైన పేరాను వాక్యాలుగా — కొన్ని browsers పొడవైన utterance ను మధ్యలో ఆపేస్తాయి */
function speechPieces(text: string): string[] {
  const sentences = text.split(/(?<=[.?!।॥])\s+/);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && buf.length + s.length > 220) {
      out.push(buf);
      buf = s;
    } else buf = buf ? `${buf} ${s}` : s;
  }
  if (buf) out.push(buf);
  return out;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ═══════════════════════════════════════════════════════════════ */

export default function SmruthimalaPage() {
  const stories = useMemo(() => (seethamalaData.stories as Story[]) || [], []);
  const total = stories.length;

  const [index, setIndex] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [resume, setResume] = useState<number | null>(null);
  const [showTitles, setShowTitles] = useState(false);
  const [displayReady, setDisplayReady] = useState(false);

  const story = stories[index];
  const headingRef = useRef<HTMLHeadingElement>(null);

  /* ---------- ఫాంట్లు: API నుండి ---------- */
  useEffect(() => {
    void loadTeluguFont(DISPLAY_FONT).then(setDisplayReady);
  }, []);
  const display = displayReady ? fontStack(DISPLAY_FONT) : "inherit";

  /* ---------- మొదట: URL లో కథ సంఖ్య / చివరిగా చదివింది ---------- */
  useEffect(() => {
    setReadIds(readStore<string[]>(STORE.read, []));
    const fromUrl = Number(new URLSearchParams(window.location.search).get("katha"));
    if (fromUrl >= 1 && fromUrl <= total) {
      setIndex(fromUrl - 1);
      return;
    }
    const last = readStore<string | null>(STORE.last, null);
    const lastIndex = stories.findIndex((s) => s.story_id === last);
    if (lastIndex > 0) setResume(lastIndex);
  }, [stories, total]);

  /* ---------- కథ మారినప్పుడు: గుర్తుంచుకో, URL మార్చు ---------- */
  useEffect(() => {
    if (!story) return;
    writeStore(STORE.last, story.story_id);
    setReadIds((prev) => {
      if (prev.includes(story.story_id)) return prev;
      const next = [...prev, story.story_id];
      writeStore(STORE.read, next);
      return next;
    });
    const url = new URL(window.location.href);
    url.searchParams.set("katha", String(index + 1));
    window.history.replaceState(null, "", url);
  }, [index, story]);

  /* ═══════════ వినండి (speechSynthesis) ═══════════ */
  const [speech, setSpeech] = useState<"idle" | "playing" | "paused">("idle");
  const [speakingPara, setSpeakingPara] = useState<number | null>(null);
  const [rate, setRate] = useState(0.95);
  const [noTeluguVoice, setNoTeluguVoice] = useState(false);
  const [canSpeak, setCanSpeak] = useState(true);
  const runRef = useRef(0); // కొత్తగా మొదలైతే పాత వరుస ఆగిపోతుంది
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setRate(readStore<number>(STORE.rate, 0.95));
    if (!("speechSynthesis" in window)) {
      setCanSpeak(false);
      return;
    }
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return; // ఇంకా లోడ్ కాలేదు
      voiceRef.current = voices.find((v) => v.lang.toLowerCase().startsWith("te")) ?? null;
      setNoTeluguVoice(!voiceRef.current);
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeech = useCallback(() => {
    runRef.current += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeech("idle");
    setSpeakingPara(null);
  }, []);

  const startSpeech = useCallback(
    (fromPara = 0, speed = rate) => {
      if (!story || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const run = ++runRef.current;

      // [పేరా సంఖ్య, మాట్లాడే ముక్క] వరుస — శీర్షిక మొదట
      const queue: [number, string][] = [];
      if (fromPara === 0) queue.push([0, `${story.title}. ${story.subtitle}`]);
      story.story_text.forEach((p, i) => {
        if (i >= fromPara) speechPieces(p).forEach((piece) => queue.push([i, piece]));
      });

      const speakNext = (k: number) => {
        if (run !== runRef.current) return;
        if (k >= queue.length) {
          setSpeech("idle");
          setSpeakingPara(null);
          return;
        }
        const [para, text] = queue[k];
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "te-IN";
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = speed;
        u.onstart = () => run === runRef.current && setSpeakingPara(para);
        u.onend = () => speakNext(k + 1);
        u.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") return;
          if (run === runRef.current) {
            setSpeech("idle");
            setSpeakingPara(null);
          }
        };
        synth.speak(u);
      };

      setSpeech("playing");
      speakNext(0);
    },
    [rate, story]
  );

  const pauseOrResume = () => {
    const synth = window.speechSynthesis;
    if (speech === "playing") {
      synth.pause();
      setSpeech("paused");
    } else if (speech === "paused") {
      synth.resume();
      setSpeech("playing");
    }
  };

  const changeRate = (value: number) => {
    setRate(value);
    writeStore(STORE.rate, value);
    if (speech !== "idle") startSpeech(speakingPara ?? 0, value); // అదే పేరా నుండి కొత్త వేగంతో
  };

  /* చదువుతున్న పేరా తెరపై కనిపించేలా */
  useEffect(() => {
    if (speakingPara === null) return;
    document.getElementById(`para-${speakingPara}`)?.scrollIntoView({
      block: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [speakingPara]);

  /* ---------- కథ మార్చడం ---------- */
  const goTo = (i: number) => {
    if (i < 0 || i >= total || i === index) return;
    stopSpeech();
    setIndex(i);
    setResume(null);
    setShowTitles(false);
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  /* ═══════════ పోస్టర్ ═══════════ */
  const [posterMsg, setPosterMsg] = useState("");
  const [posterBusy, setPosterBusy] = useState(false);

  const sharePoster = async () => {
    const el = document.getElementById("smruthi-poster");
    if (!el || !story || posterBusy) return;
    setPosterBusy(true);
    setPosterMsg("పోస్టర్ సిద్ధం చేస్తున్నాం…");
    try {
      await Promise.all([loadTeluguFont(DISPLAY_FONT), loadTeluguFont(POSTER_BODY_FONT)]);
      await document.fonts.ready;
      fitPoster(el);

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fdfaf5",
        logging: false,
        width: 1200,
        height: 1200,
        windowWidth: 1200,
        windowHeight: 1200,
        // తెర వెలుపల ఉన్న పోస్టర్‌ను నకలులో మాత్రమే ముందుకు తెస్తాం — తెరపై మెరవదు
        onclone: (doc) => {
          const clone = doc.getElementById("smruthi-poster");
          if (clone) Object.assign(clone.style, { left: "0px", top: "0px" });
        },
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("no image");
      const name = `${story.title.replace(/[\\/:*?"<>|\s]+/g, "_")}_స్మృతిమాల.png`;
      const file = new File([blob], name, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: story.title, text: `${story.title} — ${SITE_URL}` });
          setPosterMsg("పోస్టర్ పంచుకున్నారు.");
        } catch (e) {
          if ((e as Error).name === "AbortError") setPosterMsg("");
          else throw e;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setPosterMsg("పోస్టర్ డౌన్‌లోడ్ అయింది. WhatsApp / Facebook లో పంచుకోవచ్చు.");
      }
    } catch (error) {
      console.error("Poster failed:", error);
      setPosterMsg("పోస్టర్ తయారుకాలేదు. మళ్ళీ ప్రయత్నించండి.");
    } finally {
      setPosterBusy(false);
    }
  };

  if (!story) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 8 }}>
        <Typography>కథలు ఇంకా అందుబాటులో లేవు.</Typography>
      </Box>
    );
  }

  const isRead = (id: string) => readIds.includes(id);
  const prev = stories[index - 1];
  const next = stories[index + 1];

  /* ═══════════════════════ తెర ═══════════════════════ */
  return (
    <Box sx={{ bgcolor: "var(--background)", color: "var(--foreground)", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, sm: 3 }, pt: { xs: 4, sm: 7 }, pb: 10 }}>
        {/* ---------- శీర్షిక ---------- */}
        <Box component="header" sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: display,
              fontSize: { xs: "2.6rem", sm: "3.6rem" },
              lineHeight: 1.25,
              color: "var(--primary)",
            }}
          >
            స్మృతిమాల
          </Typography>
          <Typography sx={{ fontSize: { xs: "1.2rem", sm: "1.35rem" }, fontWeight: 700, mt: 0.5 }}>
            పింగళి సీతమామ జ్ఞాపకాలు
          </Typography>
          <Typography sx={{ color: "var(--muted-text)", mt: 0.75, lineHeight: 1.8, maxWidth: "34em" }}>
            {total} కథలు. చదవండి, వినండి, నచ్చిన కథను పోస్టర్‌గా పంచుకోండి.
          </Typography>
        </Box>

        {/* చివరిగా చదివిన కథ */}
        {resume !== null && resume !== index && (
          <Box
            role="status"
            sx={{
              mb: 3,
              p: 2,
              borderRadius: "var(--radius)",
              bgcolor: "var(--surface-elevated)",
              border: "2px solid var(--accent-light)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Typography sx={{ flex: "1 1 16em", lineHeight: 1.7 }}>
              మీరు చివరిగా చదివిన కథ: <strong>{stories[resume].title}</strong>
            </Typography>
            <Button
              onClick={() => goTo(resume)}
              sx={{
                minHeight: "var(--tap-target)",
                px: 2.5,
                fontWeight: 800,
                fontSize: "1rem",
                textTransform: "none",
                bgcolor: "var(--primary)",
                color: "var(--background)",
                borderRadius: "var(--radius-sm)",
                "&:hover": { bgcolor: "var(--primary)", filter: "brightness(1.1)" },
              }}
            >
              అక్కడి నుండి చదవండి
            </Button>
          </Box>
        )}

        {/* ---------- కథల మాల ---------- */}
        <Box component="nav" aria-label="కథల మాల" sx={{ mb: 1.5 }}>
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexWrap: "wrap", rowGap: 1.5 }}>
            {stories.map((s, i) => {
              const current = i === index;
              const read = isRead(s.story_id);
              return (
                <Box
                  component="li"
                  key={s.story_id}
                  sx={{
                    // దారం: ప్రతి పూస గుండా బంగారు గీత — వరుసలో అతుక్కుని మాలలా కనిపిస్తుంది
                    px: "5px",
                    background: "linear-gradient(var(--accent), var(--accent)) center / 100% 3px no-repeat",
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={current ? "page" : undefined}
                    aria-label={`కథ ${i + 1}: ${s.title}${read && !current ? " (చదివారు)" : ""}`}
                    title={s.title}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      font: "inherit",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      cursor: "pointer",
                      border: "2px solid",
                      borderColor: current ? "var(--primary)" : read ? "var(--accent)" : "var(--border-strong)",
                      bgcolor: current ? "var(--primary)" : read ? "var(--accent-light)" : "var(--surface-elevated)",
                      color: current ? "var(--background)" : read ? "var(--on-accent)" : "var(--foreground)",
                      boxShadow: current ? "0 0 0 4px var(--background), 0 0 0 6px var(--primary)" : "none",
                      transition: "background-color var(--transition-fast)",
                      "&:hover": { borderColor: "var(--primary)" },
                      "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 3 },
                    }}
                  >
                    {i + 1}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Stack direction="row" flexWrap="wrap" alignItems="center" columnGap={2.5} rowGap={1} sx={{ mb: 1, fontSize: "0.95rem", color: "var(--muted-text)" }}>
          <Legend fill="var(--primary)" border="var(--primary)" label="ఇప్పుడు చదువుతున్నది" />
          <Legend fill="var(--accent-light)" border="var(--accent)" label="చదివినవి" />
          <Legend fill="var(--surface-elevated)" border="var(--border-strong)" label="ఇంకా చదవనివి" />
          <Button
            onClick={() => setShowTitles((v) => !v)}
            aria-expanded={showTitles}
            sx={{ ml: "auto", minHeight: 44, textTransform: "none", fontWeight: 700, fontSize: "0.98rem", color: "var(--accent-text)" }}
          >
            {showTitles ? "పేర్ల జాబితా మూసివేయండి" : "కథల పేర్లతో వెతకండి"}
          </Button>
        </Stack>

        {showTitles && (
          <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, mb: 2, borderTop: "1px solid var(--border-strong)" }}>
            {stories.map((s, i) => (
              <Box component="li" key={s.story_id} sx={{ borderBottom: "1px solid var(--border)" }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === index ? "page" : undefined}
                  sx={{
                    width: "100%",
                    minHeight: "var(--tap-target)",
                    display: "flex",
                    gap: 1.5,
                    alignItems: "baseline",
                    textAlign: "left",
                    py: 1.25,
                    px: 0.5,
                    font: "inherit",
                    color: "inherit",
                    bgcolor: i === index ? "var(--surface)" : "transparent",
                    border: 0,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "var(--surface)" },
                    "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: -3 },
                  }}
                >
                  <Box component="span" sx={{ minWidth: "2.2em", fontWeight: 800, color: "var(--muted-text)" }}>
                    {i + 1}
                  </Box>
                  <Box component="span" sx={{ fontWeight: 700, lineHeight: 1.6 }}>
                    {s.title}
                    {isRead(s.story_id) && i !== index && (
                      <Box component="span" sx={{ fontWeight: 400, color: "var(--muted-text)" }}>
                        {" "}
                        (చదివారు)
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* ---------- కథ ---------- */}
        <Box component="article" aria-labelledby="story-title" sx={{ mt: { xs: 4, sm: 5 } }}>
          <Typography sx={{ color: "var(--muted-text)", fontWeight: 700, fontSize: "1rem" }}>
            {total} కథల్లో {index + 1}వ కథ
          </Typography>
          <Typography
            id="story-title"
            ref={headingRef}
            tabIndex={-1}
            component="h2"
            sx={{
              fontFamily: display,
              fontSize: { xs: "2rem", sm: "2.6rem" },
              lineHeight: 1.35,
              mt: 0.5,
              scrollMarginTop: "calc(var(--app-header-height) + 16px)",
              outline: "none",
            }}
          >
            {story.title}
          </Typography>
          {story.subtitle && (
            <Typography sx={{ fontSize: { xs: "1.15rem", sm: "1.25rem" }, color: "var(--muted-text)", mt: 0.75, lineHeight: 1.7 }}>
              {story.subtitle}
            </Typography>
          )}

          {/* వినండి · వేగం · పోస్టర్ */}
          <Box
            sx={{
              mt: 3,
              mb: 4,
              py: 2,
              borderTop: "2px solid var(--accent)",
              borderBottom: "1px solid var(--border-strong)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {canSpeak && (
              <>
                {speech === "idle" ? (
                  <ActionButton primary onClick={() => startSpeech(0)} icon={<PlayArrowRounded />}>
                    కథ వినండి
                  </ActionButton>
                ) : (
                  <>
                    <ActionButton primary onClick={pauseOrResume} icon={speech === "playing" ? <PauseRounded /> : <PlayArrowRounded />}>
                      {speech === "playing" ? "కొంచెం ఆపండి" : "కొనసాగించండి"}
                    </ActionButton>
                    <ActionButton onClick={stopSpeech} icon={<StopRounded />}>
                      ఆపివేయండి
                    </ActionButton>
                  </>
                )}

                <Box role="radiogroup" aria-label="చదివే వేగం" sx={{ display: "flex", border: "2px solid var(--border-strong)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  {SPEEDS.map((s) => {
                    const on = rate === s.rate;
                    return (
                      <Box
                        key={s.rate}
                        component="button"
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => changeRate(s.rate)}
                        sx={{
                          minHeight: 44,
                          px: 1.5,
                          font: "inherit",
                          fontSize: "0.95rem",
                          fontWeight: on ? 800 : 500,
                          border: 0,
                          cursor: "pointer",
                          bgcolor: on ? "var(--secondary)" : "transparent",
                          color: on ? "var(--background)" : "var(--foreground)",
                          "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: -3 },
                        }}
                      >
                        {s.label}
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}

            <ActionButton onClick={sharePoster} icon={<IosShareRounded />} disabled={posterBusy} sx={{ ml: { sm: "auto" } }}>
              {posterBusy ? "సిద్ధం చేస్తున్నాం…" : "పోస్టర్ పంచుకోండి"}
            </ActionButton>

            <Box role="status" aria-live="polite" sx={{ flexBasis: "100%", fontSize: "0.95rem", color: "var(--muted-text)", lineHeight: 1.7, "&:empty": { display: "none" } }}>
              {posterMsg}
            </Box>
            {canSpeak && noTeluguVoice && speech !== "idle" && (
              <Box sx={{ flexBasis: "100%", fontSize: "0.95rem", color: "var(--warning)", lineHeight: 1.7 }}>
                ఈ పరికరంలో తెలుగు స్వరం కనిపించలేదు, సరిగ్గా చదవకపోవచ్చు. Android లో: Settings → Text-to-speech → Google → తెలుగు భాష డౌన్‌లోడ్ చేయండి.
              </Box>
            )}
          </Box>

          {/* కథ పాఠ్యం — పాఠకుడు ఎంచుకున్న ఫాంట్, సైజుతోనే */}
          <Box sx={{ maxWidth: "34em" }}>
            {story.story_text.map((paragraph, i) => {
              const active = speakingPara === i;
              return (
                <Typography
                  key={i}
                  id={`para-${i}`}
                  sx={{
                    fontSize: "calc(var(--telugu-font-size, 1.125rem) * 1.15)",
                    lineHeight: 2,
                    mb: 2.5,
                    mx: -1.25,
                    px: 1.25,
                    py: 0.25,
                    borderRadius: "var(--radius-sm)",
                    bgcolor: active ? "var(--selection-bg)" : "transparent",
                    color: active ? "var(--selection-fg)" : "inherit",
                    boxShadow: active ? "inset 4px 0 0 var(--primary)" : "none",
                    transition: "background-color var(--transition-medium)",
                  }}
                >
                  {paragraph}
                </Typography>
              );
            })}
          </Box>

          {/* ముందు / తర్వాతి కథ */}
          <Box
            component="nav"
            aria-label="కథల మధ్య"
            sx={{ mt: 5, pt: 3, borderTop: "2px solid var(--accent)", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}
          >
            {prev ? <StoryLink dir="prev" title={prev.title} onClick={() => goTo(index - 1)} /> : <span />}
            {next && <StoryLink dir="next" title={next.title} onClick={() => goTo(index + 1)} />}
          </Box>
          {!next && (
            <Typography sx={{ mt: 2, color: "var(--muted-text)", lineHeight: 1.8 }}>
              ఇది ఈ మాలలో చివరి కథ. మొదటి కథకు వెళ్ళాలంటే పైన మాలలో 1 నొక్కండి.
            </Typography>
          )}
        </Box>

        {/* ---------- అన్ని కథల పట్టిక · PDF · Excel ---------- */}
        <Box component="section" aria-labelledby="smruthi-table" sx={{ mt: 8 }}>
          <Typography id="smruthi-table" component="h2" sx={{ fontFamily: display, fontSize: "1.6rem", mb: 1.5 }}>
            కథల పట్టిక
          </Typography>
          <GridSection>
            <SmruthiGrid stories={stories} />
          </GridSection>
        </Box>
      </Box>

      {/* ---------- పోస్టర్ (తెర వెలుపల; పంచుకునేటప్పుడు మాత్రమే చిత్రంగా) ---------- */}
      <Poster story={story} number={index + 1} total={total} />
    </Box>
  );
}

/* ═══════════════════════ చిన్న భాగాలు ═══════════════════════ */

function Legend({ fill, border, label }: { fill: string; border: string; label: string }) {
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box component="span" aria-hidden sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: fill, border: `2px solid ${border}` }} />
      {label}
    </Box>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  primary,
  disabled,
  sx,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  sx?: object;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      startIcon={icon}
      sx={{
        minHeight: "var(--tap-target)",
        px: 2.25,
        fontSize: "1.02rem",
        fontWeight: 800,
        textTransform: "none",
        borderRadius: "var(--radius-sm)",
        border: "2px solid",
        borderColor: primary ? "var(--primary)" : "var(--border-strong)",
        bgcolor: primary ? "var(--primary)" : "var(--surface-elevated)",
        color: primary ? "var(--background)" : "var(--foreground)",
        "& .MuiSvgIcon-root": { fontSize: "1.6rem" },
        "&:hover": { bgcolor: primary ? "var(--primary)" : "var(--surface)", filter: primary ? "brightness(1.1)" : "none" },
        "&.Mui-disabled": { color: "var(--muted-text)", bgcolor: "var(--surface)", borderColor: "var(--border-strong)" },
        "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

function StoryLink({ dir, title, onClick }: { dir: "prev" | "next"; title: string; onClick: () => void }) {
  const next = dir === "next";
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        gridColumn: next ? { sm: 2 } : undefined,
        display: "flex",
        flexDirection: next ? "row-reverse" : "row",
        alignItems: "center",
        gap: 1,
        textAlign: next ? "right" : "left",
        p: 2,
        minHeight: 72,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        borderRadius: "var(--radius)",
        border: "2px solid var(--border-strong)",
        bgcolor: "var(--surface-elevated)",
        "&:hover": { borderColor: "var(--primary)" },
        "&:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: 2 },
      }}
    >
      {next ? <ChevronRightRounded sx={{ fontSize: 34, flexShrink: 0 }} /> : <ChevronLeftRounded sx={{ fontSize: 34, flexShrink: 0 }} />}
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: "0.95rem", color: "var(--muted-text)", fontWeight: 700 }}>{next ? "తర్వాతి కథ" : "ముందు కథ"}</Box>
        <Box sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.5, overflowWrap: "anywhere" }}>{title}</Box>
      </Box>
    </Box>
  );
}

/* ═══════════════════════ పోస్టర్ ═══════════════════════ */
/* 1200×1200. రంగులు స్థిరం (dark mode లోనూ పోస్టర్ ఒకేలా). */

const P = {
  paper: "#fdfaf5",
  ink: "#241f1a",
  muted: "#574f46",
  kumkum: "#8b3a1f",
  thread: "#c9820a",
  jasmine: "#ffffff",
};

function Poster({ story, number, total }: { story: Story; number: number; total: number }) {
  return (
    <Box
      id="smruthi-poster"
      aria-hidden
      sx={{
        position: "fixed",
        left: "-12000px",
        top: 0,
        width: "1200px",
        height: "1200px",
        boxSizing: "border-box",
        bgcolor: P.paper,
        color: P.ink,
        p: "72px 84px 60px",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
      }}
    >
      {/* పైన మాల — సైట్ గుర్తు */}
      <Box sx={{ position: "relative", height: 28, mb: "36px" }}>
        <Box sx={{ position: "absolute", left: 0, right: 0, top: 13, height: 3, bgcolor: P.thread }} />
        <Box sx={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
          {Array.from({ length: 13 }, (_, i) => (
            <Box
              key={i}
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: i === 6 ? P.kumkum : P.jasmine,
                border: `3px solid ${i === 6 ? P.kumkum : P.thread}`,
                boxSizing: "border-box",
              }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ fontFamily: fontStack(POSTER_BODY_FONT), fontSize: "26px", color: P.muted, fontWeight: 700 }}>
        స్మృతిమాల: పింగళి సీతమామ జ్ఞాపకాలు, {total} కథల్లో {number}వది
      </Box>
      <Box sx={{ fontFamily: fontStack(DISPLAY_FONT), fontSize: "64px", lineHeight: 1.3, color: P.kumkum, mt: "8px" }}>{story.title}</Box>
      {story.subtitle && (
        <Box sx={{ fontFamily: fontStack(POSTER_BODY_FONT), fontSize: "30px", color: P.muted, mt: "6px", lineHeight: 1.5 }}>{story.subtitle}</Box>
      )}

      <Box sx={{ height: 3, bgcolor: P.thread, my: "32px", width: "180px" }} />

      {/* పాఠ్యం — fitPoster() సైజు సర్దుబాటు చేస్తుంది */}
      <Box data-poster-body sx={{ flex: 1, minHeight: 0, overflow: "hidden", fontFamily: fontStack(POSTER_BODY_FONT), fontSize: "30px", lineHeight: 1.75 }}>
        {story.story_text.map((p, i) => (
          <Box key={i} data-poster-para data-full={p} sx={{ mb: "0.6em" }}>
            {p}
          </Box>
        ))}
        <Box data-poster-more sx={{ display: "none", fontWeight: 700, color: P.kumkum }}>
          … పూర్తి కథ {SITE_URL} లో చదవండి
        </Box>
      </Box>

      <Box
        sx={{
          mt: "28px",
          pt: "22px",
          borderTop: `3px solid ${P.thread}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: fontStack(POSTER_BODY_FONT),
        }}
      >
        <Box sx={{ fontFamily: fontStack(DISPLAY_FONT), fontSize: "36px", color: P.ink }}>రత్నాలబాల – జ్ఞానమాల</Box>
        <Box sx={{ fontSize: "26px", color: P.muted, fontWeight: 700 }}>{SITE_URL}</Box>
      </Box>
    </Box>
  );
}

/* పోస్టర్ పాఠ్యం పెట్టెలో పట్టేలా: అక్షరం 30px నుండి 20px వరకు తగ్గించు;
   ఇంకా పట్టకపోతే చివరి పేరాలు దాచి "పూర్తి కథ వెబ్‌సైట్‌లో" చూపించు */
function fitPoster(poster: HTMLElement) {
  const body = poster.querySelector<HTMLElement>("[data-poster-body]");
  const more = poster.querySelector<HTMLElement>("[data-poster-more]");
  if (!body || !more) return;
  const paras = Array.from(body.querySelectorAll<HTMLElement>("[data-poster-para]"));
  paras.forEach((p) => {
    p.style.display = "";
    p.textContent = p.dataset.full ?? p.textContent; // ముందటి కత్తిరింపు తీసేయి
  });
  more.style.display = "none";

  const fits = () => body.scrollHeight <= body.clientHeight + 1;
  for (let size = 30; size >= 20; size -= 2) {
    body.style.fontSize = `${size}px`;
    if (fits()) return;
  }
  more.style.display = "block";
  for (let i = paras.length - 1; i > 0 && !fits(); i--) paras[i].style.display = "none";
  // ఒక్క పేరానే చాలా పొడవైతే: దాన్ని కూడా కత్తిరించు
  const first = paras[0];
  if (first && !fits()) {
    const full = first.textContent ?? "";
    let lo = 0;
    let hi = full.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      first.textContent = full.slice(0, mid);
      if (fits()) lo = mid;
      else hi = mid - 1;
    }
    first.textContent = full.slice(0, Math.max(0, full.lastIndexOf(" ", lo))) + " …";
  }
}