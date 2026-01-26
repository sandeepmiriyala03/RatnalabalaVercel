import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function POST() {
  await kv.incr("ratnalabala:views");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const views = (await kv.get<number>("ratnalabala:views")) ?? 0;
  return NextResponse.json({ views });
}
