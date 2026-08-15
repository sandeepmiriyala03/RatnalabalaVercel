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
  const chunks = await googleTTS.getAllAudioBase64(text, {
    lang: "te",
    slow: false,
  });

  const buffers = chunks.map((chunk) => Buffer.from(chunk.base64, "base64"));
  return Buffer.concat(buffers);
}

// ── Svara: now handled entirely in Python (api/main/index.py), which
// calls kenpath/svara-tts-v1's free Hugging Face Space via
// gradio_client. This route just forwards the request — no more
// @gradio/client npm dependency needed here at all.
async function generateSvara(text: string, voiceChoice: string, origin: string): Promise<Buffer> {
  const res = await fetch(`${origin}/api/main?endpoint=svara`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice: voiceChoice }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `Svara TTS failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
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
    let audioBuffer: Buffer;

    if (source === "google") {
      audioBuffer = await generateGoogle(text);
    } else if (source === "svara") {
      audioBuffer = await generateSvara(text, voiceChoice, req.nextUrl.origin);
    } else {
      audioBuffer = await generateEdge(text, voiceChoice);
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("TTS generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TTS generation failed." },
      { status: 500 }
    );
  }
}