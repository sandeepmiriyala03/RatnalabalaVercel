"use client";

/* ================================================================== */
/* జ్ఞానమాల — రత్నాలబాల సంపద అంతా ఒకే పట్టికలో                          */
/*                                                                    */
/* సైట్ menu లోని ప్రతి మాల (ఇప్పటికే ఉన్న data మాత్రమే):               */
/*  🔤 భాష:     అక్షరమాల · గుణింతమాల · పదాలమాల · సామెతలమాల ·           */
/*              సంధిమాల · సమాసముమాల                                    */
/*  📚 సాహిత్యం: పద్యాలమాల · మిరా · శతకాలమాల · స్మృతిమాల · కథామాల      */
/*  🕉️ గీతామాల: భగవద్గీత                                               */
/* ఒకే పట్టిక → PDF (59 ఫాంట్లు, 5 థీమ్‌లు) · Excel · JSON              */
/* ================================================================== */

import React, { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";

import TeluguDataGrid, { speakTelugu } from "@/app/components/TeluguDataGrid";
import type { RecordRow } from "@/app/components/exportPoems";
import { SAMETALU_FILE_MAP } from "@/app/types/sametalu";
import { AGE_GROUPS } from "@/app/types/kathamala";
import storiesData from "@/data/kids_stories_te.json";
import seethamalaData from "@/data/Pingali_Seethamama.json";
import {
  GUNINTA_MARKS,
  GUNINTA_NAMES,
  GUNINTA_VYANJANALU,
  PADALU_SWARALU,
  SAMASA_RULES,
  SANDHI_RULES,
  THREE_FOUR_LETTER,
  TWO_LETTER,
} from "@/data/bhashaMala";

/* ================================================================== */
/* మాలలు — సైట్ menu క్రమంలోనే                                           */
/* ================================================================== */

type SectionKey =
  | "aksharamala"
  | "gunintamala"
  | "padalamala"
  | "sametalamala"
  | "sandhimala"
  | "samasamala"
  | "padyalamala"
  | "mira"
  | "shatakalamala"
  | "smruthimala"
  | "kathamala"
  | "gita";

type Section = { key: SectionKey; label: string; link: string };

const GROUPS: { title: string; icon: string; sections: Section[] }[] = [
  {
    title: "భాష",
    icon: "🔤",
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
    title: "గీతామాల",
    icon: "🕉️",
    sections: [{ key: "gita", label: "భగవద్గీత", link: "/geeta" }],
  },
];

const ALL_SECTIONS = GROUPS.flatMap((g) => g.sections);
const SECTION = Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, s])) as Record<SectionKey, Section>;

type SectionState = { status: "loading" | "ready" | "error"; rows: RecordRow[] };

/* ================================================================== */
/* సహాయకాలు                                                            */
/* ================================================================== */

type AnyRecord = Record<string, unknown>;

/** JSON లో ఏ పేరుతో ఉన్నా విలువ; జాబితా అయితే కలుపుతుంది */
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

/** ఒక వరుస — అన్ని మాలలకూ ఒకే 5 columns */
function makeRow(
  key: SectionKey,
  id: string,
  sheershika: string,
  vishayam: string,
  mulam: string,
  vivaralu = ""
): RecordRow {
  return {
    id: `${key}-${id}`,
    vibhagam: SECTION[key].label,
    sheershika,
    vishayam,
    mulam,
    vivaralu,
    link: SECTION[key].link,
  } as RecordRow;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

/* ================================================================== */
/* 🔤 భాష                                                             */
/* ================================================================== */

/* అక్షరమాల — /api/aksharamala (పేజీలవారీగా; సర్వర్ పరిమితిని బట్టి 50 → 20 → 4) */
async function loadAksharamala(): Promise<RecordRow[]> {
  const TYPE_TE: Record<string, string> = { swaralu: "అచ్చు", vyanjanalu: "హల్లు", gunintalu: "గుణింతం" };
  for (const size of [50, 20, 4]) {
    try {
      const url = (p: number) => `/api/aksharamala?search=&type=all&page=${p}&page_size=${size}`;
      const first = (await fetchJson(url(1))) as { items?: AnyRecord[]; page_count?: number };
      const items = [...(first.items ?? [])];
      for (let p = 2; p <= (first.page_count ?? 1); p++) {
        const next = (await fetchJson(url(p))) as { items?: AnyRecord[] };
        items.push(...(next.items ?? []));
      }
      return items.map((a, i) =>
        makeRow("aksharamala", pick(a, ["id"]) || String(i), pick(a, ["letter"]), pick(a, ["word"]), TYPE_TE[String(a.type)] ?? "")
      );
    } catch {
      /* ఈ సైజు వద్దు — చిన్నది ప్రయత్నిస్తాం */
    }
  }
  throw new Error("aksharamala");
}

function loadGunintamala(): RecordRow[] {
  return GUNINTA_VYANJANALU.flatMap((v) =>
    GUNINTA_MARKS.map((mark, i) => {
      const roopam = i === 0 ? v : i === 14 ? `${v}ం` : i === 15 ? `${v}ః` : v + mark;
      return makeRow("gunintamala", `${v}-${i}`, roopam, GUNINTA_NAMES[i] ?? "", `"${v}" గుణింతము`);
    })
  );
}

function loadPadalamala(): RecordRow[] {
  const make = (words: string[], rakam: string, tag: string) =>
    words.map((w, i) =>
      makeRow("padalamala", `${tag}-${i}`, w, rakam, `"${w[0] ?? ""}" ${PADALU_SWARALU.includes(w[0]) ? "అచ్చుతో" : "హల్లుతో"}`)
    );
  return [...make(TWO_LETTER, "రెండక్షరాల పదం", "2"), ...make(THREE_FOUR_LETTER, "మూడు/నాలుగు అక్షరాల పదం", "3")];
}

async function loadSametalamala(): Promise<RecordRow[]> {
  const groups = await Promise.all(
    Object.entries(SAMETALU_FILE_MAP as Record<string, string>).map(async ([letter, file]) => {
      try {
        const data = (await fetchJson(`/ssmetalamala/${file}.json`)) as { sametalu?: { id?: string; text?: string }[] };
        return (data.sametalu ?? []).map((s, i) =>
          makeRow("sametalamala", `${letter}-${s.id ?? i}-${i}`, s.text ?? "", "", `"${letter}" అక్షరం`)
        );
      } catch {
        return [];
      }
    })
  );
  return groups.flat();
}

function loadSandhimala(): RecordRow[] {
  return SANDHI_RULES.flatMap((r) =>
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
}

function loadSamasamala(): RecordRow[] {
  return SAMASA_RULES.flatMap((r) => [
    ...r.subtypes.map((s, i) => makeRow("samasamala", `${r.id}-s${i}`, s.example, `= ${s.vigraha}`, `${r.name} · ${s.name}`, r.definition)),
    ...r.examples.map((e, i) => makeRow("samasamala", `${r.id}-e${i}`, e.samasa, `= ${e.vigraha}`, r.name, r.definition)),
  ]);
}

/* ================================================================== */
/* 📚 సాహిత్యం                                                         */
/* ================================================================== */

/** poet_id 1 = పద్యాలమాల, 2 = మిరా, 3–13 = శతకాలమాల — ఒకేసారి 13 requests */
async function loadPoems(): Promise<Record<"padyalamala" | "mira" | "shatakalamala", RecordRow[]>> {
  const out = { padyalamala: [] as RecordRow[], mira: [] as RecordRow[], shatakalamala: [] as RecordRow[] };
  const groups = await Promise.all(
    Array.from({ length: 13 }, (_, i) => i + 1).map(async (poetId) => {
      try {
        const data = await fetchJson(`/api/main?endpoint=poems&poet_id=${poetId}`);
        return { poetId, poems: Array.isArray(data) ? (data as AnyRecord[]) : [] };
      } catch {
        return { poetId, poems: [] };
      }
    })
  );
  for (const { poetId, poems } of groups) {
    const key = poetId === 1 ? "padyalamala" : poetId === 2 ? "mira" : "shatakalamala";
    for (const p of poems) {
      out[key].push(
        makeRow(key, pick(p, ["poem_id"]), pick(p, ["title"]), pick(p, ["content"]), pick(p, ["poet_name"]), pick(p, ["special_line"]))
      );
    }
  }
  return out;
}

function loadSmruthimala(): RecordRow[] {
  return (seethamalaData.stories as unknown as AnyRecord[]).map((s, i) =>
    makeRow("smruthimala", pick(s, ["story_id"]) || String(i), pick(s, ["title"]), pick(s, ["story_text"]), `భాగం ${i + 1}`, pick(s, ["subtitle"]))
  );
}

function loadKathamala(): RecordRow[] {
  const ageLabel = (k: string) => AGE_GROUPS.find((g) => g.key === k)?.label ?? k;
  return (storiesData.stories as unknown as AnyRecord[]).map((s, i) =>
    makeRow(
      "kathamala",
      pick(s, ["id", "story_id"]) || String(i),
      pick(s, ["title", "story_title", "name", "heading"]),
      pick(s, ["story", "content", "text", "story_text", "body", "paragraphs"]),
      `${ageLabel(String(s.age_group ?? ""))} వయస్సు`,
      pick(s, ["moral", "neethi", "nethi", "lesson", "moral_te"])
    )
  );
}

/* ================================================================== */
/* 🕉️ గీతామాల — /api/gita (జవాబు రూపం ఏదైనా శ్లోకాలు వెతికి తీస్తుంది)     */
/* ================================================================== */

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

async function loadGita(): Promise<RecordRow[]> {
  const out: RecordRow[] = [];
  collectSlokas(await fetchJson("/api/gita"), "", out);
  if (out.length) return out;
  const chapters = await Promise.all(
    Array.from({ length: 18 }, (_, i) => fetchJson(`/api/gita?chapter=${i + 1}`).catch(() => null))
  );
  chapters.forEach((c, i) => collectSlokas(c, String(i + 1), out));
  return out;
}

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
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
        >
          వినండి
        </Button>
        <Button
          size="small"
          variant="contained"
          component={NextLink}
          href={r.link}
          endIcon={<OpenInNewRoundedIcon />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
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

const ready = (rows: RecordRow[]): SectionState => ({ status: "ready", rows });
const loading: SectionState = { status: "loading", rows: [] };

export default function GnanamalaPage() {
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(() => ({
    // బ్రౌజర్‌లోనే ఉన్నవి — వెంటనే
    gunintamala: ready(loadGunintamala()),
    padalamala: ready(loadPadalamala()),
    sandhimala: ready(loadSandhimala()),
    samasamala: ready(loadSamasamala()),
    smruthimala: ready(loadSmruthimala()),
    kathamala: ready(loadKathamala()),
    // server నుండి — సమాంతరంగా
    aksharamala: loading,
    sametalamala: loading,
    padyalamala: loading,
    mira: loading,
    shatakalamala: loading,
    gita: loading,
  }));
  const [selected, setSelected] = useState<SectionKey[]>(ALL_SECTIONS.map((s) => s.key));

  useEffect(() => {
    let alive = true;
    const set = (patch: Partial<Record<SectionKey, SectionState>>) => alive && setSections((s) => ({ ...s, ...patch }));
    const fail = (...keys: SectionKey[]) => set(Object.fromEntries(keys.map((k) => [k, { status: "error", rows: [] }])));

    loadAksharamala().then((r) => set({ aksharamala: ready(r) })).catch(() => fail("aksharamala"));
    loadSametalamala().then((r) => set({ sametalamala: ready(r) })).catch(() => fail("sametalamala"));
    loadGita().then((r) => set({ gita: ready(r) })).catch(() => fail("gita"));
    loadPoems()
      .then((p) => set({ padyalamala: ready(p.padyalamala), mira: ready(p.mira), shatakalamala: ready(p.shatakalamala) }))
      .catch(() => fail("padyalamala", "mira", "shatakalamala"));

    return () => {
      alive = false;
    };
  }, []);

  const toggle = (key: SectionKey) =>
    setSelected((cur) => (cur.includes(key) ? (cur.length > 1 ? cur.filter((k) => k !== key) : cur) : [...cur, key]));
  const selectOnly = (keys: SectionKey[]) => setSelected(keys);

  const rows = useMemo(() => selected.flatMap((k) => sections[k].rows), [selected, sections]);
  const total = ALL_SECTIONS.reduce((n, s) => n + sections[s.key].rows.length, 0);
  const stillLoading = ALL_SECTIONS.some((s) => sections[s.key].status === "loading");
  const allOn = selected.length === ALL_SECTIONS.length;

  const gridTitle =
    allOn ? "జ్ఞానమాల" : selected.length === 1 ? `జ్ఞానమాల — ${SECTION[selected[0]].label}` : `జ్ఞానమాల — ${selected.length} మాలలు`;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
      {/* శీర్షిక */}
      <Typography
        variant="h3"
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
      <Typography align="center" sx={{ opacity: 0.8, mt: 1, mb: 3 }}>
        రత్నాలబాల సంపద అంతా ఒకే చోట — వెతకండి • వినండి • PDF · Excel · JSON
      </Typography>

      {/* మాలలు — సైట్ menu లాగే 3 గుంపులు */}
      <Stack spacing={1.5} sx={{ mb: 1 }}>
        {GROUPS.map((g) => (
          <Stack key={g.title} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Chip
              label={`${g.icon} ${g.title}`}
              variant="outlined"
              clickable
              onClick={() => selectOnly(g.sections.map((s) => s.key))}
              sx={{ fontWeight: 800, minWidth: 110 }}
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
                    label={`${s.label} ${
                      st.status === "ready" ? st.rows.length.toLocaleString("en-IN") : st.status === "error" ? "⚠️" : ""
                    }`}
                    sx={{ fontWeight: 700, height: 34 }}
                  />
                );
              })}
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 3, mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {stillLoading ? "సంపద లోడ్ అవుతోంది…" : `మొత్తం ${total.toLocaleString("en-IN")} అంశాలు`} · మాలపై నొక్కి చేర్చండి / తీసేయండి
        </Typography>
        {!allOn && (
          <Chip size="small" label="అన్నీ" clickable onClick={() => selectOnly(ALL_SECTIONS.map((s) => s.key))} />
        )}
      </Stack>

      {/* ఒకే పట్టిక */}
      <TeluguDataGrid
        key={selected.join("-") + (stillLoading ? "-l" : "")}
        title={gridTitle}
        unitLabel="అంశాలు"
        rows={rows}
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