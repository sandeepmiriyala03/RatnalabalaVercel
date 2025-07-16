import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function collectImages() {
  const contentDirs = ["content/poems", "content/chatbot"];
  const images: string[] = [];

  for (const dir of contentDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) continue;

    const files = fs.readdirSync(fullPath);

    for (const file of files) {
      if (path.extname(file) !== ".md") continue;

      const filePath = path.join(fullPath, file);
      const mdContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(mdContent);

      if (data.image) {
        images.push(data.image);
      }
    }
  }

  return images;
}
