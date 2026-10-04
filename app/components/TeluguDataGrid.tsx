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
  Chip,
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
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";

import { CloseIcon } from "@yuktishaalaa/yuktai";
import type * as Yuktai from "@yuktishaalaa/yuktai";
import type { GridColumn, GridTheme, YuktaiGridRule } from "@yuktishaalaa/yuktai";

import {
  PDF_THEMES,
  SITE_FONT,
  ensureFontLoaded,
  exportRecordsToExcel,
  exportRecordsToJson,
  exportRecordsToPdf,
  fetchTeluguFonts,
  findFont,
  fontStack,
  type PdfThemeId,
  type RecordColumn,
  type RecordRow,
  type TeluguFont,
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
  /* ---------- సాధారణ ప్రశ్నల కోసం (అన్నీ ఐచ్ఛికం) ---------- */
  /** మూలం / వర్గం column — "జంధ్యాల పద్యాలు", "అచ్చులు మాత్రమే", "ఎక్కడ ఉంది" */
  groupKey?: string;
  /** ఆ column పేరు, ఉదా: "కవి", "మాల", "వయస్సు" */
  groupLabel?: string;
  /** వర్గం పేరుకి వినియోగదారులు వాడే ఇతర పదాలు, ఉదా: { "సామెతలమాల": ["సామెత"] } */
  groupAliases?: Record<string, string[]>;
  /** data లోనే ఉన్న అర్థం — నీతి, నియమం, విగ్రహం, భావం */
  meaningKey?: string;
  meaningLabel?: string;
  /** పరీక్ష ప్రశ్న — వరుస నుండి ప్రశ్న (జవాబు = titleKey). null అయితే ఆ వరుస వదిలేస్తుంది */
  quizAsk?: (row: RecordRow) => string | null;
  /** PDF లో గరిష్ఠ అంశాలు — ఎక్కువైతే "ముందు filter చేయండి" (బ్రౌజర్ ఆగిపోకుండా) */
  pdfLimit?: number;
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

/* ---------- సాధారణ ప్రశ్నల సహాయకాలు ---------- */

const TE_DIGITS = "౦౧౨౩౪౫౬౭౮౯";
const asciiDigits = (s: string) => s.replace(/[౦-౯]/g, (d) => String(TE_DIGITS.indexOf(d)));
const numbersIn = (s: string) => (asciiDigits(s).match(/\d+/g) ?? []).map(Number);
const fmt = (n: number) => n.toLocaleString("en-IN");
const pickRandom = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

/** ప్రశ్నలో ఉన్న వర్గం — పొడవైనది ముందు; 1–2 అక్షరాల వర్గాలు ("క") పూర్తి పదంగా ఉంటేనే */
function findGroup(input: string, values: string[], aliases?: Record<string, string[]>): string | undefined {
  const text = norm(input);
  const words = new Set(text.split(/[\s,?!.]+/));
  const candidates: [string, string][] = [];
  for (const v of values) {
    candidates.push([v, v]);
    for (const a of aliases?.[v] ?? []) candidates.push([a, v]);
  }
  candidates.sort((a, b) => b[0].length - a[0].length);
  return candidates.find(([word]) => (word.length <= 2 ? words.has(norm(word)) : text.includes(norm(word))))?.[1];
}

/** "క తో మొదలయ్యే", "అ తో సామెతలు" → "క" */
function startsWithTerm(input: string): string | undefined {
  return norm(input).match(/(\S+)\s+తో(\s|$)/)?.[1];
}

/** వరుసగా చదవడం (ఒకదాని తర్వాత ఒకటి) */
function speakQueue(texts: string[]) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voice = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith("te"));
  for (const t of texts) {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "te-IN";
    u.rate = 0.8;
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }
}

type QuizState = { prompt: string; answerId: string; optionIds: string[] } | null;

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
  pdfLimit,
  groupKey,
  groupLabel = "వర్గం",
  groupAliases,
  meaningKey,
  meaningLabel = "అర్థం",
  quizAsk,
}: Props) {
  const mui = useTheme();
  const [theme, setTheme] = useState<GridTheme>("default");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [job, setJob] = useState<{ percent: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = job !== null && job.percent < 100;

  /* PDF ఫాంట్ (పద్యాలు, శతకాల పట్టిక లాగే — main.py 59 fonts) మరియు రంగుల థీమ్ */
  const [fonts, setFonts] = useState<TeluguFont[]>([SITE_FONT]);
  const [fontId, setFontId] = useState<string>(SITE_FONT.id);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeId>("neeli");
  useEffect(() => {
    let alive = true;
    fetchTeluguFonts().then((list) => alive && setFonts(list));
    return () => {
      alive = false;
    };
  }, []);
  const pdfFont = findFont(fonts, fontId);

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

  /* ================================================================ */
  /* తెలుగు ప్రశ్నలు — మొదట సరిపోయిన నియమం నడుస్తుంది, కాబట్టి క్రమం ముఖ్యం. */
  /* వెతకడం, క్రమం, వడపోత grid సొంత tools తో (filter, sort, clear_filters). */
  /* ================================================================ */
  const [quiz, setQuiz] = useState<QuizState>(null);
  const currentIdRef = useRef<string | null>(null);
  currentIdRef.current = selectedId;

  const groupValues = useMemo(
    () => (groupKey ? [...new Set(rows.map((r) => r[groupKey]).filter(Boolean))] : []),
    [rows, groupKey]
  );

  const rules = useMemo<YuktaiGridRule<RecordRow>[]>(() => {
    const title = (r?: RecordRow) => (r ? r[titleKey] : "");
    const textLength = (r: RecordRow) => Math.max(...columns.map((c) => (r[c.key] ?? "").length), 0);
    const inGroup = (data: RecordRow[], input: string) => {
      const g = groupKey ? findGroup(input, groupValues, groupAliases) : undefined;
      return { group: g, list: g && groupKey ? data.filter((r) => r[groupKey] === g) : data };
    };
    const show = async (row: RecordRow, executeTool: (n: string, i?: Record<string, unknown>) => Promise<unknown>) => {
      void executeTool("highlight", { ids: [row.id] });
      openRef.current(row);
    };
    const ex = (word: string) => `ఉదా: "${title(rows[0])} ${word}"`;

    const list: YuktaiGridRule<RecordRow>[] = [];

    /* 0. పరీక్షకు జవాబు — పరీక్ష జరుగుతున్నప్పుడు మాత్రమే */
    if (quiz) {
      const options = quiz.optionIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as RecordRow[];
      list.push({
        name: "quiz-answer",
        phrases: ["1", "2", "3", "౧", "౨", "౩", ...options.map((o) => title(o))],
        description: "Answer the current quiz.",
        execute: ({ input, executeTool }) => {
          const n = numbersIn(input)[0];
          const chosen = n ? options[n - 1] : options.find((o) => norm(input).includes(norm(title(o))));
          const answer = rows.find((r) => r.id === quiz.answerId);
          setQuiz(null);
          if (answer) void show(answer, executeTool);
          if (!chosen) return `జవాబు: "${title(answer)}". మళ్ళీ "పరీక్ష" అనండి.`;
          return chosen.id === quiz.answerId
            ? `🎉 సరైన జవాబు! "${title(answer)}". ఇంకొకటి కావాలంటే "పరీక్ష" అనండి.`
            : `❌ కాదు. సరైన జవాబు: "${title(answer)}". మళ్ళీ "పరీక్ష" అనండి.`;
        },
      });
    }

    /* 1. సహాయం */
    list.push({
      name: "help",
      phrases: ["ఏం అడగవచ్చు", "ఏమి అడగవచ్చు", "సహాయం", "help"],
      description: "What can be asked.",
      execute: () =>
        [
          `ఇలా అడగండి: ${examples.join(" • ")}`,
          `🔍 "X వెతుకు" · "క తో మొదలయ్యేవి"${groupKey ? ` · "${groupValues[0] ?? ""} మాత్రమే"` : ""}`,
          `📖 "X తెరువు" · "X వినిపించు" · "తర్వాతది" · "ముందుది" · "మొదటిది" · "చివరిది" · "10వది" · "ఏదైనా ఒకటి" · "ఈరోజుది"`,
          `🔢 "ఎన్ని" · "క తో ఎన్ని"${groupKey ? ` · "${groupLabel} వారీగా ఎన్ని" · "X ఎక్కడ ఉంది"` : ""}`,
          `🗂️ "అక్షర క్రమంలో" · "పొడవైనది" · "చిన్నది" · "అన్నీ చూపించు"`,
          meaningKey ? `🧠 "X ${meaningLabel}"` : "",
          quizAsk ? `🎓 "పరీక్ష"` : "",
        ]
          .filter(Boolean)
          .join("\n"),
    });

    /* 2. పరీక్ష */
    if (quizAsk) {
      list.push({
        name: "quiz",
        phrases: ["పరీక్ష", "క్విజ్", "ప్రశ్న అడుగు", "quiz", "test me"],
        description: "Ask a quiz question from the grid data.",
        execute: ({ input, data }) => {
          const pool = inGroup(data, input).list.filter((r) => quizAsk(r));
          if (pool.length < 3) return "పరీక్షకు సరిపడా అంశాలు లేవు.";
          const answer = pickRandom(pool);
          const prompt = quizAsk(answer)!;
          const wrong = shuffle(pool.filter((r) => title(r) !== title(answer) && quizAsk(r) !== prompt)).slice(0, 2);
          const options = shuffle([answer, ...wrong]);
          setQuiz({ prompt, answerId: answer.id, optionIds: options.map((o) => o.id) });
          return `❓ ${prompt}\n${options.map((o, k) => `${k + 1}) ${title(o)}`).join("\n")}\nసంఖ్య చెప్పండి (1, 2, 3).`;
        },
      });
    }

    /* 3. ఆపడం, అన్నీ వినడం */
    list.push(
      {
        name: "stop",
        phrases: ["ఆపు", "ఆపండి", "stop"],
        description: "Stop speaking.",
        execute: () => {
          if (typeof window !== "undefined") window.speechSynthesis?.cancel();
          return "⏹️ ఆపాను.";
        },
      },
      {
        name: "speak-all",
        phrases: ["అన్నీ వినిపించు", "అన్ని వినిపించు", "అన్నీ చదువు"],
        description: "Read the first 20 items aloud.",
        execute: ({ input, data }) => {
          const { list: subset } = inGroup(data, input);
          speakQueue(subset.slice(0, 20).map((r) => r[speakKey ?? titleKey]));
          return `🔊 మొదటి ${Math.min(20, subset.length)} వినిపిస్తున్నాను. ఆపాలంటే "ఆపు".`;
        },
      }
    );

    /* 4. వడపోత / క్రమం తీసేయడం */
    list.push({
      name: "clear",
      phrases: ["అన్నీ చూపించు", "అన్ని చూపించు", "వడపోత తీసేయి", "ఫిల్టర్ తీసేయి", "రీసెట్", "reset"],
      description: "Remove filters and sorting.",
      execute: async ({ executeTool }) => {
        await executeTool("clear_filters", {});
        await executeTool("clear_sort", {});
        return `అన్ని ${unitLabel} చూపిస్తున్నాను.`;
      },
    });

    /* 5. ఎక్కడ ఉంది (విభాగాల వారీగా) */
    if (groupKey) {
      list.push({
        name: "where",
        phrases: ["ఎక్కడ", "ఏ మాల", `ఏ ${groupLabel}`],
        description: "Which group contains a word.",
        execute: ({ input, data }) => {
          const term = norm(input)
            .replace(/ఎక్కడ(ెక్కడ)?|ఉంది|ఉన్నాయి|ఏ\s+\S+లో|ఏ\s+మాల(లో)?|[?？]/g, " ")
            .trim()
            .split(/\s+/)[0];
          if (!term) return `ఏ పదం? ఉదా: "కోతి ఎక్కడ ఉంది"`;
          const counts = new Map<string, number>();
          for (const r of data) {
            if (columns.some((c) => (r[c.key] ?? "").includes(term))) counts.set(r[groupKey], (counts.get(r[groupKey]) ?? 0) + 1);
          }
          if (!counts.size) return `"${term}" ఎక్కడా దొరకలేదు.`;
          const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${fmt(n)}`);
          return `"${term}": ${parts.join(" · ")}`;
        },
      });
    }

    /* 6. లెక్క — మొత్తం / "క తో ఎన్ని" / "అచ్చులు ఎన్ని" / వర్గం వారీగా */
    list.push({
      name: "count",
      phrases: ["ఎన్ని", "వరుసలు", "లెక్క", "మొత్తం", "how many", "count"],
      description: "How many items, optionally by group or first letter.",
      execute: ({ input, data }) => {
        const prefix = startsWithTerm(input);
        if (prefix) {
          const n = data.filter((r) => norm(title(r)).startsWith(norm(prefix))).length;
          return `"${prefix}" తో మొదలయ్యేవి ${fmt(n)}.`;
        }
        const { group, list: subset } = inGroup(data, input);
        if (group) return `${group}: ${fmt(subset.length)} ${unitLabel}.`;
        if (!groupKey) return `ఈ పట్టికలో మొత్తం ${fmt(data.length)} ${unitLabel} ఉన్నాయి.`;
        const counts = new Map<string, number>();
        for (const r of data) counts.set(r[groupKey], (counts.get(r[groupKey]) ?? 0) + 1);
        const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([g, n]) => `${g} ${fmt(n)}`);
        return `మొత్తం ${fmt(data.length)} ${unitLabel}${counts.size > 1 ? `: ${parts.join(" · ")}${counts.size > 15 ? " …" : ""}` : "."}`;
      },
    });

    /* 7. అర్థం (data లోనే) */
    list.push({
      name: "meaning",
      phrases: ["అర్థం", "భావం", "నియమం", "విగ్రహం", "నీతి", "వివరణ", meaningLabel],
      description: "Meaning from the data.",
      execute: ({ input, data, executeTool }) => {
        if (!meaningKey) return `ఈ మాలలో ${meaningLabel} data లో లేదు — AI సహాయం త్వరలో.`;
        const row = findMentioned(input, data, titleKey) ?? data.find((r) => r.id === currentIdRef.current);
        if (!row) return `ఏది? ${ex(meaningLabel)}`;
        void show(row, executeTool);
        return row[meaningKey] ? `"${title(row)}" — ${meaningLabel}: ${row[meaningKey]}` : `"${title(row)}" కు ${meaningLabel} లేదు.`;
      },
    });

    /* 8. తర్వాత / ముందు / మొదటి / చివరి */
    const step = (dir: 1 | -1) => (data: RecordRow[], executeTool: Parameters<typeof show>[1]) => {
      const i = data.findIndex((r) => r.id === currentIdRef.current);
      const row = data[(i + dir + data.length) % data.length];
      if (!row) return "ఏమీ లేవు.";
      void show(row, executeTool);
      return `${dir > 0 ? "తర్వాతది" : "ముందుది"}: "${title(row)}"`;
    };
    list.push(
      {
        name: "next",
        phrases: ["తర్వాత", "తరువాత", "next"],
        description: "Open the next item.",
        execute: ({ data, executeTool }) => step(1)(data, executeTool),
      },
      {
        name: "previous",
        phrases: ["ముందుది", "వెనుకది", "గతది", "previous"],
        description: "Open the previous item.",
        execute: ({ data, executeTool }) => step(-1)(data, executeTool),
      },
      {
        name: "first-last",
        phrases: ["మొదటి", "మొదటిది", "చివరి", "చివరిది", "first", "last"],
        description: "Open the first or last item.",
        execute: ({ input, data, executeTool }) => {
          const { list: subset } = inGroup(data, input);
          const last = /చివర|last/.test(input);
          const row = last ? subset[subset.length - 1] : subset[0];
          if (!row) return "ఏమీ లేవు.";
          void show(row, executeTool);
          return `${last ? "చివరిది" : "మొదటిది"}: "${title(row)}"`;
        },
      }
    );

    /* 9. సంఖ్యతో — "10వది", "జంధ్యాల 10వ పద్యం", గీత "2-47" */
    list.push({
      name: "number",
      phrases: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ...TE_DIGITS.split("")],
      description: "Open the Nth item.",
      execute: ({ input, data, executeTool }) => {
        const nums = numbersIn(input);
        const { list: subset } = inGroup(data, input);
        let row: RecordRow | undefined;
        if (nums.length >= 2) {
          const [a, b] = nums;
          const re = new RegExp(`(^|\\D)${a}(\\D+)${b}(\\D|$)`);
          row = subset.find((r) => re.test(asciiDigits(title(r))));
        }
        row ??= subset[nums[0] - 1];
        if (!row) return `${fmt(nums[0])}వది లేదు — మొత్తం ${fmt(subset.length)} మాత్రమే.`;
        void show(row, executeTool);
        return `"${title(row)}"`;
      },
    });

    /* 10. యాదృచ్ఛికం / ఈరోజుది */
    list.push({
      name: "random",
      phrases: ["ఏదైనా", "యాదృచ్ఛిక", "ఈరోజు", "నేటి", "random", "today"],
      description: "Open a random item (or today's item).",
      execute: ({ input, data, executeTool }) => {
        const { list: subset } = inGroup(data, input);
        if (!subset.length) return "ఏమీ లేవు.";
        const today = /ఈరోజు|నేటి|today/.test(input);
        const day = Math.floor(Date.now() / 86_400_000);
        const row = today ? subset[day % subset.length] : pickRandom(subset);
        void show(row, executeTool);
        return `${today ? "🌅 ఈరోజుది" : "🎲"}: "${title(row)}"`;
      },
    });

    /* 11. పొడవు — సంఖ్యల column లేకపోయినా "అత్యధికం" */
    list.push({
      name: "length",
      phrases: ["పొడవైన", "పొడవు", "పెద్దది", "పెద్ద", "చిన్నది", "చిన్న", "longest", "shortest"],
      description: "Longest or shortest item.",
      execute: ({ input, data, executeTool }) => {
        const { list: subset } = inGroup(data, input);
        if (!subset.length) return "ఏమీ లేవు.";
        const shortest = /చిన్న|shortest/.test(input);
        const sorted = [...subset].sort((a, b) => (shortest ? textLength(a) - textLength(b) : textLength(b) - textLength(a)));
        const row = sorted[0];
        const ties = sorted.filter((r) => textLength(r) === textLength(row)).length;
        void show(row, executeTool);
        return `${shortest ? "అతి చిన్నది" : "అతి పొడవైనది"}: "${title(row)}" (${fmt(textLength(row))} అక్షరాలు)${ties > 1 ? ` · ఇలాంటివి ఇంకా ${ties - 1}` : ""}`;
      },
    });

    /* 12. అక్షర క్రమం (grid sort tool) */
    list.push({
      name: "sort",
      phrases: ["క్రమంలో", "క్రమం", "అక్షర క్రమ", "sort"],
      description: "Sort by title.",
      execute: async ({ input, executeTool }) => {
        const desc = /వెనుక|తిరగ|desc/.test(input);
        await executeTool("sort", { key: titleKey, direction: desc ? "desc" : "asc" });
        return `${desc ? "వెనుక నుండి" : "అక్షర"} క్రమంలో అమర్చాను.`;
      },
    });

    /* 13. మొదటి అక్షరంతో (grid filter tool) */
    list.push({
      name: "starts-with",
      phrases: [" తో మొదల", " తో ప్రారంభ", " తో "],
      description: "Filter items starting with a letter.",
      execute: async ({ input, data, executeTool }) => {
        const prefix = startsWithTerm(input);
        if (!prefix) return `ఏ అక్షరం? ఉదా: "క తో మొదలయ్యేవి"`;
        await executeTool("filter", { key: titleKey, operator: "startsWith", value: prefix });
        const n = data.filter((r) => norm(title(r)).startsWith(norm(prefix))).length;
        return `"${prefix}" తో మొదలయ్యేవి ${fmt(n)}. అన్నీ చూడాలంటే "అన్నీ చూపించు".`;
      },
    });

    /* 14. వినడం, తెరవడం (ముందులాగే) */
    list.push(
      {
        name: "speak",
        phrases: ["వినిపించు", "వినిపించండి", "చదువు", "speak"],
        description: "Read an item aloud.",
        execute: ({ input, data, executeTool }) => {
          const named = findMentioned(input, data, titleKey);
          const g = !named && groupKey ? findGroup(input, groupValues, groupAliases) : undefined;
          if (g && groupKey) {
            const subset = data.filter((r) => r[groupKey] === g).slice(0, 20);
            speakQueue(subset.map((r) => r[speakKey ?? titleKey]));
            return `🔊 ${g}: మొదటి ${subset.length} వినిపిస్తున్నాను. ఆపాలంటే "ఆపు".`;
          }
          const row = named ?? data.find((r) => r.id === currentIdRef.current);
          if (!row) return `ఏది? ${ex("వినిపించు")}`;
          void executeTool("highlight", { ids: [row.id] });
          speakTelugu(row[speakKey ?? titleKey]);
          return `🔊 "${title(row)}" వినిపిస్తున్నాను.`;
        },
      },
      {
        name: "open",
        phrases: ["తెరువు", "తెరవండి", "చూపించు", "చూపించండి", "చూపు", "open", "show"],
        description: "Open one item.",
        execute: ({ input, data, executeTool }) => {
          const row = findMentioned(input, data, titleKey);
          if (!row) {
            const g = groupKey ? findGroup(input, groupValues, groupAliases) : undefined;
            if (g && groupKey) {
              void executeTool("filter", { key: groupKey, operator: "equals", value: g });
              return `${g}: ${fmt(data.filter((r) => r[groupKey] === g).length)} ${unitLabel} చూపిస్తున్నాను.`;
            }
            return `ఏది? ${ex("తెరువు")}`;
          }
          void show(row, executeTool);
          return `"${title(row)}" తెరుస్తున్నాను.`;
        },
      }
    );

    /* 15. వర్గం మాత్రమే — చివర (పై నియమాలు సరిపోకపోతేనే) */
    if (groupKey) {
      list.push({
        name: "group",
        phrases: [
          "మాత్రమే",
          ...groupValues.filter((v) => v.length > 2),
          ...Object.values(groupAliases ?? {}).flat(),
        ],
        description: "Show one group only.",
        execute: async ({ input, data, executeTool }) => {
          const g = findGroup(input, groupValues, groupAliases);
          if (!g) return `ఏ ${groupLabel}? ఉదా: "${groupValues[0] ?? ""} మాత్రమే"`;
          await executeTool("filter", { key: groupKey, operator: "equals", value: g });
          const n = data.filter((r) => r[groupKey] === g).length;
          return `${g}: ${fmt(n)} ${unitLabel} చూపిస్తున్నాను. అన్నీ చూడాలంటే "అన్నీ చూపించు".`;
        },
      });
    }

    return list;
  }, [
    rows,
    columns,
    examples,
    titleKey,
    speakKey,
    unitLabel,
    groupKey,
    groupLabel,
    groupAliases,
    groupValues,
    meaningKey,
    meaningLabel,
    quizAsk,
    quiz,
  ]);

  /* PDF / Excel — పట్టికలోని అన్నీ */
  const runExport = (kind: "pdf" | "excel" | "json") => {
    if (busy || !rows.length) return;
    setError(null);
    if (kind === "pdf" && pdfLimit && rows.length > pdfLimit) {
      setError(
        `PDF కి గరిష్ఠంగా ${pdfLimit} ${unitLabel} మాత్రమే. ఇప్పుడు ${rows.length} ఉన్నాయి — పైన విభాగం ఎంచుకుని తగ్గించండి. (Excel కి పరిమితి లేదు.)`
      );
      return;
    }
    const data = { title, unitLabel, rows, columns: [...columns, ...exportColumns], titleKey, highlightKey };
    const onProgress = (percent: number, message: string) => setJob({ percent, message });
    // await లేకుండా — iPhone లో PDF tab వెంటనే తెరుచుకోవాలి
    (kind === "pdf"
      ? exportRecordsToPdf(data, onProgress, pdfFont, pdfTheme)
      : kind === "excel"
        ? exportRecordsToExcel(data, onProgress)
        : exportRecordsToJson(data, onProgress))
      .then(() => setTimeout(() => setJob(null), 3000))
      .catch((err: unknown) => {
        console.error(`[${toolName}] ${kind} export failed:`, err);
        setJob(null);
        setError(
          err instanceof Error && err.message === "Popup blocked"
            ? "బ్రౌజర్ కొత్త tab ను ఆపింది. ఈ సైట్‌కి popups అనుమతించి మళ్ళీ ప్రయత్నించండి."
            : `${kind === "pdf" ? "PDF" : kind === "excel" ? "Excel" : "JSON"} తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి.`
        );
      });
  };

  const border = alpha(mui.palette.divider, 0.9);

  /* ---------- మన సొంత సూచన చిప్స్ → grid chat లోకి నేరుగా ---------- */
  // package లోని 3 చిప్స్ (ఎన్ని వరుసలు / శోధించండి / క్రమం) స్థిరం; ఇవి ప్రతి మాలకు సొంతం.
  const gridBoxRef = useRef<HTMLDivElement>(null);
  const [askNote, setAskNote] = useState<string | null>(null);
  const [showAllAsks, setShowAllAsks] = useState(false);

  /**
   * అన్ని ప్రశ్నల రకాలు, వర్గాల వారీగా — ఉదాహరణలు ఈ మాల నిజమైన data నుండే,
   * కాబట్టి ప్రతి చిప్ నొక్కితే నిజంగా జవాబు వస్తుంది.
   * ఈ మాలలో లేని సామర్థ్యాలు (వర్గం / అర్థం / పరీక్ష) ఆటోమేటిక్‌గా దాగుతాయి.
   */
  const quickAskGroups = useMemo(() => {
    // పొట్టి శీర్షిక ఉన్న వరుస (చిప్ చిన్నగా ఉండటానికి)
    const sample = [...rows.slice(0, 60)].filter((r) => r[titleKey]).sort((a, b) => a[titleKey].length - b[titleKey].length)[0];
    const t = sample?.[titleKey] ?? "";
    const letter = t.charAt(0);
    const word = (rows[1]?.[titleKey] ?? t).split(/\s+/)[0] ?? "";
    const g = groupValues.find((v) => v.length > 2) ?? groupValues[0];

    const groups: { title: string; items: (string | false | undefined)[] }[] = [
      {
        title: "🔍 కనుక్కోవడం",
        items: [word && `${word} వెతుకు`, letter && `${letter} తో మొదలయ్యేవి`, g && `${g} మాత్రమే`, groupKey && word && `${word} ఎక్కడ ఉంది`],
      },
      {
        title: "📖 చూడటం",
        items: [t && `${t} తెరువు`, "తర్వాతది", "ముందుది", "మొదటిది", "చివరిది", rows.length >= 10 && "10వది", "ఏదైనా ఒకటి", "ఈరోజుది"],
      },
      {
        title: "🔢 లెక్కించడం",
        items: ["ఎన్ని", letter && `${letter} తో ఎన్ని`, groupKey && `${groupLabel} వారీగా ఎన్ని`, g && `${g} ఎన్ని`],
      },
      {
        title: "🗂️ క్రమం, వడపోత",
        items: ["అక్షర క్రమంలో", "పొడవైనది", "చిన్నది", "అన్నీ చూపించు"],
      },
      { title: "🧠 అర్థం", items: [meaningKey && t && `${t} ${meaningLabel}`] },
      {
        title: "🔊 వినడం",
        items: [t && `${t} వినిపించు`, "అన్నీ వినిపించు", g && `${g} వినిపించు`, "ఆపు"],
      },
      {
        title: "🎓 నేర్చుకోవడం",
        items: [quizAsk && "పరీక్ష", quizAsk && g && `${g} పరీక్ష`, "ఏం అడగవచ్చు"],
      },
    ];
    return groups
      .map((x) => ({ title: x.title, items: [...new Set(x.items.filter((i): i is string => Boolean(i)))] }))
      .filter((x) => x.items.length > 0);
  }, [rows, titleKey, groupKey, groupLabel, groupValues, meaningKey, meaningLabel, quizAsk]);

  /** మొదటి వరుసలో: ఈ మాల సొంత ప్రశ్నలు + ముఖ్యమైన సాధారణవి */
  const quickAsks = useMemo(
    () => [...new Set([...examples, "ఈరోజుది", "తర్వాతది", "ఎన్ని", ...(quizAsk ? ["పరీక్ష"] : [])])].slice(0, 8),
    [examples, quizAsk]
  );

  /** grid chat పెట్టెలో ప్రశ్న పెట్టి పంపడం (పెట్టె మూసి ఉంటే ముందు తెరుస్తుంది) */
  const askGrid = async (text: string) => {
    setAskNote(null);
    const root = gridBoxRef.current ?? document.body;
    const INPUT = 'input[aria-label="అడగండి"], input[placeholder^="ప్రశ్న లేదా"], input[aria-label="Ask"]';
    const OPEN = 'button[aria-label="AI సహాయకుడిని తెరవండి"], button[aria-label^="Open AI"]';
    let input = root.querySelector<HTMLInputElement>(INPUT) ?? document.querySelector<HTMLInputElement>(INPUT);
    if (!input) {
      (root.querySelector<HTMLButtonElement>(OPEN) ?? document.querySelector<HTMLButtonElement>(OPEN))?.click();
      await new Promise((r) => setTimeout(r, 200));
      input = root.querySelector<HTMLInputElement>(INPUT) ?? document.querySelector<HTMLInputElement>(INPUT);
    }
    if (!input) {
      setAskNote(`పట్టికలోని AI పెట్టె తెరిచి "${text}" అని అడగండి.`);
      return;
    }
    // React controlled input: native setter + input event, తర్వాత Enter
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    input.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
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
          <Button
            size="small"
            variant="outlined"
            color="info"
            disabled={!rows.length || busy}
            onClick={() => runExport("json")}
            startIcon={<DataObjectRoundedIcon fontSize="small" />}
            sx={buttonSx}
          >
            JSON
          </Button>
        </Stack>
      </Stack>

      {/* PDF ఎంపికలు — ఫాంట్ (59) మరియు రంగుల థీమ్ */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ px: 0.5 }}>
        <Select
          size="small"
          value={fontId}
          onChange={(e) => setFontId(String(e.target.value))}
          onOpen={() => fonts.slice(0, 80).forEach(ensureFontLoaded)}
          inputProps={{ "aria-label": "PDF ఫాంట్" }}
          startAdornment={<TextFieldsRoundedIcon fontSize="small" sx={{ mr: 0.75, color: "text.secondary" }} />}
          renderValue={(id) => `PDF ఫాంట్: ${findFont(fonts, String(id)).label}`}
          MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
          sx={{ minWidth: 220, minHeight: 40, flex: { xs: "1 1 auto", sm: "none" } }}
        >
          {fonts.map((f) => (
            <MenuItem key={f.id} value={f.id} sx={{ minHeight: 44, fontFamily: fontStack(f), fontSize: "1.05rem" }}>
              {f.label}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={pdfTheme}
          onChange={(e) => setPdfTheme(e.target.value as PdfThemeId)}
          inputProps={{ "aria-label": "PDF రంగుల థీమ్" }}
          startAdornment={<PaletteRoundedIcon fontSize="small" sx={{ mr: 0.75, color: "text.secondary" }} />}
          renderValue={(id) => `PDF థీమ్: ${PDF_THEMES.find((t) => t.id === id)?.label ?? ""}`}
          sx={{ minWidth: 200, minHeight: 40, flex: { xs: "1 1 auto", sm: "none" } }}
        >
          {PDF_THEMES.map((t) => (
            <MenuItem key={t.id} value={t.id} sx={{ minHeight: 44 }}>
              <Box component="span" sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: t.accent, mr: 1, display: "inline-block" }} />
              {t.label}
            </MenuItem>
          ))}
        </Select>
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

      {/* 💬 సూచన చిప్స్ — నొక్కితే AI కి అడుగుతుంది */}
      <Box sx={{ px: 0.5 }}>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ overflowX: "auto", pb: 0.5, scrollbarWidth: "thin", "&::-webkit-scrollbar": { height: 4 } }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, whiteSpace: "nowrap", color: "text.secondary" }}>
            💬 అడగండి:
          </Typography>
          {quickAsks.map((q) => (
            <Chip
              key={q}
              label={q}
              size="small"
              clickable
              variant="outlined"
              color="secondary"
              onClick={() => void askGrid(q)}
              sx={{ fontWeight: 700, flexShrink: 0, height: 32 }}
            />
          ))}
          <Chip
            label={showAllAsks ? "▴ తక్కువ" : `▾ అన్ని ప్రశ్నలు (${quickAskGroups.reduce((n, x) => n + x.items.length, 0)})`}
            size="small"
            clickable
            color="secondary"
            onClick={() => setShowAllAsks((v) => !v)}
            aria-expanded={showAllAsks}
            sx={{ fontWeight: 800, flexShrink: 0, height: 32 }}
          />
        </Stack>

        {/* అన్ని ప్రశ్నల రకాలు — వర్గాల వారీగా */}
        <Collapse in={showAllAsks} timeout={200} unmountOnExit>
          <Stack spacing={1} sx={{ mt: 1, p: 1.25, borderRadius: 2.5, border: `1px dashed ${border}`, bgcolor: "background.paper" }}>
            {quickAskGroups.map((grp) => (
              <Stack key={grp.title} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 130, color: "text.secondary" }}>
                  {grp.title}
                </Typography>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {grp.items.map((q) => (
                    <Chip
                      key={q}
                      label={q}
                      size="small"
                      clickable
                      variant="outlined"
                      onClick={() => void askGrid(q)}
                      sx={{ fontWeight: 600, height: 32, maxWidth: 260 }}
                    />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Collapse>
        {askNote && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {askNote}
          </Typography>
        )}
      </Box>

      {/* GRID */}
      <Box
        ref={gridBoxRef}
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
      examples={["కి వినిపించు", "క గుణింతం మాత్రమే", "క అన్నీ వినిపించు", "పరీక్ష"]}
      groupKey="vyanjanam"
      groupLabel="వ్యంజనం"
      meaningKey="peru"
      meaningLabel="అచ్చు గుర్తు"
      quizAsk={(r) => (r.peru && r.vyanjanam ? `"${r.vyanjanam}" + ${r.peru} = ?` : null)}
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
      examples={["గంట వినిపించు", "క తో మొదలయ్యేవి", "రెండక్షరాల పదాలు", "పరీక్ష"]}
      groupKey="rakam"
      groupLabel="రకం"
      groupAliases={{ "రెండక్షరాల పదం": ["రెండక్షర", "రెండు అక్షర"], "మూడు/నాలుగు అక్షరాలు": ["మూడక్షర", "నాలుగక్షర", "మూడు అక్షర", "నాలుగు అక్షర"] }}
      quizAsk={(r) => (r.aksharam ? `"${r.aksharam}" తో మొదలయ్యే పదం ఏది?` : null)}
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
      examples={["మునీంద్ర నియమం", "గుణసంధి మాత్రమే", "సంధి వారీగా ఎన్ని", "పరీక్ష"]}
      groupKey="sandhi"
      groupLabel="సంధి"
      meaningKey="niyamam"
      meaningLabel="నియమం"
      quizAsk={(r) => (r.before ? `${r.before} = ?` : null)}
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
      examples={["పీతాంబరుడు విగ్రహం", "ద్విగు సమాసము మాత్రమే", "పరీక్ష"]}
      groupKey="rakam"
      groupLabel="సమాసం"
      meaningKey="vigraha"
      meaningLabel="విగ్రహం"
      quizAsk={(r) => (r.vigraha ? `"${r.vigraha}" — ఏ సమాసం?` : null)}
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
      examples={["3వ భాగం", "తర్వాతది", "పెళ్ళి ఎక్కడ", "ఈరోజుది"]}
      meaningKey="subtitle"
      meaningLabel="సారాంశం"
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
      examples={["ఏదైనా కథ", "చిన్నది", "నీతి", "పరీక్ష"]}
      groupKey="vayassu"
      groupLabel="వయస్సు"
      meaningKey="neethi"
      meaningLabel="నీతి"
      quizAsk={(r) => (r.neethi ? `నీతి: "${r.neethi}" — ఏ కథ?` : null)}
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
          examples={["కోతి వెతుకు", "క తో ఎన్ని", "ఈరోజుది", "పరీక్ష"]}
          groupKey="aksharam"
          groupLabel="అక్షరం"
          meaningLabel="అర్థం"
          quizAsk={(r) => {
            const words = (r.sametha ?? "").split(/\s+/);
            return words.length >= 4 ? `"${words.slice(0, 2).join(" ")} …" — పూర్తి సామెత ఏది?` : null;
          }}
        />
      )}
    </Stack>
  );
}