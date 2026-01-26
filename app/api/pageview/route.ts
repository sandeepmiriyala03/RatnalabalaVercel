export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET() {
  try {
    const views = (await redis.get<number>("ratnalabala:views")) ?? 0;
    return NextResponse.json({ views });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "redis_error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await redis.incr("ratnalabala:views");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "redis_error" },
      { status: 500 }
    );
  }
}
