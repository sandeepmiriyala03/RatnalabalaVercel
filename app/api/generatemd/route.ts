import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "శ్రీకాళహస్తీశ్వరా.txt");
    const outputDir = path.join(process.cwd(), "శ్రీకాళహస్తీశ్వర");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const lines = fs.readFileSync(inputFile, "utf-8").split(/\r?\n/);

    let poems: string[] = [];
    let current: string[] = [];
    let started = false;

    for (const raw of lines) {
      const line = raw.trimEnd();

      // ✅ Detect Telugu numeral line ONLY
      if (/^[౦-౯]+$/.test(line)) {
        // save previous poem
        if (
          current.length &&
          current.join("\n").includes("శ్రీకాళహస్తీశ్వరా!") &&
          current.join("\n").includes("తాత్పర్యము")
        ) {
          poems.push(current.join("\n").trim());
        }

        // start new poem
        current = [];
        started = true;
        continue;
      }

      if (!started) continue;

      current.push(line);
    }

    // push last poem
    if (
      current.length &&
      current.join("\n").includes("శ్రీకాళహస్తీశ్వరా!") &&
      current.join("\n").includes("తాత్పర్యము")
    ) {
      poems.push(current.join("\n").trim());
    }

    // write MD files
    poems.forEach((poem, i) => {
      const num = i + 1;

      const md = `---
title: "శ్రీకాళహస్తీశ్వర శతకం – పద్యం ${num}"
verse: ${num}
author: "ధూర్జటి"
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
        expected: 110,
        message:
          poems.length === 110
            ? "✅ PERFECT: 110 poems generated"
            : "⚠️ Count mismatch – check input formatting",
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
