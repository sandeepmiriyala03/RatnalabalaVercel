import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {

  try {

    const { poem } = await req.json();

    const poemsDir = path.join(process.cwd(), "poems");

    const files = fs.readdirSync(poemsDir)
      .filter(file => file.endsWith(".md"));

    let detectedTheme = "జ్ఞానం";

    for (const file of files) {

      const themeName = file.replace(".md", "");

      if (poem.includes(themeName)) {
        detectedTheme = themeName;
        break;
      }

    }

    return NextResponse.json({
      theme: detectedTheme
    });

  } catch (error) {

    return NextResponse.json(
      { error: "Theme detection failed" },
      { status: 500 }
    );

  }

}