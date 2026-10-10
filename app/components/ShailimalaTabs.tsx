"use client";

/* ═══════════════════════════════════════════════════════════════
   శైలిమాల ట్యాబ్‌లు — 5 ట్యాబ్‌లు, అన్నీ ఉచితం
     🔤 ఫాంట్లు     — Yuktai Grid; ప్రతి వరుసలో ఆ ఫాంట్‌లోనే నమూనా
     📚 పుస్తకాలు   — Yuktai Grid, చదవండి / డౌన్‌లోడ్
     📱 Android యాప్ — APK + ఇన్‌స్టాల్ దశలు
     🎵 సంగీతం      — public/MusicPlayer, ఒకసారి ఒక్కటే, రింగ్‌టోన్ దశలు (Suno AI)
     🎬 వీడియోలు    — public/video, ఇక్కడే ప్లే

   • ట్యాబ్ లింక్: /shailimala#apk, #music, #videos …
   • Inline styles లేవు — globals.css §11, §13. Icons: @mui/icons-material మాత్రమే
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Button, Tab, Tabs } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import type { GridColumn } from "@yuktishaalaa/yuktai";
import YGrid from "./YuktaiGridClient";

/* ─── types (sent from page.tsx) ─── */
export type MediaFile = { name: string; size: number };
export type ApkInfo = { file: string; size: number } | null;

type Props = {
  initialFonts: string[];
  initialBooks: string[];
  music?: MediaFile[];
  videos?: MediaFile[];
  apk?: ApkInfo;
};

/* ─── helpers ─── */
const url = (folder: string, file: string) => `/${folder}/${encodeURIComponent(file)}`;
const pretty = (file: string) => file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
const mb = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const ext = (file: string) => file.split(".").pop()?.toUpperCase() ?? "";

const TABS = [
  { id: "fonts", label: "🔤 ఫాంట్లు" },
  { id: "books", label: "📚 పుస్తకాలు" },
  { id: "apk", label: "📱 Android యాప్" },
  { id: "music", label: "🎵 సంగీతం" },
  { id: "videos", label: "🎬 వీడియోలు" },
] as const;

/* Only one audio/video plays at a time across the whole page */
function useOneAtATime(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onPlay = (e: Event) => {
      root.querySelectorAll<HTMLMediaElement>("audio, video").forEach((m) => {
        if (m !== e.target && !m.paused) m.pause();
      });
    };
    root.addEventListener("play", onPlay, true); // media events don't bubble → capture
    return () => root.removeEventListener("play", onPlay, true);
  }, [rootRef]);
}

/* Native <a download> — works offline, no library */
function DownloadLink({ href, file, label }: { href: string; file: string; label?: string }) {
  return (
    <Button component="a" href={href} download={file} startIcon={<DownloadRoundedIcon />} aria-label={`${pretty(file)} డౌన్‌లోడ్ (${ext(file)})`} className="rb-btn rb-btn--outline rb-btn--sm">
      {label ?? "డౌన్‌లోడ్"}
    </Button>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="rb-steps">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ol>
  );
}

function HowTo({ title, blocks }: { title: string; blocks: { os: string; steps: string[] }[] }) {
  return (
    <div>
      <h3 className="rb-h3">{title}</h3>
      {blocks.map((d) => (
        <Accordion key={d.os} disableGutters className="rb-accordion">
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>{d.os}</AccordionSummary>
          <AccordionDetails>
            <Steps items={d.steps} />
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p role="status" className="rb-empty">
      {text}
    </p>
  );
}

/* ═══════════════ 🔤 FONTS ═══════════════ */

/** Sample text in the font itself — loads only when the row is on screen.
    The family name is data, so it is set from code (ref), not a style attribute. */
function FontSample({ file, family }: { file: string; family: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"wait" | "ok" | "bad">("wait");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const ready = () => {
      el.style.fontFamily = `"${family}", var(--telugu-font-family), var(--font-telugu-fallback)`;
      setState("ok");
    };
    const load = () => {
      if (done) return;
      done = true;
      if ([...document.fonts].some((f) => f.family === family && f.status === "loaded")) return ready();
      new FontFace(family, `url("${url("Fonts", file)}")`, { display: "swap" })
        .load()
        .then((f) => {
          document.fonts.add(f);
          ready();
        })
        .catch(() => setState("bad"));
    };
    if (!("IntersectionObserver" in window)) return load();
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (load(), io.disconnect()), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [file, family]);

  return (
    <span ref={ref} data-telugu-font data-state={state} lang="te" className="rb-font-sample">
      {state === "bad" ? "నమూనా చూపలేకపోయాం" : "అమ్మ ఆవు ఇల్లు — తెలుగు వెలుగు"}
    </span>
  );
}

type FontRow = { id: string; name: string; sample: string; formats: string; ttf: string; otf: string };

function groupFonts(files: string[]): FontRow[] {
  const map = new Map<string, FontRow>();
  for (const f of files) {
    const base = f.replace(/\.(ttf|otf)$/i, "");
    const key = base.toLowerCase();
    const row = map.get(key) ?? { id: key, name: pretty(base), sample: "", formats: "", ttf: "", otf: "" };
    if (/\.ttf$/i.test(f)) row.ttf = f;
    else row.otf = f;
    map.set(key, row);
  }
  return [...map.values()].map((r) => ({ ...r, sample: r.ttf || r.otf, formats: [r.ttf && "TTF", r.otf && "OTF"].filter(Boolean).join(" · ") }));
}

const INSTALL = [
  {
    os: "🪟 Windows కంప్యూటర్",
    steps: ["డౌన్‌లోడ్ అయిన .ttf ఫైల్‌పై కుడి క్లిక్ చేయండి.", '"Install" (లేదా "అందరు వాడుకరులకు ఇన్‌స్టాల్") నొక్కండి.', "Word / PowerPoint మూసి మళ్ళీ తెరవండి — ఫాంట్ జాబితాలో కనిపిస్తుంది."],
  },
  {
    os: "🍎 Mac కంప్యూటర్",
    steps: ["ఫైల్‌ను రెండుసార్లు నొక్కండి — Font Book తెరుచుకుంటుంది.", '"Install Font" నొక్కండి.', "Pages / Word మళ్ళీ తెరవండి."],
  },
  {
    os: "🤖 Android ఫోన్",
    steps: [
      "Samsung: Settings → Display → Font style లో కొన్ని ఫాంట్లు మాత్రమే మార్చవచ్చు; బయటి .ttf కోసం zFont 3 లాంటి యాప్ కావాలి.",
      'చాలా ఫోన్లలో మొత్తం ఫోన్ ఫాంట్ మార్చలేం — కానీ PixelLab, Canva, Kinemaster లాంటి యాప్‌లలో "ఫాంట్ జోడించు" తో ఈ .ttf వాడవచ్చు.',
      "ఇన్‌స్టాల్ వద్దనుకుంటే: మా ఖతిమాల లో ఈ ఫాంట్‌తో రాసి చిత్రం / PDF గా దాచుకోండి.",
    ],
  },
  {
    os: "📱 iPhone / iPad",
    steps: ['App Store నుంచి "iFont" లాంటి ఉచిత యాప్ తెచ్చుకోండి.', 'ఫైల్‌ను ఆ యాప్‌లో తెరిచి "Install" నొక్కండి → Settings లో Profile ను అనుమతించండి.', "Pages, Keynote లాంటి యాప్‌లలో ఆ ఫాంట్ కనిపిస్తుంది."],
  },
];

const FONT_COLUMNS: GridColumn<FontRow>[] = [
  { key: "name", label: "ఫాంట్ పేరు", sortable: true, render: (v) => <strong className="rb-name">{String(v)}</strong> },
  { key: "sample", label: "నమూనా", render: (_v, r) => <FontSample file={r.sample} family={`Shaili ${r.id}`} /> },
  { key: "formats", label: "రకం", type: "badge", hiddenOnMobile: true },
  {
    key: "ttf",
    label: "డౌన్‌లోడ్",
    render: (_v, r) => (
      <span className="rb-row">
        {r.ttf && <DownloadLink href={url("Fonts", r.ttf)} file={r.ttf} label="TTF" />}
        {r.otf && <DownloadLink href={url("Fonts", r.otf)} file={r.otf} label="OTF" />}
      </span>
    ),
  },
];

function FontsTab({ files }: { files: string[] }) {
  const rows = groupFonts(files);
  return (
    <div className="rb-stack rb-stack--lg">
      <p className="rb-lede">
        పేరుతో వెతకండి, శీర్షిక నొక్కి క్రమం మార్చండి. ప్రతి వరుసలో ఆ ఫాంట్‌లోనే నమూనా కనిపిస్తుంది. <strong>TTF</strong> అన్ని పరికరాల్లో పనిచేస్తుంది — సందేహం ఉంటే అదే తీసుకోండి.
      </p>
      {rows.length ? (
        <YGrid<FontRow>
          data={rows}
          columns={FONT_COLUMNS}
          rowKey="id"
          search
          ai
          toolName="ratnalabala_fonts"
          pagination={{ pageSize: 10, showSizeChanger: true, sizeOptions: [10, 20, 50, 100] }}
          empty={<span>ఆ పేరుతో ఫాంట్ దొరకలేదు</span>}
        />
      ) : (
        <Empty text="ఫాంట్లు త్వరలో ఇక్కడ చేరతాయి." />
      )}
      <HowTo title="ఎలా ఇన్‌స్టాల్ చేయాలి?" blocks={INSTALL} />
    </div>
  );
}

/* ═══════════════ 📚 BOOKS ═══════════════ */

type BookRow = { id: string; name: string; kind: string; file: string };

const BOOK_COLUMNS: GridColumn<BookRow>[] = [
  { key: "name", label: "పుస్తకం", sortable: true, render: (v) => <strong className="rb-name">{String(v)}</strong> },
  { key: "kind", label: "రకం", type: "badge", sortable: true, hiddenOnMobile: true },
  {
    key: "file",
    label: "చదవండి / దాచుకోండి",
    render: (_v, r) => (
      <span className="rb-row">
        {r.kind === "PDF" && (
          <Button component="a" href={url("books", r.file)} target="_blank" rel="noopener" startIcon={<MenuBookRoundedIcon />} className="rb-btn rb-btn--primary rb-btn--sm">
            చదవండి
          </Button>
        )}
        <DownloadLink href={url("books", r.file)} file={r.file} />
      </span>
    ),
  },
];

function BooksTab({ files }: { files: string[] }) {
  const rows: BookRow[] = files.map((f) => ({ id: f, name: pretty(f), kind: ext(f), file: f }));
  if (!rows.length) return <Empty text="పుస్తకాలు త్వరలో ఇక్కడ చేరతాయి." />;
  return (
    <div className="rb-stack">
      <p className="rb-lede">PDF అయితే &ldquo;చదవండి&rdquo; తో ఇక్కడే తెరుచుకుంటుంది. EPUB ఫైళ్ళు ఫోన్‌లో Google Play Books / Apple Books లో తెరవండి.</p>
      <YGrid<BookRow>
        data={rows}
        columns={BOOK_COLUMNS}
        rowKey="id"
        search
        ai
        toolName="ratnalabala_books"
        pagination={{ pageSize: 10, showSizeChanger: true, sizeOptions: [10, 20, 50] }}
        empty={<span>ఆ పేరుతో పుస్తకం దొరకలేదు</span>}
      />
    </div>
  );
}

/* ═══════════════ 📱 ANDROID APP ═══════════════ */

function ApkTab({ apk }: { apk: ApkInfo }) {
  if (!apk) return <Empty text="Android యాప్ త్వరలో ఇక్కడ చేరుతుంది." />;
  return (
    <div className="rb-stack rb-stack--lg">
      <div className="rb-card rb-apk">
        <div className="rb-apk__icon" aria-hidden>
          📱
        </div>
        <h3 className="rb-card__title">రత్నాలబాల – జ్ఞానమాల Android యాప్</h3>
        <p className="rb-apk__meta">ఉచితం · {mb(apk.size)} · Android 7 లేదా ఆపై</p>
        <Button
          component="a"
          href={`/${apk.file}`}
          download={apk.file}
          type="application/vnd.android.package-archive"
          startIcon={<DownloadRoundedIcon />}
          className="rb-btn rb-btn--primary rb-btn--lg rb-btn--block-xs"
        >
          యాప్ డౌన్‌లోడ్ చేయండి
        </Button>
        <p className="rb-apk__hint">iPhone వాడేవారు: యాప్ అవసరం లేదు — Safari లో ఈ సైట్ తెరిచి Share ⬆ → &ldquo;Add to Home Screen&rdquo;.</p>
      </div>

      <div className="rb-card">
        <h3 className="rb-h3">ఎలా ఇన్‌స్టాల్ చేయాలి? — 4 దశలు</h3>
        <Steps
          items={[
            'పైన "యాప్ డౌన్‌లోడ్ చేయండి" నొక్కండి. Chrome "ఈ ఫైల్ హాని చేయవచ్చు" అంటే — "అయినా డౌన్‌లోడ్ చేయి" (Download anyway) నొక్కండి.',
            'డౌన్‌లోడ్ అయ్యాక వచ్చే "తెరువు" (Open) నొక్కండి. లేదా Files యాప్ → Downloads లో app-release-signed.apk నొక్కండి.',
            'మొదటిసారి "తెలియని యాప్‌లు" అనుమతి అడుగుతుంది: Settings → "ఈ మూలం నుంచి అనుమతించు" (Allow from this source) ఆన్ చేసి వెనక్కి రండి.',
            '"Install" నొక్కండి. Play Protect అడిగితే "అయినా ఇన్‌స్టాల్ చేయి" నొక్కండి. అయిపోయాక హోమ్ స్క్రీన్‌లో యాప్ కనిపిస్తుంది.',
          ]}
        />
      </div>

      <div className="rb-note">
        <strong>🔒 భద్రత: </strong>
        ఈ యాప్‌ను <strong>ratnalabala.vercel.app</strong> నుంచి మాత్రమే తీసుకోండి — WhatsApp లో వచ్చే APK ఫైళ్ళను నమ్మవద్దు. ఇన్‌స్టాల్ అయ్యాక &ldquo;తెలియని యాప్‌లు&rdquo; అనుమతిని మళ్ళీ ఆఫ్ చేయడం మంచిది. యాప్ మీ ఫోటోలు, కాంటాక్టులు, SMS ఏవీ అడగదు.
      </div>
    </div>
  );
}

/* ═══════════════ 🎵 MUSIC / RINGTONES ═══════════════ */

type TrackRow = { id: string; name: string; kind: string; size: number; file: string };

const TRACK_COLUMNS: GridColumn<TrackRow>[] = [
  { key: "name", label: "పాట", sortable: true, render: (v) => <strong className="rb-name">{String(v)}</strong> },
  { key: "file", label: "వినండి", render: (_v, r) => <audio controls preload="none" src={url("MusicPlayer", r.file)} aria-label={`${r.name} — పాట`} className="rb-audio" /> },
  { key: "size", label: "సైజు", type: "number", sortable: true, hiddenOnMobile: true, render: (v, r) => `${r.kind} · ${mb(Number(v))}` },
  { key: "kind", label: "రింగ్‌టోన్", render: (_v, r) => <DownloadLink href={url("MusicPlayer", r.file)} file={r.file} label="డౌన్‌లోడ్" /> },
];

const RINGTONE = [
  {
    os: "🤖 Android ఫోన్",
    steps: [
      'పైన "డౌన్‌లోడ్" నొక్కండి — పాట ఫోన్‌లోని Downloads కి వస్తుంది.',
      "Settings → Sound (ధ్వని) → Phone ringtone (రింగ్‌టోన్) తెరవండి.",
      '"+" లేదా "Add ringtone" / "ఫోన్ నుంచి" నొక్కి, Downloads లోని ఆ పాటను ఎంచుకోండి.',
      "ఒక్కరికి మాత్రమే: Contacts లో ఆ వ్యక్తిని తెరిచి ⋮ → Set ringtone.",
    ],
  },
  {
    os: "📱 iPhone",
    steps: [
      "iPhone లో నేరుగా MP3 రింగ్‌టోన్ పెట్టలేం — Apple ఉచిత యాప్ GarageBand కావాలి.",
      "పాటను Files లో దాచుకోండి → GarageBand తెరిచి కొత్త పాట → Loop (⟳) గుర్తు → Files నుంచి ఆ పాటను లాగండి.",
      "30 సెకన్లకు కత్తిరించి, My Songs లో ఆ పాటను నొక్కి పట్టుకోండి → Share → Ringtone → Export.",
      '"Use sound as… Standard Ringtone" ఎంచుకోండి.',
    ],
  },
];

function MusicTab({ tracks }: { tracks: MediaFile[] }) {
  return (
    <div className="rb-stack rb-stack--lg">
      <div className="rb-note">
        🎶 ఈ పాటలన్నీ <strong>Suno AI</strong> (కృత్రిమ మేధ సంగీత సాధనం) తో మేమే తయారుచేశాం. వినండి, డౌన్‌లోడ్ చేసి మీ ఫోన్ <strong>రింగ్‌టోన్</strong>, అలారం, WhatsApp స్టేటస్ పాటగా ఉచితంగా వాడుకోండి. ఒకదాన్ని ప్లే చేస్తే మిగతావి తానే ఆగిపోతాయి.
      </div>
      {tracks.length ? (
        <YGrid<TrackRow>
          data={tracks.map((t) => ({ id: t.name, name: pretty(t.name), kind: ext(t.name), size: t.size, file: t.name }))}
          columns={TRACK_COLUMNS}
          rowKey="id"
          search
          toolName="ratnalabala_ringtones"
          pagination={{ pageSize: 10, showSizeChanger: true, sizeOptions: [10, 25, 50] }}
          empty={<span>ఆ పేరుతో పాట దొరకలేదు</span>}
        />
      ) : (
        <Empty text="పాటలు త్వరలో ఇక్కడ చేరతాయి." />
      )}
      <HowTo title="రింగ్‌టోన్‌గా ఎలా పెట్టుకోవాలి?" blocks={RINGTONE} />
    </div>
  );
}

/* ═══════════════ 🎬 VIDEOS ═══════════════ */

type VideoRow = { id: string; name: string; size: number; file: string };

const VIDEO_COLUMNS: GridColumn<VideoRow>[] = [
  {
    key: "file",
    label: "వీడియో",
    render: (_v, r) => <video controls playsInline preload="metadata" src={`${url("video", r.file)}#t=0.1`} aria-label={`${r.name} — వీడియో`} className="rb-video" />,
  },
  { key: "name", label: "పేరు", sortable: true, render: (v) => <strong className="rb-name">{String(v)}</strong> },
  { key: "size", label: "డౌన్‌లోడ్", render: (v, r) => <DownloadLink href={url("video", r.file)} file={r.file} label={mb(Number(v))} /> },
];

function VideosTab({ videos }: { videos: MediaFile[] }) {
  if (!videos.length) return <Empty text="వీడియోలు త్వరలో ఇక్కడ చేరతాయి." />;
  return (
    <div className="rb-stack">
      <p className="rb-lede">AI తో తయారుచేసిన మా వీడియోలు. ▶ నొక్కితే ఇక్కడే ప్లే అవుతుంది; ⛶ తో పూర్తి తెర. ఒకటి ప్లే చేస్తే మిగతావి ఆగిపోతాయి.</p>
      <YGrid<VideoRow>
        data={videos.map((v) => ({ id: v.name, name: pretty(v.name), size: v.size, file: v.name }))}
        columns={VIDEO_COLUMNS}
        rowKey="id"
        view="card"
        search={videos.length > 4}
        toolName="ratnalabala_videos"
        pagination={{ pageSize: 6, showSizeChanger: false }}
      />
    </div>
  );
}

/* ═══════════════ main ═══════════════ */

export default function ShailimalaTabs({ initialFonts, initialBooks, music = [], videos = [], apk = null }: Props) {
  const [tab, setTab] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  useOneAtATime(rootRef);

  // open the tab named in the link (#apk, #music …) and follow back/forward
  useEffect(() => {
    const fromHash = () => {
      const i = TABS.findIndex((t) => `#${t.id}` === window.location.hash);
      if (i >= 0) setTab(i);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const change = (_: unknown, i: number) => {
    setTab(i);
    history.replaceState(null, "", `#${TABS[i].id}`);
    rootRef.current?.querySelectorAll<HTMLMediaElement>("audio, video").forEach((m) => m.pause());
  };

  const counts = [groupFonts(initialFonts).length, initialBooks.length, apk ? 1 : 0, music.length, videos.length];

  return (
    <div ref={rootRef}>
      <div className="rb-sticky-tabs">
        <Tabs value={tab} onChange={change} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="శైలిమాల విభాగాలు" className="rb-line-tabs">
          {TABS.map((t, i) => (
            <Tab key={t.id} id={`sh-tab-${t.id}`} aria-controls={`sh-panel-${t.id}`} label={counts[i] > 1 ? `${t.label} (${counts[i]})` : t.label} />
          ))}
        </Tabs>
      </div>

      {TABS.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`sh-panel-${t.id}`} aria-labelledby={`sh-tab-${t.id}`} hidden={tab !== i}>
          {tab === i && (
            <>
              {t.id === "fonts" && <FontsTab files={initialFonts} />}
              {t.id === "books" && <BooksTab files={initialBooks} />}
              {t.id === "apk" && <ApkTab apk={apk} />}
              {t.id === "music" && <MusicTab tracks={music} />}
              {t.id === "videos" && <VideosTab videos={videos} />}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
