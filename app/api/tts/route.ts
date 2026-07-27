
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
      { error: "TTS generation failed." },
      { status: 500 }
    );
  }
}