"use client";

import { useEffect, useState } from "react";
import { initWebMCP } from "@/lib/webmcp";

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initWebMCP();
  }, []);

  const executeSearch = async () => {
    const question = query.trim();

    if (!question) {
      setResult({
        error: "Please enter a Telugu question or topic.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const modelContext = (document as any).modelContext;

      if (!modelContext) {
        throw new Error(
          "WebMCP is not available in this browser."
        );
      }

      const tools = await modelContext.getTools();

      const tool = tools.find(
        (t: { name: string }) =>
          t.name === "searchBhavalamala"
      );

      if (!tool) {
        throw new Error(
          "searchBhavalamala WebMCP tool is not registered."
        );
      }

      const toolResult = await modelContext.executeTool(
        tool,
        {
          query: question,
        }
      );

      setResult(toolResult);
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Your existing Navbar */}
      
      {/* Your existing FontControlsTelugu */}

      {/* WebMCP Experiment 1 */}
      <section className="mx-auto max-w-3xl rounded-2xl border p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold">
          🌐 WebMCP Experiment 1
        </h2>

        <p className="mb-6 text-sm text-gray-600">
          రత్నాలబాల భావాలమాలలో తెలుగు విషయాన్ని
          WebMCP Tool ద్వారా వెతకండి.
        </p>

        <div className="mb-6">
          <label
            htmlFor="webmcp-query"
            className="mb-2 block font-semibold"
          >
            📥 Input
          </label>

          <div className="flex gap-2">
            <input
              id="webmcp-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  executeSearch();
                }
              }}
              placeholder="ఉదా: అసహనం"
              className="flex-1 rounded-lg border px-4 py-3"
            />

            <button
              type="button"
              onClick={executeSearch}
              disabled={loading}
              className="rounded-lg border px-5 py-3 font-semibold disabled:opacity-50"
            >
              {loading ? "Searching..." : "Execute"}
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border p-4">
          <h3 className="mb-2 font-bold">
            🛠️ Available Tool
          </h3>

          <p className="font-mono text-sm">
            searchBhavalamala
          </p>
        </div>

        <div className="mb-6 rounded-xl border p-4">
          <h3 className="mb-2 font-bold">
            ⚙️ Execute
          </h3>

          <pre className="overflow-x-auto rounded-lg p-3 text-sm">
{JSON.stringify({ query }, null, 2)}
          </pre>
        </div>

        <div className="mb-6 rounded-xl border p-4">
          <h3 className="mb-2 font-bold">
            📤 Result
          </h3>

          {result ? (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg p-4 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-gray-500">
              Enter a query and click Execute.
            </p>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <h3 className="mb-3 font-bold">
            🔄 WebMCP Flow
          </h3>

          <p className="text-sm">
            AI Agent → Browser → WebMCP Tool → Input →
            Execute → Ratnalabala API → RAG → Result
          </p>
        </div>
      </section>

      {/* Your existing children */}
      {children}
    </>
  );
}