import { openDb } from "./nativeIndexedDb";

export async function cacheAllPoems(poems: Record<string, string>) {
  const db = await openDb();
  const tx = db.transaction("poems", "readwrite");
  const store = tx.objectStore("poems");

  for (const [title, content] of Object.entries(poems)) {
    store.put({
      id: title,
      title,
      content,
    });
  }

  await new Promise((res, rej) => {
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });

  db.close();
}
