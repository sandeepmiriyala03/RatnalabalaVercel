/**
 * Anonymous usage tracking for the Aksharamala page.
 *
 * Events are queued in memory and sent in ONE request every 15 seconds,
 * or when the page is hidden/closed (sendBeacon). The server
 * (api/aksharamala.py ?endpoint=track) stores them in api_usage_log with
 * api_name "ui:aksharamala" and event_type "UI_EVENT".
 *
 * Nothing personal is sent: no names, no typed text, no IDs.
 * Tracking can never break the page — every error is swallowed.
 */

export type UiEventName =
  | "letter_open"
  | "speak"
  | "pronunciation"
  | "trace_check"
  | "ai_word_speak"
  | "family_record"
  | "family_voice_on"
  | "search"
  | "how_it_works";

type UiEvent = {
  name: UiEventName;
  /** The Telugu letter involved, if any */
  letter?: string;
  /** Short ASCII detail, e.g. "female" or "c82-p75" */
  detail?: string;
  /** For practice results: passed or not */
  success?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "/api";
const TRACK_URL = `${API_BASE}/aksharamala?endpoint=track`;
const FLUSH_INTERVAL_MS = 15000;
const MAX_BATCH = 50;

let queue: UiEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listenersAdded = false;

function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  // Respect the browser's "Do Not Track" setting
  const dnt = (navigator as any).doNotTrack ?? (window as any).doNotTrack;
  return dnt !== "1" && dnt !== "yes";
}

function send(batch: UiEvent[], useBeacon: boolean) {
  // text/plain keeps the request "simple", so it also works if the API
  // lives on another domain (no CORS preflight needed)
  const body = JSON.stringify({ events: batch });
  try {
    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(TRACK_URL, blob)) return;
    }
    fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore — tracking is best effort */
  }
}

export function flushEvents(useBeacon = false) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  while (queue.length > 0) {
    send(queue.splice(0, MAX_BATCH), useBeacon);
  }
}

function addListeners() {
  if (listenersAdded) return;
  listenersAdded = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents(true);
  });
  window.addEventListener("pagehide", () => flushEvents(true));
}

/** Records one event. Cheap to call; nothing is sent immediately. */
export function track(name: UiEventName, data: Omit<UiEvent, "name"> = {}) {
  if (!trackingAllowed()) return;
  try {
    queue.push({ name, ...data });
    addListeners();
    if (queue.length >= MAX_BATCH) {
      flushEvents();
    } else if (!timer) {
      timer = setTimeout(() => flushEvents(), FLUSH_INTERVAL_MS);
    }
  } catch {
    /* ignore */
  }
}