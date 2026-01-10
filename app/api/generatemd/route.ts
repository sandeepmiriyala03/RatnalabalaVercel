import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const inputFile = path.join(process.cwd(), "సుమతీ.txt");
    const outputDir = path.join(process.cwd(), "Sumati");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const lines = fs.readFileSync(inputFile, "utf-8").split(/\r?\n/);

    let poems: string[] = [];
    let currentPoem: string[] = [];
    let skippingBhava = false;

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      // 🔥 New poem number line (001–110, with optional spaces)
      if (/^\s*\d{2,3}\s*$/.test(line)) {
        if (currentPoem.length > 0) {
          poems.push(currentPoem.join("\n").trim());
          currentPoem = [];
        }
        skippingBhava = false;
        continue;
      }

      // 🔥 Start of Bhava → skip everything after this
      if (/^భావం\s*:/.test(line)) {
        skippingBhava = true;
        continue;
      }

      if (skippingBhava) continue;

      // Ignore empty lines at poem start
      if (currentPoem.length === 0 && line.trim() === "") continue;

      currentPoem.push(line);
    }

    // Push last poem
    if (currentPoem.length > 0) {
      poems.push(currentPoem.join("\n").trim());
    }

    // 🔥 Write markdown files
    poems.forEach((poem, index) => {
      const num = index + 1;

      const md = `---
title: "పద్యం ${num}"

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
        message: `Sumati Satakam ${poems.length} poems generated successfully`,
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
