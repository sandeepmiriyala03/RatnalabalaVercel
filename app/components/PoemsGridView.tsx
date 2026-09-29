"use client";

import { useMemo, useState } from "react";

import {
  YuktaiGrid,
  YuktaiGridAI,
  type GridColumn,
} from "@yuktishaalaa/yuktai";

type PoemRow = {
  id: string;
  title: string;
  content: string;
  lines: number;
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

const AI_COLUMNS = [
  {
    key: "title",
    label: "పద్యం పేరు",
    type: "text" as const,
  },
  {
    key: "content",
    label: "పద్యం",
    type: "text" as const,
  },
  {
    key: "lines",
    label: "పంక్తులు",
    type: "number" as const,
  },
];

export default function PoemsGridView({
  poems,
  highlightIds = [],
  loading = false,
  onOpenPoem,
}: Props) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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

  const handleAssistantSearch = (query: string) => {
    console.log("YuktAI Grid Assistant search:", query);
  };

  const handleAssistantSort = (
    key: string,
    direction: "asc" | "desc"
  ) => {
    console.log("YuktAI Grid Assistant sort:", key, direction);
  };

  return (
    <div className="w-full space-y-3">
      <YuktaiGridAI<PoemRow>
        data={rows}
        columns={AI_COLUMNS}
        onSearch={handleAssistantSearch}
        onSort={handleAssistantSort}
        theme="light"
        language="te-IN"
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
        onSelectionChange={setSelectedKeys}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          sizeOptions: [10, 20, 50, 100],
        }}
        loading={loading}
        highlightIds={highlightIds}
        highlightColor="#fff3a3"
        autoScrollToHighlight={true}
        onRowClick={(row) => {
          onOpenPoem(row.title);
        }}
        onSortChange={(sort) => {
          console.log("YuktAI Grid sort:", sort);
        }}
        empty="పద్యాలు కనబడలేదు."
        className="ratnalabala-yuktai-grid"
      />
    </div>
  );
}