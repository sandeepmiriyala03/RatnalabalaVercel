import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "Annamacharya.txt");
    const outputDir = path.join(process.cwd(), "Annamacharya");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content = fs.readFileSync(inputFile, "utf-8");

    // Normalize line endings
    content = content.replace(/\r/g, "");

    // 🔥 Split poems at: 1. ఉ. / 2. చ.
    const poems = content
      .split(/\n(?=\d+\.\s*(ఉ\.|చ\.))/g)
      .map(p => p.trim())
      .filter(p => /^\d+\.\s*(ఉ\.|చ\.)/.test(p));

    poems.forEach((poem, index) => {
      const num = index + 1;

      // ✅ REMOVE leading numbering like "1. ", "23. "
      const cleanPoem = poem.replace(/^\d+\.\s*/,"");

      const md = `---
title: "శ్రీ (అలమేలుమంగా) వేంకటేశ్వరశతకము – పద్యం ${num}"
verse: ${num}
author: "తాళ్లపాక అన్నమాచార్యుఁడు"
---

${cleanPoem}
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
        poemsGenerated: poems.length,
        message: "✅ Poems split correctly & numbering removed from content",
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
