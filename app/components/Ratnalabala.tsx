"use client";

/* ═══════════════════════════════════════════════════════════════
   రత్నాలబాల – జ్ఞానమాల — ముఖ పేజీ

   • Inline styles లేవు — రూపం అంతా globals.css లోని rb-* classes (§11, §12)
   • Icons: @mui/icons-material మాత్రమే
   • మాలల జాబితా: lib/malas.ts (Navbar కూడా అదే) — 3 గుంపులు, 23 మాలలు
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, CircularProgress, Collapse, Tab, Tabs } from "@mui/material";
import type { GridColumn } from "@yuktishaalaa/yuktai";
import type { SvgIconComponent } from "@mui/icons-material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import AutoStoriesTwoToneIcon from "@mui/icons-material/AutoStoriesTwoTone";
import HeadphonesTwoToneIcon from "@mui/icons-material/HeadphonesTwoTone";
import SchoolTwoToneIcon from "@mui/icons-material/SchoolTwoTone";
import BrushTwoToneIcon from "@mui/icons-material/BrushTwoTone";
import ForumTwoToneIcon from "@mui/icons-material/ForumTwoTone";
import VolunteerActivismTwoToneIcon from "@mui/icons-material/VolunteerActivismTwoTone";
import LockTwoToneIcon from "@mui/icons-material/LockTwoTone";
import GridViewTwoToneIcon from "@mui/icons-material/GridViewTwoTone";
import PhoneAndroidTwoToneIcon from "@mui/icons-material/PhoneAndroidTwoTone";

import { MALA_GROUPS, MALA_COUNT, toneClass, type Tone } from "@/lib/malas";
import YGrid from "./YuktaiGridClient";
import DownloadAllPosters from "./DownloadAllPosters";
import DownloadAllVoices from "./DownloadAllVoices";
import DownloadAllVideos from "./DownloadAllVideos";
import PoemRadio from "./Poemradio";

interface Poem {
  title: string;
  content: string;
  slug?: string;
}

const POETRY_NAME = "రత్నాలబాల – జ్ఞానమాల";
const AUTHORS: string | string[] = "మిరియాల వెంకటరత్నం";
const FEEDBACK_URL = "https://forms.gle/z4zugcnmZrW9d9cR9";

const SOMANA = `అమిత యశస్క ఆద్యయన ఇద్రుచి ఈశ్వర ఉగ్ర ఊర్జిత
క్రమ ఋషభాంక ౠజిహర ఌస్తిత ౡస్మిత ఏకరుద్ర ఐం
ద్రమహిత రూప ఓమితి పదద్యుతి ఔర్వ లలాట అంబికా
సమరసభావ అఃకలిత వర్ణనుతం బసవేశ పాహిమాం!!`;

const DO_HERE: { title: string; text: string; path: string; Icon: SvgIconComponent; tone: Tone }[] = [
  { title: "చదవండి", text: "పద్యాలు, శతకాలు, కథలు", path: "/poems", Icon: AutoStoriesTwoToneIcon, tone: "maroon" },
  { title: "వినండి", text: "మగ, స్త్రీ స్వరాల్లో", path: "/swaramala", Icon: HeadphonesTwoToneIcon, tone: "gold" },
  { title: "నేర్చుకోండి", text: "అక్షరాలు, గుణింతాలు, సంధులు", path: "/aksharamala", Icon: SchoolTwoToneIcon, tone: "maroon" },
  { title: "సృష్టించండి", text: "పోస్టర్, వీడియో, PDF", path: "/khatiMala", Icon: BrushTwoToneIcon, tone: "gold" },
  { title: "అడగండి", text: "మీ PDF పై ప్రశ్నలు", path: "/prashnottari", Icon: ForumTwoToneIcon, tone: "maroon" },
];

const HERO_STATS: [string, string][] = [
  ["1,280+", "పద్యాలు"],
  ["130", "కథలు"],
  [String(MALA_COUNT), "మాలలు"],
  ["50+", "ఫాంట్లు"],
];

const STATS: [string, string][] = [
  ["1,280+", "మొత్తం పద్యాలు"],
  ["1037", "శతక పద్యాలు (10 శతకాలు)"],
  ["130", "కథలు"],
  ["108", "పరాభవమాల పద్యాలు"],
  ["34", "రత్నాలబాల పద్యాలు"],
  ["3", "మిరా పద్యాలు"],
  ["145", "తెలుగు పదాలు"],
  ["26", "సంధులు"],
  ["1140+", "AI పద్య విశ్లేషణలు"],
];

const PROMISES: { title: string; text: string; Icon: SvgIconComponent }[] = [
  { title: "ఉచితం", text: "వాణిజ్యేతర ప్రాజెక్ట్. చదవడానికి, వినడానికి డబ్బు లేదు.", Icon: VolunteerActivismTwoToneIcon },
  { title: "మీ గోప్యత", text: "మీరు చేర్చిన ఫాంట్లు మీ పరికరంలోనే ఉంటాయి. PDF ఫైల్ సేవ్ కాదు, దాని పాఠ్యం 24 గంటల్లో తొలగిపోతుంది.", Icon: LockTwoToneIcon },
];

const TECH: { group: string; items: { name: string; does: string }[] }[] = [
  {
    group: "మీరు చూసేది, వాడేది",
    items: [
      { name: "Next.js · React", does: "వెబ్‌సైట్ పునాది — పేజీలు వేగంగా తెరుచుకోవడానికి" },
      { name: "MUI", does: "బటన్లు, మెనూలు, కార్డులు — పెద్ద అక్షరాలు, స్పష్టమైన రంగులతో" },
      { name: "TypeScript", does: "code లో తప్పులను ముందే పట్టుకుంటుంది, site స్థిరంగా ఉంటుంది" },
      { name: "PWA (Serwist)", does: "phone లో app లా install చేసుకోవచ్చు; internet లేకపోయినా తెరుచుకుంటుంది" },
      { name: "Telugu Fonts API", does: "50+ తెలుగు ఫాంట్లు, మీ సొంత ఫాంట్ కూడా చేర్చుకోవచ్చు" },
    ],
  },
  {
    group: "వినడం, చదవడం",
    items: [
      { name: "Microsoft Edge స్వరాలు", does: "మగ (Mohan), స్త్రీ (Shruti) తెలుగు స్వరాల్లో పద్యాలు చదివి వినిపిస్తాయి" },
      { name: "Google TTS · Svara", does: "ఇంకో రెండు తెలుగు స్వరాలు — నచ్చిన స్వరం ఎంచుకోవచ్చు" },
      { name: "OCR (Tesseract)", does: "చిత్రంలోని తెలుగు అక్షరాలను పాఠ్యంగా మారుస్తుంది (లిపిమాల)" },
      { name: "Rust · WebAssembly", does: "తెలుగు అక్షర విశ్లేషణ — మీ browser లోనే, వేగంగా" },
    ],
  },
  {
    group: "AI, వెతకడం",
    items: [
      { name: "Python (Vercel)", does: "site వెనుక సర్వర్ — పద్యాలు, స్వరాలు, PDF పనులు" },
      { name: "Neon PostgreSQL · pgvector", does: "పద్యాలు, అర్థాల డేటాబేస్ — అర్థం ద్వారా పద్యాలు వెతకడం" },
      { name: "LangGraph · BAML · Groq", does: "భావాలమాల AI — పద్యాల అర్థం, సామెతలు, చదవడానికి సూచనలు" },
      { name: "సొంత RAG", does: "PDF ప్రశ్నోత్తరి — బయటి AI కి పంపకుండా, మీ PDF నుండే జవాబు" },
      { name: "WebMCP", does: "AI సహాయకులు కూడా ఈ site లో నేరుగా వెతకగలిగే కొత్త web ప్రమాణం" },
    ],
  },
  {
    group: "నడిచే చోటు",
    items: [
      { name: "Vercel", does: "site ఎప్పుడూ అందుబాటులో, ప్రపంచమంతా వేగంగా" },
      { name: "Vercel Analytics · Google Analytics", does: "ఎంతమంది, ఏ పేజీలు చదువుతున్నారో — site ను మెరుగుపరచడానికి" },
    ],
  },
];

/* ─── Yuktai Grid rows ─── */
type MalaRow = { id: string; name: string; intro: string; group: string; open: string };
const MALA_META = new Map(MALA_GROUPS.flatMap((g) => g.items.map((m) => [m.path, { Icon: m.Icon, tone: g.tone }] as const)));
const rowsFor = (gi: number): MalaRow[] =>
  (gi === 0 ? MALA_GROUPS : [MALA_GROUPS[gi - 1]]).flatMap((g) => g.items.map((m) => ({ id: m.path, name: m.label, intro: m.intro, group: g.label, open: m.path })));

const MALA_COLUMNS: GridColumn<MalaRow>[] = [
  {
    key: "name",
    label: "మాల",
    sortable: true,
    render: (_v, r) => {
      const meta = MALA_META.get(r.id)!;
      return (
        <Link href={r.open} className={`rb-mala-link ${toneClass(meta.tone)}`}>
          <span className="rb-icon-box" aria-hidden>
            <meta.Icon />
          </span>
          {r.name}
        </Link>
      );
    },
  },
  { key: "intro", label: "ఇందులో ఏముంది" },
  { key: "group", label: "గుంపు", type: "badge", sortable: true, hiddenOnMobile: true },
  {
    key: "open",
    label: "",
    align: "right",
    render: (_v, r) => (
      <Button component={Link} href={r.open} endIcon={<ArrowForwardRoundedIcon />} aria-label={`${r.name} తెరవండి`} className="rb-btn rb-btn--outline rb-btn--sm">
        తెరవండి
      </Button>
    ),
  },
];

type TechRow = { id: string; name: string; group: string; does: string };
const TECH_ROWS: TechRow[] = TECH.flatMap((g) => g.items.map((t) => ({ id: t.name, name: t.name, group: g.group, does: t.does })));
const TECH_COLUMNS: GridColumn<TechRow>[] = [
  { key: "name", label: "సాంకేతికత", sortable: true, render: (v) => <strong>{String(v)}</strong> },
  { key: "does", label: "మీకు ఏం చేస్తుంది" },
  { key: "group", label: "విభాగం", type: "badge", sortable: true, hiddenOnMobile: true },
];

/* ─── small parts ─── */
function SectionHead({ id, kicker, children }: { id: string; kicker?: string; children: React.ReactNode }) {
  return (
    <div className="rb-section-head">
      {kicker && <p className="rb-section-head__kicker">{kicker}</p>}
      <h2 id={id} className="rb-section-head__title">
        {children}
      </h2>
      <span className="rb-beads" aria-hidden />
    </div>
  );
}

function Toggle({ open, onClick, icon, children, controls }: { open: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode; controls: string }) {
  return (
    <Button
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      startIcon={icon}
      endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
      className="rb-btn rb-btn--quiet rb-btn--sm"
    >
      {children}
    </Button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export default function RatnalabalaHighlights({ poets }: { poets?: React.ReactNode }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState(0);
  const [group, setGroup] = useState(0); // 0 = అన్నీ
  const [toolsOpen, setToolsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/poems");
        if (!res.ok) throw new Error(String(res.status));
        const data: Record<string, string> = await res.json();
        const list = Object.entries(data).map(([title, content]) => ({ title, content, slug: title }));
        if (!alive) return;
        setPoems(list);
        // రోజుకొక పద్యం — సంవత్సరంలో ఎన్నో రోజో దాని ప్రకారం (అందరికీ ఒకటే)
        const now = new Date();
        const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
        if (list.length) setPick(day % list.length);
      } catch {
        if (alive) setError("పద్యాలు లోడ్ కాలేదు. ఇంటర్నెట్ చూసి పేజీని మళ్ళీ తెరవండి.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const today = poems[pick];
  const selTone = group === 0 ? "ink" : MALA_GROUPS[group - 1].tone;

  return (
    <div>
      {/* ═══════════ 1. Hero ═══════════ */}
      <header className="rb-hero">
        <div className="rb-container rb-hero__grid">
          <div className="rb-hero__text">
            <span className="rb-hero__badge">🪔 ఉచిత తెలుగు సాహిత్య వేదిక</span>
            <h1 className="rb-hero__title">
              రత్నాలబాల
              <span className="rb-hero__title-sub">జ్ఞానమాల</span>
            </h1>
            <span className="rb-rule" aria-hidden />
            <p className="rb-hero__lead">
              తెలుగు పద్యం, కథ, వ్యాకరణం — <strong>చదవండి · వినండి · నేర్చుకోండి</strong>. పెద్ద అక్షరాలతో, అందరికీ సులభంగా.
            </p>

            <div className="rb-row rb-row--stack-xs rb-hero__actions">
              <Button component={Link} href="/poems" endIcon={<ArrowForwardRoundedIcon />} className="rb-btn rb-btn--ink rb-btn--lg">
                📖 పద్యాలు చదవండి
              </Button>
              <Button component="a" href="#radio" className="rb-btn rb-btn--outline rb-btn--lg">
                🎧 వినండి
              </Button>
            </div>

            <ul className="rb-stats" aria-label="ఇక్కడ ఉన్నవి">
              {HERO_STATS.map(([n, l]) => (
                <li key={l} className="rb-stat">
                  <div className="rb-stat__num">{n}</div>
                  <div className="rb-stat__label">{l}</div>
                </li>
              ))}
            </ul>
          </div>

          <figure className="rb-quote-frame">
            <span className="rb-quote-frame__mark" aria-hidden>
              ❝
            </span>
            <blockquote className="rb-quote-frame__text">{SOMANA}</blockquote>
            <div className="rb-quote-frame__stars" aria-hidden>
              ✦ ✦ ✦
            </div>
            <figcaption className="rb-quote-frame__by">— పాల్కురికి సోమన</figcaption>
            <p className="rb-quote-frame__note">తెలుగు అక్షరమాల అంతా ఒకే పద్యంలో</p>
          </figure>
        </div>
      </header>

      {/* ═══════════ 2. Five tiles ═══════════ */}
      <nav className="rb-container rb-tiles rb-section" aria-label="ఏం చేయాలనుకుంటున్నారు?">
        <ul className="rb-grid rb-grid--tiles">
          {DO_HERE.map(({ title, text, path, Icon, tone }) => (
            <li key={title}>
              <Link href={path} className={`rb-tile ${toneClass(tone)}`}>
                <span className="rb-icon-circle" aria-hidden>
                  <Icon />
                </span>
                <span className="rb-tile__title">{title}</span>
                <span className="rb-tile__text">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="rb-container">
        {/* ═══════════ 3. Today's poem + radio ═══════════ */}
        <section className="rb-section" aria-label="ఈ రోజు పద్యం, స్వరమాల రేడియో">
          {loading && (
            <div className="rb-loading" role="status">
              <CircularProgress size={32} />
              <span>పద్యాలు లోడ్ అవుతున్నాయి…</span>
            </div>
          )}

          {error && (
            <p role="alert" className="rb-error">
              {error}
            </p>
          )}

          {!loading && !error && poems.length > 0 && (
            <div className="rb-duo">
              <article className="rb-card rb-card--flex rb-card--top-maroon" aria-labelledby="today-title">
                <p className="rb-card__kicker">🌅 ఈ రోజు పద్యం</p>
                <h2 id="today-title" className="rb-card__title">
                  {today?.title}
                </h2>
                <p className="rb-poem rb-spacer" aria-live="polite">
                  {today?.content}
                </p>
                <p className="muted">— మిరియాల వెంకటరత్నం, రత్నాలబాల</p>
                <div className="rb-row rb-row--stack-xs">
                  <Button onClick={() => setPick((p) => (p + 1) % poems.length)} startIcon={<AutorenewRoundedIcon />} className="rb-btn rb-btn--outline">
                    మరో పద్యం
                  </Button>
                  <Button component={Link} href="/poems" endIcon={<ArrowForwardRoundedIcon />} className="rb-btn rb-btn--primary">
                    అన్ని {poems.length} పద్యాలు
                  </Button>
                </div>
              </article>

              <section id="radio" className="rb-card rb-card--top-gold rb-radio" aria-labelledby="radio-title">
                <p className="rb-card__kicker">🎧 స్వరమాల రేడియో</p>
                <h2 id="radio-title" className="rb-card__title">
                  కళ్ళు మూసుకుని వినండి
                </h2>
                <p className="rb-card__text">స్వరం ఎంచుకుంటే {poems.length} పద్యాలు వరుసగా వినిపిస్తాయి.</p>

                <PoemRadio poems={poems} />

                <div className="rb-row rb-row--center rb-mt">
                  <Toggle open={toolsOpen} onClick={() => setToolsOpen((v) => !v)} icon={<DownloadRoundedIcon />} controls="radio-downloads">
                    పోస్టర్లు, వీడియోలు, వాయిస్‌లు
                  </Toggle>
                </div>
                <Collapse in={toolsOpen} timeout={200} unmountOnExit>
                  <div id="radio-downloads" className="rb-stack rb-mt">
                    <DownloadAllPosters poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                    <DownloadAllVideos poems={poems} authors={AUTHORS} poetryName={POETRY_NAME} />
                    <DownloadAllVoices poems={poems} />
                  </div>
                </Collapse>
              </section>
            </div>
          )}
        </section>

        {/* ═══════════ 4. Poets ═══════════ */}
        {poets && (
          <section className="rb-section" aria-labelledby="poets-title">
            <SectionHead id="poets-title" kicker="ఈ వేదిక వెనుక">
              మా కవులు
            </SectionHead>
            {poets}
          </section>
        )}

        {/* ═══════════ 5. Malas — tabs + Yuktai Grid ═══════════ */}
        <section className="rb-section" aria-labelledby="malas-title">
          <SectionHead id="malas-title" kicker={`${MALA_COUNT} మాలలు — పేరుతో వెతకండి`}>
            మాలలు అన్వేషించండి
          </SectionHead>

          <div className="rb-seg-wrap">
            <Tabs
              value={group}
              onChange={(_, v: number) => setGroup(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="మాలల గుంపులు"
              className={`rb-seg ${toneClass(selTone)}`}
            >
              <Tab id="mala-tab-0" aria-controls="mala-panel" label={`అన్నీ (${MALA_COUNT})`} />
              {MALA_GROUPS.map((g, i) => (
                <Tab key={g.label} id={`mala-tab-${i + 1}`} aria-controls="mala-panel" icon={<g.Icon />} iconPosition="start" label={`${g.label} (${g.items.length})`} />
              ))}
            </Tabs>
          </div>

          <div id="mala-panel" role="tabpanel" aria-labelledby={`mala-tab-${group}`}>
            <YGrid<MalaRow>
              key={group}
              data={rowsFor(group)}
              columns={MALA_COLUMNS}
              rowKey="id"
              search
              toolName="ratnalabala_malas"
              pagination={{ pageSize: 8, showSizeChanger: true, sizeOptions: [8, 25] }}
              empty={<span>ఆ పేరుతో మాల దొరకలేదు — ఇంకో మాటతో వెతకండి</span>}
            />
          </div>
        </section>

        {/* ═══════════ 6. Shailimala band ═══════════ */}
        <aside className="rb-band rb-kolam rb-section" aria-label="ఉచిత డౌన్‌లోడ్లు">
          <PhoneAndroidTwoToneIcon className="rb-band__icon" aria-hidden />
          <div className="rb-band__text">
            <h2 className="rb-band__title">ఫోన్‌లో యాప్‌గా · రింగ్‌టోన్లు · 50+ ఫాంట్లు</h2>
            <p className="rb-band__sub">మా Android యాప్, AI పాటల రింగ్‌టోన్లు, తెలుగు ఫాంట్లు, పుస్తకాలు — అన్నీ ఉచితం.</p>
          </div>
          <Button component={Link} href="/shailimala#apk" endIcon={<ArrowForwardRoundedIcon />} className="rb-btn rb-btn--on-band rb-btn--block-xs">
            శైలిమాల తెరవండి
          </Button>
        </aside>

        {/* ═══════════ 7. About (folded) ═══════════ */}
        <section className="rb-about rb-section" aria-label="ప్రాజెక్ట్ గురించి">
          <p className="rb-about__lead">తెలుగు పద్యాలు, కథలు పుస్తకాల్లో, జ్ఞాపకాల్లో మాత్రమే ఉండిపోకూడదు — తర్వాతి తరాలకు అందించడానికే ఈ ఉచిత, వాణిజ్యేతర వేదిక.</p>
          <div className="rb-row rb-row--center rb-row--stack-xs">
            <Toggle open={aboutOpen} onClick={() => setAboutOpen((v) => !v)} controls="about-panel">
              {aboutOpen ? "తక్కువగా చూపించు" : "ప్రాజెక్ట్ గురించి పూర్తిగా"}
            </Toggle>
            <Button component="a" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" startIcon={<ChatBubbleOutlineRoundedIcon />} className="rb-btn rb-btn--ink rb-btn--sm">
              అభిప్రాయం చెప్పండి
              <span className="rb-sr-only"> (కొత్త ట్యాబ్‌లో)</span>
            </Button>
          </div>

          <Collapse in={aboutOpen} timeout={200} unmountOnExit>
            <div id="about-panel" className="rb-panel">
              <h3 className="rb-panel__title">ఇప్పటివరకు ఉన్నవి</h3>
              <ul className="rb-stat-grid">
                {STATS.map(([n, label]) => (
                  <li key={label} className="rb-stat-tile">
                    <div className="rb-stat-tile__num">{n}</div>
                    <div className="rb-stat-tile__label">{label}</div>
                  </li>
                ))}
              </ul>

              <h3 className="rb-panel__title">మా మాట</h3>
              {PROMISES.map(({ title, text, Icon }) => (
                <p key={title} className="rb-feature">
                  <Icon aria-hidden />
                  <span>
                    <strong>{title}:</strong> {text}
                  </span>
                </p>
              ))}

              <h3 className="rb-panel__title">సాంకేతికత</h3>
              <div className="rb-highlight-box">
                <GridViewTwoToneIcon aria-hidden />
                <div>
                  <p className="rb-highlight-box__title">
                    Yuktai Grid <span>— మా సొంత, ఓపెన్ సోర్స్</span>
                  </p>
                  <p className="rb-highlight-box__text">
                    యుక్తిశాల AI తయారుచేసిన తెలుగు పట్టిక — వెతకడం, క్రమం, పేజీలు, ఫోన్‌లో కార్డులు, AI సహాయకుడు. ఈ పేజీలోని మాలల పట్టిక, శైలిమాల ఫాంట్ల జాబితా ఇదే.{" "}
                    <a href="https://www.npmjs.com/package/@yuktishaalaa/yuktai" target="_blank" rel="noopener noreferrer" className="rb-link">
                      npm
                    </a>{" "}
                    ·{" "}
                    <a href="https://github.com/sandeepmiriyala03/yuktai" target="_blank" rel="noopener noreferrer" className="rb-link">
                      GitHub
                    </a>
                  </p>
                </div>
              </div>

              <YGrid<TechRow>
                data={TECH_ROWS}
                columns={TECH_COLUMNS}
                rowKey="id"
                search
                toolName="ratnalabala_tech"
                pagination={{ pageSize: 8, showSizeChanger: true, sizeOptions: [8, 20] }}
              />

              <h3 className="rb-panel__title">స్వరాలు</h3>
              <p className="rb-lede">
                <strong>మగ / స్త్రీ స్వరం</strong> — Microsoft AI వాయిస్‌లు (Mohan, Shruti):{" "}
                <a href="https://speech.microsoft.com/portal/voicegallery" target="_blank" rel="noopener noreferrer" className="rb-link">
                  speech.microsoft.com
                </a>
                . <strong>Google TTS</strong> — Google Translate లో వినే అదే స్వరం:{" "}
                <a href="https://translate.google.com" target="_blank" rel="noopener noreferrer" className="rb-link">
                  translate.google.com
                </a>
                .
              </p>

              <h3 className="rb-panel__title">కృతజ్ఞతలు</h3>
              <ul className="rb-thanks">
                <li>
                  <strong>రత్నాలబాల పద్యాలు</strong> — మిరియాల వెంకటరత్నం గారు
                </li>
                <li>
                  <strong>మిరా పద్యాలు</strong> — డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు
                </li>
                <li>
                  <strong>వేదిక</strong> — యుక్తిశాల AI
                </li>
              </ul>
            </div>
          </Collapse>
        </section>
      </div>
    </div>
  );
}
