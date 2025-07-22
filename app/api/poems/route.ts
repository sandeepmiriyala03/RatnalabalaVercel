import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function GET() {
  try {
    const poemsDir = path.join(process.cwd(), "poems");
    const files = fs.readdirSync(poemsDir);

    const uniquePoemsMap = new Map(); // Using a Map to store unique poems by title

    files.forEach((file) => {
      const filePath = path.join(poemsDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");

      const { data, content } = matter(fileContent);

      const title = data.title || "అజ్ఞాత శీర్షిక";
      const slug = file.replace(/\.md$/, "");


      uniquePoemsMap.set(title, {
        title,
        slug,
        content,
      });
    });

    // Convert the Map values back to an array
    const poems = Array.from(uniquePoemsMap.values());
     poems.sort((a, b) => a.title.localeCompare(b.title, 'te', { sensitivity: 'base' }));

    return NextResponse.json(poems);
  } catch (error) {
    console.error("Error loading poems:", error);
    return NextResponse.json({ error: "Failed to load poems." }, { status: 500 });
  }
}