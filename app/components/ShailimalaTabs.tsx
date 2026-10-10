"use client";

/* ═══════════════════════════════════════════════════════════════
   శైలిమాల ట్యాబ్‌లు — 5 ట్యాబ్‌లు, అన్నీ ఉచితం
     🔤 ఫాంట్లు     — Yuktai Grid (వెతుకుడు, క్రమం, పేజీలు, ఫోన్‌లో కార్డులు)
                       ప్రతి వరుసలో ఆ ఫాంట్‌లోనే నమూనా (కనిపించినప్పుడే లోడ్)
     📚 పుస్తకాలు   — Yuktai Grid, చదవండి / డౌన్‌లోడ్
     📱 Android యాప్ — APK డౌన్‌లోడ్ + ఇన్‌స్టాల్ దశలు
     🎵 సంగీతం      — public/MusicPlayer లోని అన్ని పాటలు, ఒకసారి ఒక్కటే
                       మోగుతుంది; రింగ్‌టోన్‌గా పెట్టుకునే దశలు (Suno AI)
     🎬 వీడియోలు    — public/video లోని అన్ని వీడియోలు, ఇక్కడే ప్లే

   • ట్యాబ్ లింక్: /shailimala#apk, #music, #videos … నేరుగా ఆ ట్యాబ్‌కి
   • 60+ పాఠకుల కోసం: పెద్ద అక్షరాలు, 52px పైగా బటన్లు, tokens తో రంగులు
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import dynamic from "next/dynamic";
import type { GridColumn, YuktaiGridProps } from "@yuktishaalaa/yuktai";

/* Yuktai Grid reads the clock while drawing, so Next.js 16 cannot pre-build it on
   the server ("new Date() in a Client Component"). Load it in the browser only —
   a placeholder of the same height shows for a moment meanwhile. */
const YuktaiGrid = dynamic(() => import("@yuktishaalaa/yuktai").then((m) => m.YuktaiGrid), {
  ssr: false,
  loading: () => (
    <Box role="status" sx={{ minHeight: 420, display: "grid", placeItems: "center", borderRadius: "16px", bgcolor: "var(--surface)", border: "1px solid var(--border-strong)", fontSize: "1.15rem" }}>
      పట్టిక సిద్ధమవుతోంది…
    </Box>
  ),
}) as <T extends Record<string, unknown>>(p: YuktaiGridProps<T>) => React.ReactElement;

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

const big = { minHeight: 52, fontSize: "1.05rem", fontWeight: 800, textTransform: "none" as const, borderRadius: "12px" };
const green = { ...big, bgcolor: "var(--secondary)", color: "var(--background)", "&:hover": { bgcolor: "var(--secondary)", filter: "brightness(1.08)" } };
const card = { p: { xs: 2, sm: 2.5 }, borderRadius: "16px", bgcolor: "var(--surface-elevated)", border: "1px solid var(--border-strong)" };
const body = { fontSize: "1.1rem", lineHeight: 1.9 };

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

/* Small "download" link-button. Native <a download> — works offline, no library */
function DownloadLink({ href, file, label, wide }: { href: string; file: string; label?: string; wide?: boolean }) {
  return (
    <Button
      component="a"
      href={href}
      download={file}
      variant="outlined"
      startIcon={<DownloadRoundedIcon />}
      aria-label={`${pretty(file)} డౌన్‌లోడ్ (${ext(file)})`}
      sx={{ ...big, minHeight: 48, fontSize: "1rem", whiteSpace: "nowrap", ...(wide ? { width: "100%" } : {}) }}
    >
      {label ?? "డౌన్‌లోడ్"}
    </Button>
  );
}

/* ═══════════════ 🔤 FONTS ═══════════════ */

/** Sample text drawn in the font itself — the font loads only when the row is on screen */
function FontSample({ file, family }: { file: string; family: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"wait" | "ok" | "bad">("wait");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      if ([...document.fonts].some((f) => f.family === family && f.status === "loaded")) return setState("ok");
      const face = new FontFace(family, `url("${url("Fonts", file)}")`, { display: "swap" });
      face
        .load()
        .then((f) => {
          document.fonts.add(f);
          setState("ok");
        })
        .catch(() => setState("bad"));
    };
    if (!("IntersectionObserver" in window)) return load();
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (load(), io.disconnect()), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [file, family]);

  return (
    <span
      ref={ref}
      data-telugu-font
      lang="te"
      style={{
        fontFamily: state === "ok" ? `"${family}", var(--font-telugu, sans-serif)` : "inherit",
        fontSize: "1.45rem",
        lineHeight: 1.7,
        opacity: state === "wait" ? 0.45 : 1,
        transition: "opacity .2s",
        display: "inline-block",
      }}
    >
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
      "చాలా ఫోన్లలో మొత్తం ఫోన్ ఫాంట్ మార్చలేం — కానీ PixelLab, Canva, Kinemaster లాంటి యాప్‌లలో \"ఫాంట్ జోడించు\" తో ఈ .ttf వాడవచ్చు.",
      "ఇన్‌స్టాల్ వద్దనుకుంటే: మా ఖతిమాల లో ఈ ఫాంట్‌తో రాసి చిత్రం / PDF గా దాచుకోండి.",
    ],
  },
  {
    os: "📱 iPhone / iPad",
    steps: ["App Store నుంచి \"iFont\" లాంటి ఉచిత యాప్ తెచ్చుకోండి.", "ఫైల్‌ను ఆ యాప్‌లో తెరిచి \"Install\" నొక్కండి → Settings లో Profile ను అనుమతించండి.", "Pages, Keynote లాంటి యాప్‌లలో ఆ ఫాంట్ కనిపిస్తుంది."],
  },
];

function FontsTab({ files }: { files: string[] }) {
  const rows = groupFonts(files);
  const columns: GridColumn<FontRow>[] = [
    { key: "name", label: "ఫాంట్ పేరు", sortable: true, render: (v) => <strong style={{ fontSize: "1.1rem" }}>{String(v)}</strong> },
    { key: "sample", label: "నమూనా", render: (_v, r) => <FontSample file={r.sample} family={`Shaili ${r.id}`} /> },
    { key: "formats", label: "రకం", type: "badge", hiddenOnMobile: true },
    {
      key: "ttf",
      label: "డౌన్‌లోడ్",
      render: (_v, r) => (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {r.ttf && <DownloadLink href={url("Fonts", r.ttf)} file={r.ttf} label="TTF" />}
          {r.otf && <DownloadLink href={url("Fonts", r.otf)} file={r.otf} label="OTF" />}
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <Typography sx={body}>
        పేరుతో వెతకండి, శీర్షిక నొక్కి క్రమం మార్చండి. ప్రతి వరుసలో ఆ ఫాంట్‌లోనే నమూనా కనిపిస్తుంది. <strong>TTF</strong> అన్ని పరికరాల్లో పనిచేస్తుంది — సందేహం ఉంటే అదే తీసుకోండి.
      </Typography>

      {rows.length ? (
        <YuktaiGrid<FontRow>
          data={rows}
          columns={columns}
          rowKey="id"
          locale="te-IN"
          inputLanguage="te-IN"
          search
          ai
          view="auto"
          mobileBreakpoint={700}
          toolName="ratnalabala_fonts"
          pagination={{ pageSize: 10, showSizeChanger: true, sizeOptions: [10, 20, 50, 100] }}
          empty={<span>ఆ పేరుతో ఫాంట్ దొరకలేదు</span>}
        />
      ) : (
        <Empty text="ఫాంట్లు త్వరలో ఇక్కడ చేరతాయి." />
      )}

      <Box>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 1.5 }}>
          ఎలా ఇన్‌స్టాల్ చేయాలి?
        </Typography>
        {INSTALL.map((d) => (
          <Accordion key={d.os} disableGutters sx={{ bgcolor: "var(--surface)", border: "1px solid var(--border-strong)", mb: 1, borderRadius: "12px !important", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ minHeight: 56, "& .MuiAccordionSummary-content": { my: 1.5 } }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>{d.os}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Steps items={d.steps} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Stack>
  );
}

/* ═══════════════ 📚 BOOKS ═══════════════ */

type BookRow = { id: string; name: string; kind: string; file: string };

function BooksTab({ files }: { files: string[] }) {
  const rows: BookRow[] = files.map((f) => ({ id: f, name: pretty(f), kind: ext(f), file: f }));
  const columns: GridColumn<BookRow>[] = [
    { key: "name", label: "పుస్తకం", sortable: true, render: (v) => <strong style={{ fontSize: "1.1rem" }}>{String(v)}</strong> },
    { key: "kind", label: "రకం", type: "badge", sortable: true, hiddenOnMobile: true },
    {
      key: "file",
      label: "చదవండి / దాచుకోండి",
      render: (_v, r) => (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {r.kind === "PDF" && (
            <Button component="a" href={url("books", r.file)} target="_blank" rel="noopener" variant="contained" sx={{ ...green, minHeight: 48, fontSize: "1rem" }}>
              📖 చదవండి
            </Button>
          )}
          <DownloadLink href={url("books", r.file)} file={r.file} />
        </Stack>
      ),
    },
  ];
  return rows.length ? (
    <Stack spacing={2}>
      <Typography sx={body}>PDF అయితే &ldquo;చదవండి&rdquo; తో ఇక్కడే తెరుచుకుంటుంది. EPUB ఫైళ్ళు ఫోన్‌లో Google Play Books / Apple Books లో తెరవండి.</Typography>
      <YuktaiGrid<BookRow>
        data={rows}
        columns={columns}
        rowKey="id"
        locale="te-IN"
        inputLanguage="te-IN"
        search
        ai
        view="auto"
        mobileBreakpoint={700}
        toolName="ratnalabala_books"
        pagination={{ pageSize: 10, showSizeChanger: true, sizeOptions: [10, 20, 50] }}
        empty={<span>ఆ పేరుతో పుస్తకం దొరకలేదు</span>}
      />
    </Stack>
  ) : (
    <Empty text="పుస్తకాలు త్వరలో ఇక్కడ చేరతాయి." />
  );
}

/* ═══════════════ 📱 ANDROID APP ═══════════════ */

function ApkTab({ apk }: { apk: ApkInfo }) {
  if (!apk) return <Empty text="Android యాప్ త్వరలో ఇక్కడ చేరుతుంది." />;
  return (
    <Stack spacing={3}>
      <Box sx={{ ...card, textAlign: "center" }}>
        <Box aria-hidden sx={{ fontSize: 64, lineHeight: 1, mb: 1 }}>
          📱
        </Box>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.5rem", mb: 0.5 }}>
          రత్నాలబాల – జ్ఞానమాల Android యాప్
        </Typography>
        <Typography sx={{ ...body, color: "var(--muted-text)", mb: 2 }}>
          ఉచితం · {mb(apk.size)} · Android 7 లేదా ఆపై
        </Typography>
        <Button
          component="a"
          href={`/${apk.file}`}
          download={apk.file}
          type="application/vnd.android.package-archive"
          variant="contained"
          startIcon={<DownloadRoundedIcon />}
          sx={{ ...green, minHeight: 60, px: 4, fontSize: "1.2rem", width: { xs: "100%", sm: "auto" } }}
        >
          యాప్ డౌన్‌లోడ్ చేయండి
        </Button>
        <Typography sx={{ mt: 1.5, fontSize: "1rem", color: "var(--muted-text)" }}>iPhone వాడేవారు: యాప్ అవసరం లేదు — Safari లో ఈ సైట్ తెరిచి Share ⬆ → &ldquo;Add to Home Screen&rdquo;.</Typography>
      </Box>

      <Box sx={card}>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.35rem", mb: 1.5 }}>
          ఎలా ఇన్‌స్టాల్ చేయాలి? — 4 దశలు
        </Typography>
        <Steps
          items={[
            'పైన "యాప్ డౌన్‌లోడ్ చేయండి" నొక్కండి. Chrome "ఈ ఫైల్ హాని చేయవచ్చు" అంటే — "అయినా డౌన్‌లోడ్ చేయి" (Download anyway) నొక్కండి.',
            'డౌన్‌లోడ్ అయ్యాక వచ్చే "తెరువు" (Open) నొక్కండి. లేదా Files యాప్ → Downloads లో app-release-signed.apk నొక్కండి.',
            'మొదటిసారి "తెలియని యాప్‌లు" అనుమతి అడుగుతుంది: Settings → "ఈ మూలం నుంచి అనుమతించు" (Allow from this source) ఆన్ చేసి వెనక్కి రండి.',
            '"Install" నొక్కండి. Play Protect అడిగితే "అయినా ఇన్‌స్టాల్ చేయి" నొక్కండి. అయిపోయాక హోమ్ స్క్రీన్‌లో యాప్ కనిపిస్తుంది.',
          ]}
        />
      </Box>

      <Box sx={{ ...card, borderColor: "var(--accent-light)", borderWidth: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", mb: 1 }}>🔒 భద్రత</Typography>
        <Typography sx={body}>
          ఈ యాప్‌ను <strong>ratnalabala.vercel.app</strong> నుంచి మాత్రమే తీసుకోండి — WhatsApp లో వచ్చే APK ఫైళ్ళను నమ్మవద్దు. ఇన్‌స్టాల్ అయ్యాక &ldquo;తెలియని యాప్‌లు&rdquo; అనుమతిని మళ్ళీ ఆఫ్ చేయడం మంచిది. యాప్ మీ ఫోటోలు, కాంటాక్టులు, SMS ఏవీ అడగదు.
        </Typography>
      </Box>
    </Stack>
  );
}

/* ═══════════════ 🎵 MUSIC / RINGTONES ═══════════════ */

function MusicTab({ tracks }: { tracks: MediaFile[] }) {
  return (
    <Stack spacing={3}>
      <Box sx={{ ...card, borderColor: "var(--accent-light)", borderWidth: 2 }}>
        <Typography sx={body}>
          🎶 ఈ పాటలన్నీ <strong>Suno AI</strong> (కృత్రిమ మేధ సంగీత సాధనం) తో మేమే తయారుచేశాం. వినండి, డౌన్‌లోడ్ చేసి మీ ఫోన్ <strong>రింగ్‌టోన్</strong>, అలారం, WhatsApp స్టేటస్ పాటగా ఉచితంగా వాడుకోండి. ఒకదాన్ని ప్లే చేస్తే మిగతావి తానే ఆగిపోతాయి.
        </Typography>
      </Box>

      {tracks.length ? (
        <Stack component="ol" spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }} aria-label="పాటల జాబితా">
          {tracks.map((t, i) => (
            <Box component="li" key={t.name} sx={card}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.2rem", wordBreak: "break-word" }}>
                    {i + 1}. {pretty(t.name)}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={ext(t.name)} size="small" />
                    <Chip label={mb(t.size)} size="small" />
                  </Stack>
                </Box>
                <DownloadLink href={url("MusicPlayer", t.name)} file={t.name} label="రింగ్‌టోన్ డౌన్‌లోడ్" />
              </Stack>
              <Box component="audio" controls preload="none" src={url("MusicPlayer", t.name)} aria-label={`${pretty(t.name)} — పాట`} sx={{ width: "100%", mt: 1.5, height: 54 }} />
            </Box>
          ))}
        </Stack>
      ) : (
        <Empty text="పాటలు త్వరలో ఇక్కడ చేరతాయి." />
      )}

      <Box>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.4rem", mb: 1.5 }}>
          రింగ్‌టోన్‌గా ఎలా పెట్టుకోవాలి?
        </Typography>
        {[
          {
            os: "🤖 Android ఫోన్",
            steps: [
              'పైన "రింగ్‌టోన్ డౌన్‌లోడ్" నొక్కండి — పాట ఫోన్‌లోని Downloads కి వస్తుంది.',
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
        ].map((d) => (
          <Accordion key={d.os} disableGutters sx={{ bgcolor: "var(--surface)", border: "1px solid var(--border-strong)", mb: 1, borderRadius: "12px !important", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ minHeight: 56, "& .MuiAccordionSummary-content": { my: 1.5 } }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>{d.os}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Steps items={d.steps} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Stack>
  );
}

/* ═══════════════ 🎬 VIDEOS ═══════════════ */

function VideosTab({ videos }: { videos: MediaFile[] }) {
  if (!videos.length) return <Empty text="వీడియోలు త్వరలో ఇక్కడ చేరతాయి." />;
  return (
    <Stack spacing={2}>
      <Typography sx={body}>AI తో తయారుచేసిన మా వీడియోలు. ▶ నొక్కితే ఇక్కడే ప్లే అవుతుంది; ⛶ తో పూర్తి తెర. ఒకటి ప్లే చేస్తే మిగతావి ఆగిపోతాయి.</Typography>
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: videos.length > 1 ? "1fr 1fr" : "1fr" } }}>
        {videos.map((v) => (
          <Box component="li" key={v.name} sx={{ ...card, p: 1.5 }}>
            <Box
              component="video"
              controls
              playsInline
              preload="metadata"
              src={`${url("video", v.name)}#t=0.1`}
              aria-label={`${pretty(v.name)} — వీడియో`}
              sx={{ width: "100%", aspectRatio: "16 / 9", bgcolor: "#000", borderRadius: "10px", display: "block", objectFit: "contain" }}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25 }}>
              <Typography component="h3" sx={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: "1.15rem", wordBreak: "break-word" }}>
                {pretty(v.name)}
              </Typography>
              <DownloadLink href={url("video", v.name)} file={v.name} label={mb(v.size)} />
            </Stack>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

/* ═══════════════ shared bits ═══════════════ */

function Steps({ items }: { items: string[] }) {
  return (
    <Box component="ol" sx={{ m: 0, pl: 3.5, "& li": { ...body, mb: 0.75, pl: 0.5 }, "& li::marker": { fontWeight: 800, color: "var(--secondary)" } }}>
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </Box>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Typography role="status" sx={{ ...card, textAlign: "center", fontSize: "1.15rem", py: 4 }}>
      {text}
    </Typography>
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
    <Box ref={rootRef}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 2, bgcolor: "var(--background)", borderBottom: "2px solid var(--border-strong)", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={change}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="శైలిమాల విభాగాలు"
          sx={{
            "& .MuiTab-root": { minHeight: 60, fontSize: "1.08rem", fontWeight: 800, textTransform: "none", color: "var(--foreground)", px: 2 },
            "& .Mui-selected": { color: "var(--secondary) !important" },
            "& .MuiTabs-indicator": { height: 4, borderRadius: 2, bgcolor: "var(--secondary)" },
            "& .MuiTab-root:focus-visible": { outline: "3px solid var(--focus-ring)", outlineOffset: -3 },
          }}
        >
          {TABS.map((t, i) => (
            <Tab key={t.id} id={`sh-tab-${t.id}`} aria-controls={`sh-panel-${t.id}`} label={counts[i] > 1 ? `${t.label} (${counts[i]})` : t.label} />
          ))}
        </Tabs>
      </Box>

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
    </Box>
  );
}