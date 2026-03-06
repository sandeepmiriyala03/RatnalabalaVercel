import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function GET() {

  try {

    const poemsDir = path.join(process.cwd(), "poems");

    const files = fs.readdirSync(poemsDir)
      .filter(file => file.endsWith(".md"));

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No poems found" },
        { status: 404 }
      );
    }

    const randomFile =
      files[Math.floor(Math.random() * files.length)];

    const filePath = path.join(poemsDir, randomFile);

    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data, content } = matter(fileContent);

    const title = data.title || randomFile.replace(".md", "");

    return NextResponse.json({
      title,
      poem: content.trim()
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Random poem error" },
      { status: 500 }
    );

  }

}