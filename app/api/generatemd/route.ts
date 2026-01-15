import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "GnanaBhaskara.txt");
    const outputDir = path.join(process.cwd(), "YajnavalkyaSatakam");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, "utf-8");

    // normalize line endings
    content = content.replace(/\r/g, "").trim();

    /**
     * 🔑 Split AFTER ending invocation
     */
    const poems = content
      .split(/(?<=భాస్కరా\s*!)/g)
      .map(p => p.trim())
      .filter(p => p.length > 30);

    poems.forEach((poem, index) => {
      const verse = index + 1;

      const md = `---
title: "శ్రీ యాజ్ఞవల్క్య శతకం – పద్యం ${verse}"
verse: ${verse}
author: "చింతా రామకృష్ణారావు"
collection: "శ్రీ యాజ్ఞవల్క్య శతకము"
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
          poems.length === 108
            ? "✅ PERFECT: 108 poems generated correctly"
            : `⚠️ Generated ${poems.length}, expected 108`,
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
