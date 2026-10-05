"use client";

/* ═══════════════════════════════════════════
   WebMCP — runs on every page (called from RootClientLayout).

   Registers one read-only tool, "searchBhavalamala", so AI agents
   in the browser can search Ratnalabala content.

   The search itself is exported too, so the on-page search panel
   works in every browser, even where WebMCP isn't available yet.
═══════════════════════════════════════════ */

type ToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

type ModelContext = {
  registerTool?: (
    tool: ToolDefinition,
    options?: { signal?: AbortSignal }
  ) => Promise<void> | void;
};

export const TOOL_NAME = "searchBhavalamala";
export const TOOL_DESCRIPTION =
  "Searches Telugu literary content in the Ratnalabala knowledge base.";

/** The real search. Used by the WebMCP tool AND by the on-page panel. */
export async function searchBhavalamala(query: string): Promise<unknown> {
  const q = query.trim();

  if (!q) {
    throw new Error("వెతకడానికి ఒక పదం లేదా ప్రశ్న రాయండి.");
  }

  const response = await fetch(`/api/search?query=${encodeURIComponent(q)}`);

  if (!response.ok) {
    throw new Error(`శోధన పూర్తి కాలేదు (${response.status}). మళ్ళీ ప్రయత్నించండి.`);
  }

  return response.json();
}

/** The spec has moved between navigator and document, so check both. */
function getModelContext(): ModelContext | undefined {
  if (typeof window === "undefined") return undefined;

  return (
    (navigator as Navigator & { modelContext?: ModelContext }).modelContext ??
    (document as Document & { modelContext?: ModelContext }).modelContext
  );
}

export function isWebMCPAvailable(): boolean {
  return typeof getModelContext()?.registerTool === "function";
}

/**
 * Registers the tool and returns a cleanup function.
 * Use it as: useEffect(() => initWebMCP(), []);
 * The cleanup unregisters the tool, so React (Strict Mode in dev)
 * never registers the same name twice.
 */
export function initWebMCP(): () => void {
  const modelContext = getModelContext();

  if (!modelContext || typeof modelContext.registerTool !== "function") {
    console.log("[WebMCP] WebMCP is not available.");
    return () => {};
  }

  const register = modelContext.registerTool.bind(modelContext);
  const controller = new AbortController();

  void (async () => {
    try {
      await register(
        {
          name: TOOL_NAME,
          title: "Search Ratnalabala knowledge",
          description: TOOL_DESCRIPTION,
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
          execute: async (input) => searchBhavalamala(String(input?.query ?? "")),
        },
        { signal: controller.signal }
      );

      console.log(`[WebMCP] ${TOOL_NAME} registered successfully.`);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("[WebMCP] Tool registration failed:", error);
      }
    }
  })();

  return () => controller.abort();
}

export default initWebMCP;