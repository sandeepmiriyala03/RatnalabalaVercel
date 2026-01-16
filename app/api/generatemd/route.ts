import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "DasarathiKaruNapaYonidhi.txt");
    const outputDir = path.join(process.cwd(), "DasarathiKaruNapaYonidhi");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, "utf-8");

    // normalize line endings
    content = content.replace(/\r/g, "").trim();

    /**
     * 🔑 Split by verse numbers like 001, 002, ... 103
     * Keep the number with the poem
     */
    const poems = content
      .split(/\n(?=\d{3}\n)/g)
      .map(p => p.trim())
      .filter(p => p.length > 50);

    poems.forEach((poem, index) => {
      const verseNumberMatch = poem.match(/^(\d{3})/);
      const verse = verseNumberMatch ? verseNumberMatch[1] : `${index + 1}`;

      const md = `---
title: " దాశరథీ శతకము  – పద్యం ${verse}"
verse: ${verse}
author: "భద్రాచల రామదాసు"
---

${poem}
`;

      fs.writeFileSync(
        path.join(outputDir, `${verse}.md`),
        md,
        "utf-8"
      );
    });

    return new Response(
      JSON.stringify({
        success: true,
        poemsGenerated: poems.length,
        message:
          poems.length === 103
            ? "✅ PERFECT: 103 పద్యాలు సరిగా జనరేట్ అయ్యాయి"
            : `⚠️ Generated ${poems.length}, expected 103`,
      }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
