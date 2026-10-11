"use client";

/* ═══════════════════════════════════════════════════════════════
   స్వరం — పేజీ అంతటా ఒకే నియమాలు (అక్షరం కార్డులు, AI పదాలు)

   1. ఒకసారి ఒక్క స్వరమే: ఎవరైనా మాట్లాడటం మొదలుపెడితే announceVoice(),
      మిగతావారు onOtherVoice() తో విని తమ స్వరం ఆపుతారు.
   2. iPhone: సర్వర్ జవాబు కోసం await చేశాక play() ని Safari ఆపుతుంది.
      unlockAudio() ను నొక్కిన క్షణంలోనే పిలిస్తే ఆ audio తెరుచుకుంటుంది.
   3. పరికరం స్వరం: తెలుగు స్వరం ఉంటేనే వాడాలి (లేకపోతే ఇంగ్లీష్‌లో తప్పుగా చదువుతుంది).
   ═══════════════════════════════════════════════════════════════ */

export type VoiceKind = "male" | "female" | "family";

/** TTS server gets this long; then the device's own Telugu voice is used */
export const TTS_TIMEOUT_MS = 12000;

const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/** Call inside the tap, before any await. Returns the (reusable) audio element. */
export function unlockAudio(existing: HTMLAudioElement | null): HTMLAudioElement {
  const audio = existing ?? new Audio();
  audio.src = SILENT_WAV;
  void audio.play().catch(() => {});
  return audio;
}

/* ---------- one voice at a time, across components ---------- */

const VOICE_EVENT = "rb-voice-start";

/** Tell every other speaker on the page to stop */
export function announceVoice(owner: string) {
  window.dispatchEvent(new CustomEvent<string>(VOICE_EVENT, { detail: owner }));
}

/** Run `stop` whenever someone else starts speaking. Returns an unsubscribe. */
export function onOtherVoice(owner: string, stop: () => void): () => void {
  const handler = (e: Event) => {
    if ((e as CustomEvent<string>).detail !== owner) stop();
  };
  window.addEventListener(VOICE_EVENT, handler);
  return () => window.removeEventListener(VOICE_EVENT, handler);
}

/* ---------- device voice ---------- */

/** Chrome fills the voice list a moment after load — wait for it (max 1.5 s) */
function deviceVoices(): Promise<SpeechSynthesisVoice[]> {
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1500);
  });
}

/** A Telugu voice of the chosen kind if the device has one, else any Telugu voice, else null */
export async function pickTeluguVoice(kind: VoiceKind): Promise<SpeechSynthesisVoice | null> {
  if (!("speechSynthesis" in window)) return null;
  const te = (await deviceVoices()).filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("te"));
  if (!te.length) return null;
  // Edge: Shruti = female, Mohan = male. "male" must not match "female".
  const want = kind === "male" ? /(^|[^e])male|mohan|\bman\b|పురుష/i : /female|shruti|woman|స్త్రీ/i;
  return te.find((v) => want.test(v.name)) ?? te[0];
}

export const NO_TELUGU_VOICE = "సర్వర్ స్వరం అందలేదు, ఈ పరికరంలో తెలుగు స్వరం కూడా లేదు. ఇంటర్నెట్ చూసి మళ్ళీ నొక్కండి.";