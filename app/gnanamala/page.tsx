"use client";

/* ================================================================== */
/* జ్ఞానమాల — రత్నాలబాల సంపద అంతా ఒకే పట్టికలో                          */
/*                                                                    */
/* మొబైల్ / PWA వేగం కోసం:                                              */
/*  • పెద్ద data (కథలు, స్మృతి, వ్యాకరణం) వేరే chunk గా — మొదటి స్క్రీన్    */
/*    ముందు download కాదు                                               */
/*  • పద్యాలు: 13 requests → 1 (poems_all, CDN cache)                  */
/*  • ఒకేసారి 2 server పనులు మాత్రమే (85 requests ఒకేసారి కాదు)          */
/*  • నెమ్మది నెట్ / Data Saver: server మాలలు నొక్కినప్పుడే              */
/*  • పట్టిక ప్రతిసారి మొదటి నుండి కాకుండా, నేపథ్యంలో నవీకరణ               */
/* ================================================================== */

import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";

import TeluguDataGrid, { speakTelugu } from "@/app/components/TeluguDataGrid";
import type { RecordRow } from "@/app/components/exportPoems";
import { SAMETALU_FILE_MAP } from "@/app/types/sametalu";
import { AGE_GROUPS } from "@/app/types/kathamala";

/* ================================================================== */
/* మాలలు — సైట్ menu క్రమంలోనే                                           */
/* ================================================================== */

type SectionKey =
  | "padyalamala"
  | "mira"
  | "shatakalamala"
  | "smruthimala"
  | "kathamala"
  | "aksharamala"
  | "gunintamala"
  | "padalamala"
  | "sametalamala"
  | "sandhimala"
  | "samasamala"
  | "gita";

type Section = { key: SectionKey; label: string; link: string };

const GROUPS: { title: string; icon: string; sections: Section[] }[] = [
  {
    title: "సాహిత్యం",
    icon: "📚",
    sections: [
      { key: "padyalamala", label: "పద్యాలమాల", link: "/poems" },
      { key: "mira", label: "మిరా", link: "/mirapoems" },
      { key: "shatakalamala", label: "శతకాలమాల", link: "/shatakamu" },
      { key: "smruthimala", label: "స్మృతిమాల", link: "/smruthimala" },
      { key: "kathamala", label: "కథామాల", link: "/kathamala" },
    ],
  },
  {
    title: "వ్యాకరణం",
    icon: "📖",
    sections: [
      { key: "aksharamala", label: "అక్షరమాల", link: "/aksharamala" },
      { key: "gunintamala", label: "గుణింతమాల", link: "/guninta" },
      { key: "padalamala", label: "పదాలమాల", link: "/padalamala" },
      { key: "sametalamala", label: "సామెతలమాల", link: "/sametalu" },
      { key: "sandhimala", label: "సంధిమాల", link: "/sandhi" },
      { key: "samasamala", label: "సమాసముమాల", link: "/samasa" },
    ],
  },
  {
    title: "గీతామాల",
    icon: "🕉️",
    sections: [{ key: "gita", label: "భగవద్గీత", link: "/geeta" }],
  },
];

const ALL_SECTIONS = GROUPS.flatMap((g) => g.sections);
const ALL_KEYS = ALL_SECTIONS.map((s) => s.key);
const SECTION = Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, s])) as Record<SectionKey, Section>;

/* ఒకే download లో వచ్చే మాలలు = ఒక "unit" */
type UnitKey = "local" | "poems" | "aksharamala" | "sametalu" | "gita";
const UNIT_OF: Record<SectionKey, UnitKey> = {
  gunintamala: "local",
  padalamala: "local",
  sandhimala: "local",
  samasamala: "local",
  smruthimala: "local",
  kathamala: "local",
  padyalamala: "poems",
  mira: "poems",
  shatakalamala: "poems",
  aksharamala: "aksharamala",
  sametalamala: "sametalu",
  gita: "gita",
};
/** server పనుల ప్రాధాన్యత క్రమం */
const SERVER_UNITS: UnitKey[] = ["poems", "aksharamala", "sametalu", "gita"];
/** ఒకేసారి నడిచే server పనులు — మొబైల్ నెట్‌వర్క్ నిండిపోకుండా */
const SERVER_CONCURRENCY = 2;

type Status = "idle" | "loading" | "ready" | "error";
type SectionState = { status: Status; rows: RecordRow[] };
type Patch = Partial<Record<SectionKey, RecordRow[]>>;

/* ================================================================== */
/* సహాయకాలు                                                            */
/* ================================================================== */

type AnyRecord = Record<string, unknown>;

function pick(o: AnyRecord, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) {
      const t = v.map((x) => String(x ?? "")).join("\n").trim();
      if (t) return t;
    } else if (v !== undefined && v !== null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

function makeRow(key: SectionKey, id: string, sheershika: string, vishayam: string, mulam: string, vivaralu = ""): RecordRow {
  return { id: `${key}-${id}`, vibhagam: SECTION[key].label, sheershika, vishayam, mulam, vivaralu, link: SECTION[key].link } as RecordRow;
}

async function fetchJson(url: string, timeoutMs = 20000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** ఒకేసారి `limit` పనులు మాత్రమే */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

/** Data Saver / 2G — అప్పుడు server మాలలు నొక్కినప్పుడే */
function isSlowNetwork(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || /(^|-)2g$/.test(c?.effectiveType ?? "");
}

/* ================================================================== */
/* LOADERS — ప్రతి unit ఒక async పని                                     */
/* ================================================================== */

/** బ్రౌజర్‌లోని data — వేరే chunk గా (మొదటి స్క్రీన్ తర్వాత) */
async function loadLocal(): Promise<Patch> {
  const [bhasha, stories, seethamala] = await Promise.all([
    import("@/data/bhashaMala"),
    import("@/data/kids_stories_te.json"),
    import("@/data/Pingali_Seethamama.json"),
  ]);
  const { GUNINTA_MARKS, GUNINTA_NAMES, GUNINTA_VYANJANALU, PADALU_SWARALU, SAMASA_RULES, SANDHI_RULES, THREE_FOUR_LETTER, TWO_LETTER } =
    bhasha;

  const gunintamala = GUNINTA_VYANJANALU.flatMap((v) =>
    GUNINTA_MARKS.map((mark, i) => {
      const roopam = i === 0 ? v : i === 14 ? `${v}ం` : i === 15 ? `${v}ః` : v + mark;
      return makeRow("gunintamala", `${v}-${i}`, roopam, GUNINTA_NAMES[i] ?? "", `"${v}" గుణింతము`);
    })
  );

  const words = (list: string[], rakam: string, tag: string) =>
    list.map((w, i) =>
      makeRow("padalamala", `${tag}-${i}`, w, rakam, `"${w[0] ?? ""}" ${PADALU_SWARALU.includes(w[0]) ? "అచ్చుతో" : "హల్లుతో"}`)
    );
  const padalamala = [...words(TWO_LETTER, "రెండక్షరాల పదం", "2"), ...words(THREE_FOUR_LETTER, "మూడు/నాలుగు అక్షరాల పదం", "3")];

  const sandhimala = SANDHI_RULES.flatMap((r) =>
    r.examples.map((ex, i) =>
      makeRow(
        "sandhimala",
        `${r.id}-${i}`,
        ex.after,
        `${ex.before} → ${ex.after}\nసూత్రం: ${r.purva} + ${r.para} → ${r.result}`,
        `${r.name} (${r.category})`,
        r.rule
      )
    )
  );

  const samasamala = SAMASA_RULES.flatMap((r) => [
    ...r.subtypes.map((s, i) => makeRow("samasamala", `${r.id}-s${i}`, s.example, `= ${s.vigraha}`, `${r.name} · ${s.name}`, r.definition)),
    ...r.examples.map((e, i) => makeRow("samasamala", `${r.id}-e${i}`, e.samasa, `= ${e.vigraha}`, r.name, r.definition)),
  ]);

  const smruthimala = ((seethamala.default as { stories?: unknown }).stories as AnyRecord[] | undefined ?? []).map((s, i) =>
    makeRow("smruthimala", pick(s, ["story_id"]) || String(i), pick(s, ["title"]), pick(s, ["story_text"]), `భాగం ${i + 1}`, pick(s, ["subtitle"]))
  );

  const ageLabel = (k: string) => AGE_GROUPS.find((g) => g.key === k)?.label ?? k;
  const kathamala = ((stories.default as { stories?: unknown }).stories as AnyRecord[] | undefined ?? []).map((s, i) =>
    makeRow(
      "kathamala",
      pick(s, ["id", "story_id"]) || String(i),
      pick(s, ["title", "story_title", "name", "heading"]),
      pick(s, ["story", "content", "text", "story_text", "body", "paragraphs"]),
      `${ageLabel(String(s.age_group ?? ""))} వయస్సు`,
      pick(s, ["moral", "neethi", "nethi", "lesson", "moral_te"])
    )
  );

  return { gunintamala, padalamala, sandhimala, samasamala, smruthimala, kathamala };
}

/** పద్యాలు: ముందు ఒకే request (poems_all); పాత server అయితే కవి వారీగా (ఒకేసారి 4) */
async function loadPoems(): Promise<Patch> {
  let all: AnyRecord[];
  try {
    const data = await fetchJson("/api/main?endpoint=poems_all", 30000);
    if (!Array.isArray(data)) throw new Error("shape");
    all = data as AnyRecord[];
  } catch {
    const groups = await mapLimit(
      Array.from({ length: 13 }, (_, i) => i + 1),
      4,
      (id) => fetchJson(`/api/main?endpoint=poems&poet_id=${id}`).then((d) => (Array.isArray(d) ? (d as AnyRecord[]) : [])).catch(() => [])
    );
    all = groups.flat();
  }
  const out: Required<Pick<Patch, "padyalamala" | "mira" | "shatakalamala">> = { padyalamala: [], mira: [], shatakalamala: [] };
  for (const p of all) {
    const id = Number(p.poet_id);
    const key = id === 1 ? "padyalamala" : id === 2 ? "mira" : "shatakalamala";
    out[key].push(makeRow(key, pick(p, ["poem_id"]), pick(p, ["title"]), pick(p, ["content"]), pick(p, ["poet_name"]), pick(p, ["special_line"])));
  }
  return out;
}

async function loadAksharamala(): Promise<Patch> {
  const TYPE_TE: Record<string, string> = { swaralu: "అచ్చు", vyanjanalu: "హల్లు", gunintalu: "గుణింతం" };
  for (const size of [50, 20, 4]) {
    try {
      const url = (p: number) => `/api/aksharamala?search=&type=all&page=${p}&page_size=${size}`;
      const first = (await fetchJson(url(1))) as { items?: AnyRecord[]; page_count?: number };
      const pages = Array.from({ length: Math.max(0, (first.page_count ?? 1) - 1) }, (_, i) => i + 2);
      const rest = await mapLimit(pages, 3, (p) => fetchJson(url(p)) as Promise<{ items?: AnyRecord[] }>);
      const items = [...(first.items ?? []), ...rest.flatMap((r) => r.items ?? [])];
      return {
        aksharamala: items.map((a, i) =>
          makeRow("aksharamala", pick(a, ["id"]) || String(i), pick(a, ["letter"]), pick(a, ["word"]), TYPE_TE[String(a.type)] ?? "")
        ),
      };
    } catch {
      /* చిన్న సైజు ప్రయత్నిస్తాం */
    }
  }
  throw new Error("aksharamala");
}

/** సామెతలు: 50 చిన్న static files — CDN నుండి, ఒకేసారి 6 */
async function loadSametalu(): Promise<Patch> {
  const entries = Object.entries(SAMETALU_FILE_MAP as Record<string, string>);
  const groups = await mapLimit(entries, 6, async ([letter, file]) => {
    try {
      const data = (await fetchJson(`/ssmetalamala/${file}.json`)) as { sametalu?: { id?: string; text?: string }[] };
      return (data.sametalu ?? []).map((s, i) => makeRow("sametalamala", `${letter}-${s.id ?? i}-${i}`, s.text ?? "", "", `"${letter}" అక్షరం`));
    } catch {
      return [];
    }
  });
  return { sametalamala: groups.flat() };
}

/* ---------- గీత (/api/gita — రూపం ఏదైనా శ్లోకాలు వెతుకుతుంది) ---------- */
const GITA_TEXT = ["sloka", "shloka", "slokam", "verse_text", "telugu", "text_te", "text", "verse"];
const GITA_MEANING = ["meaning_te", "meaning", "bhavam", "bhavamu", "tatparyam", "translation", "explanation"];
const GITA_CHAPTER = ["chapter", "chapter_number", "chapter_no", "adhyaya", "adhyayam"];
const GITA_NUMBER = ["verse_number", "verse_no", "sloka_number", "number", "id"];

function collectSlokas(node: unknown, chapter: string, out: RecordRow[]) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSlokas(n, chapter, out));
    return;
  }
  if (!node || typeof node !== "object") return;
  const o = node as AnyRecord;
  const ch = pick(o, GITA_CHAPTER) || chapter;
  const text = GITA_TEXT.map((k) => o[k]).find((v) => typeof v === "string" && v.trim()) as string | undefined;
  if (text) {
    const num = pick(o, GITA_NUMBER);
    out.push(
      makeRow(
        "gita",
        `${ch}-${num || out.length}-${out.length}`,
        ch && num ? `అధ్యాయం ${ch} · శ్లోకం ${num}` : text.split("\n")[0].slice(0, 60),
        text.trim(),
        ch ? `భగవద్గీత — అధ్యాయం ${ch}` : "భగవద్గీత",
        pick(o, GITA_MEANING)
      )
    );
    return;
  }
  Object.values(o).forEach((v) => {
    if (v && typeof v === "object") collectSlokas(v, ch, out);
  });
}

async function loadGita(): Promise<Patch> {
  const out: RecordRow[] = [];
  collectSlokas(await fetchJson("/api/gita"), "", out);
  if (!out.length) {
    const chapters = await mapLimit(
      Array.from({ length: 18 }, (_, i) => i + 1),
      3,
      (n) => fetchJson(`/api/gita?chapter=${n}`).catch(() => null)
    );
    chapters.forEach((c, i) => collectSlokas(c, String(i + 1), out));
  }
  return { gita: out };
}

const LOADERS: Record<UnitKey, () => Promise<Patch>> = {
  local: loadLocal,
  poems: loadPoems,
  aksharamala: loadAksharamala,
  sametalu: loadSametalu,
  gita: loadGita,
};
const KEYS_OF_UNIT = (unit: UnitKey) => ALL_KEYS.filter((k) => UNIT_OF[k] === unit);

/* ================================================================== */
/* వివరాల పెట్టె                                                         */
/* ================================================================== */

function Detail({ r }: { r: RecordRow }) {
  return (
    <Box sx={{ pr: 4 }}>
      <Chip size="small" label={r.vibhagam} sx={{ mb: 1, fontWeight: 700 }} />
      <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1.5, mb: 0.5 }}>{r.sheershika}</Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        {r.mulam}
      </Typography>
      {r.vishayam && <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.9, mb: 1.5 }}>{r.vishayam}</Typography>}
      {r.vivaralu && (
        <Box sx={{ borderLeft: "3px solid", borderColor: "secondary.main", pl: 1.5, py: 0.5, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.7, whiteSpace: "pre-line" }}>{r.vivaralu}</Typography>
        </Box>
      )}
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          size="small"
          variant="outlined"
          startIcon={<VolumeUpRoundedIcon />}
          onClick={() => speakTelugu([r.sheershika, r.vishayam].filter(Boolean).join(". "), 0.9)}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", minHeight: 40 }}
        >
          వినండి
        </Button>
        <Button
          size="small"
          variant="contained"
          component={NextLink}
          href={r.link}
          endIcon={<OpenInNewRoundedIcon />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", minHeight: 40 }}
        >
          {r.vibhagam} పేజీకి వెళ్ళండి
        </Button>
      </Stack>
    </Box>
  );
}

/* ================================================================== */
/* PAGE                                                               */
/* ================================================================== */

const initialSections = (): Record<SectionKey, SectionState> =>
  Object.fromEntries(ALL_KEYS.map((k) => [k, { status: "idle", rows: [] }])) as unknown as Record<SectionKey, SectionState>;

export default function GnanamalaPage() {
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(initialSections);
  const [selected, setSelected] = useState<SectionKey[]>(ALL_KEYS);
  const [slowNet, setSlowNet] = useState(false);
  const started = useRef(new Set<UnitKey>());
  const alive = useRef(true);

  const setStatus = useCallback((keys: SectionKey[], status: Status, patch?: Patch) => {
    if (!alive.current) return;
    // నేపథ్య నవీకరణ — chips, scroll ఆగకుండా
    startTransition(() =>
      setSections((s) => {
        const next = { ...s };
        for (const k of keys) next[k] = { status, rows: patch?.[k] ?? s[k].rows };
        return next;
      })
    );
  }, []);

  /** ఒక unit ని (ఒక్కసారే) load చేయడం */
  const loadUnit = useCallback(
    async (unit: UnitKey) => {
      if (started.current.has(unit)) return;
      started.current.add(unit);
      const keys = KEYS_OF_UNIT(unit);
      setStatus(keys, "loading");
      try {
        const patch = await LOADERS[unit]();
        setStatus(keys, "ready", patch);
      } catch {
        started.current.delete(unit); // మళ్ళీ నొక్కితే ప్రయత్నించవచ్చు
        setStatus(keys, "error");
      }
    },
    [setStatus]
  );

  useEffect(() => {
    alive.current = true;
    const slow = isSlowNetwork();
    setSlowNet(slow);

    // 1. బ్రౌజర్ data — మొదటి స్క్రీన్ తర్వాత వెంటనే
    void loadUnit("local");

    // 2. server మాలలు — వరుసగా, ఒకేసారి 2 మాత్రమే (నెమ్మది నెట్ అయితే నొక్కినప్పుడే)
    if (!slow) {
      const queue = [...SERVER_UNITS];
      const worker = async () => {
        while (queue.length && alive.current) await loadUnit(queue.shift()!);
      };
      for (let i = 0; i < SERVER_CONCURRENCY; i++) void worker();
    }
    return () => {
      alive.current = false;
    };
  }, [loadUnit]);

  const ensureLoaded = (keys: SectionKey[]) => keys.forEach((k) => sections[k].status !== "ready" && void loadUnit(UNIT_OF[k]));

  const toggle = (key: SectionKey) => {
    const turningOn = !selected.includes(key);
    if (turningOn) ensureLoaded([key]);
    setSelected((cur) => (cur.includes(key) ? (cur.length > 1 ? cur.filter((k) => k !== key) : cur) : [...cur, key]));
  };
  const selectOnly = (keys: SectionKey[]) => {
    ensureLoaded(keys);
    setSelected(keys);
  };

  const rows = useMemo(() => selected.flatMap((k) => sections[k].rows), [selected, sections]);
  // పెద్ద జాబితా మారుతున్నప్పుడు కూడా స్క్రీన్ స్పందిస్తూనే ఉంటుంది
  const deferredRows = useDeferredValue(rows);

  const total = ALL_KEYS.reduce((n, k) => n + sections[k].rows.length, 0);
  const loadingCount = ALL_KEYS.filter((k) => sections[k].status === "loading").length;
  const allOn = selected.length === ALL_KEYS.length;
  const gridTitle =
    allOn ? "జ్ఞానమాల" : selected.length === 1 ? `జ్ఞానమాల — ${SECTION[selected[0]].label}` : `జ్ఞానమాల — ${selected.length} మాలలు`;

  const chipLabel = (s: Section) => {
    const st = sections[s.key];
    if (st.status === "ready") return `${s.label} ${st.rows.length.toLocaleString("en-IN")}`;
    if (st.status === "error") return `${s.label} ⚠️`;
    if (st.status === "idle" && slowNet) return `${s.label} · నొక్కండి`;
    return s.label;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 1.5, sm: 3 }, py: { xs: 2.5, sm: 5 } }}>
      <Typography
        variant="h3"
        component="h1"
        fontWeight={800}
        sx={{
          textAlign: "center",
          background: "linear-gradient(90deg, #0f172a, #2563eb)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "calc(var(--telugu-font-size) * 1.8)",
        }}
      >
        జ్ఞానమాల
      </Typography>
      <Typography align="center" sx={{ opacity: 0.8, mt: 1, mb: 2.5 }}>
        రత్నాలబాల సంపద అంతా ఒకే చోట — వెతకండి • వినండి • PDF · Excel · JSON
      </Typography>

      {/* మాలలు — సైట్ menu లాగే 3 గుంపులు */}
      <Stack spacing={1.25} sx={{ mb: 1 }}>
        {GROUPS.map((g) => (
          <Stack key={g.title} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Chip
              label={`${g.icon} ${g.title}`}
              variant="outlined"
              clickable
              onClick={() => selectOnly(g.sections.map((s) => s.key))}
              sx={{ fontWeight: 800, minWidth: 110, height: 36 }}
              aria-label={`${g.title} మాలలు మాత్రమే`}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {g.sections.map((s) => {
                const st = sections[s.key];
                const on = selected.includes(s.key);
                return (
                  <Chip
                    key={s.key}
                    clickable
                    onClick={() => toggle(s.key)}
                    color={on ? "primary" : "default"}
                    variant={on ? "filled" : "outlined"}
                    aria-pressed={on}
                    icon={st.status === "loading" ? <CircularProgress size={14} color="inherit" /> : undefined}
                    label={chipLabel(s)}
                    sx={{ fontWeight: 700, height: 36 }}
                  />
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" useFlexGap flexWrap="wrap" sx={{ mb: 2.5, mt: 1 }}>
        <Typography variant="caption" color="text.secondary" aria-live="polite">
          {loadingCount > 0
            ? `${total.toLocaleString("en-IN")} అంశాలు సిద్ధం · ఇంకా ${loadingCount} మాలలు వస్తున్నాయి…`
            : `మొత్తం ${total.toLocaleString("en-IN")} అంశాలు`}
          {slowNet && " · నెమ్మది నెట్: మాలపై నొక్కితే లోడ్ అవుతుంది"}
        </Typography>
        {!allOn && <Chip size="small" label="అన్నీ" clickable onClick={() => selectOnly(ALL_KEYS)} />}
      </Stack>

      {/* ఒకే పట్టిక — ఎంపిక మారినప్పుడు మాత్రమే మళ్ళీ మొదలు; data వచ్చినప్పుడు కాదు */}
      <TeluguDataGrid
        key={selected.join("-")}
        title={gridTitle}
        unitLabel="అంశాలు"
        rows={deferredRows}
        columns={[
          { key: "vibhagam", label: "మాల", width: 120 },
          { key: "sheershika", label: "శీర్షిక" },
          { key: "vishayam", label: "విషయం", preview: 80, hiddenOnMobile: true },
          { key: "mulam", label: "మూలం", width: 180, hiddenOnMobile: true },
        ]}
        exportColumns={[{ key: "vivaralu", label: "వివరాలు" }]}
        titleKey="sheershika"
        highlightKey="vivaralu"
        toolName="gnanamala"
        examples={["కోతి వెతుకు", "కర్మ వెతుకు", "ఎన్ని"]}
        pdfLimit={500}
        renderDetail={(r) => <Detail key={r.id} r={r} />}
      />
    </Box>
  );
}