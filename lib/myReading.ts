export type ReadingKind = "module" | "poem" | "story" | "verse" | "proverb";

export type ReadingRecord = {
  id: string;
  kind: ReadingKind;
  title: string;
  module: string;
  href: string;
  favorite: boolean;
  openCount: number;
  readingSeconds: number;
  lastReadAt: number;
  favoriteAt?: number;
};

export type ReadingEntryInput = Pick<ReadingRecord, "id" | "kind" | "title" | "module" | "href">;

const DB_NAME = "ratnalabala-my-reading";
const STORE_NAME = "entries";
const DB_VERSION = 1;
const CHANGE_EVENT = "ratnalabala:my-reading-changed";

let dbPromise: Promise<IDBDatabase> | null = null;

function openReadingDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function createRecord(entry: ReadingEntryInput): ReadingRecord {
  return {
    ...entry,
    favorite: false,
    openCount: 0,
    readingSeconds: 0,
    lastReadAt: 0,
  };
}

async function updateRecord(
  entry: ReadingEntryInput,
  update: (current: ReadingRecord) => ReadingRecord
): Promise<ReadingRecord> {
  const db = await openReadingDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(entry.id);
    let updated: ReadingRecord;

    request.onsuccess = () => {
      updated = update({ ...createRecord(entry), ...(request.result ?? {}), ...entry });
      store.put(updated);
    };
    transaction.oncomplete = () => {
      window.dispatchEvent(new Event(CHANGE_EVENT));
      resolve(updated);
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function recordEntryOpen(entry: ReadingEntryInput) {
  return updateRecord(entry, (current) => ({
    ...current,
    openCount: current.openCount + 1,
    lastReadAt: Date.now(),
  }));
}

export async function addReadingTime(entry: ReadingEntryInput, seconds: number) {
  if (seconds <= 0) return;
  return updateRecord(entry, (current) => ({
    ...current,
    readingSeconds: current.readingSeconds + seconds,
    lastReadAt: Date.now(),
  }));
}

export async function setEntryFavorite(entry: ReadingEntryInput, favorite: boolean) {
  return updateRecord(entry, (current) => ({
    ...current,
    favorite,
    favoriteAt: favorite ? Date.now() : undefined,
  }));
}

export async function getReadingRecords(): Promise<ReadingRecord[]> {
  const db = await openReadingDb();

  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as ReadingRecord[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getReadingRecord(id: string): Promise<ReadingRecord | undefined> {
  const db = await openReadingDb();

  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as ReadingRecord | undefined);
    request.onerror = () => reject(request.error);
  });
}

export function subscribeToReadingChanges(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}