import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "ShivanandaLahari.txt");
    const outputDir = path.join(process.cwd(), "ShivanandaLahari");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, "utf-8");

    /* Normalize line endings */
    content = content.replace(/\r/g, "");

    /**
     * 🔥 Split ONLY by verse numbers (ROBUST)
     * Handles:
     *  - ।।1।।
     *  - ।। 1 ।।
     *  - ॥1॥
     *  - 1.
     */
    const poems = content
      .split(/\n?\s*(?:।।|॥)?\s*\d+\s*(?:।।|॥|\.)\s*/g)
      .map(p => p.trim())
      .filter(p => p.length > 0); // ONLY remove empty blocks

    poems.forEach((poem, index) => {
      const verse = index + 1;

      const md = `---
title: "శివానందలహరి – పద్యం ${verse}"
verse: ${verse}
author: "ఆది శంకరాచార్యులు"
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
        message: "✅ Each poem correctly split & written to separate MD files",
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
