/* ================================================================== */
/* పద్యాల ఎగుమతి — PDF (బ్రౌజర్ Print) మరియు Excel (SheetJS)          */
/* అంతా బ్రౌజర్‌లోనే జరుగుతుంది, సర్వర్ అవసరం లేదు.                     */
/* ================================================================== */


/* ================================================================== */
/* తెలుగు fonts సహాయకులు — జాబితా main.py fonts API నుండి వస్తుంది        */
/* ================================================================== */

export type TeluguFont = {
  id: string;
  /** వినియోగదారుడికి కనిపించే పేరు */
  label: string;
  /** CSS font-family పేరు; సైట్ ఫాంట్‌కి ఖాళీ */
  family: string;
  /** Stylesheet లింక్ (ఉదా: Google Fonts css) */
  cssUrl?: string;
  /** నేరుగా font file (.ttf / .woff2 / .otf) */
  fileUrl?: string;
};

export const SITE_FONT_ID = "site";

/** ఎప్పుడూ ఉండే మొదటి ఎంపిక — సైట్‌లో వినియోగదారుడు ఎంచుకున్న ఫాంట్ */
export const SITE_FONT: TeluguFont = { id: SITE_FONT_ID, label: "సైట్ ఫాంట్", family: "" };

/* ------------------------------------------------------------------ */
/* main.py fonts API → TeluguFont[] (ఏ రూపంలో ఇచ్చినా చదువుతుంది)        */
/*   ["Ramabhadra", ...]                                               */
/*   { fonts: [...] } / { data: [...] } / { items: [...] }             */
/*   [{ family | name | font_family | fontFamily,                      */
/*      label | display_name | telugu_name | label_te,                 */
/*      css | css_url | cssUrl | href | link | url | file | src }]     */
/* ------------------------------------------------------------------ */

type Raw = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const pick = (o: Raw, keys: string[]) => keys.map((k) => str(o[k])).find(Boolean) ?? "";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0C00-\u0C7F]+/g, "-").replace(/^-|-$/g, "");

function toFont(item: unknown): TeluguFont | null {
  if (typeof item === "string") {
    const family = item.trim();
    return family ? { id: slug(family), label: family, family } : null;
  }
  if (!item || typeof item !== "object") return null;
  const o = item as Raw;

  const family = pick(o, ["family", "font_family", "fontFamily", "name", "font", "value"]);
  if (!family) return null;

  const label = pick(o, ["label", "display_name", "displayName", "telugu_name", "label_te", "title"]) || family;
  const link = pick(o, ["css", "css_url", "cssUrl", "href", "link", "url", "file", "file_url", "fileUrl", "src", "path"]);

  const isFile = /\.(ttf|otf|woff2?)(\?|#|$)/i.test(link);
  return {
    id: str(o.id) || slug(family),
    label,
    family,
    cssUrl: link && !isFile ? link : undefined,
    fileUrl: link && isFile ? link : undefined,
  };
}

export function parseFonts(data: unknown): TeluguFont[] {
  const list: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (["fonts", "data", "items", "results"].map((k) => (data as Raw)[k]).find(Array.isArray) as unknown[] | undefined) ?? []
      : [];

  const seen = new Set<string>([SITE_FONT_ID]);
  const fonts: TeluguFont[] = [];
  for (const item of list) {
    const f = toFont(item);
    if (f && !seen.has(f.id)) {
      seen.add(f.id);
      fonts.push(f);
    }
  }
  return fonts;
}

export const findFont = (fonts: TeluguFont[], id: string): TeluguFont =>
  fonts.find((f) => f.id === id) ?? SITE_FONT;

/* ------------------------------------------------------------------ */
/* Font ఉపయోగం                                                          */
/* ------------------------------------------------------------------ */

/** సాపేక్ష URL ని పూర్తి URL గా (PDF frame లో "/fonts/x.ttf" పనిచేయదు) */
export const absoluteUrl = (url: string) => {
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
};

/** వినియోగదారుడు సైట్‌లో ఎంచుకున్న తెలుగు font (లేకపోతే ఖాళీ) */
export function siteTeluguFont(): string {
  if (typeof window === "undefined") return "";
  const read = (el: Element) => getComputedStyle(el).getPropertyValue("--telugu-font-family").trim();
  return read(document.documentElement) || read(document.body);
}

/** పూర్తి font-family stack — ఎంచుకున్న font లేకపోతే మంచి fallback లు */
export function fontStack(font: TeluguFont): string {
  const first = font.id === SITE_FONT_ID ? siteTeluguFont() : `"${font.family.replace(/"/g, "")}"`;
  return [first, '"Noto Sans Telugu"', '"Nirmala UI"', "Gautami", "sans-serif"].filter(Boolean).join(", ");
}

/** Font ను ఈ పేజీలో ఒక్కసారి మాత్రమే load చేయడం */
export function ensureFontLoaded(font: TeluguFont): void {
  if (typeof document === "undefined" || font.id === SITE_FONT_ID) return;
  const marker = `telugu-font-${font.id}`;
  if (document.getElementById(marker)) return;

  if (font.cssUrl) {
    const link = document.createElement("link");
    link.id = marker;
    link.rel = "stylesheet";
    link.href = absoluteUrl(font.cssUrl);
    document.head.appendChild(link);
  } else if (font.fileUrl) {
    const style = document.createElement("style");
    style.id = marker;
    style.textContent = `@font-face { font-family: "${font.family}"; src: url("${absoluteUrl(font.fileUrl)}"); font-display: swap; }`;
    document.head.appendChild(style);
  }
}

/** PDF పేజీ <head> లో పెట్టాల్సిన font HTML */
export function fontHeadHtml(font: TeluguFont): string {
  if (font.cssUrl) return `<link rel="stylesheet" href="${absoluteUrl(font.cssUrl)}">`;
  if (font.fileUrl) {
    return `<style>@font-face { font-family: "${font.family}"; src: url("${absoluteUrl(font.fileUrl)}"); font-display: block; }</style>`;
  }
  return "";
}

/* చిన్న localStorage సహాయకులు — బ్రౌజర్ అనుమతించకపోయినా పేజీ పనిచేస్తుంది */
export function loadPref<T extends object>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function savePref(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage full — ignore */
  }
}

/* ================================================================== */
/* ఎగుమతి                                                              */
/* ================================================================== */

export type ExportPoem = {
  title: string;
  content: string;
  specialLine: string;
};

export type ExportOptions = {
  poems: ExportPoem[];
  /** శతకం / సంకలనం పేరు — PDF ముఖపేజీ, file పేరు */
  poetryName: string;
  poet?: string;
};

/** Progress: 0–100 మరియు ఒక సరళమైన తెలుగు సందేశం */
export type ProgressFn = (percent: number, message: string) => void;

/* ------------------------------------------------------------------ */
/* PDF సెట్టింగ్స్ — పేజీ సైజు, రంగుల థీమ్, ఫాంట్, అక్షర సైజు           */
/* ------------------------------------------------------------------ */

export type PageSizeId = "A4" | "A5" | "Letter";
export type PdfThemeId = "sampradayam" | "neeli" | "pachcha" | "neelambari" | "ink";

export type PdfSettings = {
  pageSize: PageSizeId;
  theme: PdfThemeId;
  /** fonts API లోని font id ("site" = సైట్ ఫాంట్) */
  fontId: string;
  /** 0.8 – 1.6 (100% = 1) */
  fontScale: number;
  /** ప్రత్యేక పంక్తి చూపించాలా */
  showSpecialLine: boolean;
};

export const PAGE_SIZES: { id: PageSizeId; label: string; hint: string; widthMm: number; heightMm: number; marginMm: number }[] = [
  { id: "A4", label: "A4", hint: "సాధారణ పేజీ", widthMm: 210, heightMm: 297, marginMm: 16 },
  { id: "A5", label: "A5", hint: "చిన్న పుస్తకం", widthMm: 148, heightMm: 210, marginMm: 12 },
  { id: "Letter", label: "Letter", hint: "అమెరికా సైజు", widthMm: 216, heightMm: 279, marginMm: 16 },
];

export type PdfTheme = {
  id: PdfThemeId;
  label: string;
  paper: string;
  text: string;
  muted: string;
  accent: string;
  /** ప్రత్యేక పంక్తి నేపథ్యం */
  soft: string;
  rule: string;
};

export const PDF_THEMES: PdfTheme[] = [
  { id: "sampradayam", label: "సంప్రదాయం", paper: "#fffaf0", text: "#3b1d0e", muted: "#7c5a45", accent: "#b45309", soft: "#fdecc8", rule: "#e9d2ad" },
  { id: "neeli", label: "నీలం", paper: "#ffffff", text: "#0f172a", muted: "#475569", accent: "#2563eb", soft: "#eff6ff", rule: "#cbd5e1" },
  { id: "pachcha", label: "పచ్చ", paper: "#fbfdf8", text: "#14281d", muted: "#4b6354", accent: "#15803d", soft: "#e8f5e9", rule: "#cfe3d3" },
  { id: "neelambari", label: "నీలాంబరి", paper: "#fdfcff", text: "#1e1533", muted: "#5b4e78", accent: "#7c3aed", soft: "#f3edff", rule: "#ddd3f3" },
  { id: "ink", label: "ఇంక్ ఆదా", paper: "#ffffff", text: "#000000", muted: "#444444", accent: "#000000", soft: "#ffffff", rule: "#999999" },
];

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  pageSize: "A4",
  theme: "sampradayam",
  fontId: SITE_FONT_ID,
  fontScale: 1,
  showSpecialLine: true,
};

const SITE_NAME = "రత్నాలబాల – జ్ఞానమాల";

const today = () => new Date().toISOString().slice(0, 10);

/** Windows/Mac file names లో పనిచేయని గుర్తులు తీసేయడం */
const safeName = (s: string) =>
  s.trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_") || "పద్యాలు";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]);

/**
 * సైట్‌లో "అక్షర సైజ్" సెట్టింగ్ (--telugu-font-size) → గుణకం.
 * 100% (16px) = 1, 125% = 1.25. 0.8–1.6 మధ్య ఉంచుతాం.
 */
export function siteFontScale(): number {
  if (typeof document === "undefined") return 1;
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;font-size:var(--telugu-font-size, 16px);";
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).fontSize) || 16;
  probe.remove();
  return Math.min(1.6, Math.max(0.8, Math.round((px / 16) * 10) / 10));
}

/** CSS లోని url(...) లను పూర్తి URL గా — PDF frame లో "/fonts/x.woff2" పనిచేయదు */
function absolutizeUrls(cssText: string, base: string): string {
  return cssText.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, _q: string, url: string) => {
    if (url.startsWith("data:")) return match;
    try {
      return `url("${new URL(url, base).href}")`;
    } catch {
      return match;
    }
  });
}

const cleanFamily = (s: string) => s.replace(/["']/g, "").trim().toLowerCase();

/**
 * సైట్ CSS లోని @font-face నియమాలను PDF పేజీలోకి కాపీ చేయడం.
 * main.py fonts కి link లు ఉండవు — అవి సైట్ @font-face నుండే వస్తాయి.
 * family ఇస్తే ఆ font నియమాలు మాత్రమే; లేకపోతే అన్నీ ("సైట్ ఫాంట్").
 */
function collectSiteFontCss(family?: string): { links: string; css: string } {
  const want = family ? cleanFamily(family) : "";
  const links: string[] = [];
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    const base = sheet.href || document.baseURI;
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (!rule.cssText.startsWith("@font-face")) continue;
        if (want) {
          const fam = (rule as CSSFontFaceRule).style?.getPropertyValue("font-family") ?? "";
          if (cleanFamily(fam) !== want) continue;
        }
        rules.push(absolutizeUrls(rule.cssText, base));
      }
    } catch {
      // వేరే origin stylesheet (ఉదా: Google Fonts) — link నే మళ్ళీ జోడిస్తాం
      const href = (sheet.ownerNode as HTMLLinkElement | null)?.href;
      if (href && /fonts\.googleapis\.com/.test(href)) links.push(`<link rel="stylesheet" href="${escapeHtml(href)}">`);
    }
  }
  return { links: links.join("\n"), css: rules.join("\n") };
}

/* ------------------------------------------------------------------ */
/* 📄 PDF HTML                                                         */
/* ------------------------------------------------------------------ */

/**
 * Print కోసం HTML. preview = true అయితే మొదటి 3 పద్యాలు మాత్రమే,
 * స్క్రీన్‌పై కాగితం లాగా కనిపించేలా.
 */
export function buildPdfHtml(
  { poems, poetryName, poet = "" }: ExportOptions,
  settings: PdfSettings,
  font: TeluguFont,
  preview = false
): string {
  const title = poetryName.trim();
  const size = PAGE_SIZES.find((s) => s.id === settings.pageSize) ?? PAGE_SIZES[0];
  const t = PDF_THEMES.find((x) => x.id === settings.theme) ?? PDF_THEMES[0];
  const scale = Math.min(1.6, Math.max(0.8, settings.fontScale));
  // A5 చిన్న పేజీ — అక్షరాలు కొంచెం చిన్నగా
  const basePt = (size.id === "A5" ? 10.5 : 12) * scale;

  // సైట్ ఫాంట్ → అన్ని @font-face; link ఉన్న font → ఆ link; main.py fonts (link లేవు) → సైట్ CSS లోని ఆ font నియమాలు
  let fontLinks: string;
  if (font.id === SITE_FONT_ID || (!font.cssUrl && !font.fileUrl)) {
    const site = collectSiteFontCss(font.id === SITE_FONT_ID ? undefined : font.family);
    fontLinks = `${site.links}\n<style>${site.css}</style>`;
  } else {
    fontLinks = fontHeadHtml(font);
  }

  const list = preview ? poems.slice(0, 3) : poems;
  const poemsHtml = list
    .map((p, i) => {
      const lines = p.content.split(/\r?\n/).map((l) => escapeHtml(l.trim())).filter(Boolean).join("<br>");
      const special =
        settings.showSpecialLine && p.specialLine
          ? `<p class="special"><span>ప్రత్యేక పంక్తి</span>${escapeHtml(p.specialLine)}</p>`
          : "";
      return `<article class="poem">
  <h2><span class="num">${i + 1}</span>${escapeHtml(p.title)}</h2>
  <p class="text">${lines}</p>
  ${special}
</article>`;
    })
    .join("\n");

  const coverHeight = size.heightMm - size.marginMm * 2 - 14;
  const previewNote =
    preview && poems.length > list.length
      ? `<p class="preview-note">నమూనా: మొదటి ${list.length} పద్యాలు మాత్రమే. PDF లో మొత్తం ${poems.length} పద్యాలు ఉంటాయి.</p>`
      : "";

  return `<!doctype html>
<html lang="te">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(safeName(title))}_${today()}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap">
${fontLinks}
<style>
  @page { size: ${size.id === "Letter" ? "letter" : size.id}; margin: ${size.marginMm}mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  html { background: ${t.paper}; }
  body { font-family: ${fontStack(font)}; color: ${t.text}; font-size: ${basePt.toFixed(2)}pt; line-height: 1.8; }

  .cover { min-height: ${coverHeight}mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; break-after: page; }
  .cover .band { width: 3.5em; height: 0.3em; background: ${t.accent}; border-radius: 1em; margin-bottom: 1.6em; }
  .cover h1 { font-size: 2.4em; margin: 0 0 0.45em; line-height: 1.35; color: ${t.accent}; }
  .cover .poet { font-size: 1.25em; margin: 0 0 1.6em; }
  .cover .meta { font-size: 0.88em; color: ${t.muted}; margin: 0.15em 0; }

  .poem { page-break-inside: avoid; break-inside: avoid; padding: 0.9em 0 1em; border-bottom: 0.5pt solid ${t.rule}; }
  .poem:last-of-type { border-bottom: 0; }
  h2 { font-size: 1.08em; margin: 0 0 0.35em; display: flex; gap: 0.6em; align-items: baseline; page-break-after: avoid; break-after: avoid; }
  h2 .num { color: ${t.accent}; min-width: 2em; }
  .text { margin: 0 0 0 2.6em; }
  .special { margin: 0.6em 0 0 2.6em; padding: 0.35em 0.7em; border-left: 3pt solid ${t.accent}; background: ${t.soft}; font-weight: 700; }
  .special span { display: block; font-size: 0.7em; font-weight: 400; color: ${t.muted}; }
  footer { margin-top: 1.5em; text-align: center; font-size: 0.75em; color: ${t.muted}; }
  .preview-note { display: none; }

  /* స్క్రీన్ నమూనా: ఒక కాగితం లాగా */
  @media screen {
    html { background: #d9dee5; }
    body { width: ${size.widthMm}mm; margin: 6mm auto; padding: ${size.marginMm}mm; background: ${t.paper}; box-shadow: 0 2px 12px rgba(15, 23, 42, 0.18); }
    .cover { min-height: ${Math.round(coverHeight * 0.45)}mm; border-bottom: 1px dashed ${t.rule}; margin-bottom: 1em; }
    .preview-note { display: block; text-align: center; font-size: 0.8em; color: ${t.muted}; margin-top: 1.2em; }
  }
</style>
</head>
<body>
  <section class="cover">
    <div class="band"></div>
    <h1>${escapeHtml(title)}</h1>
    ${poet ? `<p class="poet">${escapeHtml(poet)}</p>` : ""}
    <p class="meta">${poems.length} పద్యాలు</p>
    <p class="meta">${SITE_NAME} · ${today()}</p>
  </section>
  ${poemsHtml}
  ${previewNote}
  <footer>${SITE_NAME}</footer>
</body>
</html>`;
}

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/** Fonts వచ్చేవరకు ఆగి print తెరవడం */
async function waitAndPrint(win: Window, onProgress: ProgressFn): Promise<void> {
  onProgress(60, "తెలుగు అక్షరాలు లోడ్ అవుతున్నాయి…");
  await withTimeout(win.document.fonts.ready, 6000);
  await pause(300); // గుణింతాలు పూర్తిగా అమరడానికి

  onProgress(100, "సిద్ధం! Print window లో \"Save as PDF\" ఎంచుకోండి.");
  await pause(150); // సందేశం కనిపించడానికి (print window తెరిస్తే పేజీ ఆగుతుంది)
  win.focus();
  win.print();
}

/* ------------------------------------------------------------------ */
/* 📄 PDF డౌన్‌లోడ్                                                     */
/* ------------------------------------------------------------------ */

export async function exportPoemsToPdf(
  options: ExportOptions,
  settings: PdfSettings,
  font: TeluguFont,
  onProgress: ProgressFn = () => {}
): Promise<void> {
  if (!options.poems.length) return;

  // iPhone/iPad: కొత్త tab. window.open ఏ await కంటే ముందే ఉండాలి (popup blocker).
  const ios = isIOS();
  const iosWin = ios ? window.open("", "_blank") : null;
  if (ios && !iosWin) throw new Error("Popup blocked");

  onProgress(10, "పద్యాలు సిద్ధం చేస్తున్నాం…");
  await pause(50);
  const html = buildPdfHtml(options, settings, font);

  onProgress(35, "పేజీలు అమరుస్తున్నాం…");

  if (iosWin) {
    iosWin.document.open();
    iosWin.document.write(html);
    iosWin.document.close();
    if (iosWin.document.readyState !== "complete") {
      await withTimeout(new Promise<void>((r) => iosWin.addEventListener("load", () => r(), { once: true })), 8000);
    }
    await waitAndPrint(iosWin, onProgress);
    return;
  }

  // స్క్రీన్ బయట iframe (visibility:hidden వాడితే కొన్ని బ్రౌజర్లు ఖాళీ పేజీ print చేస్తాయి)
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  let removed = false;
  const cleanup = () => {
    if (!removed) {
      removed = true;
      iframe.remove();
    }
  };

  try {
    await withTimeout(
      new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.srcdoc = html;
      }),
      8000
    );
    const win = iframe.contentWindow;
    if (!win) throw new Error("Print frame not available");

    win.addEventListener("afterprint", () => setTimeout(cleanup, 1000));
    setTimeout(cleanup, 120_000); // afterprint రాని బ్రౌజర్ల కోసం
    await waitAndPrint(win, onProgress);
  } catch (err) {
    cleanup();
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* 📊 Excel (.xlsx) — SheetJS.  Install: npm i xlsx                     */
/* ------------------------------------------------------------------ */

export async function exportPoemsToExcel(
  { poems, poetryName, poet = "" }: ExportOptions,
  onProgress: ProgressFn = () => {}
): Promise<void> {
  if (!poems.length) return;

  onProgress(10, "పద్యాలు సిద్ధం చేస్తున్నాం…");
  // అవసరమైనప్పుడు మాత్రమే load అవుతుంది — పేజీ బరువు పెరగదు
  const XLSX = await import("xlsx");

  onProgress(50, "Excel పట్టిక తయారవుతోంది…");
  await pause(50);

  const header = ["సంఖ్య", "శీర్షిక", "పద్యం", "ప్రత్యేక పంక్తి", "కవి"];
  const body = poems.map((p, i) => [
    i + 1,
    p.title,
    p.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join("\n"),
    p.specialLine,
    poet,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = [{ wch: 7 }, { wch: 28 }, { wch: 60 }, { wch: 40 }, { wch: 28 }];
  ws["!autofilter"] = { ref: `A1:E${body.length + 1}` };

  // Excel sheet పేరు: 31 అక్షరాలు మించకూడదు, కొన్ని గుర్తులు నిషిద్ధం
  const sheetName = (poetryName.replace(/[\\/?*[\]:]/g, "").trim() || "పద్యాలు").slice(0, 31);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  onProgress(90, "డౌన్‌లోడ్ అవుతోంది…");
  XLSX.writeFile(wb, `${safeName(poetryName)}_${today()}.xlsx`);
  onProgress(100, "Excel డౌన్‌లోడ్ అయింది ✓");
}