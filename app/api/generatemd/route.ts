import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "Jandhyala.txt");
    const outputDir = path.join(process.cwd(), "Jandhyala");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = fs.readFileSync(inputFile, "utf-8");

    // 🔥 Match each poem ending with "!! number"
    const regex = /(.*?లలితసుగుణజాల!\s*తెలుగుబాల!!\s*(\d+))/gs;

    let match;
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
      let fullPoem = match[1].trim();
      const num = match[2];

      // 🔥 remove trailing number
      const body = fullPoem.replace(/\s*\d+\s*$/, "");

      const md = `---
title: తెలుగుబాల! పద్యం ${num}
---

${body}
`;

      fs.writeFileSync(
        path.join(outputDir, `${num}.md`),
        md,
        "utf-8"
      );

      count++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        poems: count,
        message: "MD files generated successfully",
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
