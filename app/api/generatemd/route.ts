import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "Tea.txt");
    const outputDir = path.join(process.cwd(), "TeaShatakam");

    if (!fs.existsSync(inputFile)) {
      return Response.json(
        { success: false, error: "Tea.txt not found." },
        { status: 404 }
      );
    }

    fs.mkdirSync(outputDir, { recursive: true });

    let content = fs.readFileSync(inputFile, "utf8");

    content = content
      .replace(/\r/g, "")
      .replace(/Become a Medium member/gi, "")
      .replace(/ప్రసాదరావు మిరియాల.*$/gm, "")
      .replace(/శుభోదయం.*$/gm, "")
      .trim();

    // Generate numbered poems (1-99)
    const poems = content
      .split(/\n(?=\d+\.\s*)/g)
      .map((p) => p.trim())
      .filter((p) => /^\d+\./.test(p));

    let generated = 0;

    for (const poem of poems) {
      const match = poem.match(/^(\d+)\./);
      if (!match) continue;

      const verseNumber = parseInt(match[1]);
      const versePadded = verseNumber.toString().padStart(3, "0");

      let cleanPoem = poem.replace(/^\d+\.\s*/, "").trim();

      // Remove existing ending
      cleanPoem = cleanPoem.replace(/\*?టీ\*?!?\s*$/u, "").trim();

      // Remove Telugu verse numbers like ౯౮ ౯౯ ౧౦౦
      cleanPoem = cleanPoem.replace(/[౦-౯]+\.?\s*$/gm, "").trim();

      cleanPoem += "\n\n*టీ*";

      const md = `---
title: "టీ శతకం – పద్యం ${verseNumber}"
verse: ${versePadded}
author: "ప్రసాదరావు మిరియాల, కాకినాడ"
---

${cleanPoem}
`;

      fs.writeFileSync(
        path.join(outputDir, `${versePadded}.md`),
        md,
        "utf8"
      );

      generated++;
    }

    // Create 100.md from the final blessing
    const finalMatch = content.match(
      /ఈ పద్యములను జదివిన[\s\S]*?గనినన్ వినినన్\.?\s*[౦-౯]*/
    );

    if (finalMatch) {
      let finalPoem = finalMatch[0]
        .replace(/[౦-౯]+\.?\s*$/gm, "")
        .trim();

      finalPoem = finalPoem.replace(/\*?టీ\*?!?\s*$/u, "").trim();

      finalPoem += "\n\n*టీ*";

      const md100 = `---
title: "టీ శతకం – పద్యం 100"
verse: 100
author: "ప్రసాదరావు మిరియాల, కాకినాడ"
---

${finalPoem}
`;

      fs.writeFileSync(
        path.join(outputDir, "100.md"),
        md100,
        "utf8"
      );

      generated++;
    }

    return Response.json({
      success: true,
      poemsGenerated: generated,
      message: `✅ ${generated} Markdown files generated successfully.`,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}