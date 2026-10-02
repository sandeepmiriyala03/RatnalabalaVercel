"use client";

/* ================================================================== */
/* యుక్తి AI పట్టిక — అన్ని మాలలకు ఒకే component                         */
/* గుణింత మాల, పదాల మాల, సంధి మాల, సమాస మాల, స్మృతిమాల…                  */
/* ప్రతి పేజీలో: 1 import + 1 లైన్ మాత్రమే                                 */
/* ================================================================== */

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";

import { CloseIcon } from "@yuktishaalaa/yuktai";
import type * as Yuktai from "@yuktishaalaa/yuktai";
import type { GridColumn, GridTheme, YuktaiGridRule } from "@yuktishaalaa/yuktai";

import {
  exportRecordsToExcel,
  exportRecordsToPdf,
  type RecordColumn,
  type RecordRow,
} from "@/app/components/exportPoems";

const YuktaiGrid = dynamic(() => import("@yuktishaalaa/yuktai").then((m) => m.YuktaiGrid), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" width="100%" height={420} />,
}) as unknown as typeof Yuktai.YuktaiGrid;

/* ================================================================== */
/* TYPES                                                              */
/* ================================================================== */

export type DataColumn = RecordColumn & {
  width?: number | string;
  /** పెద్ద అక్షరాలతో (ఉదా: అక్షరం, పదం) */
  big?: boolean;
  /** ఫోన్‌లో దాచు */
  hiddenOnMobile?: boolean;
  /** పట్టికలో ఎన్ని అక్షరాల వరకు చూపించాలి (పొడవైన కథలకు) */
  preview?: number;
};

type Props = {
  /** ఉదా: "సంధి మాల" — PDF ముఖపేజీ, file పేరు */
  title: string;
  /** ఉదా: "సంధులు" */
  unitLabel: string;
  rows: RecordRow[];
  columns: DataColumn[];
  /** PDF/Excel లో అదనంగా రావాల్సినవి (పట్టికలో కనిపించవు) */
  exportColumns?: RecordColumn[];
  /** అంశం పేరు ఉన్న column — AI ప్రశ్నలు, PDF శీర్షిక */
  titleKey: string;
  /** PDF లో highlight పెట్టెలో వచ్చే column */
  highlightKey?: string;
  /** వరుసపై నొక్కితే చదివి వినిపించే column */
  speakKey?: string;
  /** వరుసపై నొక్కితే కింద వివరాలు */
  renderDetail?: (row: RecordRow) => React.ReactNode;
  /** WebMCP tool పేరు, ప్రతి పేజీకి వేరు: "sandhi", "padalu" … */
  toolName: string;
  examples?: string[];
};

const GRID_THEMES: { value: GridTheme; label: string }[] = [
  { value: "default", label: "సాధారణం" },
  { value: "dark", label: "చీకటి" },
  { value: "high-contrast", label: "అధిక కాంట్రాస్ట్" },
  { value: "color-blind", label: "రంగు అంధత్వం" },
  { value: "dyslexia", label: "డిస్లెక్సియా" },
];

/* ================================================================== */
/* HELPERS                                                            */
/* ================================================================== */

/** బ్రౌజర్ తెలుగు గొంతుతో చదవడం (ఈ పేజీలు ఇప్పటికే ఇదే వాడుతున్నాయి) */
export function speakTelugu(text: string, rate = 0.8, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "te-IN";
  u.rate = rate;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("te"));
  if (v) u.voice = v;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  window.speechSynthesis.speak(u);
}

const norm = (s: string) => s.normalize("NFC").trim();

/** ప్రశ్నలో ఉన్న అంశం — పొడవైన పేరు ముందు ("క్ష" ను "క" గా పొరబడకుండా) */
function findMentioned(input: string, rows: RecordRow[], key: string): RecordRow | undefined {
  const text = norm(input);
  return [...rows]
    .filter((r) => (r[key] ?? "").trim())
    .sort((a, b) => b[key].length - a[key].length)
    .find((r) => text.includes(norm(r[key])));
}

/* ================================================================== */
/* TeluguDataGrid                                                     */
/* ================================================================== */

export default function TeluguDataGrid({
  title,
  unitLabel,
  rows,
  columns,
  exportColumns = [],
  titleKey,
  highlightKey,
  speakKey,
  renderDetail,
  toolName,
  examples = [],
}: Props) {
  const mui = useTheme();
  const [theme, setTheme] = useState<GridTheme>("default");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [job, setJob] = useState<{ percent: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job !== null && job.percent < 100;

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  /* పట్టిక columns */
  const gridColumns = useMemo<GridColumn<RecordRow>[]>(
    () =>
      columns.map((c) => ({
        key: c.key,
        label: c.label,
        width: c.width,
        hiddenOnMobile: c.hiddenOnMobile,
        render: (value) => {
          const text = String(value ?? "");
          const shown = c.preview && text.length > c.preview ? `${text.slice(0, c.preview)}…` : text;
          return (
            <Box
              sx={{
                whiteSpace: "pre-line",
                lineHeight: 1.7,
                ...(c.big ? { fontSize: "1.4rem", fontWeight: 800, color: "#1a3d2b" } : {}),
              }}
            >
              {shown}
            </Box>
          );
        },
      })),
    [columns]
  );

  /* వరుస ఎంపిక: వివరాలు చూపించు / చదువు */
  const openRow = (row: RecordRow) => {
    setSelectedId(row.id);
    if (speakKey && row[speakKey]) speakTelugu(row[speakKey]);
  };
  const openRef = useRef(openRow);
  openRef.current = openRow;

  /* తెలుగు AI నియమాలు — వెతకడం, లెక్కించడం పట్టికలోనే ఉన్నాయి */
  const rules = useMemo<YuktaiGridRule<RecordRow>[]>(
    () => [
      {
        name: "help",
        phrases: ["ఏం అడగవచ్చు", "ఏమి అడగవచ్చు", "సహాయం", "help"],
        description: "What can be asked.",
        execute: () => `ఇలా అడగండి: ${[...examples, "X వెతుకు", "ఎన్ని"].join(" • ")}`,
      },
      {
        name: "speak",
        phrases: ["వినిపించు", "వినిపించండి", "చదువు", "speak"],
        description: "Read an item aloud.",
        execute: ({ input, data, executeTool }) => {
          const row = findMentioned(input, data, titleKey);
          if (!row) return `ఏది? ఉదా: "${data[0]?.[titleKey] ?? ""} వినిపించు".`;
          void executeTool("highlight", { ids: [row.id] });
          speakTelugu(row[speakKey ?? titleKey]);
          return `🔊 "${row[titleKey]}" వినిపిస్తున్నాను.`;
        },
      },
      {
        name: "open",
        phrases: ["తెరువు", "తెరవండి", "చూపించు", "చూపించండి", "open", "show"],
        description: "Open one item.",
        execute: ({ input, data, executeTool }) => {
          const row = findMentioned(input, data, titleKey);
          if (!row) return `ఏది? ఉదా: "${data[0]?.[titleKey] ?? ""} తెరువు".`;
          void executeTool("highlight", { ids: [row.id] });
          openRef.current(row);
          return `"${row[titleKey]}" తెరుస్తున్నాను.`;
        },
      },
    ],
    [examples, titleKey, speakKey]
  );

  /* PDF / Excel — పట్టికలోని అన్నీ */
  const runExport = (kind: "pdf" | "excel") => {
    if (busy || !rows.length) return;
    setError(null);
    const data = { title, unitLabel, rows, columns: [...columns, ...exportColumns], titleKey, highlightKey };
    const onProgress = (percent: number, message: string) => setJob({ percent, message });
    // await లేకుండా — iPhone లో PDF tab వెంటనే తెరుచుకోవాలి
    (kind === "pdf" ? exportRecordsToPdf(data, onProgress) : exportRecordsToExcel(data, onProgress))
      .then(() => setTimeout(() => setJob(null), 3000))
      .catch((err: unknown) => {
        console.error(`[${toolName}] ${kind} export failed:`, err);
        setJob(null);
        setError(
          err instanceof Error && err.message === "Popup blocked"
            ? "బ్రౌజర్ కొత్త tab ను ఆపింది. ఈ సైట్‌కి popups అనుమతించి మళ్ళీ ప్రయత్నించండి."
            : `${kind === "pdf" ? "PDF" : "Excel"} తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి.`
        );
      });
  };

  const border = alpha(mui.palette.divider, 0.9);
  const buttonSx = { textTransform: "none" as const, fontWeight: 700, minHeight: 40, borderRadius: "10px", flex: { xs: 1, sm: "none" } };

  return (
    <Stack spacing={1.25} sx={{ width: "100%", minWidth: 0 }}>
      {/* HEADER */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ p: 1.25, borderRadius: 2.5, border: `1px solid ${border}`, bgcolor: "background.paper" }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.4 }}>
            {title} — యుక్తి AI పట్టిక
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rows.length} {unitLabel}
            {examples.length > 0 && <> · AI ని అడగండి: {examples.join(" • ")}</>}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Select
            size="small"
            value={theme}
            onChange={(e) => setTheme(e.target.value as GridTheme)}
            inputProps={{ "aria-label": "పట్టిక రూపం" }}
            startAdornment={<ContrastRoundedIcon fontSize="small" sx={{ mr: 0.75, color: "text.secondary" }} />}
            sx={{ minWidth: 160, minHeight: 40, flex: { xs: "1 1 100%", sm: "none" } }}
          >
            {GRID_THEMES.map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ minHeight: 44 }}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={!rows.length || busy}
            onClick={() => runExport("pdf")}
            startIcon={<PictureAsPdfRoundedIcon fontSize="small" />}
            sx={buttonSx}
          >
            PDF
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            disabled={!rows.length || busy}
            onClick={() => runExport("excel")}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <GridOnRoundedIcon fontSize="small" />}
            sx={buttonSx}
          >
            Excel
          </Button>
        </Stack>
      </Stack>

      {/* PROGRESS — 10% → 100% */}
      {job && (
        <Box role="status" aria-live="polite" sx={{ px: 0.5 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {job.message}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job.percent}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={job.percent}
            color={job.percent >= 100 ? "success" : "primary"}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: "12px" }}>
          {error}
        </Alert>
      )}

      {/* GRID */}
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          borderRadius: { xs: 2, sm: 3 },
          border: `1px solid ${border}`,
          '& div:has(> select[aria-label="ఇన్‌పుట్ భాష"]), & div:has(> select[aria-label="Input language"])': {
            display: "none !important",
          },
          "& div:has(> table)": { maxHeight: { xs: "62vh", md: "70vh" }, overflowY: "auto", overscrollBehavior: "contain" },
          "& thead th": { position: "sticky", top: 0, zIndex: 2, boxShadow: `inset 0 -1px 0 ${border}`, fontWeight: 800 },
          "& tbody tr": { cursor: "pointer" },
        }}
      >
        <YuktaiGrid<RecordRow>
          data={rows}
          columns={gridColumns}
          rowKey="id"
          view="table"
          theme={theme}
          locale="te-IN"
          inputLanguage="te-IN"
          customRules={rules}
          search
          pagination={{ pageSize: 10, showSizeChanger: true, sizeOptions: [10, 20, 50, 100] }}
          highlightIds={selectedId ? [selectedId] : []}
          onRowClick={(row) => openRef.current(row)}
          ai
          webmcp
          toolName={toolName}
          empty={`${unitLabel} కనబడలేదు.`}
        />
      </Box>

      {/* DETAIL — వరుసపై నొక్కితే */}
      {renderDetail && selected && (
        <Box sx={{ position: "relative", p: 2, borderRadius: 2.5, border: `1px solid ${border}`, bgcolor: "background.paper" }}>
          <IconButton
            size="small"
            aria-label="మూసివేయి"
            onClick={() => setSelectedId(null)}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <CloseIcon size={18} color="currentColor" />
          </IconButton>
          {renderDetail(selected)}
        </Box>
      )}
    </Stack>
  );
}

/* ================================================================== */
/* GridSection — పేజీలో "యుక్తి AI పట్టిక" బటన్ + పట్టిక                  */
/* ================================================================== */

export function GridSection({ children, label = "యుక్తి AI పట్టిక" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ my: 3 }}>
      <Stack direction="row" justifyContent="center">
        <Button
          variant={open ? "contained" : "outlined"}
          color="secondary"
          startIcon={<TableRowsRoundedIcon />}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "12px", px: 3, minHeight: 44 }}
        >
          {open ? `${label} మూసివేయి` : `📊 ${label} · PDF · Excel`}
        </Button>
      </Stack>
      <Collapse in={open} timeout={280} unmountOnExit>
        <Box sx={{ mt: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}

/* ================================================================== */
/* ప్రతి మాలకు సిద్ధంగా ఉన్న పట్టికలు                                     */
/* పేజీలోని data నే props గా ఇస్తారు — data ఒక్క చోటే ఉంటుంది              */
/* ================================================================== */

/** వివరాల పెట్టెలో చిన్న "శీర్షిక: విలువ" వరుస */
function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}>{value}</Typography>
    </Box>
  );
}

/* ---------- గుణింత మాల ---------- */

export function GunintaGrid({
  vyanjanalu,
  marks,
  names,
}: {
  vyanjanalu: string[];
  marks: string[];
  names: string[];
}) {
  const rows = useMemo<RecordRow[]>(
    () =>
      vyanjanalu.flatMap((v) =>
        marks.map((mark, i) => ({
          id: `${v}-${i}`,
          roopam: i === 0 ? v : i === 14 ? `${v}ం` : i === 15 ? `${v}ః` : v + mark,
          vyanjanam: v,
          peru: names[i] ?? "",
        }))
      ),
    [vyanjanalu, marks, names]
  );
  return (
    <TeluguDataGrid
      title="గుణింత మాల"
      unitLabel="గుణింతాలు"
      rows={rows}
      columns={[
        { key: "roopam", label: "రూపం", big: true, width: 110 },
        { key: "vyanjanam", label: "వ్యంజనం", width: 110 },
        { key: "peru", label: "అచ్చు గుర్తు" },
      ]}
      titleKey="roopam"
      speakKey="roopam"
      toolName="guninta_mala"
      examples={["కి వినిపించు", "క వెతుకు", "ఎన్ని"]}
    />
  );
}

/* ---------- పదాల మాల ---------- */

export function PadalaGrid({
  twoLetter,
  threeFour,
  swaralu,
}: {
  twoLetter: string[];
  threeFour: string[];
  swaralu: string[];
}) {
  const rows = useMemo<RecordRow[]>(() => {
    const make = (words: string[], rakam: string, prefix: string) =>
      words.map((w, i) => ({
        id: `${prefix}-${i}`,
        padam: w,
        aksharam: w[0] ?? "",
        rakam,
        vargam: swaralu.includes(w[0]) ? "అచ్చుతో" : "హల్లుతో",
      }));
    return [...make(twoLetter, "రెండక్షరాల పదం", "2"), ...make(threeFour, "మూడు/నాలుగు అక్షరాలు", "3")];
  }, [twoLetter, threeFour, swaralu]);
  return (
    <TeluguDataGrid
      title="పదాల మాల"
      unitLabel="పదాలు"
      rows={rows}
      columns={[
        { key: "padam", label: "పదం", big: true },
        { key: "aksharam", label: "మొదటి అక్షరం", width: 120 },
        { key: "rakam", label: "రకం", hiddenOnMobile: true },
        { key: "vargam", label: "వర్గం", width: 110, hiddenOnMobile: true },
      ]}
      titleKey="padam"
      speakKey="padam"
      toolName="padala_mala"
      examples={["గంట వినిపించు", "క వెతుకు", "ఎన్ని"]}
    />
  );
}

/* ---------- సంధి మాల ---------- */

type SandhiRule = {
  id: number;
  name: string;
  category: string;
  rule: string;
  purva: string;
  para: string;
  result: string;
  examples: { before: string; after: string }[];
};

export function SandhiGrid({ rules }: { rules: SandhiRule[] }) {
  const rows = useMemo<RecordRow[]>(
    () =>
      rules.flatMap((r) =>
        r.examples.map((ex, i) => ({
          id: `${r.id}-${i}`,
          after: ex.after,
          before: ex.before,
          sandhi: r.name,
          vargam: r.category,
          niyamam: r.rule,
          sutram: `${r.purva} + ${r.para} → ${r.result}`,
        }))
      ),
    [rules]
  );
  return (
    <TeluguDataGrid
      title="సంధి మాల"
      unitLabel="సంధి ఉదాహరణలు"
      rows={rows}
      columns={[
        { key: "after", label: "పదం", big: true },
        { key: "before", label: "విడదీత" },
        { key: "sandhi", label: "సంధి" },
        { key: "vargam", label: "వర్గం", hiddenOnMobile: true },
      ]}
      exportColumns={[
        { key: "sutram", label: "సూత్రం" },
        { key: "niyamam", label: "నియమం" },
      ]}
      titleKey="after"
      highlightKey="niyamam"
      toolName="sandhi_mala"
      examples={["మునీంద్ర తెరువు", "గుణసంధి వెతుకు", "ఎన్ని"]}
      renderDetail={(row) => (
        <Box sx={{ pr: 4 }}>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#2d6a4f" }}>{row.after}</Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            {row.before} → {row.after}
          </Typography>
          <Field label="సంధి" value={`${row.sandhi} (${row.vargam})`} />
          <Field label="సూత్రం" value={row.sutram} />
          <Field label="నియమం" value={row.niyamam} />
        </Box>
      )}
    />
  );
}

/* ---------- సమాస మాల ---------- */

type SamasaRule = {
  id: number;
  name: string;
  definition: string;
  pradhanyam: string;
  vigrahyaVakya: string;
  subtypes: { name: string; example: string; vigraha: string }[];
  examples: { samasa: string; vigraha: string }[];
};

export function SamasaGrid({ rules }: { rules: SamasaRule[] }) {
  const rows = useMemo<RecordRow[]>(
    () =>
      rules.flatMap((r) => [
        ...r.subtypes.map((s, i) => ({
          id: `${r.id}-s${i}`,
          samasam: s.example,
          vigraha: s.vigraha,
          rakam: r.name,
          uparakam: s.name,
          nirvachanam: r.definition,
          pradhanyam: r.pradhanyam,
        })),
        ...r.examples.map((e, i) => ({
          id: `${r.id}-e${i}`,
          samasam: e.samasa,
          vigraha: e.vigraha,
          rakam: r.name,
          uparakam: "ఉదాహరణ",
          nirvachanam: r.definition,
          pradhanyam: r.pradhanyam,
        })),
      ]),
    [rules]
  );
  return (
    <TeluguDataGrid
      title="సమాస మాల"
      unitLabel="సమాసాలు"
      rows={rows}
      columns={[
        { key: "samasam", label: "సమాసం", big: true },
        { key: "vigraha", label: "విగ్రహ వాక్యం" },
        { key: "rakam", label: "సమాసం రకం" },
        { key: "uparakam", label: "ఉపరకం", hiddenOnMobile: true },
      ]}
      exportColumns={[
        { key: "pradhanyam", label: "ప్రాధాన్యం" },
        { key: "nirvachanam", label: "నిర్వచనం" },
      ]}
      titleKey="samasam"
      highlightKey="vigraha"
      toolName="samasa_mala"
      examples={["పీతాంబరుడు తెరువు", "ద్విగు వెతుకు", "ఎన్ని"]}
      renderDetail={(row) => (
        <Box sx={{ pr: 4 }}>
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#2d6a4f" }}>{row.samasam}</Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            = {row.vigraha}
          </Typography>
          <Field label="సమాసం" value={`${row.rakam} · ${row.uparakam}`} />
          <Field label="ప్రాధాన్యం" value={row.pradhanyam} />
          <Field label="నిర్వచనం" value={row.nirvachanam} />
        </Box>
      )}
    />
  );
}

/* ---------- స్మృతిమాల ---------- */

type Story = { story_id: string; title: string; subtitle: string; story_text: string[] };

function StoryDetail({ row }: { row: RecordRow }) {
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speakTelugu(`${row.title}. ${row.katha}`, 0.95, () => setPlaying(false));
  };
  return (
    <Box sx={{ pr: 4 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        కథా భాగం {row.bhagam}
      </Typography>
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.4 }}>{row.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        {row.subtitle}
      </Typography>
      <Button
        size="small"
        variant={playing ? "contained" : "outlined"}
        startIcon={playing ? <StopRoundedIcon /> : <VolumeUpRoundedIcon />}
        onClick={toggle}
        sx={{ textTransform: "none", fontWeight: 700, mb: 1.5, borderRadius: "10px" }}
      >
        {playing ? "ఆపు" : "కథ వినండి"}
      </Button>
      <Typography sx={{ lineHeight: 1.9, whiteSpace: "pre-line", textAlign: "justify" }}>{row.katha}</Typography>
    </Box>
  );
}

export function SmruthiGrid({ stories }: { stories: Story[] }) {
  const rows = useMemo<RecordRow[]>(
    () =>
      stories.map((s, i) => ({
        id: s.story_id || String(i),
        bhagam: String(i + 1),
        title: s.title,
        subtitle: s.subtitle,
        katha: (s.story_text || []).join("\n\n"),
      })),
    [stories]
  );
  return (
    <TeluguDataGrid
      title="స్మృతిమాల"
      unitLabel="కథలు"
      rows={rows}
      columns={[
        { key: "bhagam", label: "భాగం", width: 80 },
        { key: "title", label: "శీర్షిక", big: true },
        { key: "subtitle", label: "ఉపశీర్షిక", hiddenOnMobile: true },
        { key: "katha", label: "కథ", preview: 90, hiddenOnMobile: true },
      ]}
      titleKey="title"
      toolName="smruthi_mala"
      examples={["పెళ్ళి వెతుకు", "ఎన్ని"]}
      renderDetail={(row) => <StoryDetail key={row.id} row={row} />}
    />
  );
}

/* ---------- కథామాల ---------- */

type AnyRecord = Record<string, unknown>;

/** JSON లో ఏ పేరుతో ఉన్నా విలువ తీసుకోవడం (title / story_title …); జాబితా అయితే కలుపుతుంది */
function pickText(o: AnyRecord, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) {
      const t = v.map((x) => String(x ?? "")).join("\n\n").trim();
      if (t) return t;
    } else if (v !== undefined && v !== null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

export function KathaGrid({
  stories,
  ageKey,
  ageGroups,
}: {
  stories: ReadonlyArray<AnyRecord>;
  /** పేజీలో ఎంచుకున్న వయస్సు; "all" అయితే అన్నీ */
  ageKey: string;
  ageGroups: ReadonlyArray<{ key: string; label: string }>;
}) {
  const rows = useMemo<RecordRow[]>(() => {
    const ageLabel = (k: string) => ageGroups.find((g) => g.key === k)?.label ?? k;
    return stories
      .filter((s) => ageKey === "all" || String(s.age_group ?? "") === ageKey)
      .map((s, i) => ({
        id: pickText(s, ["id", "story_id"]) || String(i),
        title: pickText(s, ["title", "story_title", "name", "heading"]),
        vayassu: ageLabel(String(s.age_group ?? "")),
        neethi: pickText(s, ["moral", "neethi", "nethi", "lesson", "moral_te"]),
        katha: pickText(s, ["story", "content", "text", "story_text", "body", "paragraphs"]),
      }));
  }, [stories, ageKey, ageGroups]);

  return (
    <TeluguDataGrid
      key={ageKey}
      title={ageKey === "all" ? "కథామాల" : `కథామాల — ${ageGroups.find((g) => g.key === ageKey)?.label ?? ""}`}
      unitLabel="కథలు"
      rows={rows}
      columns={[
        { key: "title", label: "కథ పేరు", big: true },
        { key: "vayassu", label: "వయస్సు", width: 130 },
        { key: "neethi", label: "నీతి", hiddenOnMobile: true },
      ]}
      exportColumns={[{ key: "katha", label: "కథ" }]}
      titleKey="title"
      highlightKey="neethi"
      toolName="katha_mala"
      examples={["నీతి వెతుకు", "ఎన్ని"]}
      renderDetail={(row) => <KathaDetail key={row.id} row={row} />}
    />
  );
}

function KathaDetail({ row }: { row: RecordRow }) {
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speakTelugu(`${row.title}. ${row.katha}${row.neethi ? `. నీతి: ${row.neethi}` : ""}`, 0.9, () => setPlaying(false));
  };
  return (
    <Box sx={{ pr: 4 }}>
      <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.4 }}>{row.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        {row.vayassu}
      </Typography>
      <Button
        size="small"
        variant={playing ? "contained" : "outlined"}
        startIcon={playing ? <StopRoundedIcon /> : <VolumeUpRoundedIcon />}
        onClick={toggle}
        sx={{ textTransform: "none", fontWeight: 700, mb: 1.5, borderRadius: "10px" }}
      >
        {playing ? "ఆపు" : "కథ వినండి"}
      </Button>
      {row.katha && <Typography sx={{ lineHeight: 1.9, whiteSpace: "pre-line", textAlign: "justify", mb: 1.5 }}>{row.katha}</Typography>}
      <Field label="నీతి" value={row.neethi} />
    </Box>
  );
}

/* ---------- సామెతల మాల ---------- */

type SametaItem = { id: string; text: string };

/** public/ssmetalamala/<file>.json — SametaluList వాడే అదే files */
async function loadSametalu(file: string): Promise<SametaItem[]> {
  try {
    const res = await fetch(`/ssmetalamala/${file}.json`);
    if (!res.ok) return [];
    const data = (await res.json()) as { sametalu?: SametaItem[] };
    return data.sametalu ?? [];
  } catch {
    return [];
  }
}

export function SametaluGrid({
  letter,
  fileMap,
}: {
  /** పేజీలో ఎంచుకున్న అక్షరం */
  letter: string;
  /** SAMETALU_FILE_MAP (అక్షరం → file పేరు) */
  fileMap: Record<string, string>;
}) {
  const [allLetters, setAllLetters] = useState(false);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const letters = allLetters ? Object.keys(fileMap) : [letter];
    // అన్ని అక్షరాలు: ఒకేసారి అన్ని files (బ్రౌజర్ cache తో వేగంగా)
    Promise.all(letters.map(async (l) => ({ l, items: await loadSametalu(fileMap[l]) }))).then((groups) => {
      if (!alive) return;
      setRows(
        groups.flatMap(({ l, items }) =>
          items.map((s, i) => ({ id: `${l}-${s.id ?? i}-${i}`, sametha: s.text, aksharam: l }))
        )
      );
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [letter, allLetters, fileMap]);

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={<Switch checked={allLetters} onChange={(e) => setAllLetters(e.target.checked)} />}
        label={allLetters ? "అన్ని అక్షరాల సామెతలు" : `"${letter}" సామెతలు మాత్రమే — అన్నీ చూడాలంటే ఆన్ చేయండి`}
        sx={{ mx: 0 }}
      />
      {loading ? (
        <Skeleton variant="rounded" width="100%" height={360} />
      ) : (
        <TeluguDataGrid
          key={allLetters ? "all" : letter}
          title={allLetters ? "సామెతల మాల" : `సామెతల మాల — ${letter}`}
          unitLabel="సామెతలు"
          rows={rows}
          columns={[
            { key: "sametha", label: "సామెత" },
            { key: "aksharam", label: "అక్షరం", width: 90 },
          ]}
          titleKey="sametha"
          speakKey="sametha"
          toolName="sametalu_mala"
          examples={["కోతి వెతుకు", "ఎన్ని"]}
        />
      )}
    </Stack>
  );
}