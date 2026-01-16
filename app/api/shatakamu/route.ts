import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ❗ IMPORTANT: keep this list in sync with POETRY_COLLECTIONS (except "all")
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
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    // ✅ CASE 1: ALL poems
    if (key === "all") {
      const poemsMap: Record<string, string> = {};
      let total = 0;

      for (const folder of POETRY_FOLDERS) {
        const poemsDir = path.join(process.cwd(), folder);

        if (!fs.existsSync(poemsDir)) continue;

        const files = fs.readdirSync(poemsDir);

        files.forEach((file) => {
          if (!file.endsWith(".md")) return;

          const filePath = path.join(poemsDir, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");

          const { data, content } = matter(fileContent);
          const title = (data.title || "").trim();
          const poemText = content.trim();

          if (title && poemText) {
            // 🔑 Prefix folder name to avoid title collisions
            const uniqueTitle = `${folder} – ${title}`;
            poemsMap[uniqueTitle] = poemText;
            total++;
          }
        });
      }

      return NextResponse.json({
        success: true,
        key: "all",
        total,
        poems: poemsMap,
      });
    }

    // ✅ CASE 2: Single collection (existing behavior)
    const poemsDir = path.join(process.cwd(), key || "");

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
      poems: poemsMap,
    });
  } catch (error) {
    console.error("Error loading poems:", error);
    return NextResponse.json(
      { error: "Failed to load poems" },
      { status: 500 }
    );
  }
}
