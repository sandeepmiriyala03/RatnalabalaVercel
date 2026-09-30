"use client";

import { useMemo, useState } from "react";
import { Box, Chip, Stack, Typography, alpha, useTheme } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import { YuktaiGrid, type GridColumn, type WebMCPStatus } from "@yuktishaalaa/yuktai";

/**
 * Poems table (YuktAI Grid 4.7).
 *
 * ONE <YuktaiGrid> now does everything inside the package:
 *   embedded assistant → Agent → tools   (typing or Telugu voice)
 *   WebMCP (external AI agents)  → Agent → the SAME tools
 * So this file no longer builds its own tools, Agent, prompt() dialogs,
 * raw-JSON panels or a second WebMCP component.
 */

type PoemRow = {
  id: string;
  title: string;
  content: string;
  lines: number;
};

type Props = {
  poems: { title: string; content: string; slug?: string }[];
  /** Poems to glow from outside, e.g. future RAG "search by meaning" results */
  highlightIds?: string[];
  loading?: boolean;
  /** A poem was opened: row click, the assistant ("గర్వం తెరువు"), or an AI agent */
  onOpenPoem: (title: string) => void;
};

/* ---------- module-level constants (stable between renders) ---------- */

const TOOL_PREFIX = "ratnalabala_poems";

const COLUMNS: GridColumn<PoemRow>[] = [
  { key: "title", label: "పద్యం పేరు", width: "30%" },
  {
    key: "content",
    label: "పద్యం",
    sortable: false,
    hiddenOnMobile: true,
    render: (value) => <Box sx={{ whiteSpace: "pre-line" }}>{String(value ?? "")}</Box>,
  },
  { key: "lines", label: "పంక్తులు", type: "number", align: "center", width: 96 },
];

// What AI agents read to pick a tool (English works best for tool selection)
const TOOL_DESCRIPTIONS = {
  search: "Search Telugu poems by title or text. Matching poems are highlighted.",
  open: "Open one poem by its ID to show the full poem card.",
  select: "Select one poem by its ID.",
  filter: "Filter poems by title, text, or number of lines.",
  sort: "Sort poems by title or number of lines.",
  count: "Count the poems in the list.",
};

// Telugu names for the tools actually registered (shown to people)
const TOOL_LABELS: Record<string, string> = {
  search: "వెతుకు",
  count: "లెక్క",
  columns: "కాలమ్‌లు",
  get_row: "వరుస చూపు",
  highlight: "హైలైట్",
  select: "ఎంచుకో",
  open: "తెరువు",
  filter: "ఫిల్టర్",
  clear_filters: "ఫిల్టర్లు తీసేయి",
  sort: "క్రమం",
  clear_sort: "క్రమం తీసేయి",
};

const WEBMCP_TEXT: Record<WebMCPStatus["state"], string> = {
  unsupported: "ఈ బ్రౌజర్‌లో WebMCP లేదు (Chrome లో ఆన్ చేయాలి).",
  registering: "AI tools నమోదవుతున్నాయి…",
  ready: "AI agents కి tools సిద్ధం.",
  partial: "కొన్ని tools మాత్రమే నమోదయ్యాయి.",
  error: "Tools నమోదు కాలేదు.",
};

export default function PoemsGridView({ poems, highlightIds = [], loading = false, onOpenPoem }: Props) {
  const theme = useTheme();

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [webmcp, setWebmcp] = useState<WebMCPStatus | null>(null);
  const [lastAction, setLastAction] = useState<{ success: boolean; message: string } | null>(null);

  const rows = useMemo<PoemRow[]>(
    () =>
      poems.map((poem) => {
        const lines = poem.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return { id: poem.slug ?? poem.title, title: poem.title, content: lines.join("\n"), lines: lines.length };
      }),
    [poems]
  );

  const registeredLabels = (webmcp?.registered ?? []).map((name) => {
    const id = name.startsWith(`${TOOL_PREFIX}_`) ? name.slice(TOOL_PREFIX.length + 1) : name;
    return TOOL_LABELS[id] ?? id;
  });

  return (
    <Stack spacing={1.5}>
      {/* Small counts row */}
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip size="small" label={`పద్యాలు: ${rows.length}`} />
        {selectedKeys.length > 0 && (
          <Chip size="small" color="secondary" label={`ఎంపిక: ${selectedKeys.length}`} onDelete={() => setSelectedKeys([])} />
        )}
      </Stack>

      <YuktaiGrid<PoemRow>
        data={rows}
        columns={COLUMNS}
        rowKey="id"
        view="auto"
        locale="te-IN"
        // The page's own search box already filters `poems` — no second box here
        search={false}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        pagination={{ pageSize: 20, showSizeChanger: true, sizeOptions: [10, 20, 50, 100] }}
        loading={loading}
        highlightIds={highlightIds}
        autoScrollToHighlight
        onRowClick={(row) => onOpenPoem(row.title)}
        // One assistant → Agent → tools; Telugu voice input
        ai
        inputLanguage="te-IN"
        // The SAME tools for external AI agents
        webmcp
        toolName={TOOL_PREFIX}
        toolDescriptions={TOOL_DESCRIPTIONS}
        onWebMCPStatusChange={setWebmcp}
        onAgentResult={(result) => setLastAction({ success: result.success, message: result.message })}
        empty="పద్యాలు కనబడలేదు."
        className="ratnalabala-yuktai-grid"
      />

      {/* Last action — plain Telugu sentence from the Agent, never raw JSON */}
      {lastAction && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha(lastAction.success ? theme.palette.success.main : theme.palette.warning.main, 0.1),
          }}
        >
          <SmartToyRoundedIcon fontSize="small" color={lastAction.success ? "success" : "warning"} />
          <Typography variant="body2">{lastAction.message}</Typography>
        </Box>
      )}

      {/* Real WebMCP status — what the browser actually accepted */}
      {webmcp && (
        <Box sx={{ px: 1.5, py: 1, borderRadius: 2, border: `1px dashed ${theme.palette.divider}` }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HubRoundedIcon fontSize="small" color={webmcp.state === "ready" ? "success" : "disabled"} />
            <Typography variant="caption" color="text.secondary">
              WebMCP: {WEBMCP_TEXT[webmcp.state]}
            </Typography>
          </Stack>

          {registeredLabels.length > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {registeredLabels.map((label) => (
                <Chip key={label} size="small" variant="outlined" label={label} />
              ))}
            </Stack>
          )}

          {webmcp.errors.length > 0 && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
              {webmcp.errors.map((e) => e.tool).join(", ")} నమోదు కాలేదు.
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
}