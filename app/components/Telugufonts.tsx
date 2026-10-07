"use client";

/* ═══════════════════════════════════════════════════════════════
   తెలుగు ఫాంట్లు — రెండు మూలాలు, ఒకే జాబితా

   1. సైట్ ఫాంట్లు: main.py నుండి మాత్రమే (/api/main?endpoint=fonts).
      ఎంచుకున్నప్పుడే ఆ ఒక్క ఫాంట్ ఫైల్ డౌన్‌లోడ్ అవుతుంది.
   2. "నా ఫాంట్లు": పాఠకుడు తన సొంత ఫాంట్ జోడించుకోవచ్చు —
      • ఫైల్ అప్‌లోడ్ (.ttf/.otf/.woff/.woff2): ఫోన్, ట్యాబ్, కంప్యూటర్ — అన్నిటిలో
      • కంప్యూటర్‌లో install అయిన ఫాంట్లు: Chrome / Edge డెస్క్‌టాప్‌లో
      ఇవి ఆ పరికరంలోనే (IndexedDB) ఉంటాయి. ఏదీ సర్వర్‌కి వెళ్ళదు.

   వాడకం:
     const { fonts } = useTeluguFonts();         // రెండూ కలిపి
     await loadTeluguFont(value);                // ఎంచుకున్నప్పుడు
     style={{ fontFamily: fontStack(value) }}
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

export type FontSource = { url: string; format: string };

export type FontKind = "site" | "upload" | "device";

export type TeluguFontInfo = {
  /** Stable id for saved choices, e.g. "mandali-regular" */
  id: string;
  /** Name shown in pickers */
  label: string;
  /** CSS font-family name */
  value: string;
  src: FontSource[];
  weight: number;
  style: "normal" | "italic";
  features?: string;
  /** site = from main.py · upload = reader's file · device = installed on their computer */
  kind?: FontKind;
};

/** Must match DEFAULT_FONT in api/main.py */
export const DEFAULT_FONT = "Dhurjati";

/** Telugu-capable system fonts, so text never shows as boxes */
const FALLBACK = 'var(--font-telugu-fallback, "Noto Sans Telugu", "Nirmala UI", "Gautami"), system-ui, sans-serif';

/** CSS font-family value with Telugu fallbacks */
export const fontStack = (value: string) => `"${value.replace(/"/g, "")}", ${FALLBACK}`;

/* ─────────────────────────────────────────────────────────────── */
/* COMBINED LIST + LISTENERS                                         */
/* ─────────────────────────────────────────────────────────────── */

let listCache: TeluguFontInfo[] | null = null; // site fonts (main.py)
let listRequest: Promise<TeluguFontInfo[] | null> | null = null;
let userFonts: TeluguFontInfo[] = []; // "నా ఫాంట్లు" (this device only)

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** My fonts first, then the site's */
export const allFonts = (): TeluguFontInfo[] => [...userFonts, ...(listCache ?? [])];

export function findFont(valueOrId: string): TeluguFontInfo | undefined {
  return allFonts().find((f) => f.value === valueOrId || f.id === valueOrId);
}

/* ─────────────────────────────────────────────────────────────── */
/* SITE FONTS — from main.py, retried, cached for the visit          */
/* ─────────────────────────────────────────────────────────────── */

function isFontInfo(f: unknown): f is TeluguFontInfo {
  const x = f as Partial<TeluguFontInfo> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.label === "string" &&
    typeof x.value === "string" &&
    x.value !== "" &&
    Array.isArray(x.src) &&
    x.src.length > 0 &&
    x.src.every((s) => s && typeof s.url === "string" && s.url.startsWith("/Fonts/"))
  );
}

/** Accepts the fonts API reply, or the font_agent reply's `fonts` field */
export function setFontListFromApi(data: unknown): boolean {
  if (!Array.isArray(data) || data.length === 0 || !data.every(isFontInfo)) return false;
  listCache = data.map((f) => ({ ...f, kind: "site" as const }));
  notify();
  return true;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Site list; null only if every attempt failed (try again later). */
export function fetchTeluguFonts(): Promise<TeluguFontInfo[] | null> {
  if (listCache) return Promise.resolve(listCache);
  listRequest ??= (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // 8s, 12s, 16s — slow phones / cold server get more time
        const res = await fetchWithTimeout("/api/main?endpoint=fonts", 8000 + attempt * 4000);
        if (res.ok && setFontListFromApi(await res.json())) return listCache;
      } catch {
        /* network / timeout — retry */
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    listRequest = null; // allow a later retry
    return null;
  })();
  return listRequest;
}

export const getCachedFonts = () => listCache;

/* ─────────────────────────────────────────────────────────────── */
/* LOAD — inject @font-face for one font, only when it's needed      */
/* ─────────────────────────────────────────────────────────────── */

const injected = new Set<string>();

function styleSheet(): HTMLStyleElement {
  let el = document.getElementById("telugu-fonts-dynamic") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "telugu-fonts-dynamic";
    document.head.appendChild(el);
  }
  return el;
}

function inject(font: TeluguFontInfo) {
  // Installed computer fonts need no @font-face: the name alone works
  if (font.kind === "device" || injected.has(font.value)) return;
  injected.add(font.value);
  const src = font.src.map((s) => `url("${s.url}") format("${s.format}")`).join(", ");
  const features = font.features ? `font-feature-settings:${font.features};` : "";
  // A text node (not insertRule/FontFace) so html-to-image can read it
  // and embed the font in poster / PDF exports
  styleSheet().appendChild(
    document.createTextNode(
      `@font-face{font-family:"${font.value}";src:${src};font-weight:${font.weight};font-style:${font.style};font-display:swap;${features}}\n`
    )
  );
}

/**
 * Makes one font available on the page and waits until it can draw
 * Telugu. Returns false if the font is unknown or its file failed.
 * Safe to call many times; the file is only fetched once.
 */
export async function loadTeluguFont(value: string): Promise<boolean> {
  if (typeof document === "undefined") return false;

  let font = findFont(value);
  if (!font) {
    await Promise.all([fetchTeluguFonts(), restoreUserFonts()]);
    font = findFont(value);
  }
  if (!font) return false;
  if (font.kind === "device") return true;

  inject(font);
  try {
    const faces = await Promise.race([
      document.fonts.load(`${font.style} ${font.weight} 1em "${font.value}"`, "అ"),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (faces === null) return true; // slow network: swap will show it when it arrives
    return faces.length > 0;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/* "నా ఫాంట్లు" — the reader's own fonts, kept on this device only   */
/* ═══════════════════════════════════════════════════════════════ */

const DB_NAME = "ratnalabala-fonts";
const STORE = "fonts";
export const MAX_FONT_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_USER_FONTS = 20;

type StoredFont = {
  id: string;
  label: string;
  value: string;
  kind: "upload" | "device";
  data?: ArrayBuffer; // upload only
  format?: string; // upload only
  added: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbRun<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

const blobUrls = new Map<string, string>();

function toInfo(s: StoredFont): TeluguFontInfo {
  let src: FontSource[] = [];
  if (s.kind === "upload" && s.data) {
    // blob: URL (not FontFace) so poster / PDF exports can embed it too
    let url = blobUrls.get(s.id);
    if (!url) {
      url = URL.createObjectURL(new Blob([s.data], { type: `font/${s.format ?? "ttf"}` }));
      blobUrls.set(s.id, url);
    }
    src = [{ url, format: FORMAT_CSS[s.format ?? "ttf"] ?? "truetype" }];
  }
  return { id: s.id, label: s.label, value: s.value, src, weight: 400, style: "normal", kind: s.kind };
}

let restored: Promise<void> | null = null;

/** Loads "నా ఫాంట్లు" from this device once per visit. Never throws. */
export function restoreUserFonts(): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();
  restored ??= (async () => {
    try {
      const rows = await dbRun<StoredFont[]>("readonly", (st) => st.getAll() as IDBRequest<StoredFont[]>);
      userFonts = rows.sort((a, b) => b.added - a.added).map(toInfo);
      notify();
    } catch {
      /* private browsing / storage blocked — the feature just isn't saved */
    }
  })();
  return restored;
}

async function saveUserFont(s: StoredFont) {
  try {
    await dbRun("readwrite", (st) => st.put(s));
  } catch {
    /* storage blocked: font works for this visit only */
  }
  userFonts = [toInfo(s), ...userFonts.filter((f) => f.id !== s.id)];
  notify();
}

export async function removeUserFont(id: string) {
  try {
    await dbRun("readwrite", (st) => st.delete(id));
  } catch {
    /* ignore */
  }
  const url = blobUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  blobUrls.delete(id);
  userFonts = userFonts.filter((f) => f.id !== id);
  notify();
}

export const getUserFonts = () => userFonts;

/* ---------- does a font actually draw Telugu? ---------- */

/**
 * Draws Telugu text with the font and with two plain fallbacks. If the
 * widths always match a fallback, the font has no Telugu letters (the
 * browser silently used another font). A quick, good-enough check.
 */
export function fontHasTelugu(family: string): boolean {
  if (typeof document === "undefined") return true;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return true;
  const sample = "తెలుగు అక్షరమాల క్షేమం";
  return ["monospace", "serif"].some((generic) => {
    ctx.font = `40px ${generic}`;
    const base = ctx.measureText(sample).width;
    ctx.font = `40px "${family.replace(/"/g, "")}", ${generic}`;
    return Math.abs(ctx.measureText(sample).width - base) > 0.5;
  });
}

/* ---------- 1. upload a font file (every device) ---------- */

const FORMAT_CSS: Record<string, string> = { ttf: "truetype", otf: "opentype", woff: "woff", woff2: "woff2" };

/** Reads the first bytes: is this really a font file, and which kind? */
function sniffFormat(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf.slice(0, 4));
  const tag = String.fromCharCode(...b);
  if (tag === "wOF2") return "woff2";
  if (tag === "wOFF") return "woff";
  if (tag === "OTTO") return "otf";
  if (tag === "true" || (b[0] === 0 && b[1] === 1 && b[2] === 0 && b[3] === 0)) return "ttf";
  return null;
}

export type AddFontResult =
  | { ok: true; font: TeluguFontInfo; hasTelugu: boolean }
  | { ok: false; error: string };

export async function addFontFile(file: File): Promise<AddFontResult> {
  if (file.size > MAX_FONT_BYTES) return { ok: false, error: "ఫైల్ చాలా పెద్దది (గరిష్ఠం 20 MB)." };
  if (userFonts.length >= MAX_USER_FONTS)
    return { ok: false, error: `గరిష్ఠం ${MAX_USER_FONTS} సొంత ఫాంట్లు. ఒకటి తీసేసి మళ్ళీ ప్రయత్నించండి.` };

  const data = await file.arrayBuffer();
  const format = sniffFormat(data);
  if (!format) return { ok: false, error: "ఇది ఫాంట్ ఫైల్ కాదు. .ttf, .otf, .woff లేదా .woff2 ఫైల్ ఎంచుకోండి." };

  const label = file.name.replace(/\.(ttf|otf|woff2?)$/i, "").trim() || "నా ఫాంట్";
  const id = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  // Own name space, so it can never clash with a site or system font
  const value = `RB-My-${id}`;

  const stored: StoredFont = { id, label, value, kind: "upload", data, format, added: Date.now() };
  const info = toInfo(stored);

  // Load it first: a broken file must not be saved
  inject(info);
  try {
    const faces = await document.fonts.load(`1em "${value}"`, "అ");
    if (faces.length === 0) throw new Error("not loaded");
  } catch {
    return { ok: false, error: "ఈ ఫాంట్ ఫైల్ తెరవలేకపోయాం. వేరే ఫైల్ ప్రయత్నించండి." };
  }

  await saveUserFont(stored);
  return { ok: true, font: info, hasTelugu: fontHasTelugu(value) };
}

/* ---------- 2. fonts installed on the computer (Chrome / Edge desktop) ---------- */

type LocalFontData = { family: string };
type QueryLocalFonts = () => Promise<LocalFontData[]>;

export const supportsDeviceFonts = () =>
  typeof window !== "undefined" && typeof (window as Window & { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts === "function";

export type DeviceFontsResult =
  | { ok: true; telugu: string[]; others: string[] }
  | { ok: false; error: string };

/** Asks permission once, then lists installed font families (Telugu ones first). */
export async function listDeviceFonts(): Promise<DeviceFontsResult> {
  if (!supportsDeviceFonts()) {
    return { ok: false, error: "ఈ బ్రౌజర్ కంప్యూటర్ ఫాంట్లను చూపించదు. ఫాంట్ ఫైల్ అప్‌లోడ్ చేయండి." };
  }
  try {
    const query = (window as Window & { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts!;
    const families = [...new Set((await query()).map((f) => f.family))].sort((a, b) => a.localeCompare(b));
    const telugu: string[] = [];
    const others: string[] = [];
    for (const fam of families) (fontHasTelugu(fam) ? telugu : others).push(fam);
    return { ok: true, telugu, others };
  } catch (e) {
    const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
    return {
      ok: false,
      error: denied
        ? "అనుమతి ఇవ్వలేదు. బ్రౌజర్ అడ్రస్ బార్‌లోని 🔒 గుర్తు నుండి \"Fonts\" అనుమతి ఇవ్వండి."
        : "కంప్యూటర్ ఫాంట్లు చదవలేకపోయాం. ఫాంట్ ఫైల్ అప్‌లోడ్ చేయండి.",
    };
  }
}

export async function addDeviceFont(family: string): Promise<TeluguFontInfo> {
  const existing = userFonts.find((f) => f.kind === "device" && f.value === family);
  if (existing) return existing;
  const stored: StoredFont = {
    id: `device-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: family,
    value: family,
    kind: "device",
    added: Date.now(),
  };
  await saveUserFont(stored);
  return toInfo(stored);
}

/* ─────────────────────────────────────────────────────────────── */
/* REACT HOOK                                                        */
/* ─────────────────────────────────────────────────────────────── */

/** My fonts + site fonts, for pickers. Retries when the network comes back. */
export function useTeluguFonts() {
  const [fonts, setFonts] = useState<TeluguFontInfo[]>(allFonts);
  const [loading, setLoading] = useState(!listCache);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const onChange = () => {
      if (!alive) return;
      setFonts(allFonts());
      if (listCache) {
        setLoading(false);
        setFailed(false);
      }
    };
    listeners.add(onChange);
    void restoreUserFonts();

    const load = () => {
      if (listCache) return onChange();
      setLoading(true);
      fetchTeluguFonts().then((list) => {
        if (!alive) return;
        if (list) onChange();
        else {
          setLoading(false);
          setFailed(true);
        }
      });
    };
    load();

    const retry = () => {
      if (!listCache) load();
    };
    const onVisible = () => document.visibilityState === "visible" && retry();
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      listeners.delete(onChange);
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const retry = () => {
    if (listCache) return;
    setLoading(true);
    setFailed(false);
    fetchTeluguFonts().then((list) => {
      if (!list) {
        setLoading(false);
        setFailed(true);
      }
    });
  };

  return { fonts, loading, failed, retry };
}