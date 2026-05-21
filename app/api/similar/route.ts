import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export async function POST(req: Request) {

  try {

    const poemsDir = path.join(process.cwd(), "poems");

    const files = fs.readdirSync(poemsDir)
      .filter(file => file.endsWith(".md"));

    const randomFile =
      files[Math.floor(Math.random() * files.length)];

    const filePath = path.join(poemsDir, randomFile);

    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { data, content } = matter(fileContent);

    return NextResponse.json({
      result: `${data.title}\n\n${content.trim()}`
    });

  } catch (error) {

    return NextResponse.json(
      { error: "Similar poem error" },
      { status: 500 }
    );

  }

}