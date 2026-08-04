import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  let raw;
  try {
    raw = await kv.get("featured-content");
  } catch {
    return NextResponse.json({ error: "no content yet" }, { status: 404 });
  }

  if (!raw) {
    return NextResponse.json({ error: "no content yet" }, { status: 404 });
  }

  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Featured content parse failed:", err);
    return NextResponse.json({ error: "data format issue" }, { status: 500 });
  }
}
