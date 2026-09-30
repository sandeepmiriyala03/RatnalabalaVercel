"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import {
  YuktaiGrid,
  SearchIcon,
  SortUpIcon,
  CheckIcon,
  CloseIcon,
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
  specialLine: string;
  makutam: string;
};

type Props = {
  poems: { title: string; content: string; slug?: string }[];
  /** Poems to glow (e.g. future RAG "search by meaning" results) */
  highlightIds?: string[];
  loading?: boolean;
  /** Row click, the assistant ("గర్వం తెరువు") or an AI agent opened a poem */
  onOpenPoem: (title: string) => void;
  theme?: GridTheme;
  onThemeChange?: (theme: GridTheme) => void;
  /**
   * Optional Telugu font family name. When not given, the grid uses the
   * site's current font (so the site-wide font picker keeps working).
   */
  teluguFont?: string;
  /**
   * Height (px) of anything already stuck to the top of the page above this
   * grid, e.g. the page's tab bar. The grid header sticks just below it.
   * A fixed site header can be accounted for with the CSS variable
   * --app-header-height on :root.
   */
  stickyOffset?: number;
};

/* ================================================================== */
/* CONSTANTS (module level → stable between renders)                  */
/* ================================================================== */

const TOOL_PREFIX = "ratnalabala_poems";

const fontStack = (font?: string) =>
  font ? `"${font}", "Noto Sans Telugu", "Nirmala UI", "Gautami", sans-serif` : "inherit";

const COLUMNS: GridColumn<PoemRow>[] = [
  { key: "title", label: "పద్యం పేరు", width: "24%" },
  {
    key: "content",
    label: "పద్యం",
    sortable: false,
    render: (value) => (
      <Box sx={{ whiteSpace: "pre-line", lineHeight: 1.9, py: 0.5 }}>
        {String(value ?? "")}
      </Box>
    ),
  },
  {
    key: "specialLine",
    label: "ప్రత్యేక పంక్తి",
    width: "30%",
    sortable: false,
    render: (value) => (
      <Box sx={{ fontWeight: 700, lineHeight: 1.7 }}>
        {String(value ?? "")}
      </Box>
    ),
  },
];

// What AI agents read to choose a tool. English works best for tool
// selection; the poems themselves are Telugu.
const TOOL_DESCRIPTIONS = {
  search: "Search the Telugu poems by unique title or by any word in the poem.",
  open: "Open one poem using its unique poem ID or title and show the full poem card.",
  get_row: "Get complete information about one poem: title, full text, special identity line and makutam.",
  highlight: "Highlight one or more poems by their unique IDs without removing other rows.",
  select: "Select one poem row in the grid.",
  filter: "Filter poems by title, poem text, special identity line or makutam.",
  clear_filters: "Remove all active poem filters.",
  sort: "Sort poems by title or special identity line.",
  clear_sort: "Remove the current sorting.",
  count: "Return the total number of poems.",
  columns: "List the available grid columns: poem name, poem text and special identity line.",
};

const TOOL_LABELS: Record<string, string> = {
  search: "వెతుకు",
  count: "లెక్క",
  columns: "కాలమ్‌లు",
  get_row: "పద్యం వివరాలు",
  highlight: "హైలైట్",
  select: "ఎంచుకో",
  open: "తెరువు",
  filter: "ఫిల్టర్",
  clear_filters: "ఫిల్టర్లు తీసేయి",
  sort: "క్రమం",
  clear_sort: "క్రమం తీసేయి",
};

const WEBMCP_TEXT: Record<WebMCPStatus["state"], string> = {
  unsupported: "ఈ బ్రౌజర్‌లో WebMCP లేదు. (Chrome లో ఆన్ చేసినప్పుడు AI agents వాడవచ్చు.)",
  registering: "AI tools నమోదవుతున్నాయి…",
  ready: "AI agents కోసం tools సిద్ధం.",
  partial: "కొన్ని AI tools మాత్రమే నమోదయ్యాయి.",
  error: "AI tools నమోదు కాలేదు.",
};

const THEME_OPTIONS: { value: GridTheme; label: string }[] = [
  { value: "default", label: "సాధారణం" },
  { value: "dark", label: "చీకటి" },
  { value: "high-contrast", label: "అధిక కాంట్రాస్ట్" },
  { value: "color-blind", label: "రంగు అంధత్వం" },
  { value: "dyslexia", label: "డిస్లెక్సియా" },
];

// Shown under the grid so people know what they can ask
const EXAMPLE_QUESTIONS = [
  "గర్వం తెరువు",
  "ఎన్ని పద్యాలు",
  "మకుటం ఏమిటి",
  "క తో మొదలయ్యే పద్యాలు",
  "\"బుద్ధి\" ఉన్న పద్యాలు",
  "ఈరోజు పద్యం",
];

/* ================================================================== */
/* HELPERS FOR THE RULES                                              */
/* ================================================================== */

const norm = (s: string) => s.normalize("NFC").trim();

/** The poem whose title is mentioned in the text (longest title wins). */
function findMentionedPoem(input: string, data: PoemRow[]): PoemRow | undefined {
  const text = norm(input);
  return [...data]
    .sort((a, b) => b.title.length - a.title.length)
    .find((poem) => text.includes(norm(poem.title)));
}

/** A word in quotes, or the word right before one of the marker phrases. */
function extractWord(input: string, marker: RegExp): string {
  const quoted = input.match(/["“”'‘’]([^"“”'‘’]+)["“”'‘’]/);
  if (quoted) return norm(quoted[1]);
  const before = input.match(marker);
  return before?.[1] ? norm(before[1]) : "";
}

function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

const titles = (list: PoemRow[]) => list.map((p) => p.title).join(", ");

/* ================================================================== */
/* AGENT RULES — built for these 36 poems                             */
/*                                                                    */
/* Facts in the data: every poem has 4 lines and ends with the same   */
/* మకుటం "భావరత్నబాల ! భాగ్యలీల !"; titles are single-word themes      */
/* (గర్వం, దయ, ధనం…). So line-count rules would always say "4" and   */
/* are left out. Order matters: specific rules first, general last.   */
/* ================================================================== */

export const POEM_RULES: YuktaiGridRule<PoemRow>[] = [
  {
    name: "help",
    phrases: ["ఏం అడగవచ్చు", "ఏమి అడగవచ్చు", "సహాయం", "help", "what can i ask"],
    description: "What the assistant can do with these poems.",
    execute: () =>
      `ఇలా అడగండి: ${EXAMPLE_QUESTIONS.join(" • ")} • అక్షర క్రమంలో • ఏదైనా పద్యం • పద్యాల పేర్లు`,
  },

  {
    name: "makutam",
    phrases: ["మకుటం", "మకుటము", "చివరి పంక్తి అన్ని", "refrain", "makutam"],
    description: "The refrain (makutam) shared by the poems.",
    execute: ({ data }) => {
      const counts = new Map<string, number>();
      for (const poem of data) {
        const last = poem.content.split("\n").pop()?.trim();
        if (last) counts.set(last, (counts.get(last) ?? 0) + 1);
      }
      const [line, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
      if (!line) return "పద్యాలు ఏవీ లేవు.";
      return count === data.length
        ? `${data.length} పద్యాలూ "${line}" అనే మకుటంతో ముగుస్తాయి.`
        : `${data.length} లో ${count} పద్యాలు "${line}" అనే మకుటంతో ముగుస్తాయి.`;
    },
  },

  {
    name: "special-line",
    phrases: ["ప్రత్యేక పంక్తి", "ప్రత్యేక లైన్", "special line", "identity line", "identity"],
    description: "Return the unique third line that identifies the poem.",
    execute: ({ input, data }) => {
      const poem = findMentionedPoem(input, data);
      return poem
        ? `"${poem.title}" ప్రత్యేక పంక్తి: ${poem.specialLine}`
        : 'ఏ పద్యం? ఉదా: "గర్వం ప్రత్యేక పంక్తి".';
    },
  },

  {
    name: "first-line",
    phrases: ["మొదటి పంక్తి", "తొలి పంక్తి", "first line"],
    description: "First line of the poem named in the question.",
    execute: ({ input, data }) => {
      const poem = findMentionedPoem(input, data);
      const firstLine = poem?.content.split("\n")[0]?.trim() ?? "";
      return poem
        ? `"${poem.title}" మొదటి పంక్తి: ${firstLine}`
        : 'ఏ పద్యం? పేరు చెప్పండి — ఉదా: "గర్వం మొదటి పంక్తి".';
    },
  },

  {
    name: "starts-with-letter",
    phrases: ["తో మొదలయ్యే", "తో మొదలు", "starting with", "starts with"],
    description: "Poems whose title starts with a letter.",
    execute: ({ input, data, executeTool }) => {
      const letter = extractWord(input, /(\S+)\s*(తో మొదల|starting with|starts with)/i);
      if (!letter) return "ఏ అక్షరం? ఉదా: \"క తో మొదలయ్యే పద్యాలు\".";
      const matches = data.filter((p) => norm(p.title).startsWith(letter));
      if (!matches.length) return `"${letter}" తో మొదలయ్యే పద్యం లేదు.`;
      void executeTool("highlight", { ids: matches.map((p) => p.id) });
      return `"${letter}" తో మొదలయ్యే ${matches.length} పద్యాలు: ${titles(matches)}`;
    },
  },

  {
    name: "word-in-poems",
    phrases: ["ఉన్న పద్యాలు", "అనే పదం", "పదం ఉన్న", "పద్యంలో వెతుకు", "poems with", "containing"],
    description: "Poems that contain a word; they are highlighted.",
    execute: ({ input, data, executeTool }) => {
      const word = extractWord(input, /(\S+)\s*(అనే పదం|పదం ఉన్న|ఉన్న పద్యాలు|containing)/i);
      if (!word) return "ఏ పదం? ఉదా: \"బుద్ధి\" ఉన్న పద్యాలు.";
      const matches = data.filter(
        (p) =>
          norm(p.content).includes(word) ||
          norm(p.title).includes(word) ||
          norm(p.specialLine).includes(word)
      );
      if (!matches.length) return `"${word}" ఉన్న పద్యం లేదు.`;
      void executeTool("highlight", { ids: matches.map((p) => p.id) });
      return `"${word}" ఉన్న ${matches.length} పద్యాలు (హైలైట్ చేశాను): ${titles(matches)}`;
    },
  },

  {
    name: "poem-of-the-day",
    phrases: ["ఈరోజు పద్యం", "ఈ రోజు పద్యం", "రోజుకో పద్యం", "poem of the day", "today's poem"],
    description: "Same poem for everyone today.",
    execute: ({ data, executeTool }) => {
      if (!data.length) return "పద్యాలు ఏవీ లేవు.";
      const poem = data[dayOfYear() % data.length];
      void executeTool("highlight", { ids: [poem.id] });
      return `ఈరోజు పద్యం: "${poem.title}" — ${poem.specialLine}`;
    },
  },

  {
    name: "random-poem",
    phrases: ["ఏదైనా పద్యం", "యాదృచ్ఛిక", "random poem", "surprise"],
    description: "A random poem, highlighted.",
    execute: ({ data, executeTool }) => {
      if (!data.length) return "పద్యాలు ఏవీ లేవు.";
      const poem = data[Math.floor(Math.random() * data.length)];
      void executeTool("highlight", { ids: [poem.id] });
      return `ఈ పద్యం చదవండి: "${poem.title}" — ${poem.specialLine}`;
    },
  },

  {
    name: "count-poems",
    phrases: ["ఎన్ని పద్యాలు", "మొత్తం పద్యాలు", "పద్యాలు ఎన్ని", "how many poems", "total poems"],
    description: "Number of poems.",
    execute: ({ data }) => `మొత్తం ${data.length} పద్యాలు ఉన్నాయి.`,
  },

  {
    name: "list-titles",
    phrases: ["పద్యాల పేర్లు", "పద్యాల జాబితా", "అన్ని పద్యాలు", "list poems", "poem names"],
    description: "All poem titles.",
    execute: ({ data }) =>
      data.length ? `పద్యాల పేర్లు (${data.length}): ${data.map((p) => p.title).join(" • ")}` : "పద్యాలు ఏవీ లేవు.",
  },

  {
    name: "poem-details",
    phrases: ["వివరాలు", "పూర్తి వివరాలు", "details", "special identity"],
    description: "Return the poem title, special identity line and makutam.",
    execute: ({ input, data }) => {
      const poem = findMentionedPoem(input, data);
      if (!poem) return 'ఏ పద్యం? ఉదా: "గర్వం వివరాలు".';
      return `"${poem.title}" — ప్రత్యేక పంక్తి: ${poem.specialLine} — మకుటం: ${poem.makutam}`;
    },
  },

  {
    name: "alphabetical",
    phrases: ["అక్షర క్రమం", "అక్షర క్రమంలో", "alphabetical", "a to z"],
    description: "Sort titles in Telugu alphabetical order.",
    execute: ({ executeTool }) => {
      void executeTool("sort", { key: "title", direction: "asc" });
      return "పద్యాలను అక్షర క్రమంలో అమర్చాను.";
    },
  },

  {
    // General "open/show <title>" — kept LAST so the specific rules win
    name: "open-poem",
    phrases: ["తెరువు", "తెరవండి", "చూపించు", "చూపించండి", "open", "show"],
    description: "Open the poem named in the question.",
    execute: ({ input, data, executeTool }) => {
      const poem = findMentionedPoem(input, data);
      if (!poem) return "ఆ పేరుతో పద్యం కనబడలేదు. \"పద్యాల పేర్లు\" అని అడిగి చూడండి.";
      void executeTool("open", { id: poem.id });
      return `"${poem.title}" తెరుస్తున్నాను.`;
    },
  },
];

/* ================================================================== */
/* COMPONENT                                                          */
/* ================================================================== */

export default function YuktaiGridView({
  poems,
  highlightIds = [],
  loading = false,
  onOpenPoem,
  theme = "default",
  onThemeChange,
  teluguFont,
  stickyOffset = 0,
}: Props) {
  const mui = useTheme();
  const font = fontStack(teluguFont);

  const [webmcp, setWebmcp] = useState<WebMCPStatus | null>(null);
  const [lastAction, setLastAction] = useState<{ success: boolean; message: string } | null>(null);

  const rows = useMemo<PoemRow[]>(
    () =>
      poems.map((poem) => {
        const lines = poem.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return {
          id: poem.slug ?? poem.title,
          title: poem.title,
          content: lines.join("\n"),
          specialLine: lines[2] ?? "",
          makutam: lines[3] ?? "",
        };
      }),
    [poems]
  );

  const registeredLabels = useMemo(
    () =>
      (webmcp?.registered ?? []).map((name) => {
        const id = name.startsWith(`${TOOL_PREFIX}_`) ? name.slice(TOOL_PREFIX.length + 1) : name;
        return TOOL_LABELS[id] ?? id;
      }),
    [webmcp]
  );

  /* Theme colours for the frame and the sticky header */
  const dark = theme === "dark";
  const frameBg =
    theme === "dark" ? "#0f172a"
    : theme === "color-blind" ? "#f4f7ff"
    : theme === "dyslexia" ? "#fffdf5"
    : "#ffffff";
  const headerBg =
    theme === "dark" ? "#1e293b"
    : theme === "high-contrast" ? "#000000"
    : theme === "color-blind" ? "#e8eeff"
    : theme === "dyslexia" ? "#fbf6e6"
    : "#f8fafc";
  const headerText = theme === "dark" || theme === "high-contrast" ? "#ffffff" : "#0f172a";
  const border = alpha(mui.palette.divider, 0.9);

  return (
    <Stack spacing={{ xs: 1.25, sm: 1.75 }} sx={{ width: "100%", minWidth: 0, fontFamily: font }}>
      {/* ============================================================ */}
      {/* HEADER — sticky on phones so it stays while the list scrolls */}
      {/* ============================================================ */}
      <Box
        sx={{
          position: { xs: "sticky", md: "static" },
          top: { xs: `calc(var(--app-header-height, 0px) + ${stickyOffset}px)`, md: "auto" },
          zIndex: 4,
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: 2.5,
          border: `1px solid ${border}`,
          bgcolor: "background.paper",
          boxShadow: { xs: `0 4px 14px ${alpha(mui.palette.common.black, 0.06)}`, md: "none" },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.4, fontFamily: font }}>
              పద్యాల పట్టిక
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: font }}>
              {rows.length} పద్యాలు · AI సహాయకుడిని తెలుగులో అడగండి
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Chip size="small" icon={<SearchIcon size={16} />} label="AI" variant="outlined" />
            {webmcp?.state === "ready" && (
              <Chip size="small" icon={<CheckIcon size={16} />} label="WebMCP" color="success" variant="outlined" />
            )}
            <FormControl size="small" sx={{ minWidth: { xs: 150, sm: 190 }, flex: { xs: 1, sm: "none" } }}>
              <Select
                value={theme}
                onChange={(e) => onThemeChange?.(e.target.value as GridTheme)}
                inputProps={{ "aria-label": "పట్టిక రూపం (accessibility theme)" }}
                startAdornment={<SortUpIcon size={16} color="currentColor" />}
                sx={{ minHeight: 40, fontFamily: font }}
              >
                {THEME_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value} sx={{ minHeight: 44, fontFamily: font }}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Box>

      {/* ============================================================ */}
      {/* WEBMCP — the tools the browser really registered              */}
      {/* ============================================================ */}
      {webmcp && webmcp.state !== "unsupported" && (
        <Box sx={{ px: 1.5, py: 1.1, borderRadius: 2, border: `1px dashed ${border}` }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SearchIcon size={16} color="currentColor" />
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: font }}>
              WebMCP: {WEBMCP_TEXT[webmcp.state]}
            </Typography>
          </Stack>

          {registeredLabels.length > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {registeredLabels.map((label) => (
                <Chip key={label} size="small" variant="outlined" label={label} sx={{ fontFamily: font }} />
              ))}
            </Stack>
          )}

          {webmcp.errors.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
              {webmcp.errors.map((e) => e.tool).join(", ")} నమోదు కాలేదు.
            </Alert>
          )}
        </Box>
      )}

      {/* ============================================================ */}
      {/* GRID — table on every screen; phones show 2 compact columns.  */}
      {/* The table scrolls inside its own box, so the column header    */}
      {/* stays fixed at the top while scrolling (phones included).     */}
      {/* ============================================================ */}
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          borderRadius: { xs: 2, sm: 3 },
          border: `1px solid ${border}`,
          bgcolor: frameBg,
          color: dark ? "#f8fafc" : "#0f172a",
          boxShadow: { xs: "none", sm: `0 8px 30px ${alpha(mui.palette.common.black, 0.06)}` },

          "& input, & textarea, & button, & select, & table, & th, & td": { fontFamily: font },

          // The package wraps the table in a horizontally scrolling div.
          // Give that div a height, so the header can stick inside it.
          "& div:has(> table)": {
            maxHeight: { xs: "62vh", md: "70vh" },
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          },
          "& thead th": {
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: headerBg,
            color: headerText,
            boxShadow: `inset 0 -1px 0 ${border}`,
            fontWeight: 800,
          },
          // Bigger tap targets on phones
          "& tbody td": { py: { xs: 1.25, sm: 1 } },
        }}
      >
        <YuktaiGrid<PoemRow>
          data={rows}
          columns={COLUMNS}
          rowKey="id"
          view="table"
          mobileBreakpoint={768}
          theme={theme}
          locale="te-IN"
          inputLanguage="te-IN"
          customRules={POEM_RULES}
          search
          pagination={{ pageSize: 20, showSizeChanger: true, sizeOptions: [10, 20, 36] }}
          loading={loading}
          highlightIds={highlightIds}
          autoScrollToHighlight
          onRowClick={(row) => onOpenPoem(row.title)}
          ai
          webmcp
          toolName={TOOL_PREFIX}
          toolDescriptions={TOOL_DESCRIPTIONS}
          onWebMCPStatusChange={setWebmcp}
          onAgentResult={(result) => setLastAction({ success: result.success, message: result.message })}
          empty="పద్యాలు కనబడలేదు."
          className="ratnalabala-yuktai-grid"
        />
      </Box>

      {/* ============================================================ */}
      {/* WHAT TO ASK                                                   */}
      {/* ============================================================ */}
      <Box sx={{ px: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: font }}>
          AI సహాయకుడిని ఇలా అడగండి:
        </Typography>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
          {EXAMPLE_QUESTIONS.map((q) => (
            <Chip key={q} size="small" variant="outlined" label={q} sx={{ fontFamily: font }} />
          ))}
        </Stack>
      </Box>

      {/* ============================================================ */}
      {/* LAST AGENT ACTION — a plain Telugu sentence, never raw JSON   */}
      {/* ============================================================ */}
      {lastAction && (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            px: { xs: 1.25, sm: 1.75 },
            py: 1.1,
            borderRadius: 2,
            bgcolor: alpha(lastAction.success ? mui.palette.success.main : mui.palette.warning.main, 0.08),
            border: `1px solid ${alpha(
              lastAction.success ? mui.palette.success.main : mui.palette.warning.main,
              0.2
            )}`,
          }}
        >
          {lastAction.success ? (
            <CheckIcon size={16} color="currentColor" />
          ) : (
            <CloseIcon size={16} color="currentColor" />
          )}
          <Typography variant="body2" sx={{ lineHeight: 1.75, overflowWrap: "anywhere", fontFamily: font }}>
            {lastAction.message}
          </Typography>
        </Box>
      )}


    </Stack>
  );
}