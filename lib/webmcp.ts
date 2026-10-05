"use client";

type WebMCPTool = {
  name: string;
  inputSchema?: Record<string, unknown>;
};

type ModelContext = {
  registerTool?: (
    tool: {
      name: string;
      title?: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations?: {
        readOnlyHint?: boolean;
      };
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    },
    options?: { signal?: AbortSignal }
  ) => Promise<void>;
};

export function initWebMCP() {
  const modelContext = (
    document as Document & {
      modelContext?: ModelContext & {
        getTools?: () => Promise<WebMCPTool[]>;
        executeTool?: (
          tool: WebMCPTool,
          input?: Record<string, unknown> | string
        ) => Promise<unknown>;
      };
    }
  ).modelContext;

  if (!modelContext || typeof modelContext.registerTool !== "function") {
    console.log("[WebMCP] WebMCP is not available.");
    return false;
  }

  const controller = new AbortController();

  void (async () => {
    try {
      await modelContext.registerTool(
        {
          name: "searchBhavalamala",
          title: "Search Ratnalabala knowledge",
          description:
            "Searches Telugu literary content in the Ratnalabala knowledge base.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The Telugu question or topic to search for.",
              },
            },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: {
            readOnlyHint: true,
          },
          execute: async (input) => {
            const query = String(input?.query ?? "").trim();

            if (!query) {
              throw new Error("A search query is required.");
            }

            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);

            if (!response.ok) {
              throw new Error("Failed to search Ratnalabala content.");
            }

            return response.json();
          },
        },
        { signal: controller.signal }
      );

      console.log("[WebMCP] searchBhavalamala registered successfully.");
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("[WebMCP] Tool registration failed:", error);
      }
    }
  })();

  return true;
}

export default initWebMCP;