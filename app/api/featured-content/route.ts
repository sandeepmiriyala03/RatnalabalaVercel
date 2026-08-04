// app/api/featured-content/route.ts
//
// Reads the "featured-content" key that the eve agent's
// pick_rotating_content tool writes to, every 6 hours. This lives
// in your MAIN Next.js project (not the eve agent project) since
// that's where your landing page's Vercel KV connection already
// exists — same KV instance the eve agent writes to, as long as
// both projects point at the same KV store's environment variables.

import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  let raw;
  try {
    raw = await kv.get("featured-content");
  } catch {
    // kv.get() can throw on a genuinely missing key rather than
    // returning null, depending on the client version — this is
    // expected right now since the eve agent hasn't successfully
    // written anything yet, not a real server error.
    return NextResponse.json({ error: "ఇంకా కంటెంట్ లేదు" }, { status: 404 });
  }

  if (!raw) {
    return NextResponse.json({ error: "ఇంకా కంటెంట్ లేదు" }, { status: 404 });
  }

  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Featured content parse failed:", err);
    return NextResponse.json({ error: "డేటా ఫార్మాట్ సమస్య" }, { status: 500 });
  }
}