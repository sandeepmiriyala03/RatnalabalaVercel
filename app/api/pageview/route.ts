export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // uses REDIS_URL automatically

export async function POST() {
  await redis.incr("ratnalabala:views");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const views = (await redis.get<number>("ratnalabala:views")) ?? 0;
  return NextResponse.json({ views });
}
