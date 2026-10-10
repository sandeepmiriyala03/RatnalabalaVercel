/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — ఈ పరికరంలోనే సేవ్ (IndexedDB) + చిత్రం / సంగీతం చదవడం

   localStorage కి 5 MB పరిమితి — చిత్రాలు పట్టవు. అందుకే IndexedDB.
   ఏదీ సర్వర్‌కి వెళ్ళదు. Private browsing లో సేవ్ కాకపోయినా పని ఆగదు.
   ═══════════════════════════════════════════════════════════════ */

import type { Project } from "./model";

const DB = "ratnalabala-khatimala";
const STORE = "kv";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
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

export async function loadSaved<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    return ((await run("readonly", (s) => s.get(key))) as T) ?? null;
  } catch {
    return null;
  }
}

export async function save(key: string, value: unknown): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    await run("readwrite", (s) => s.put(value, key));
    return true;
  } catch {
    return false;
  }
}

export const saveProject = (p: Project) => save("project", p);
export const loadProject = () => loadSaved<Project>("project");

export type Music = { name: string; blob: Blob };
export const MAX_MUSIC = 30 * 1024 * 1024;
export const saveMusic = (m: Music | null) => save("music", m);
export const loadMusic = () => loadSaved<Music>("music");

/* ─────────────────────────────────────────────────────────────── */
/* PICTURES — shrink big phone photos (keeps saving + PDFs light)    */
/* ─────────────────────────────────────────────────────────────── */

export type Picture = { src: string; iw: number; ih: number };

export async function readPicture(file: File, maxSide = 2000): Promise<Picture> {
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const png = file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp";
    if (!png) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0, w, h);
    // PNG keeps transparent logos; photos become JPEG (much smaller)
    const src = png ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.88);
    const finalSrc = png && src.length > 2_500_000 ? c.toDataURL("image/jpeg", 0.88) : src;
    c.width = c.height = 0;
    return { src: finalSrc, iw: w, ih: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
