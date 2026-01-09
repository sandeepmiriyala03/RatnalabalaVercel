import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "vemanapoems.txt");
    const outputDir = path.join(process.cwd(), "vemanapoems");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = fs.readFileSync(inputFile, "utf-8");

    // Split by ॥ 1 ॥, ॥ 2 ॥ ...
    const parts = content.split(/॥\s*(\d+)\s*॥/);

    for (let i = 1; i < parts.length; i += 2) {
      const num = parts[i]; // 1, 2, 3...
      let body = parts[i + 1]?.trim();
      if (!body) continue;

      // 🔥 REMOVE trailing number line if exists
      body = body.replace(/\s*॥\s*\d+\s*॥\s*$/, "");

      // ✅ FILE NAME = ONLY NUMBER
      const fileName = `${num}.md`;

      const md = `---
title: వేమన శతకం పద్యం ${num}
---

${body}
`;

      fs.writeFileSync(
        path.join(outputDir, fileName),
        md,
        "utf-8"
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "MD files created as 1.md, 2.md, 3.md … (number removed from poem body)",
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
