export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

let ready = false;
async function redis() {
  if (!ready) {
    await client.connect();
    ready = true;
  }
  return client;
}

export async function GET() {
  const r = await redis();
  const views = Number(await r.get("ratnalabala:views")) || 0;
  return NextResponse.json({ views });
}

export async function POST() {
  const r = await redis();
  await r.incr("ratnalabala:views");
  return NextResponse.json({ ok: true });
}
