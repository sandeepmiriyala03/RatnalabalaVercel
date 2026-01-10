import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "KrishnaSatakam.txt");
    const outputDir = path.join(process.cwd(), "KrishnaSatakam");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = fs.readFileSync(inputFile, "utf-8");

    // 🔥 Forgiving marker: |56|, ||56||, |56||, ||56|
    const regex = /([\s\S]*?)(\|{1,2}\s*\d+\s*\|{1,2}|$)/g;

    const poems: string[] = [];

    for (const match of content.matchAll(regex)) {
      const body = match[1]?.trim();

      // skip junk / empty blocks
      if (!body || body.length < 40) continue;

      // ✅ DO NOT append marker to poem body
      poems.push(body);
    }

    poems.forEach((poem, i) => {
      const num = i + 1;

      const md = `---
title: "కృష్ణ శతకము – పద్యం ${num}"
verse: ${num}
author: "నృసింహ్వాయు"
deity: "Sri Krishna"
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
        expected: 101,
        message:
          poems.length === 101
            ? "✅ PERFECT: markers removed, 101 poems generated cleanly"
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
