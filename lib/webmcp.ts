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
  "Searches the Ratnalabala Telugu literature collection (poems, satakams, proverbs, stories, Bhagavad Gita) by meaning, not just exact words. Input a Telugu word, topic or question. Returns the closest matching passages with title, collection (mala), a text snippet, a link to read the full text, and a match percentage. Read-only.";

export type SearchItem = {
  title: string;
  mala: string;
  snippet: string;
  /** Same-site path, for links inside the app */
  link: string;
  /** Full URL, so an AI agent can cite or open it */
  url: string;
  matchPercent: number;
};

export type SearchResult = {
  query: string;
  results: SearchItem[];
};

type SearchReply = {
  success: boolean;
  error?: string;
  results?: { title: string; mala: string; link?: string; snippet?: string; similarity: number }[];
};

/**
 * The real search. Used by the WebMCP tool AND by the on-page panel.
 *
 * GET /api/search  → (next.config.ts rewrite) → /api/main?endpoint=bhavalamala-search
 * Retrieval only: no AI answer, so it's fast, has no Groq cost, and the
 * same query is served from Vercel's CDN cache. The AI agent that calls
 * this tool writes its own answer from these passages.
 */
export async function searchBhavalamala(query: string): Promise<SearchResult> {
  const q = query.trim();

  if (!q) {
    throw new Error("వెతకడానికి ఒక పదం లేదా ప్రశ్న రాయండి.");
  }

  const response = await fetch(`/api/search?query=${encodeURIComponent(q)}&top_k=5`);

  let data: SearchReply | null = null;
  try {
    data = (await response.json()) as SearchReply;
  } catch {
    // server sent an HTML error page instead of JSON
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || `శోధన పూర్తి కాలేదు (${response.status}). మళ్ళీ ప్రయత్నించండి.`);
  }

  return {
    query: q,
    results: (data.results ?? []).map((r) => {
      const link = r.link || "";
      return {
        title: r.title,
        mala: r.mala,
        snippet: r.snippet ?? "",
        link,
        url: link ? new URL(link, window.location.origin).href : "",
        matchPercent: Math.round(Math.max(0, Math.min(1, Number(r.similarity) || 0)) * 100),
      };
    }),
  };
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