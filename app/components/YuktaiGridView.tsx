"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import FontDownloadRoundedIcon from "@mui/icons-material/FontDownloadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import {
  YuktaiGrid,
  type GridColumn,
  type GridTheme,
  type WebMCPStatus,
  type YuktaiGridRule,
} from "@yuktishaalaa/yuktai";

import {
  buildPdfHtml,
  DEFAULT_PDF_SETTINGS,
  ensureFontLoaded,
  exportPoemsToExcel,
  exportPoemsToPdf,
  fetchTeluguFonts,
  findFont,
  fontStack,
  loadPref,
  PAGE_SIZES,
  parseFonts,
  PDF_THEMES,
  savePref,
  SITE_FONT,
  SITE_FONT_ID,
  siteFontScale,
  type ExportOptions,
  type PageSizeId,
  type PdfSettings,
  type TeluguFont,
} from "@/app/components/exportPoems";

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */

type PoemRow = {
  id: string;
  title: string;
  content: string;
  /** Database special_line; if empty, falls back to the 3rd line */
  specialLine: string;
};

type Props = {
  poems: { title: string; content: string; slug?: string; special_line?: string | null }[];
  /** కవి పేరు — header, "కవి ఎవరు" answer, AI tool descriptions, downloads */
  poet?: string;
  /** శతకం / సంకలనం పేరు — PDF ముఖపేజీ, Excel sheet, file పేరు */
  poetryName?: string;
  /** Prefix for the AI tool names, different per page, e.g. "shatakam_4" / "mira_poems" */
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

const GRID_FONT_KEY = "ratnalabala-grid-font";


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
      description: "The special (key) line of the named poem.",
      execute: ({ input, data }) => {
        const p = findMentionedPoem(input, data);
        if (!p) return 'ఏ పద్యం? ఉదా: "గర్వం ప్రత్యేక పంక్తి".';
        return p.specialLine ? `"${p.title}" ప్రత్యేక పంక్తి: ${p.specialLine}` : `"${p.title}" కు ప్రత్యేక పంక్తి ఇంకా లేదు.`;
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
  poetryName = "పద్యాలు",
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
  const [pdfOpen, setPdfOpen] = useState(false);
  const [excelProgress, setExcelProgress] = useState<{ percent: number; message: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  /* పట్టిక ఫాంట్ — main.py fonts API నుండి; వినియోగదారుడి ఎంపిక గుర్తుంచుకుంటాం */
  const [fonts, setFonts] = useState<TeluguFont[]>([SITE_FONT]);
  const [fontId, setFontId] = useState<string>(SITE_FONT_ID);
  useEffect(() => {
    let alive = true;
    setFontId(loadPref<{ fontId: string }>(GRID_FONT_KEY, { fontId: SITE_FONT_ID }).fontId);
    fetchTeluguFonts().then((list) => alive && setFonts(list));
    return () => {
      alive = false;
    };
  }, []);
  // దాచిన font API జాబితాలో లేకపోతే సైట్ ఫాంట్
  const font = useMemo(() => findFont(fonts, fontId), [fonts, fontId]);
  useEffect(() => {
    ensureFontLoaded(font);
  }, [font]);
  const changeFont = (id: string) => {
    setFontId(id);
    savePref(GRID_FONT_KEY, { fontId: id });
  };
  const gridFont = fontStack(font);

  const rows = useMemo<PoemRow[]>(
    () =>
      poems.map((poem) => {
        const lines = poem.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        return {
          id: poem.slug ?? poem.title,
          title: poem.title,
          content: lines.join("\n"),
          // Database choice first (AI / reviewed); old poems fall back to the 3rd line
          specialLine: poem.special_line?.trim() || lines[2] || "",
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
      get_row: "Get one poem by its ID: title, full text, and its special (key) line.",
    };
  }, [poet]);

  /* Downloads: whatever this grid received (the page's search already applied) */
  const exportOptions = useMemo<ExportOptions>(() => ({ poems: rows, poetryName, poet }), [rows, poetryName, poet]);

  const excelBusy = excelProgress !== null && excelProgress.percent < 100;

  const downloadExcel = async () => {
    if (excelBusy || !rows.length) return;
    setExportError(null);
    try {
      await exportPoemsToExcel(exportOptions, (percent, message) => setExcelProgress({ percent, message }));
      setTimeout(() => setExcelProgress(null), 3000); // "అయింది ✓" కొద్దిసేపు కనిపించి పోతుంది
    } catch (err) {
      console.error("Excel export failed:", err);
      setExcelProgress(null);
      setExportError("Excel తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి.");
    }
  };

  const border = alpha(mui.palette.divider, 0.9);
  const header = HEADER_COLORS[theme] ?? HEADER_COLORS.default;
  const canExport = !loading && rows.length > 0;

  const exportButtonSx = { textTransform: "none" as const, fontWeight: 700, minHeight: 40, borderRadius: "10px" };

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

        {/* TOOLBAR — ఫాంట్ + PDF + Excel */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.25, pt: 1.25, borderTop: `1px dashed ${border}` }}
        >
          <FormControl size="small" sx={{ minWidth: { sm: 190 } }}>
            <Select
              value={font.id}
              onChange={(e) => changeFont(e.target.value)}
              inputProps={{ "aria-label": "పట్టిక ఫాంట్" }}
              startAdornment={<FontDownloadRoundedIcon fontSize="small" sx={{ mr: 0.75, color: "text.secondary" }} />}
              sx={{ minHeight: 40 }}
            >
              {fonts.map((f) => (
                <MenuItem key={f.id} value={f.id} sx={{ minHeight: 44 }}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={!canExport}
              onClick={() => setPdfOpen(true)}
              startIcon={<PictureAsPdfRoundedIcon fontSize="small" />}
              sx={{ ...exportButtonSx, flex: { xs: 1, sm: "none" } }}
            >
              PDF
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="success"
              disabled={!canExport || excelBusy}
              onClick={downloadExcel}
              startIcon={excelBusy ? <CircularProgress size={16} color="inherit" /> : <GridOnRoundedIcon fontSize="small" />}
              sx={{ ...exportButtonSx, flex: { xs: 1, sm: "none" } }}
            >
              Excel
            </Button>
          </Stack>
        </Stack>

        {/* Excel progress — 10% → 50% → 90% → 100% */}
        {excelProgress && (
          <Box sx={{ mt: 1.25 }} role="status" aria-live="polite">
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {excelProgress.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {excelProgress.percent}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={excelProgress.percent}
              color={excelProgress.percent >= 100 ? "success" : "primary"}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {exportError && (
          <Alert severity="error" onClose={() => setExportError(null)} sx={{ mt: 1.25 }}>
            {exportError}
          </Alert>
        )}
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
          // ఎంచుకున్న తెలుగు ఫాంట్ — పట్టికలోని పద్యాలకు
          "& table, & table *": { fontFamily: `${gridFont} !important` },
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

      <PdfExportDialog open={pdfOpen} onClose={() => setPdfOpen(false)} options={exportOptions} initialFontId={font.id} fonts={fonts} />
    </Stack>
  );
}

/* ================================================================== */
/* PDF WINDOW — సెట్టింగ్స్ + నమూనా + progress                          */
/* ================================================================== */

const PDF_PREF_KEY = "ratnalabala-pdf-settings";
const MM_TO_PX = 96 / 25.4;
const PREVIEW_HEIGHT = 520;

type PdfDialogProps = {
  open: boolean;
  onClose: () => void;
  options: ExportOptions;
  /** Grid లో ఎంచుకున్న font — PDF కి కూడా అదే మొదట వస్తుంది */
  initialFontId: string;
  /** main.py fonts API నుండి వచ్చిన జాబితా (grid నుండి) */
  fonts: TeluguFont[];
};

type PdfProgress = { percent: number; message: string } | null;

function PdfExportDialog({ open, onClose, options, initialFontId, fonts }: PdfDialogProps) {
  const mui = useTheme();
  const fullScreen = useMediaQuery(mui.breakpoints.down("sm"));

  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_PDF_SETTINGS);
  const [progress, setProgress] = useState<PdfProgress>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null && progress.percent < 100;

  /* తెరిచినప్పుడు: దాచిన సెట్టింగ్స్, లేకపోతే సైట్ అక్షర సైజు + grid font */
  useEffect(() => {
    if (!open) return;
    // మొదటిసారి: grid font + సైట్ అక్షర సైజు. తర్వాత: వినియోగదారుడు చివరిగా ఎంచుకున్నవి
    setSettings(loadPref<PdfSettings>(PDF_PREF_KEY, { ...DEFAULT_PDF_SETTINGS, fontId: initialFontId, fontScale: siteFontScale() }));
    setProgress(null);
    setError(null);
  }, [open, initialFontId]);

  const update = (patch: Partial<PdfSettings>) =>
    setSettings((cur) => {
      const next = { ...cur, ...patch };
      savePref(PDF_PREF_KEY, next);
      return next;
    });

  // దాచిన font ఇప్పుడు API జాబితాలో లేకపోతే సైట్ ఫాంట్
  const font = useMemo(() => findFont(fonts, settings.fontId), [fonts, settings.fontId]);

  useEffect(() => {
    if (open) ensureFontLoaded(font);
  }, [open, font]);

  /* ---------------- నమూనా (preview) ---------------- */

  const [previewHtml, setPreviewHtml] = useState("");
  useEffect(() => {
    if (!open) return;
    // త్వరగా మార్చినప్పుడు ప్రతిసారీ కొత్తగా గీయకుండా చిన్న విరామం
    const id = setTimeout(() => setPreviewHtml(buildPdfHtml(options, settings, font, true)), 250);
    return () => clearTimeout(id);
  }, [open, options, settings, font]);

  const frameBoxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(360);
  useEffect(() => {
    const el = frameBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const size = PAGE_SIZES.find((s) => s.id === settings.pageSize) ?? PAGE_SIZES[0];
  // కాగితం వెడల్పు + చుట్టూ బూడిద అంచు
  const pagePx = size.widthMm * MM_TO_PX + 12 * MM_TO_PX;
  const scale = Math.min(1, boxWidth / pagePx);

  /* ---------------- డౌన్‌లోడ్ ---------------- */

  const download = async () => {
    if (busy) return;
    setError(null);
    setProgress({ percent: 5, message: "మొదలుపెడుతున్నాం…" });
    try {
      await exportPoemsToPdf(options, settings, font, (percent, message) => setProgress({ percent, message }));
      setProgress({ percent: 100, message: "పూర్తయింది ✓ మళ్ళీ కావాలంటే సెట్టింగ్స్ మార్చి మళ్ళీ నొక్కండి." });
    } catch (err) {
      console.error("PDF export failed:", err);
      setProgress(null);
      setError(
        err instanceof Error && err.message === "Popup blocked"
          ? "బ్రౌజర్ కొత్త tab ను ఆపింది. ఈ సైట్‌కి popups అనుమతించి మళ్ళీ ప్రయత్నించండి."
          : "PDF తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి."
      );
    }
  };

  const themeOf = useMemo(() => PDF_THEMES.find((t) => t.id === settings.theme) ?? PDF_THEMES[0], [settings.theme]);

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      aria-labelledby="pdf-dialog-title"
    >
      <DialogTitle id="pdf-dialog-title" sx={{ pr: 6, fontWeight: 800 }}>
        PDF డౌన్‌లోడ్
        <Typography variant="body2" color="text.secondary">
          {options.poetryName} · {options.poems.length} పద్యాలు
        </Typography>
        <IconButton aria-label="మూసివేయి" onClick={onClose} disabled={busy} sx={{ position: "absolute", right: 12, top: 12 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* ---------- సెట్టింగ్స్ ---------- */}
          <Stack spacing={2.5} sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
            {/* ఫాంట్ */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                అక్షర శైలి (ఫాంట్)
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={font.id}
                  onChange={(e) => update({ fontId: e.target.value })}
                  inputProps={{ "aria-label": "అక్షర శైలి" }}
                  disabled={busy}
                >
                  {fonts.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* పేజీ సైజు */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                పేజీ సైజు
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={settings.pageSize}
                onChange={(_, v: PageSizeId | null) => v && update({ pageSize: v })}
                disabled={busy}
                aria-label="పేజీ సైజు"
              >
                {PAGE_SIZES.map((s) => (
                  <ToggleButton key={s.id} value={s.id} sx={{ textTransform: "none", flexDirection: "column", lineHeight: 1.3, py: 0.75 }}>
                    <b>{s.label}</b>
                    <Typography component="span" variant="caption" color="text.secondary">
                      {s.hint}
                    </Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* రంగుల థీమ్ */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                రంగుల థీమ్
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" role="radiogroup" aria-label="రంగుల థీమ్">
                {PDF_THEMES.map((t) => {
                  const selected = t.id === settings.theme;
                  return (
                    <ButtonBase
                      key={t.id}
                      role="radio"
                      aria-checked={selected}
                      disabled={busy}
                      onClick={() => update({ theme: t.id })}
                      sx={{
                        flexDirection: "column",
                        gap: 0.5,
                        p: 0.75,
                        width: 58,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: selected ? t.accent : "transparent",
                        "&:focus-visible": { outline: `2px solid ${mui.palette.primary.main}`, outlineOffset: 2 },
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${t.paper} 0 50%, ${t.accent} 50% 100%)`,
                          border: `1px solid ${t.rule}`,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {selected && <CheckRoundedIcon sx={{ fontSize: 18, color: "#fff", filter: "drop-shadow(0 0 2px rgba(0,0,0,.6))" }} />}
                      </Box>
                      <Typography variant="caption" sx={{ lineHeight: 1.2, textAlign: "center" }}>
                        {t.label}
                      </Typography>
                    </ButtonBase>
                  );
                })}
              </Stack>
            </Box>

            {/* అక్షర సైజు */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="subtitle2" fontWeight={700}>
                  అక్షర సైజు
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(settings.fontScale * 100)}%
                </Typography>
              </Stack>
              <Slider
                value={settings.fontScale}
                min={0.8}
                max={1.6}
                step={0.1}
                marks={[{ value: 0.8, label: "చిన్న" }, { value: 1, label: "100%" }, { value: 1.6, label: "పెద్ద" }]}
                onChange={(_, v) => update({ fontScale: v as number })}
                disabled={busy}
                aria-label="అక్షర సైజు"
                sx={{ mx: 1, width: "calc(100% - 16px)" }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch checked={settings.showSpecialLine} onChange={(e) => update({ showSpecialLine: e.target.checked })} disabled={busy} />
              }
              label="ప్రత్యేక పంక్తి చూపించు"
            />
          </Stack>

          {/* ---------- నమూనా ---------- */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              నమూనా
            </Typography>
            <Box
              ref={frameBoxRef}
              sx={{
                position: "relative",
                height: PREVIEW_HEIGHT,
                overflow: "hidden",
                borderRadius: 2,
                bgcolor: "#d9dee5",
                border: `1px solid ${mui.palette.divider}`,
              }}
            >
              {previewHtml && (
                <iframe
                  title="PDF నమూనా"
                  srcDoc={previewHtml}
                  style={{
                    border: 0,
                    width: pagePx,
                    height: PREVIEW_HEIGHT / scale,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    background: "#d9dee5",
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, fontFamily: fontStack(font) }}>
              {themeOf.label} థీమ్ · {size.label} · {Math.round(settings.fontScale * 100)}% — నమూనాలో scroll చేసి చూడండి
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch", gap: 1.5 }}>
        {/* Progress — 10% → 35% → 60% → 100% సరళమైన తెలుగు సందేశాలతో */}
        <Box sx={{ flex: 1, minWidth: 0, alignSelf: "center" }} role="status" aria-live="polite">
          {progress ? (
            <>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {progress.message}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.percent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress.percent}
                color={progress.percent >= 100 ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              బటన్ నొక్కిన తర్వాత Print window తెరుచుకుంటుంది. Destination లో &quot;Save as PDF&quot; ఎంచుకోండి (Microsoft Print to PDF కాదు — అది అక్షరాలను చిత్రంగా మారుస్తుంది). More settings లో &quot;Background graphics&quot; ఆన్ చేయండి.
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onClose} disabled={busy} sx={{ textTransform: "none" }}>
            మూసివేయి
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={download}
            disabled={busy || !options.poems.length}
            startIcon={<PictureAsPdfRoundedIcon />}
            sx={{ textTransform: "none", fontWeight: 700, minWidth: 160 }}
          >
            {busy ? "తయారవుతోంది…" : "PDF డౌన్‌లోడ్"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}