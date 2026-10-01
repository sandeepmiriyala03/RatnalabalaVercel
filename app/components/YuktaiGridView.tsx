"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRounded";

import {
  YuktaiGrid,
  type GridColumn,
  type GridTheme,
  type WebMCPStatus,
  type YuktaiGridRule,
} from "@yuktishaalaa/yuktai";

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */

type PoemRow = {
  id: string;
  title: string;
  content: string;
  /** Every poem's 3rd line is its special (identity) line */
  specialLine: string;
};

type Props = {
  poems: { title: string; content: string; slug?: string }[];
  /** కవి పేరు — header, "కవి ఎవరు" answer, and AI tool descriptions */
  poet?: string;
  /**
   * Prefix for the AI tool names, different per page so agents can tell
   * the collections apart, e.g. "ratnalabala_poems" / "mira_poems".
   */
  toolName?: string;
  /** Poems to glow (e.g. future RAG "search by meaning" results) */
  highlightIds?: string[];
  loading?: boolean;
  /** Row click, the assistant ("గర్వం తెరువు") or an AI agent opened a poem */
  onOpenPoem: (title: string) => void;
  theme?: GridTheme;
  onThemeChange?: (theme: GridTheme) => void;
  /** Height (px) of a sticky bar above this grid (e.g. page tabs) */
  stickyOffset?: number;
};

/* ================================================================== */
/* CONSTANTS                                                          */
/* ================================================================== */

const COLUMNS: GridColumn<PoemRow>[] = [
  { key: "title", label: "పద్యం పేరు", width: "24%" },
  {
    key: "content",
    label: "పద్యం",
    sortable: false,
    // Phones: title + special line only; tap the row for the full poem
    hiddenOnMobile: true,
    render: (value) => (
      <Box sx={{ whiteSpace: "pre-line", lineHeight: 1.9, py: 0.5 }}>{String(value ?? "")}</Box>
    ),
  },
  {
    key: "specialLine",
    label: "ప్రత్యేక పంక్తి",
    width: "30%",
    sortable: false,
    render: (value) => <Box sx={{ fontWeight: 700, lineHeight: 1.7 }}>{String(value ?? "")}</Box>,
  },
];

const THEME_OPTIONS: { value: GridTheme; label: string }[] = [
  { value: "default", label: "సాధారణం" },
  { value: "dark", label: "చీకటి" },
  { value: "high-contrast", label: "అధిక కాంట్రాస్ట్" },
  { value: "color-blind", label: "రంగు అంధత్వం" },
  { value: "dyslexia", label: "డిస్లెక్సియా" },
];

// Only the sticky column header needs its own colours (the grid themes itself)
const HEADER_COLORS: Record<GridTheme, { bg: string; text: string }> = {
  default: { bg: "#f8fafc", text: "#0f172a" },
  dark: { bg: "#1e293b", text: "#ffffff" },
  "high-contrast": { bg: "#000000", text: "#ffffff" },
  "color-blind": { bg: "#e8eeff", text: "#0f172a" },
  dyslexia: { bg: "#fbf6e6", text: "#0f172a" },
};

const WEBMCP_TEXT: Record<WebMCPStatus["state"], string> = {
  unsupported: "",
  registering: "నమోదవుతోంది…",
  ready: "సిద్ధం",
  partial: "కొన్ని మాత్రమే",
  error: "నమోదు కాలేదు",
};

const EXAMPLES = ["గర్వం తెరువు", "గర్వం ప్రత్యేక పంక్తి", "మకుటం ఏమిటి", "క తో మొదలయ్యే పద్యాలు", "ఈరోజు పద్యం"];

/* ================================================================== */
/* HELPERS                                                            */
/* ================================================================== */

const norm = (s: string) => s.normalize("NFC").trim();

/** For comparing lines: no spaces or punctuation ("తెలుగు లెస్స!" = "తెలుగులెస్స") */
const loose = (s: string) => norm(s).replace(/[\s!?,.;:'"“”‘’-]/g, "");

/** The poem whose title is mentioned in the text (longest title wins). */
function findMentionedPoem(input: string, data: PoemRow[]): PoemRow | undefined {
  const text = norm(input);
  return [...data].sort((a, b) => b.title.length - a.title.length).find((p) => text.includes(norm(p.title)));
}

/** A word in quotes, or the word right before the marker phrase. */
function extractWord(input: string, marker: RegExp): string {
  const quoted = input.match(/["“”'‘’]([^"“”'‘’]+)["“”'‘’]/);
  if (quoted) return norm(quoted[1]);
  return norm(input.match(marker)?.[1] ?? "");
}

/** Day number of the year — calculated in UTC so daylight-saving can't skip or repeat a day */
function dayOfYear(date = new Date()): number {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - Date.UTC(date.getFullYear(), 0, 0)) / 86_400_000);
}

const lastLine = (p: PoemRow) => p.content.split("\n").pop() ?? "";
const titles = (list: PoemRow[]) => list.map((p) => p.title).join(", ");

/* ================================================================== */
/* AGENT RULES (in-page assistant)                                    */
/*                                                                    */
/* Only things the built-in Agent can't do. Searching ("X వెతుకు"),   */
/* counting ("ఎన్ని") and sorting (column header) are built in.       */
/* Order matters: specific rules first, the general "open" rule last. */
/* ================================================================== */

function buildRules(poet: string): YuktaiGridRule<PoemRow>[] {
  return [
    {
      name: "help",
      phrases: ["ఏం అడగవచ్చు", "ఏమి అడగవచ్చు", "సహాయం", "help"],
      description: "What can be asked.",
      execute: () => `ఇలా అడగండి: ${EXAMPLES.join(" • ")} • కవి ఎవరు • పద్యాల పేర్లు`,
    },
    {
      name: "poet",
      phrases: ["కవి ఎవరు", "కవి పేరు", "ఎవరు రాశారు", "who wrote"],
      description: "Who wrote the poems.",
      execute: ({ data }) => (poet ? `ఈ ${data.length} పద్యాలు రాసినవారు: ${poet}.` : "కవి పేరు ఇవ్వలేదు."),
    },
    {
      name: "makutam",
      phrases: ["మకుటం", "మకుటము", "makutam", "refrain"],
      description: "The shared last line (makutam), if the poems have one.",
      execute: ({ data }) => {
        if (!data.length) return "పద్యాలు ఏవీ లేవు.";
        // Group last lines ignoring spaces/punctuation, keep one original spelling
        const groups = new Map<string, { line: string; count: number }>();
        for (const p of data) {
          const line = lastLine(p);
          const key = loose(line);
          if (!key) continue;
          const g = groups.get(key) ?? { line, count: 0 };
          g.count += 1;
          groups.set(key, g);
        }
        const top = [...groups.values()].sort((a, b) => b.count - a.count)[0];
        if (!top || top.count < 2) return "ఈ పద్యాలకు ఒకే మకుటం లేదు — ప్రతి పద్యం వేరే పంక్తితో ముగుస్తుంది.";
        return top.count === data.length
          ? `${data.length} పద్యాలూ "${top.line}" అనే మకుటంతో ముగుస్తాయి.`
          : `${data.length} లో ${top.count} పద్యాలు "${top.line}" అనే పంక్తితో ముగుస్తాయి.`;
      },
    },
    {
      name: "special-line",
      phrases: ["ప్రత్యేక పంక్తి", "ప్రత్యేక లైన్", "special line"],
      description: "The 3rd (identity) line of the named poem.",
      execute: ({ input, data }) => {
        const p = findMentionedPoem(input, data);
        if (!p) return 'ఏ పద్యం? ఉదా: "గర్వం ప్రత్యేక పంక్తి".';
        return p.specialLine ? `"${p.title}" ప్రత్యేక పంక్తి: ${p.specialLine}` : `"${p.title}" లో 3 పంక్తులు లేవు.`;
      },
    },
    {
      name: "first-line",
      phrases: ["మొదటి పంక్తి", "తొలి పంక్తి", "first line"],
      description: "The first line of the named poem.",
      execute: ({ input, data }) => {
        const p = findMentionedPoem(input, data);
        return p ? `"${p.title}" మొదటి పంక్తి: ${p.content.split("\n")[0]}` : 'ఏ పద్యం? ఉదా: "గర్వం మొదటి పంక్తి".';
      },
    },
    {
      name: "starts-with-letter",
      phrases: ["తో మొదలయ్యే", "తో మొదలు", "starting with"],
      description: "Poems whose title starts with a letter (highlighted).",
      execute: ({ input, data, executeTool }) => {
        const letter = extractWord(input, /(\S+)\s*(?:తో మొదల|starting with)/i);
        if (!letter) return 'ఏ అక్షరం? ఉదా: "క తో మొదలయ్యే పద్యాలు".';
        const matches = data.filter((p) => norm(p.title).startsWith(letter));
        if (!matches.length) return `"${letter}" తో మొదలయ్యే పద్యం లేదు.`;
        void executeTool("highlight", { ids: matches.map((p) => p.id) });
        return `"${letter}" తో మొదలయ్యే ${matches.length} పద్యాలు: ${titles(matches)}`;
      },
    },
    {
      // Natural phrasing for search: "బుద్ధి ఉన్న పద్యాలు" (built-in needs "బుద్ధి వెతుకు")
      name: "word-in-poems",
      phrases: ["ఉన్న పద్యాలు", "అనే పదం", "పదం ఉన్న", "containing"],
      description: "Poems containing a word (highlighted).",
      execute: ({ input, data, executeTool }) => {
        const word = extractWord(input, /(\S+)\s*(?:అనే పదం|పదం ఉన్న|ఉన్న పద్యాలు|containing)/i);
        if (!word) return 'ఏ పదం? ఉదా: "బుద్ధి" ఉన్న పద్యాలు.';
        const matches = data.filter((p) => norm(p.content).includes(word) || norm(p.title).includes(word));
        if (!matches.length) return `"${word}" ఉన్న పద్యం లేదు.`;
        void executeTool("highlight", { ids: matches.map((p) => p.id) });
        return `"${word}" ఉన్న ${matches.length} పద్యాలు (హైలైట్ చేశాను): ${titles(matches)}`;
      },
    },
    {
      name: "poem-of-the-day",
      phrases: ["ఈరోజు పద్యం", "ఈ రోజు పద్యం", "రోజుకో పద్యం", "poem of the day"],
      description: "The same poem for everyone today (highlighted).",
      execute: ({ data, executeTool }) => {
        if (!data.length) return "పద్యాలు ఏవీ లేవు.";
        const p = data[dayOfYear() % data.length];
        void executeTool("highlight", { ids: [p.id] });
        return `ఈరోజు పద్యం: "${p.title}" — ${p.specialLine || p.content.split("\n")[0]}`;
      },
    },
    {
      name: "list-titles",
      phrases: ["పద్యాల పేర్లు", "పద్యాల జాబితా", "poem names"],
      description: "All poem titles.",
      execute: ({ data }) => (data.length ? `పద్యాల పేర్లు (${data.length}): ${data.map((p) => p.title).join(" • ")}` : "పద్యాలు ఏవీ లేవు."),
    },
    {
      // General "open/show <title>" — LAST, so the specific rules win
      name: "open-poem",
      phrases: ["తెరువు", "తెరవండి", "చూపించు", "చూపించండి", "open", "show"],
      description: "Open the named poem.",
      execute: ({ input, data, executeTool }) => {
        const p = findMentionedPoem(input, data);
        if (!p) return 'ఆ పేరుతో పద్యం లేదు. "పద్యాల పేర్లు" అని అడిగి చూడండి.';
        void executeTool("open", { id: p.id });
        return `"${p.title}" తెరుస్తున్నాను.`;
      },
    },
  ];
}

/* ================================================================== */
/* COMPONENT                                                          */
/* ================================================================== */

export default function YuktaiGridView({
  poems,
  poet = "",
  toolName = "telugu_poems",
  highlightIds = [],
  loading = false,
  onOpenPoem,
  theme = "default",
  onThemeChange,
  stickyOffset = 0,
}: Props) {
  const mui = useTheme();
  const [webmcp, setWebmcp] = useState<WebMCPStatus | null>(null);

  const rows = useMemo<PoemRow[]>(
    () =>
      poems.map((poem) => {
        const lines = poem.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return {
          id: poem.slug ?? poem.title,
          title: poem.title,
          content: lines.join("\n"),
          specialLine: lines[2] ?? "",
        };
      }),
    [poems]
  );

  const rules = useMemo(() => buildRules(poet), [poet]);

  // Only tools that need poem-specific wording; the package's defaults cover the rest
  const toolDescriptions = useMemo(() => {
    const by = poet ? ` by ${poet}` : "";
    return {
      search: `Search Telugu poems${by} by title or any word in the poem. Matches are highlighted.`,
      open: "Open one poem by its ID to show the full poem card (listen, meaning, share).",
      get_row: "Get one poem by its ID: title, full text, and its special (3rd) line.",
    };
  }, [poet]);

  const border = alpha(mui.palette.divider, 0.9);
  const header = HEADER_COLORS[theme] ?? HEADER_COLORS.default;

  return (
    <Stack spacing={{ xs: 1.25, sm: 1.5 }} sx={{ width: "100%", minWidth: 0 }}>
      {/* HEADER — sticky on phones */}
      <Box
        sx={{
          position: { xs: "sticky", md: "static" },
          top: { xs: `calc(var(--app-header-height, 0px) + ${stickyOffset}px)`, md: "auto" },
          zIndex: 4,
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 2.5,
          border: `1px solid ${border}`,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.4 }}>పద్యాల పట్టిక</Typography>
            <Typography variant="caption" color="text.secondary">
              {poet && <>కవి: <b>{poet}</b> · </>}
              {rows.length} పద్యాలు
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Tooltip arrow title={`ఉదా: ${EXAMPLES.join(" • ")}`}>
              <Chip size="small" variant="outlined" icon={<SmartToyRoundedIcon />} label="AI · తెలుగు" />
            </Tooltip>

            {webmcp && webmcp.state !== "unsupported" && (
              <Tooltip
                arrow
                title={
                  webmcp.errors.length
                    ? `నమోదు కానివి: ${webmcp.errors.map((e) => e.tool).join(", ")}`
                    : `AI agents కోసం ${webmcp.registered.length} tools`
                }
              >
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<HubRoundedIcon />}
                  color={webmcp.state === "ready" ? "success" : webmcp.state === "registering" ? "default" : "warning"}
                  label={`WebMCP · ${WEBMCP_TEXT[webmcp.state]}`}
                />
              </Tooltip>
            )}

            {onThemeChange && (
              <FormControl size="small" sx={{ minWidth: { xs: 150, sm: 180 }, flex: { xs: 1, sm: "none" } }}>
                <Select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value as GridTheme)}
                  inputProps={{ "aria-label": "పట్టిక రూపం" }}
                  startAdornment={<ContrastRoundedIcon fontSize="small" sx={{ mr: 0.75, color: "text.secondary" }} />}
                  sx={{ minHeight: 40 }}
                >
                  {THEME_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value} sx={{ minHeight: 44 }}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* GRID — the column header stays fixed while the table scrolls */}
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          borderRadius: { xs: 2, sm: 3 },
          border: `1px solid ${border}`,

          // Voice input is always Telugu here — hide the input-language picker
          '& div:has(> select[aria-label="ఇన్‌పుట్ భాష"]), & div:has(> select[aria-label="Input language"])': {
            display: "none !important",
          },
          // Give the package's table wrapper a height so the header can stick
          "& div:has(> table)": {
            maxHeight: { xs: "62vh", md: "70vh" },
            overflowY: "auto",
            overscrollBehavior: "contain",
          },
          "& thead th": {
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: header.bg,
            color: header.text,
            boxShadow: `inset 0 -1px 0 ${border}`,
            fontWeight: 800,
          },
          "& tbody td": { py: { xs: 1.25, sm: 1 } },
        }}
      >
        <YuktaiGrid<PoemRow>
          data={rows}
          columns={COLUMNS}
          rowKey="id"
          view="table"
          theme={theme}
          locale="te-IN"
          inputLanguage="te-IN"
          customRules={rules}
          search
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            sizeOptions: Array.from({ length: 10 }, (_, i) => (i + 1) * 10),
          }}
          loading={loading}
          highlightIds={highlightIds}
          autoScrollToHighlight
          onRowClick={(row) => onOpenPoem(row.title)}
          ai
          webmcp
          toolName={toolName}
          toolDescriptions={toolDescriptions}
          onWebMCPStatusChange={setWebmcp}
          empty="పద్యాలు కనబడలేదు."
        />
      </Box>
    </Stack>
  );
}