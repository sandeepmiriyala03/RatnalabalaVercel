"use client";

import { useMemo, useState } from "react";

import {
  YuktaiGrid,
  YuktaiGridAI,
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
  const [selectedKeys, setSelectedKeys] =
    useState<string[]>([]);

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

  const agentTools = useMemo<GridAgentTool[]>(
    () => [
      {
        name: "search",
        description:
          "Search Telugu poems in the grid.",
        execute: async (
          input: Record<string, unknown>
        ) => {
          const query = String(
            input.query ?? ""
          );

          const text = query
            .trim()
            .toLowerCase();

          const matches = rows.filter(
            (row) =>
              row.title
                .toLowerCase()
                .includes(text) ||
              row.content
                .toLowerCase()
                .includes(text)
          );

          onAssistantSearch(query);

          return {
            success: true,
            message: `${matches.length} poem(s) found.`,
            data: matches,
          };
        },
      },
      {
        name: "count",
        description:
          "Count poems in the grid.",
        execute: async () => ({
          success: true,
          message: `${rows.length} poem(s).`,
          data: rows.length,
        }),
      },
      {
        name: "getRow",
        description:
          "Get a poem by its ID.",
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
            return {
              success: false,
              message: `Poem "${id}" not found.`,
            };
          }

          return {
            success: true,
            message: "Poem found.",
            data: row,
          };
        },
      },
      {
        name: "selectRow",
        description:
          "Select a poem row.",
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
            return {
              success: false,
              message: `Poem "${id}" not found.`,
            };
          }

          setSelectedKeys([id]);

          return {
            success: true,
            message: `Poem "${id}" selected.`,
            data: id,
          };
        },
      },
      {
        name: "openRow",
        description:
          "Open a poem.",
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
            return {
              success: false,
              message: `Poem "${id}" not found.`,
            };
          }

          onOpenPoem(row.title);

          return {
            success: true,
            message: `Poem "${row.title}" opened.`,
            data: row,
          };
        },
      },
    ],
    [
      rows,
      onAssistantSearch,
      onOpenPoem,
    ]
  );

  const {
    loading: agentLoading,
  } = useYuktaiGridAgent({
    tools: agentTools,
  });

  const handleAssistantSearch = (
    query: string
  ) => {
    onAssistantSearch(query);
  };

  const handleAssistantSort = (
    key: string,
    direction: "asc" | "desc"
  ) => {
    console.log(
      "YuktAI Grid Assistant sort:",
      key,
      direction
    );
  };

  return (
    <div className="w-full space-y-3">
      <YuktaiGridAI<PoemRow>
        data={rows}
        columns={MCP_COLUMNS}
        onSearch={handleAssistantSearch}
        onSort={handleAssistantSort}
        theme="light"
        language="te-IN"
      />

      <YuktaiGridWebMCP
        data={rows}
        columns={MCP_COLUMNS}
        name="ratnalabala_grid"
        onSelectRow={(id) => {
          setSelectedKeys([id]);
        }}
        onOpenRow={(id) => {
          const row = rows.find(
            (item) => item.id === id
          );

          if (row) {
            onOpenPoem(row.title);
          }
        }}
        onHighlightRows={() => {}}
      />

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
        onSelectionChange={
          setSelectedKeys
        }
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
        loading={
          loading || agentLoading
        }
        highlightIds={highlightIds}
        highlightColor="#fff3a3"
        autoScrollToHighlight={true}
        onRowClick={(
          row,
          index
        ) => {
          void index;
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
  );
}