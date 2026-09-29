"use client";

import { useEffect, useMemo, useState } from "react";

import {
  YuktaiGrid,
  YuktaiGridWebMCP,
  useYuktaiGridAgent,
  type GridColumn,
  type GridAgentTool,
} from "@yuktishaalaa/yuktai";

type PoemRow = {
  id: string;
  title: string;
  content: string;
  lines: number;
};

type MCPColumn = {
  key: string;
  label: string;
  type?: "number" | "text" | "date";
};

type Props = {
  poems: {
    title: string;
    content: string;
    slug?: string;
  }[];
  highlightIds?: string[];
  loading?: boolean;
  onOpenPoem: (title: string) => void;
  onAssistantSearch: (query: string) => void;
};

const COLUMNS: GridColumn<PoemRow>[] = [
  {
    key: "title",
    label: "పద్యం పేరు",
    width: "30%",
    sortable: true,
    filterable: true,
  },
  {
    key: "content",
    label: "పద్యం",
    sortable: true,
    filterable: true,
    render: (value) => (
      <div className="whitespace-pre-line">
        {String(value)}
      </div>
    ),
  },
  {
    key: "lines",
    label: "పంక్తులు",
    type: "number",
    align: "center",
    width: 96,
    sortable: true,
    filterable: true,
  },
];

const MCP_COLUMNS: MCPColumn[] = [
  {
    key: "title",
    label: "పద్యం పేరు",
    type: "text",
  },
  {
    key: "content",
    label: "పద్యం",
    type: "text",
  },
  {
    key: "lines",
    label: "పంక్తులు",
    type: "number",
  },
];

export default function PoemsGridView({
  poems,
  highlightIds = [],
  loading = false,
  onOpenPoem,
  onAssistantSearch,
}: Props) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const [mcpHighlightIds, setMcpHighlightIds] = useState<string[]>(
    []
  );

  const [agentResult, setAgentResult] = useState<unknown>(null);

  const [agentError, setAgentError] = useState<string | null>(
    null
  );

  const [webMcpAvailable, setWebMcpAvailable] =
    useState<boolean>(false);

  /*
   * ------------------------------------------------------------
   * Check WebMCP availability
   * ------------------------------------------------------------
   */
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setWebMcpAvailable(
      Boolean(document.modelContext)
    );
  }, []);

  /*
   * ------------------------------------------------------------
   * Convert poems into Grid rows
   * ------------------------------------------------------------
   */
  const rows = useMemo<PoemRow[]>(
    () =>
      poems.map((poem) => {
        const lines = poem.content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        return {
          id: poem.slug ?? poem.title,
          title: poem.title,
          content: lines.join("\n"),
          lines: lines.length,
        };
      }),
    [poems]
  );

  /*
   * ------------------------------------------------------------
   * Combine external + WebMCP highlights
   * ------------------------------------------------------------
   */
  const combinedHighlightIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...highlightIds,
          ...mcpHighlightIds,
        ])
      ),
    [highlightIds, mcpHighlightIds]
  );

  /*
   * ------------------------------------------------------------
   * AGENT TOOLS
   * ------------------------------------------------------------
   */
  const agentTools = useMemo<GridAgentTool[]>(
    () => [
      {
        name: "search",
        description: "Search Telugu poems in the grid.",

        execute: async (
          input: Record<string, unknown>
        ) => {
          const query = String(
            input.query ?? ""
          );

          const text = query
            .trim()
            .toLowerCase();

          if (!text) {
            const result = {
              success: false,
              message: "శోధన పదాన్ని ఇవ్వండి.",
            };

            setAgentResult(result);

            return result;
          }

          const matches = rows.filter(
            (row) =>
              row.title
                .toLowerCase()
                .includes(text) ||
              row.content
                .toLowerCase()
                .includes(text)
          );

          const matchIds = matches.map(
            (row) => row.id
          );

          setMcpHighlightIds(matchIds);

          onAssistantSearch(query);

          const result = {
            success: true,
            message: `${matches.length} పద్యాలు కనుగొనబడ్డాయి.`,
            data: matches,
          };

          setAgentResult(result);

          return result;
        },
      },

      {
        name: "count",
        description: "Count poems in the grid.",

        execute: async () => {
          const result = {
            success: true,
            message: `మొత్తం ${rows.length} పద్యాలు ఉన్నాయి.`,
            data: rows.length,
          };

          setAgentResult(result);

          return result;
        },
      },

      {
        name: "getRow",
        description: "Get a poem by its ID.",

        execute: async (
          input: Record<string, unknown>
        ) => {
          const id = String(
            input.id ?? ""
          );

          const row = rows.find(
            (item) => item.id === id
          );

          if (!row) {
            const result = {
              success: false,
              message: `పద్యం "${id}" కనబడలేదు.`,
            };

            setAgentResult(result);

            return result;
          }

          const result = {
            success: true,
            message: "పద్యం కనుగొనబడింది.",
            data: row,
          };

          setAgentResult(result);

          return result;
        },
      },

      {
        name: "selectRow",
        description: "Select a poem row.",

        execute: async (
          input: Record<string, unknown>
        ) => {
          const id = String(
            input.id ?? ""
          );

          const row = rows.find(
            (item) => item.id === id
          );

          if (!row) {
            const result = {
              success: false,
              message: `పద్యం "${id}" కనబడలేదు.`,
            };

            setAgentResult(result);

            return result;
          }

          setSelectedKeys([id]);

          const result = {
            success: true,
            message: `పద్యం "${row.title}" ఎంపిక చేయబడింది.`,
            data: id,
          };

          setAgentResult(result);

          return result;
        },
      },

      {
        name: "openRow",
        description: "Open a poem.",

        execute: async (
          input: Record<string, unknown>
        ) => {
          const id = String(
            input.id ?? ""
          );

          const row = rows.find(
            (item) => item.id === id
          );

          if (!row) {
            const result = {
              success: false,
              message: `పద్యం "${id}" కనబడలేదు.`,
            };

            setAgentResult(result);

            return result;
          }

          onOpenPoem(row.title);

          const result = {
            success: true,
            message: `పద్యం "${row.title}" తెరవబడింది.`,
            data: row,
          };

          setAgentResult(result);

          return result;
        },
      },
    ],
    [
      rows,
      onAssistantSearch,
      onOpenPoem,
    ]
  );

  /*
   * ------------------------------------------------------------
   * AGENT
   * ------------------------------------------------------------
   */
  const {
    loading: agentLoading,
    executeTool,
  } = useYuktaiGridAgent({
    tools: agentTools,
  });

  /*
   * ------------------------------------------------------------
   * Execute agent tool manually from visible UI
   * ------------------------------------------------------------
   */
  const runAgentTool = async (
    toolName: string
  ) => {
    try {
      setAgentError(null);

      if (toolName === "search") {
        const query = window.prompt(
          "పద్యాన్ని వెతకడానికి పదాన్ని నమోదు చేయండి:"
        );

        if (query === null) {
          return;
        }

        await executeTool(
          "search",
          {
            query,
          }
        );

        return;
      }

      if (toolName === "getRow") {
        const id = window.prompt(
          "పద్యం ID నమోదు చేయండి:"
        );

        if (id === null) {
          return;
        }

        await executeTool(
          "getRow",
          {
            id,
          }
        );

        return;
      }

      if (toolName === "selectRow") {
        const id = window.prompt(
          "ఎంపిక చేయాల్సిన పద్యం ID నమోదు చేయండి:"
        );

        if (id === null) {
          return;
        }

        await executeTool(
          "selectRow",
          {
            id,
          }
        );

        return;
      }

      if (toolName === "openRow") {
        const id = window.prompt(
          "తెరవాల్సిన పద్యం ID నమోదు చేయండి:"
        );

        if (id === null) {
          return;
        }

        await executeTool(
          "openRow",
          {
            id,
          }
        );

        return;
      }

      await executeTool(
        toolName,
        {}
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Agent execution failed.";

      setAgentError(message);
    }
  };

  return (
    <div className="w-full space-y-4">

      {/* =========================================================
          1. AGENTIC AI
          YuktAI Grid displays its embedded AI Assistant here
          ========================================================= */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">

        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                🤖 Agentic AI Assistant
              </h2>

              <p className="text-sm text-gray-600">
                గ్రిడ్‌తో సహజ భాషలో పనిచేయండి
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          </div>
        </div>

        <YuktaiGrid<PoemRow>
          data={rows}
          columns={COLUMNS}
          rowKey="id"

          view="auto"
          mobileBreakpoint={768}

          theme="default"
          locale="te-IN"

          search={true}
          selectable={true}

          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}

          /*
           * Agentic AI is visible inside the Grid
           */
          ai={true}

          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            sizeOptions: [
              10,
              20,
              50,
              100,
            ],
          }}

          loading={loading}

          highlightIds={
            combinedHighlightIds
          }

          highlightColor="#fff3a3"

          autoScrollToHighlight={true}

          onRowClick={(row) => {
            onOpenPoem(row.title);
          }}

          onSortChange={(sort) => {
            console.log(
              "YuktAI Grid sort:",
              sort
            );
          }}

          empty="పద్యాలు కనబడలేదు."

          className="ratnalabala-yuktai-grid"
        />
      </div>

      {/* =========================================================
          2. GRID AGENT
          Explicit visible Agent panel
          ========================================================= */}
      <section className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold">
              🧠 Grid Agent
            </h2>

            <p className="text-sm text-gray-600">
              గ్రిడ్ పనులను Agent ద్వారా అమలు చేయండి
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
              agentLoading
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {agentLoading
              ? "Running"
              : "Ready"}
          </span>
        </div>

        {/* Agent tools */}
        <div className="mt-4">

          <p className="mb-2 text-sm font-medium">
            Agent Tools
          </p>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                void runAgentTool("search")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              🔎 Search
            </button>

            <button
              type="button"
              onClick={() =>
                void runAgentTool("count")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              🔢 Count
            </button>

            <button
              type="button"
              onClick={() =>
                void runAgentTool("getRow")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              📄 Get Row
            </button>

            <button
              type="button"
              onClick={() =>
                void runAgentTool("selectRow")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              ☑️ Select Row
            </button>

            <button
              type="button"
              onClick={() =>
                void runAgentTool("openRow")
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              📖 Open Row
            </button>
          </div>
        </div>

        {/* Agent result */}
        <div className="mt-4">

          <p className="mb-2 text-sm font-medium">
            Agent Result
          </p>

          <div className="min-h-[70px] rounded-lg bg-gray-50 p-3 text-sm">

            {agentError ? (
              <div className="text-red-600">
                {agentError}
              </div>
            ) : agentResult ? (
              <pre className="overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(
                  agentResult,
                  null,
                  2
                )}
              </pre>
            ) : (
              <span className="text-gray-500">
                Agent result will appear here.
              </span>
            )}

          </div>
        </div>

        {/* Agent data summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-xs text-gray-500">
              Total Rows
            </div>
            <div className="mt-1 text-lg font-semibold">
              {rows.length}
            </div>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-xs text-gray-500">
              Selected
            </div>
            <div className="mt-1 text-lg font-semibold">
              {selectedKeys.length}
            </div>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-xs text-gray-500">
              Highlighted
            </div>
            <div className="mt-1 text-lg font-semibold">
              {combinedHighlightIds.length}
            </div>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-xs text-gray-500">
              Agent Status
            </div>
            <div className="mt-1 text-lg font-semibold">
              {agentLoading
                ? "Running"
                : "Ready"}
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================
          3. WEBMCP
          Actual component registers tools.
          Visible panel below shows its state/tools.
          ========================================================= */}
      <section className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold">
              🔗 WebMCP
            </h2>

            <p className="text-sm text-gray-600">
              గ్రిడ్ టూల్స్‌ను WebMCP ద్వారా అందిస్తుంది
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
              webMcpAvailable
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {webMcpAvailable
              ? "Connected"
              : "Not Available"}
          </span>
        </div>

        <div className="mt-4">

          <p className="mb-2 text-sm font-medium">
            WebMCP Tools
          </p>

          <div className="flex flex-wrap gap-2">

            <span className="rounded-full border px-3 py-1 text-sm">
              Search
            </span>

            <span className="rounded-full border px-3 py-1 text-sm">
              Count
            </span>

            <span className="rounded-full border px-3 py-1 text-sm">
              Columns
            </span>

            <span className="rounded-full border px-3 py-1 text-sm">
              Get Row
            </span>

            <span className="rounded-full border px-3 py-1 text-sm">
              Highlight
            </span>

            <span className="rounded-full border px-3 py-1 text-sm">
              Select Row
            </span>

            <span className="rounded-full border px-3 py-1 text-sm">
              Open Row
            </span>

          </div>
        </div>

        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          {webMcpAvailable
            ? "WebMCP environment detected. Grid tools can be registered for agent interaction."
            : "WebMCP environment is not detected in this browser. The WebMCP component remains loaded and will register when document.modelContext is available."}
        </div>

        {/* Actual WebMCP registration */}
        <YuktaiGridWebMCP
          data={rows}
          columns={MCP_COLUMNS}
          name="ratnalabala_grid"

          onSelectRow={(id) => {
            setSelectedKeys([id]);
          }}

          onHighlightRows={(ids) => {
            setMcpHighlightIds(ids);
          }}

          onOpenRow={(id) => {
            const row = rows.find(
              (item) => item.id === id
            );

            if (row) {
              onOpenPoem(row.title);
            }
          }}
        />
      </section>

      {/* =========================================================
          4. GRID INFORMATION
          ========================================================= */}
      <section className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">

        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            📊 YuktAI Grid
          </h2>

          <p className="text-sm text-gray-600">
            పద్యాల పట్టిక
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">
              పద్యాలు
            </div>
            <div className="mt-1 text-xl font-semibold">
              {rows.length}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">
              ఎంపిక
            </div>
            <div className="mt-1 text-xl font-semibold">
              {selectedKeys.length}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">
              Highlight
            </div>
            <div className="mt-1 text-xl font-semibold">
              {combinedHighlightIds.length}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">
              Page Size
            </div>
            <div className="mt-1 text-xl font-semibold">
              10 / 20 / 50 / 100
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}