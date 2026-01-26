export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error("❌ Upstash env vars missing", { url, token });
}

const redis = new Redis({
  url: url!,
  token: token!,
});

export async function GET() {
  try {
    const views = (await redis.get<number>("ratnalabala:views")) ?? 0;
    return NextResponse.json({ views });
  } catch (e: any) {
    console.error("GET error", e);
    return NextResponse.json(
      { error: e?.message ?? "redis_get_failed" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await redis.incr("ratnalabala:views");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST error", e);
    return NextResponse.json(
      { error: e?.message ?? "redis_incr_failed" },
      { status: 500 }
    );
  }
}
