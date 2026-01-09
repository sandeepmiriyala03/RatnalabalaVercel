import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);


    const key = searchParams.get("key") || "shatakamupoems";

    const poemsDir = path.join(process.cwd(), key);

    if (!fs.existsSync(poemsDir)) {
      return NextResponse.json(
        { error: `Poems directory not found: ${key}` },
        { status: 404 }
      );
    }

    const files = fs.readdirSync(poemsDir);
    const poemsMap: Record<string, string> = {};

    files.forEach((file) => {
      if (!file.endsWith(".md")) return;

      const filePath = path.join(poemsDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");

      const { data, content } = matter(fileContent);
      const title = (data.title || "").trim();
      const poemText = content.trim();

      if (title && poemText) {
        poemsMap[title] = poemText;
      }
    });

    return NextResponse.json({
      success: true,
      key,
      total: Object.keys(poemsMap).length,
      poems: poemsMap
    });
  } catch (error) {
    console.error("Error loading poems:", error);
    return NextResponse.json(
      { error: "Failed to load poems" },
      { status: 500 }
    );
  }
}
