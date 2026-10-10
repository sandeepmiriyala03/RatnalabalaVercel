// app/shailimala/page.tsx
/* ═══════════════════════════════════════════════════════════════
   శైలిమాల — తెలుగు ఫాంట్లు, పుస్తకాలు, Android యాప్, సంగీతం, వీడియోలు

   కొత్తగా: public/MusicPlayer (పాటలు), public/video (వీడియోలు),
   public/app-release-signed.apk (Android యాప్) — ఫైల్ వేసి deploy చేస్తే
   తానే జాబితాలో చేరుతుంది. ఫాంట్లు, పుస్తకాలు Yuktai Grid లో.

   ఏం మారింది:
   • <main> → <div>: RootClientLayout ఇప్పటికే <main id="main-content"> ఇస్తుంది
     (ఒక పేజీలో రెండు <main> లు ఉండకూడదు — screen reader లు తికమకపడతాయి)
   • రంగులు సైట్ tokens తో (var(--background) …) — dark mode లోనూ సరిగ్గా
   • పెద్ద అక్షరాలు (60+ పాఠకుల కోసం), ఎన్ని ఫాంట్లు / పుస్తకాలు ఉన్నాయో లెక్క
   • "ఎలా వాడాలి?" — 3 సులభమైన దశలు + "ఇన్‌స్టాల్ చేయకుండానే వాడండి" (ఖతిమాల)
   • ఫైళ్ళు చదవడం async, రెండూ ఒకేసారి; తెలుగు క్రమంలో
   • Next.js 16.4 Cache Components: ఫైళ్ళ జాబితా "use cache" తో — పేజీ build
     సమయంలోనే static గా తయారవుతుంది (public/ ఫైళ్ళు deploy తో మాత్రమే మారతాయి)
   ═══════════════════════════════════════════════════════════════ */

import { readdir, stat } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import ShailimalaTabs, { type ApkInfo, type MediaFile } from "@/app/components/ShailimalaTabs";

export const metadata: Metadata = {
  title: "శైలిమాల — ఉచిత తెలుగు ఫాంట్లు, పుస్తకాలు, యాప్, రింగ్‌టోన్లు | రత్నాలబాల",
  description: "తెలుగు యూనికోడ్ ఫాంట్లు (.ttf / .otf), తెలుగు పుస్తకాలు (PDF / EPUB), రత్నాలబాల Android యాప్, ఫోన్ రింగ్‌టోన్లు, AI వీడియోలు — అన్నీ ఉచితం. ఇన్‌స్టాల్ చేసే విధానం తెలుగులో.",
};

const sortTe = (a: string, b: string) => a.localeCompare(b, "te-IN", { sensitivity: "base" });

/** Files in public/<folder> with the given extensions; [] if the folder is missing */
async function listPublic(folder: string, exts: string[]): Promise<string[]> {
  /* Next.js 16.4 Cache Components: reading files is "data" — it must be cached
     or the build stops ("uncached data during prerendering"). public/ only changes
     with a new deploy, so cache it for as long as possible. */
  "use cache";
  cacheLife("max");
  try {
    const dir = path.join(process.cwd(), "public", folder);
    const names = await readdir(dir);
    return names.filter((n) => exts.includes(path.extname(n).toLowerCase())).sort(sortTe);
  } catch (err) {
    // ENOENT = folder not there yet: quietly show the empty state
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") console.error(`public/${folder} read error:`, err);
    return [];
  }
}

/** Files with their sizes (for "2.4 MB" labels) */
async function listPublicSized(folder: string, exts: string[]): Promise<MediaFile[]> {
  "use cache";
  cacheLife("max");
  const names = await listPublic(folder, exts);
  const dir = path.join(process.cwd(), "public", folder);
  return Promise.all(names.map(async (name) => ({ name, size: (await stat(path.join(dir, name))).size })));
}

/** The Android app, if public/app-release-signed.apk is there */
async function findApk(): Promise<ApkInfo> {
  "use cache";
  cacheLife("max");
  const file = "app-release-signed.apk";
  try {
    return { file, size: (await stat(path.join(process.cwd(), "public", file))).size };
  } catch {
    return null;
  }
}

const STEPS = [
  { n: "1", title: "డౌన్‌లోడ్", text: '"ఫాంట్లు" లో నచ్చిన ఫాంట్ పక్కన డౌన్‌లోడ్ నొక్కండి. .ttf ఫైల్ మీ ఫోన్ / కంప్యూటర్‌కి వస్తుంది.' },
  { n: "2", title: "ఇన్‌స్టాల్", text: 'కింద "ఎలా ఇన్‌స్టాల్ చేయాలి?" తెరిచి మీ పరికరం (Windows, Mac, Android, iPhone) దశలు చూడండి.' },
  { n: "3", title: "వాడండి", text: "Word, WhatsApp, Photoshop — ఎక్కడైనా ఆ ఫాంట్‌లో తెలుగు రాయవచ్చు." },
];

export default async function ShailimalaPage() {
  const [fontFiles, bookFiles, music, videos, apk] = await Promise.all([
    listPublic("Fonts", [".ttf", ".otf"]),
    listPublic("books", [".pdf", ".epub"]),
    listPublicSized("MusicPlayer", [".mp3", ".m4a", ".aac", ".ogg", ".wav"]),
    listPublicSized("video", [".mp4", ".webm", ".m4v"]),
    findApk(),
  ]);

  // .ttf and .otf of the same font count once
  const fontCount = new Set(fontFiles.map((f) => f.replace(/\.(ttf|otf)$/i, "").toLowerCase())).size;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* ── Page header ── */}
        <header className="mb-8 pb-6 border-b border-[var(--border-strong)]">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">శైలిమాల</h1>
          <p className="text-lg sm:text-xl text-[var(--muted-text)] leading-relaxed mb-4">ఉచిత తెలుగు ఫాంట్లు, పుస్తకాలు, మా Android యాప్, రింగ్‌టోన్లు, వీడియోలు — ఒకే చోట</p>

          {/* counts */}
          <ul className="flex flex-wrap gap-3 mb-5" aria-label="ఈ పేజీలో ఉన్నవి">
            <li className="rounded-full px-4 py-2 text-base font-bold bg-[var(--surface)] border border-[var(--border-strong)]">
              🔤 {fontCount} ఫాంట్లు
            </li>
            <li className="rounded-full px-4 py-2 text-base font-bold bg-[var(--surface)] border border-[var(--border-strong)]">
              📚 {bookFiles.length} పుస్తకాలు
            </li>
            {apk && (
              <li>
                <a
                  href="#apk"
                  className="block rounded-full px-4 py-2 text-base font-bold bg-[var(--surface)] border border-[var(--border-strong)] hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--focus-ring)]"
                >
                  📱 Android యాప్
                </a>
              </li>
            )}
            {music.length > 0 && (
              <li>
                <a
                  href="#music"
                  className="block rounded-full px-4 py-2 text-base font-bold bg-[var(--surface)] border border-[var(--border-strong)] hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--focus-ring)]"
                >
                  🎵 {music.length} రింగ్‌టోన్లు
                </a>
              </li>
            )}
            {videos.length > 0 && (
              <li>
                <a
                  href="#videos"
                  className="block rounded-full px-4 py-2 text-base font-bold bg-[var(--surface)] border border-[var(--border-strong)] hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--focus-ring)]"
                >
                  🎬 {videos.length} వీడియోలు
                </a>
              </li>
            )}
            <li className="rounded-full px-4 py-2 text-base font-bold bg-[var(--surface)] border border-[var(--border-strong)]">💯 అన్నీ ఉచితం</li>
          </ul>

          <p className="text-base sm:text-lg leading-loose">
            డిజిటల్ విప్లవంతో తెలుగు యూనికోడ్ ఫాంట్లు ప్రింట్‌లోనూ, ఆన్‌లైన్‌లోనూ అందుబాటులోకి వచ్చాయి.{" "}
            <a
              href="https://freetelugufonts.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline underline-offset-4 text-[var(--accent-text)] hover:no-underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--focus-ring)]"
            >
              FreeTeluguFonts.com
              <span className="sr-only"> (కొత్త ట్యాబ్‌లో తెరుచుకుంటుంది)</span>
            </a>{" "}
            మన తెలుగు ప్రజలకు యూనికోడ్ ఫాంట్‌లను ఉచితంగా అందించడం లక్ష్యంగా పెట్టుకుంది.
          </p>

          {/* thanks */}
          <aside
            aria-label="కృతజ్ఞతలు"
            className="mt-5 rounded-xl px-5 py-4 text-base sm:text-lg leading-loose border-2 border-[var(--accent-light)] bg-[color-mix(in_srgb,var(--accent-light)_14%,var(--background))]"
          >
            🙏 తెలుగు లిపికి ఆధునిక యూనికోడ్ ఓపెన్‌టైప్ సాంకేతికతను జోడించి ఉచితంగా అందించిన <strong>అప్పాజీ అంబరీష గారికి</strong>, ఇతర
            ఫాంట్ రూపకర్తలందరికీ &lsquo;రత్నాలబాల–జ్ఞానమాల&rsquo; తరపున హృదయపూర్వక ధన్యవాదాలు.
          </aside>
        </header>

        {/* ── How to use (3 steps) ── */}
        <section aria-labelledby="how-title" className="mb-8">
          <h2 id="how-title" className="text-2xl font-bold mb-4">
            ఎలా వాడాలి? — 3 దశలు
          </h2>
          <ol className="grid gap-3 sm:grid-cols-3 list-none p-0 m-0">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-xl p-4 bg-[var(--surface-elevated)] border border-[var(--border-strong)]">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    aria-hidden
                    className="grid place-items-center w-10 h-10 rounded-full text-lg font-extrabold bg-[var(--secondary)] text-[var(--background)]"
                  >
                    {s.n}
                  </span>
                  <h3 className="text-xl font-bold m-0">{s.title}</h3>
                </div>
                <p className="text-base leading-relaxed m-0">{s.text}</p>
              </li>
            ))}
          </ol>

          {/* try without installing */}
          <p className="mt-4 rounded-xl px-5 py-4 text-base sm:text-lg leading-relaxed bg-[var(--surface)] border border-[var(--border-strong)]">
            💡 <strong>ఇన్‌స్టాల్ చేయకుండానే వాడాలా?</strong> ఈ ఫాంట్లన్నీ మా సైట్‌లోనే పనిచేస్తాయి — పైన ఉన్న ఫాంట్ ఎంపికలో మార్చుకోండి, లేదా{" "}
            <Link
              href="/khatiMala"
              className="font-bold underline underline-offset-4 text-[var(--accent-text)] hover:no-underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--focus-ring)]"
            >
              ఖతిమాల
            </Link>{" "}
            లో రాసి PDF, Word, పోస్టర్, వీడియోగా డౌన్‌లోడ్ చేసుకోండి.
          </p>
        </section>

        {/* ── Tabs: fonts / books / Android app / music / videos ── */}
        <section aria-label="ఫాంట్లు, పుస్తకాలు, యాప్, సంగీతం, వీడియోలు">
          <ShailimalaTabs initialFonts={fontFiles} initialBooks={bookFiles} music={music} videos={videos} apk={apk} />
        </section>

        <p className="mt-8 text-sm sm:text-base text-[var(--muted-text)] leading-relaxed">
          ఈ ఫాంట్లు ఉచితం; ప్రతి ఫాంట్ దాని రూపకర్త ఇచ్చిన లైసెన్స్ ప్రకారం. వాణిజ్య అవసరాలకు వాడేముందు ఆ ఫాంట్ లైసెన్స్ ఒకసారి చూడండి. పాటలు Suno AI తో తయారైనవి — వ్యక్తిగత వాడకానికి (రింగ్‌టోన్, స్టేటస్) ఉచితం.
        </p>
      </div>
    </div>
  );
}