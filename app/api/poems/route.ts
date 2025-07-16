import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function GET() {
  const dir = path.join(process.cwd(), "content/poems");
  const files = fs.readdirSync(dir);
  const poems = files.map((file) => {
    const md = fs.readFileSync(path.join(dir, file), "utf8");
    const { data } = matter(md);
    return {
      slug: file.replace(".md", ""),
      title: data.title,
      author: data.author,
    };
  });

  return Response.json({ poems });
}
