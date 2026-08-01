import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { groq } from "@ai-sdk/groq";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `
మీరు రత్నాలబాల AI సహాయకుడు.

వినియోగదారునికి సహాయకరమైన, స్పష్టమైన సమాధానాలు తెలుగులో ఇవ్వండి.
తెలియని విషయాలను కల్పించవద్దు.
`,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}