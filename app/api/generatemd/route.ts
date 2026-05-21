import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "Dileep.txt");
    const outputDir = path.join(process.cwd(), "Ugadi108");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, "utf-8");

    content = content
      .replace(/\r/g, "")
      .replace(/Become a Medium member/g, "")
      .trim();

    const poems = content
      .split(/\n(?=\d+\.\n)/g)
      .map(p => p.trim())
      .filter(p => p.length > 50);

    poems.forEach((poem, index) => {
      const match = poem.match(/^(\d+)\./);

      const verseNumber = match ? match[1] : String(index + 1);


      const cleanPoem = poem.replace(/^\d+\.\n?/, "").trim();

      const versePadded = verseNumber.padStart(3, "0");

      const md = `---
title: "ఉగాది శతకం – పద్యం ${parseInt(verseNumber)}"
verse: ${versePadded}
author: "నిర్మాణం, పర్యవేక్షణ, సారధ్యం  మిరియాల దిలీపు"
---

${cleanPoem}
`;

      fs.writeFileSync(
        path.join(outputDir, `${versePadded}.md`),
        md,
        "utf-8"
      );
    });

    return new Response(
      JSON.stringify({
        success: true,
        poemsGenerated: poems.length,
        message: "✅ Clean format generated",
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