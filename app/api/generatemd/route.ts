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
      const num = parts[i];
      const body = parts[i + 1]?.trim();
      if (!body) continue;

      const fileName = `ratnala_bala_${num.padStart(3, "0")}.md`;

      const md = `# వేమన  – పద్యం ${num}

${body}

---
**చదవండి –వినండి – పంచుకోండి**
`;

      fs.writeFileSync(path.join(outputDir, fileName), md, "utf-8");
    }

    return new Response(
      JSON.stringify({ success: true, message: "146 MD files created" }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
