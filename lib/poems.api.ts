export async function fetchPoemsByAuthor(author: string) {
  const res = await fetch(`/api/poems/${author}`);

  if (!res.ok) {
    throw new Error("Failed to load poems");
  }

  return res.json() as Promise<Record<string, string>>;
}
