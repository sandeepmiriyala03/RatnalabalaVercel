import fs from "fs";
import path from "path";

export async function GET() {
  const imagesDir = path.join(process.cwd(), "public/images");
  let files: string[] = [];

  if (fs.existsSync(imagesDir)) {
    files = fs.readdirSync(imagesDir).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
    });
  }

  return Response.json({ images: files });
}
