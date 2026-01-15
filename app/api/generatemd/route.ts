import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "RamachandraSatakam.txt");
    const outputDir = path.join(process.cwd(), "RamachandraSatakam");

    if (!fs.existsSync(inputFile)) {
      throw new Error("Input file not found");
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, "utf-8");

    // Normalize line endings
    content = content.replace(/\r/g, "").trim();

    /**
     * ✅ STEP 1: Split ONLY by 'ప్రభూ!'
     */
    let poems = content
      .split("ప్రభూ!")
      .map(p => p.trim())
      .filter(Boolean);

    /**
     * ✅ STEP 2: Remove leading numbers like:
     * 1.
     * 21.మ.
     * 21. మ.
     * 21)
     */
    poems = poems.map(p =>
      p.replace(/^\s*\d+\s*[.)]?\s*[శామ.]*\s*/u, "").trim()
    );

    /**
     * ✅ STEP 3: Write MD files
     */
    poems.forEach((poem, index) => {
      const verse = index + 1;

      const md = `---
title: "రామచంద్రప్రభు – పద్యం ${verse}"
verse: ${verse}
author: "కూచి నరసింహము"
---

${poem}

రామచంద్రప్రభూ!
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
        message: "✅ 100 poems cleaned, numbers removed & written as safe MD files"
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
