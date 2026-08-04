import fs from "fs";
import path from "path";

function getFiles(dir: string) {
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
 
  const audio = getFiles("audio");
  const video = getFiles("video");

  const names = new Set([
     ...Object.keys(audio),
    ...Object.keys(video),
  ]);

  const mediaItems = Array.from(names).map((name) => ({
    name,
   
    audio: audio[name] || null,
    video: video[name] || null,
  }));

  return Response.json({ mediaItems });
}
