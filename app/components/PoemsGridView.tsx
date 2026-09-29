"use client";

import { useMemo, useState } from "react";
import {
  YuktaiGrid,
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

  return (
    <YuktaiGrid<PoemRow>
      data={rows}
      columns={COLUMNS}
      rowKey="id"

      /* Responsive */
      view="auto"
      mobileBreakpoint={768}

      /* Telugu */
      locale="te-IN"

      /* Theme */
      theme="default"

      /* ================================================
         GRID ASSISTANT / AI
         ================================================ */
      ai={{
        search: true,
        summary: true,
        anomaly: true,
        suggest: true,
      }}

      /* ================================================
         VOICE ASSISTANT
         ================================================ */
      voice={{
        control: true,
        speakOnFocus: true,
        speakSummary: true,
        language: "te-IN",
      }}

      /* Search */
      search={true}

      /* Selection */
      selectable={true}
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}

      /* Pagination */
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        sizeOptions: [10, 20, 50, 100],
      }}

      /* Loading */
      loading={loading}

      /* ================================================
         ASK & HIGHLIGHT
         ================================================ */
      highlightIds={highlightIds}
      highlightColor="#fff3a3"
      autoScrollToHighlight={true}

      /* Open poem */
      onRowClick={(row) => {
        onOpenPoem(row.title);
      }}

      /* Sorting */
      onSortChange={(sort) => {
        console.log("YuktAI Grid sort:", sort);
      }}

      empty="పద్యాలు కనబడలేదు."

      className="ratnalabala-yuktai-grid"
    />
  );
}