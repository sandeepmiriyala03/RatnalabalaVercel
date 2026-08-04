import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { processFile } from "@/lib/processFile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("✅ /api/upload HIT");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log("📄 File:", file.name, file.type, file.size);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const tempPath = path.join(
      os.tmpdir(),
      `${Date.now()}-${safeName}`
    );

    await fs.writeFile(tempPath, buffer);
    console.log("📁 Temp file written:", tempPath);

    const result = await processFile(tempPath);

    await fs.unlink(tempPath);

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ API UPLOAD ERROR:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
