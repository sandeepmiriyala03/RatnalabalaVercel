/**
 * Family voice ("అమ్మ గొంతుతో అక్షరమాల") — recordings stay on this device.
 *
 * Each letter's recording is stored in IndexedDB (works in all modern
 * browsers and inside the installed PWA / Android TWA). Nothing is uploaded.
 */

export type FamilyRecording = {
  letter: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  updatedAt: number;
};

const DB_NAME = "ratnalabala-family-voice";
const DB_VERSION = 1;
const STORE = "recordings";
const NAME_KEY = "ratnalabala.familyVoiceName";

/** Fired on window whenever recordings or the voice name change. */
export const FAMILY_VOICE_EVENT = "family-voice-changed";

/** TTS voice used for letters that haven't been recorded yet. */
export const FAMILY_FALLBACK_VOICE: "male" | "female" = "female";

/** Longest recording allowed; keeps files small ("అ… అరటి" needs ~2–4 s). */
export const MAX_RECORDING_MS = 8000;

/* ================= IndexedDB ================= */

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "letter" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("IndexedDB open was blocked."));
    }).catch((error) => {
      dbPromise = null; // allow a retry later
      throw error;
    });
  }
  return dbPromise;
}

function runRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        let result: T;
        request.onsuccess = () => {
          result = request.result;
        };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error ?? request.error);
        tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
      })
  );
}

function notifyChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FAMILY_VOICE_EVENT));
  }
}

export async function getRecording(letter: string): Promise<FamilyRecording | null> {
  try {
    const rec = await runRequest<FamilyRecording | undefined>("readonly", (s) => s.get(letter));
    return rec ?? null;
  } catch {
    return null;
  }
}

export async function saveRecording(rec: FamilyRecording): Promise<void> {
  await runRequest("readwrite", (s) => s.put(rec));
  notifyChanged();
}

export async function deleteRecording(letter: string): Promise<void> {
  await runRequest("readwrite", (s) => s.delete(letter));
  notifyChanged();
}

export async function clearAllRecordings(): Promise<void> {
  await runRequest("readwrite", (s) => s.clear());
  notifyChanged();
}

/** Letters that have a recording (keys only — doesn't load the audio). */
export async function listRecordedLetters(): Promise<string[]> {
  try {
    const keys = await runRequest<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
    return keys.map(String);
  } catch {
    return [];
  }
}

/* ================= Voice name (e.g. అమ్మమ్మ) ================= */

export function getFamilyVoiceName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setFamilyVoiceName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 30));
  } catch {
    /* storage blocked (private mode) — the name just isn't remembered */
  }
  notifyChanged();
}

/* ================= Device helpers ================= */

/**
 * Asks the browser not to auto-delete our data when the device is low on
 * space. Browsers may say no (then data is kept "best effort"), but on an
 * installed PWA it is usually granted.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* not supported */
  }
  return false;
}

/** True if this browser can record audio at all. */
export function canRecordAudio(): boolean {
  return (
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== "undefined"
  );
}

/**
 * Picks an audio format the browser can both record and play back.
 * Chrome/Android/Edge → webm/opus, Safari/iOS → mp4 (AAC).
 */
export function pickRecordingMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });
}