// app/api/chat/route.ts
//
// Replaces api/rag_chat.py entirely — same Cohere embeddings, same Groq
// LLM, same Vercel Blob index, but now in native TypeScript. This
// sidesteps every Python bundle-size/dependency issue from before,
// since Node has none of those Vercel packaging limits.
//
// Reuses the SAME environment variables already set up:
//   COHERE_API_KEY, GROQ_API_KEY, EMBEDDINGS_BLOB_URL
// No new secrets needed.

import { streamText, tool, convertToModelMessages } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

export const runtime = "nodejs"; // needs Node, not edge, for the fetch sizes involved

interface IndexedItem {
  text: string;
  title: string;
  folder: string;
  vector: number[];
}

// Loaded once per warm serverless instance — same caching idea as the
// Python version's get_index(), just as a module-level variable here.
let cachedIndex: IndexedItem[] | null = null;

async function getIndex(): Promise<IndexedItem[]> {
  if (cachedIndex) return cachedIndex;

  const url = process.env.EMBEDDINGS_BLOB_URL;
  if (!url) {
    throw new Error(
      "EMBEDDINGS_BLOB_URL సెట్ చేయలేదు — /api/build_index ఒకసారి విజిట్ చేసి, అది ఇచ్చిన url ను పెట్టండి."
    );
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Embeddings blob fetch failed: ${res.status}`);
  cachedIndex = await res.json();
  return cachedIndex!;
}

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error("COHERE_API_KEY సెట్ చేయలేదు.");

  const res = await fetch("https://api.cohere.com/v1/embed", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      texts: [text],
      model: "embed-multilingual-v3.0",
      input_type: "search_query", // matches build_index.py's "search_document" pairing
    }),
  });

  if (!res.ok) throw new Error(`Cohere embedding error: ${res.status}`);
  const data = await res.json();
  return data.embeddings[0];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system:
      "మీరు రత్నాలబాల సహాయకుడు. యూజర్ ప్రశ్నకు జవాబు ఇవ్వడానికి ముందు, ఎల్లప్పుడూ " +
      "search_ratnalabala_knowledge tool వాడి సంబంధిత పద్యాలు/నియమాలు వెతకండి. ఆ ఫలితాల " +
      "ఆధారంగా మాత్రమే జవాబు ఇవ్వండి — కొత్తవి కల్పించకండి.",
    // NEW — incoming messages from useChat are UIMessage[] (with the
    // parts array), not plain ModelMessage[]. convertToModelMessages()
    // is the AI SDK 5 helper that bridges the two.
    messages: convertToModelMessages(messages),
    tools: {
      search_ratnalabala_knowledge: tool({
        description:
          "రత్నాలబాల డేటాబేస్ (పద్యాలు, కథలు, సామెతలు, సంధి, సమాసం, అక్షరమాల) లో " +
          "సంబంధిత అంశాల కోసం వెతకండి.",
        parameters: z.object({
          query: z.string().describe("వెతకాల్సిన అంశం లేదా భావం"),
        }),
        execute: async ({ query }) => {
          const index = await getIndex();
          const queryVector = await embedQuery(query);

          const scored = index.map((item) => ({
            ...item,
            score: cosineSimilarity(queryVector, item.vector),
          }));
          scored.sort((a, b) => b.score - a.score);
          const top5 = scored.slice(0, 5);

          return top5.map(({ text, title, folder }) => ({ text, title, folder }));
        },
      }),
    },
    maxSteps: 3,
  });

  // NEW — toDataStreamResponse() was renamed to toUIMessageStreamResponse()
  // in AI SDK 5, matching the new UIMessage-based protocol useChat expects.
  return result.toUIMessageStreamResponse();
}