import fs from "fs";
import path from "path";

function getFiles(dir: string, prefix: string) {
  const result: Record<string, string> = {};
  const fullPath = path.join(process.cwd(), "public", dir);

  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    for (const file of files) {
      const base = path.parse(file).name;
      result[base] = `/${dir}/${file}`;
    }
  }

  return result;
}

export async function GET() {
  const images = getFiles("images", "/images");
  const audio = getFiles("audio", "/audio");
  const video = getFiles("video", "/video");

  // Merge by base name
  const names = new Set([
    ...Object.keys(images),
    ...Object.keys(audio),
    ...Object.keys(video),
  ]);

  const mediaItems = Array.from(names).map((name) => ({
    name,
    image: images[name] || null,
    audio: audio[name] || null,
    video: video[name] || null,
  }));

  return Response.json({ mediaItems });
}
