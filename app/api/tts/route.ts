import { NextRequest, NextResponse } from "next/server";
import { EdgeTTS } from "@andresaya/edge-tts";
import * as googleTTS from "google-tts-api";
import { Client } from "@gradio/client";

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

// ── Svara: kenpath/svara-tts-v1, called via its free Hugging Face
// Space (https://huggingface.co/spaces/kenpath/svara-tts), since the
// underlying 3B-param model isn't deployed on HF's standard Inference
// Providers (too large/GPU-heavy for that tier) — the Space is the
// only free way to call it.
//
// IMPORTANT — parameter names below are a BEST-EFFORT match to the
// Space's visible UI labels (Language, Gender, Text to speak,
// Temperature, Top-p, Repetition Penalty, Max New Tokens). Gradio's
// internal API parameter names aren't always identical to the
// display labels. Before relying on this in production:
//   1. Visit https://kenpath-svara-tts.hf.space
//   2. Click "Use via API" at the bottom of the page
//   3. Copy the exact parameter names/order shown there
//   4. Adjust the object passed to client.predict() below to match
//
// Optional: add HF_TOKEN to your environment variables (a free
// Hugging Face account token) — Spaces on the free "Zero GPU" tier
// can queue/rate-limit anonymous requests; an authenticated request
// generally gets priority.
let svaraClient: Client | null = null;

async function getSvaraClient(): Promise<Client> {
  if (!svaraClient) {
    svaraClient = await Client.connect("kenpath/svara-tts", {
      hf_token: process.env.HF_TOKEN as `hf_${string}` | undefined,
    });
  }
  return svaraClient;
}

async function generateSvara(text: string, voiceChoice: string): Promise<Buffer> {
  const client = await getSvaraClient();

  const result = await client.predict("/predict", {
    language: "Telugu",
    gender: voiceChoice === "female" ? "Female" : "Male",
    text_input: text,
    temperature: 0.7,
    top_p: 0.7,
    repetition_penalty: 1.1,
    max_new_tokens: 1200,
  });

  // Gradio audio outputs typically come back as { url } or a direct
  // path — handle both shapes defensively since the exact structure
  // depends on the Space's Gradio version.
  const data = result.data as any;
  const audioInfo = Array.isArray(data) ? data[0] : data;
  const audioUrl: string | undefined = audioInfo?.url ?? audioInfo?.path;

  if (!audioUrl) {
    throw new Error("Svara Space returned no audio URL — check response shape.");
  }

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to download Svara audio: ${audioRes.status}`);
  }

  const arrayBuffer = await audioRes.arrayBuffer();
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
      audioBuffer = await generateSvara(text, voiceChoice);
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