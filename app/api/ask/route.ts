import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {

  const { question } = await req.json();

  const poemsDir = path.join(process.cwd(), "poems");

  const files = fs.readdirSync(poemsDir)
    .filter(f => f.endsWith(".md"));

  let match = files.find(f =>
    question.includes(f.replace(".md",""))
  );

  if (!match) match = files[Math.floor(Math.random()*files.length)];

  const poem = fs.readFileSync(
    path.join(poemsDir, match),
    "utf-8"
  );

  return NextResponse.json({
    title: match.replace(".md",""),
    poem
  });

}