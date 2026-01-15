import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "NarayanaShatakam.txt");
    const outputDir = path.join(process.cwd(), "NarayanaSatakam");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = fs.readFileSync(inputFile, "utf-8");

    // 🔥 Marker format: 1 - శా. / 2 - మ.
    const regex = /(?:^|\n)\s*\d+\s*-\s*[^\n]+\n/g;

    const poems = content
      .split(regex)
      .map(p => p.trim())
      .filter(p => p.length > 40);

    poems.forEach((poem, i) => {
      const num = i + 1;

      const md = `---
title: "నారాయణ  శతకము – పద్యం ${num}"
verse: ${num}
author: "శ్రీ బమ్మెర పోతన"

---

${poem}
`;

      fs.writeFileSync(
        path.join(outputDir, `${num}.md`),
        md,
        "utf-8"
      );
    });

    return new Response(
      JSON.stringify({
        success: true,
        poems: poems.length,
        expected: 105,
        message:
          poems.length === 105
            ? "✅ PERFECT: markers removed, 105 poems generated cleanly"
            : "⚠️ Count mismatch – check input",
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
