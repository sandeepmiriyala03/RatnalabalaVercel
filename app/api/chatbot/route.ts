import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function POST(req: Request) {
  const body = await req.json();
  const question = body.question?.toLowerCase();

  const dir = path.join(process.cwd(), "content/chatbot");
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const slug = file.replace(".md", "");
    if (question.includes(slug)) {
      const md = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(md);
      return Response.json({
        type: data.type || "text",
        file: data.file || null,
        text: content,
      });
    }
  }

  return Response.json({
    type: "text",
    text: "క్షమించండి, మీ సందేశం నాకు అర్థం కాలేదు.",
  });
}
