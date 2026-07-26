// app/api/tts/route.ts
//
// Generates poem audio ON THE FLY, live, when someone clicks Listen.
// No pre-generated files, no Python, no separate serverless runtime —
// this is a normal Next.js Route Handler, exactly like your existing
// app/api/poems/route.ts. That matters: mixing a top-level /api/*.py
// file alongside app/api/*/route.ts can actually break the Next.js
// routes entirely (a real, reported Vercel issue) — staying in pure
// Node.js sidesteps that risk completely.
//
// Engines:
//   source: "edge"   -> Microsoft Edge neural voice, via @andresaya/edge-tts
//                        (voice: "male" -> te-IN-MohanNeural,
//                         voice: "female" -> te-IN-ShrutiNeural)
//   source: "google" -> Google Translate's TTS engine, via google-tts-api
//                        (one voice only; "voice" is ignored for this source)
//
// Called from the frontend exactly as before:
//   fetch('/api/tts', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ text, source: 'edge', voice: 'male' }),
//   })

import { NextRequest, NextResponse } from "next/server";
import { EdgeTTS } from "@andresaya/edge-tts";
import * as googleTTS from "google-tts-api";

export const runtime = "nodejs"; // needs real Node APIs, not Edge runtime

const MAX_TEXT_LENGTH = 5000; // sanity cap against abuse via giant payloads

async function generateEdge(text: string, voiceChoice: string): Promise<Buffer> {
  const voice = voiceChoice === "female" ? "te-IN-ShrutiNeural" : "te-IN-MohanNeural";
  const tts = new EdgeTTS();
  await tts.synthesize(text, voice);
  return tts.toBuffer(); // NOT getAudioData() — that method doesn't exist on this class
}

async function generateGoogle(text: string): Promise<Buffer> {
  // Google's endpoint caps individual requests at ~200 characters — a
  // full poem exceeds that, so getAllAudioBase64 splits it into
  // multiple chunks (by sentence-ish punctuation) and returns each
  // chunk's audio separately. MP3 frames are self-contained, so
  // concatenating the raw bytes of sequential chunks plays back fine
  // as one continuous file.
  const chunks = await googleTTS.getAllAudioBase64(text, {
    lang: "te",
    slow: false,
  });

  const buffers = chunks.map((chunk) => Buffer.from(chunk.base64, "base64"));
  return Buffer.concat(buffers);
}

export async function POST(req: NextRequest) {
  let payload: { text?: string; source?: string; voice?: string };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (payload.text ?? "").trim();
  const source = payload.source ?? "edge";
  const voiceChoice = payload.voice ?? "male";

  if (!text) {
    return NextResponse.json({ error: "Missing 'text' field." }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text too long (max ${MAX_TEXT_LENGTH} characters).` },
      { status: 400 }
    );
  }

  try {
    const audioBuffer =
      source === "google"
        ? await generateGoogle(text)
        : await generateEdge(text, voiceChoice);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS generation failed:", err);
    return NextResponse.json(
      { error: "TTS generation failed." },
      { status: 500 }
    );
  }
}