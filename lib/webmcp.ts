
// Ratnalabala WebMCP - Experiment 1
//
// REAL WebMCP API
// document.modelContext.registerTool()
//
// 🧠 8-Word Memory
//
// ఎవరు     → Agent
// ఎక్కడ    → Browser
// ఏ పని   → Tool
// పేరు     → Name
// వివరాలు  → Description
// Input    → Input Schema
// తర్కం    → Execute
// Output   → Result

export async function initWebMCP() {
  // 1. ఎవరు → Agent
  // AI Agent will discover and use this tool.

  // 2. ఎక్కడ → Browser
  // WebMCP is a browser API.
  if (typeof window === "undefined") {
    return false;
  }

  // Current REAL WebMCP API
  if (!("modelContext" in document)) {
    console.log("WebMCP is not available in this browser.");
    return false;
  }

  const modelContext = (document as any).modelContext;

  // 3. ఏ పని → Tool
  // We expose ONE simple Ratnalabala tool.
  try {
    // Avoid duplicate registration during React development reloads.
    const existingTools = await modelContext.getTools();

    const alreadyRegistered = existingTools.some(
      (tool: { name: string }) =>
        tool.name === "searchBhavalamala"
    );

    if (alreadyRegistered) {
      console.log(
        "🌸 WebMCP tool already registered: searchBhavalamala"
      );
      return true;
    }

    await modelContext.registerTool({
      // 4. పేరు → Name
      name: "searchBhavalamala",

      // 5. వివరాలు → Description
      description:
        "రత్నాలబాల భావాలమాలలో తెలుగు ప్రశ్న లేదా విషయాన్ని వెతికి సమాధానం ఇస్తుంది.",

      // 6. Input → Input Schema
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "భావాలమాలలో వెతకాల్సిన తెలుగు ప్రశ్న లేదా విషయం",
          },
        },
        required: ["query"],
      },

      // 7. తర్కం → Execute
      // AI Agent calls this function with:
      // { query: "అసహనం" }
      execute: async ({ query }: { query: string }) => {
        const question = query?.trim();

        if (!question) {
          throw new Error("query is required");
        }

        console.log(
          "🌸 WebMCP → Bhavalamala:",
          question
        );

        // Call YOUR REAL existing API.
        const response = await fetch(
          "/api/main?endpoint=bhavalamala-chat",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question,
              top_k: 5,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "భావాలమాల సమాధానం అందుబాటులో లేదు."
          );
        }

        // 8. Output → Result
        // Return the REAL API response to the AI Agent.
        return {
          query: question,
          answer: data.answer,
          sources: data.sources ?? [],
        };
      },
    });

    console.log(
      "🌸 Real WebMCP initialized: searchBhavalamala"
    );

    return true;
  } catch (error) {
    console.error(
      "WebMCP registration failed:",
      error
    );

    return false;
  }
}
