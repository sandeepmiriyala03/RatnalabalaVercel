// AGENTS.md → see "FeaturedContent Component Rules"
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POETRY_FOLDERS = [
  "Jandhyala",
  "Sumati",
  "SriKalahastheeswara",
  "KrishnaSatakam",
  "NarayanaSatakam",
  "Annamacharya",
  "ShivanandaLahari",
  "RamachandraPrabhu",
  "YajnavalkyaSatakam",
  "DasarathiKaruNapaYonidhi",
  "TeaShatakam",
];

export async function GET() {
  try {
    const randomFolder =
      POETRY_FOLDERS[Math.floor(Math.random() * POETRY_FOLDERS.length)];
    const poemsDir = path.join(process.cwd(), "content", randomFolder);

    if (!fs.existsSync(poemsDir)) {
      return NextResponse.json({ error: "No content found" }, { status: 404 });
    }

    const files = fs.readdirSync(poemsDir).filter((f) => f.endsWith(".md"));
    if (files.length === 0) {
      return NextResponse.json({ error: "No poems found" }, { status: 404 });
    }

    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(poemsDir, randomFile);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return NextResponse.json({
      category: "poem",
      title: (data.title || randomFile.replace(".md", "")).trim(),
      text: content.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[featured-content] failed:", error);
    return NextResponse.json(
      { error: "Failed to load featured content" },
      { status: 500 }
    );
  }
}