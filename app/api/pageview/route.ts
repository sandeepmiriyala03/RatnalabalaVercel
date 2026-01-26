export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

let connected = false;

async function getRedis() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client;
}

export async function POST() {
  const redis = await getRedis();
  await redis.incr("ratnalabala:views");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const redis = await getRedis();
  const views = Number(await redis.get("ratnalabala:views")) || 0;
  return NextResponse.json({ views });
}
