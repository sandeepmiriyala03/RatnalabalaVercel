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

/* ------------------------------------------------------------------ */
/* main.py fonts API — ఒక్కసారే పిలుపు (Grid, ఖతి మాల, PDF అన్నీ ఇదే)    */
/* ------------------------------------------------------------------ */

let fontsRequest: Promise<TeluguFont[]> | null = null;

export function fetchTeluguFonts(): Promise<TeluguFont[]> {
  fontsRequest ??= fetch("/api/main?endpoint=fonts")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => [SITE_FONT, ...parseFonts(data)])
    .catch((err) => {
      console.warn("Telugu fonts API failed, using site font only:", err);
      fontsRequest = null; // తర్వాత మళ్ళీ ప్రయత్నించడానికి
      return [SITE_FONT];
    });
  return fontsRequest;
}

/* ------------------------------------------------------------------ */
/* main.py "value" → సైట్ CSS లోని అసలు font-family పేరు                */
/* ఉదా: "Mallanna-Italic" → "MallannaItalic", "Syamala Ramana" →        */
/* "SyamalaRamana", "Suranna-Regular" → "Suranna". రెండో జాబితా అక్కర్లేదు. */
/* ------------------------------------------------------------------ */

const normFamily = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

let familyIndex: Map<string, string> | null = null;

function buildFamilyIndex(): Map<string, string> {
  const map = new Map<string, string>();
  const add = (raw: string) => {
    const family = raw.replace(/["']/g, "").trim();
    if (!family) return;
    const key = normFamily(family);
    if (!map.has(key)) map.set(key, family);
    const bare = key.replace(/regular$/, "");
    if (bare && !map.has(bare)) map.set(bare, family);
  };
  try {
    document.fonts.forEach((face) => add(face.family));
  } catch {
    /* పాత బ్రౌజర్లు */
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule.cssText.startsWith("@font-face")) add((rule as CSSFontFaceRule).style.getPropertyValue("font-family"));
      }
    } catch {
      /* వేరే origin stylesheet */
    }
  }
  return map;
}

export function resolveFontFamily(value: string): string {
  if (typeof document === "undefined" || !value) return value;
  const key = normFamily(value);
  const find = () => familyIndex!.get(key) ?? familyIndex!.get(key.replace(/regular$/, ""));
  familyIndex ??= buildFamilyIndex();
  let hit = find();
  if (!hit) {
    familyIndex = buildFamilyIndex(); // CSS ఆలస్యంగా load అయి ఉండవచ్చు
    hit = find();
  }
  return hit ?? value;
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
  const first = font.id === SITE_FONT_ID ? siteTeluguFont() : `"${resolveFontFamily(font.family).replace(/"/g, "")}"`;
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
  /** PDF లో అంశాల పేరు — డిఫాల్ట్ "పద్యాలు" (ఉదా: "సంధులు", "పదాలు", "కథలు") */
  unitLabel?: string;
  /** చివరి పేజీలో సంకలనం పేరు ముందు పదం — డిఫాల్ట్ "శతకం" */
  collectionLabel?: string;
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

/** తెలుగు అంకెలు: 12 → ౧౨ */
const TE_DIGITS = "౦౧౨౩౪౫౬౭౮౯";
export const teluguNumber = (n: number | string) => String(n).replace(/\d/g, (d) => TE_DIGITS[Number(d)]);

/** ముఖపేజీ, చివరి పేజీలోని లోగో (public/icons) */
const LOGO_PATH = "/icons/android-launchericon-512-512.png";

/**
 * Print కోసం HTML — ప్రతి పేజీని మనమే అమరుస్తాం (బ్రౌజర్ కాదు):
 *  • @page margin 0 → బ్రౌజర్ పెట్టే తేదీ, సమయం, URL, "1/10" రావు
 *  • ప్రతి పేజీ కింద తెలుగు అంకెలతో "పుట ౩ / ౧౦"
 *  • మొదటి పేజీ: లోగో + శీర్షిక; చివరి పేజీ: ఈ పుస్తకం వివరాలు (ఫాంట్, సైజు, థీమ్)
 * preview = true అయితే మొదటి 3 పద్యాలు మాత్రమే.
 */
export function buildPdfHtml(
  { poems, poetryName, poet = "", unitLabel = "పద్యాలు", collectionLabel = "శతకం" }: ExportOptions,
  settings: PdfSettings,
  font: TeluguFont,
  preview = false
): string {
  const title = poetryName.trim();
  const size = PAGE_SIZES.find((s) => s.id === settings.pageSize) ?? PAGE_SIZES[0];
  const t = PDF_THEMES.find((x) => x.id === settings.theme) ?? PDF_THEMES[0];
  const scale = Math.min(1.6, Math.max(0.8, settings.fontScale));
  // A5 చిన్న పేజీ — అక్షరాలు కొంచెం చిన్నగా
  const basePt = (size.id === "A5" ? 11 : 13) * scale;
  const m = size.marginMm;
  // ముద్రణలో చిన్న గుండ్రని తేడాల వల్ల ఖాళీ పేజీ రాకుండా 0.6mm తక్కువ
  const pageH = size.heightMm - 0.6;

  // సైట్ ఫాంట్ → అన్ని @font-face; link ఉన్న font → ఆ link; main.py fonts (link లేవు) → సైట్ CSS లోని ఆ font నియమాలు
  let fontLinks: string;
  if (font.id === SITE_FONT_ID || (!font.cssUrl && !font.fileUrl)) {
    const site = collectSiteFontCss(font.id === SITE_FONT_ID ? undefined : resolveFontFamily(font.family));
    fontLinks = `${site.links}\n<style>${site.css}</style>`;
  } else {
    fontLinks = fontHeadHtml(font);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logo = `${origin}${LOGO_PATH}`;
  const madeOn = new Date().toLocaleDateString("te-IN", { day: "numeric", month: "long", year: "numeric" });
  const site = origin.replace(/^https?:\/\//, "");

  const list = preview ? poems.slice(0, 3) : poems;
  const poemsHtml = list
    .map((p, i) => {
      const lines = p.content.split(/\r?\n/).map((l) => escapeHtml(l.trim())).filter(Boolean).join("<br>");
      const special =
        settings.showSpecialLine && p.specialLine
          ? `<p class="special"><span>ప్రత్యేక పంక్తి</span>${escapeHtml(p.specialLine)}</p>`
          : "";
      return `<article class="poem"><h2><span class="num">${teluguNumber(i + 1)}</span>${escapeHtml(p.title)}</h2><p class="text">${lines}</p>${special}</article>`;
    })
    .join("\n");

  const row = (k: string, v: string) => `<tr><th>${k}</th><td>${escapeHtml(v)}</td></tr>`;
  const previewNote =
    preview && poems.length > list.length
      ? `<p class="note">నమూనా: మొదటి ${teluguNumber(list.length)} ${unitLabel} మాత్రమే. PDF లో మొత్తం ${teluguNumber(poems.length)} ${unitLabel} ఉంటాయి.</p>`
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
  @page { size: ${size.widthMm}mm ${size.heightMm}mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: ${t.paper}; }
  body { font-family: ${fontStack(font)}; color: ${t.text}; font-size: ${basePt.toFixed(2)}pt; line-height: 1.65; }
  #src { display: none; }

  /* ఒక్కో పేజీ — స్థిరమైన కాగితం సైజు */
  .page { width: ${size.widthMm}mm; height: ${pageH}mm; display: flex; flex-direction: column; overflow: hidden; background: ${t.paper}; break-after: page; page-break-after: always; }
  .page:last-child { break-after: auto; page-break-after: auto; }
  .content { flex: 1; min-height: 0; overflow: hidden; padding: ${m}mm ${m}mm 2mm; }
  .foot { height: ${Math.max(10, m - 2)}mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 0.6em; font-size: 0.72em; color: ${t.muted}; }
  .foot::before, .foot::after { content: ""; width: 2.2em; height: 0.5pt; background: ${t.rule}; }
  .foot:empty { visibility: hidden; }

  /* పద్యం — పూర్తి వెడల్పు, చిన్న సంఖ్య గుర్తు */
  .poem { padding: 0.6em 0 0.7em; border-bottom: 0.5pt solid ${t.rule}; }
  .poem:last-child { border-bottom: 0; }
  h2 { font-size: 1.05em; margin: 0 0 0.3em; display: flex; align-items: baseline; gap: 0.55em; color: ${t.text}; }
  h2 .num { flex-shrink: 0; min-width: 1.9em; padding: 0 0.4em; border-radius: 1em; background: ${t.soft}; color: ${t.accent}; font-size: 0.8em; text-align: center; border: 0.5pt solid ${t.rule}; }
  .text { margin: 0; padding-left: 0.2em; }
  .special { margin: 0.55em 0 0; padding: 0.35em 0.75em; border-left: 3pt solid ${t.accent}; background: ${t.soft}; font-weight: 700; border-radius: 0 0.3em 0.3em 0; }
  .special span { display: block; font-size: 0.68em; font-weight: 400; color: ${t.muted}; }

  /* ముఖపేజీ */
  .cover { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cover img { width: 38mm; height: 38mm; object-fit: contain; margin-bottom: 9mm; }
  .cover h1 { font-size: 2.5em; margin: 0 0 0.35em; line-height: 1.35; color: ${t.accent}; }
  .cover .poet { font-size: 1.2em; margin: 0 0 1.4em; }
  .cover .band { width: 3.5em; height: 0.25em; border-radius: 1em; background: ${t.accent}; margin: 0 auto 1.2em; }
  .cover .meta { font-size: 0.85em; color: ${t.muted}; margin: 0.1em 0; }

  /* చివరి పేజీ — ఈ పుస్తకం గురించి */
  .colophon { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .colophon img { width: 22mm; height: 22mm; object-fit: contain; margin-bottom: 6mm; }
  .colophon h3 { font-size: 1.15em; margin: 0 0 0.8em; color: ${t.accent}; }
  .colophon table { border-collapse: collapse; font-size: 0.85em; margin-bottom: 1.4em; }
  .colophon th { text-align: left; font-weight: 400; color: ${t.muted}; padding: 0.25em 1.2em 0.25em 0; }
  .colophon td { text-align: left; font-weight: 700; padding: 0.25em 0; }
  .colophon .thanks { font-size: 0.85em; color: ${t.muted}; margin: 0.2em 0; }
  .colophon .note { font-size: 0.75em; color: ${t.muted}; margin-top: 1.2em; }

  /* స్క్రీన్ నమూనా: పేజీలు ఒకదాని కింద ఒకటి */
  @media screen {
    html, body { background: #d9dee5; }
    body { padding: 6mm 0; }
    .page { margin: 0 auto 6mm; box-shadow: 0 2px 12px rgba(15, 23, 42, 0.18); }
  }
</style>
</head>
<body>
<div id="pages"></div>
<template id="src">
  <section class="cover">
    <img src="${logo}" alt="">
    <h1>${escapeHtml(title)}</h1>
    ${poet ? `<p class="poet">${escapeHtml(poet)}</p>` : ""}
    <div class="band"></div>
    <p class="meta">${teluguNumber(poems.length)} ${unitLabel}</p>
    <p class="meta">${SITE_NAME}</p>
  </section>
  ${poemsHtml}
  <section class="colophon">
    <img src="${logo}" alt="">
    <h3>ఈ పుస్తకం గురించి</h3>
    <table>
      ${row(collectionLabel, title)}
      ${poet ? row("కవి", poet) : ""}
      ${row(unitLabel, teluguNumber(poems.length))}
      ${row("ఫాంట్", font.label)}
      ${row("పేజీ సైజు", `${size.label} (${size.hint})`)}
      ${row("రంగుల థీమ్", t.label)}
      ${row("తయారైన తేదీ", madeOn)}
    </table>
    <p class="thanks">${SITE_NAME}</p>
    ${site ? `<p class="thanks">${escapeHtml(site)}</p>` : ""}
    ${previewNote}
  </section>
</template>
<script>
(function () {
  var TE = "${TE_DIGITS}";
  function te(n) { return String(n).replace(/\\d/g, function (d) { return TE[+d]; }); }
  function run() {
    var pages = document.getElementById("pages");
    var items = Array.prototype.slice.call(document.getElementById("src").content.children);
    function newPage(cls) {
      var p = document.createElement("div");
      p.className = "page" + (cls ? " " + cls : "");
      p.innerHTML = '<div class="content"></div><div class="foot"></div>';
      pages.appendChild(p);
      return p.firstChild;
    }
    var box = null;
    items.forEach(function (it) {
      if (it.classList.contains("cover") || it.classList.contains("colophon")) {
        newPage(it.className + "-page").appendChild(it);
        box = null;
        return;
      }
      if (!box) box = newPage("");
      box.appendChild(it);
      // ఈ పేజీలో పట్టకపోతే కొత్త పేజీకి (ఒక పద్యం ఎప్పుడూ రెండు పేజీల మధ్య విడిపోదు)
      if (box.scrollHeight > box.clientHeight + 1 && box.children.length > 1) {
        box.removeChild(it);
        box = newPage("");
        box.appendChild(it);
      }
    });
    var all = pages.children;
    for (var i = 1; i < all.length; i++) {
      all[i].lastChild.textContent = "పుట " + te(i + 1) + " / " + te(all.length);
    }
  }
  function done() { document.documentElement.setAttribute("data-paged", "1"); }
  var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(function () { setTimeout(function () { try { run(); } finally { done(); } }, 60); });
})();
</script>
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

  onProgress(80, "పుటలు అమరుస్తున్నాం…");
  // పేజీల script పూర్తయ్యే వరకు (గరిష్ఠం 8 సెకన్లు)
  for (let waited = 0; waited < 8000 && win.document.documentElement.getAttribute("data-paged") !== "1"; waited += 100) {
    await pause(100);
  }
  await pause(200); // లోగో చిత్రం, గుణింతాలు పూర్తిగా అమరడానికి

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
  onProgress(10, "పద్యాలు సిద్ధం చేస్తున్నాం…");
  // ఇక్కడ await లేదు — iPhone లో కొత్త tab బటన్ నొక్కిన వెంటనే తెరవాలి
  return printHtml(buildPdfHtml(options, settings, font), onProgress);
}

/**
 * ఏ print HTML నైనా బ్రౌజర్ Print window లో తెరుస్తుంది (పద్యాలు, అక్షరమాల…).
 * HTML లో <html data-paged="1"> ఉండాలి, లేదా పేజీలు అమర్చే script అది సెట్ చేయాలి.
 */
export async function printHtml(html: string, onProgress: ProgressFn = () => {}): Promise<void> {
  // iPhone/iPad: కొత్త tab. window.open ఏ await కంటే ముందే ఉండాలి (popup blocker).
  const ios = isIOS();
  const iosWin = ios ? window.open("", "_blank") : null;
  if (ios && !iosWin) throw new Error("Popup blocked");

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

/* ================================================================== */
/* అక్షరమాల — PDF చార్ట్ మరియు Excel                                    */
/* ================================================================== */

export type AksharaExportRow = {
  letter: string;
  word: string;
  typeLabel: string;
  image?: string;
};

/** ఒక A4 పేజీకి 12 అక్షరాలు (3 × 4) — పిల్లల చార్ట్ లాగా */
const AKSHARA_COLS = 3;
const AKSHARA_PER_PAGE = 12;

const absoluteSrc = (src: string) => {
  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return src;
  }
};

export function buildAksharaChartHtml(title: string, rows: AksharaExportRow[]): string {
  const site = collectSiteFontCss();
  const origin = window.location.origin;
  const logo = `${origin}${LOGO_PATH}`;
  const madeOn = new Date().toLocaleDateString("te-IN", { day: "numeric", month: "long", year: "numeric" });

  const cell = (r: AksharaExportRow) => `<div class="cell">
  <div class="pic">${r.image ? `<img src="${escapeHtml(absoluteSrc(r.image))}" alt="">` : ""}</div>
  <div class="letter">${escapeHtml(r.letter)}</div>
  <div class="word">${escapeHtml(r.word)}</div>
  <div class="type">${escapeHtml(r.typeLabel)}</div>
</div>`;

  const chunks: AksharaExportRow[][] = [];
  for (let i = 0; i < rows.length; i += AKSHARA_PER_PAGE) chunks.push(rows.slice(i, i + AKSHARA_PER_PAGE));
  const total = chunks.length + 1; // + ముఖపేజీ

  const pages = chunks
    .map(
      (chunk, i) => `<div class="page">
  <div class="content"><div class="chart">${chunk.map(cell).join("")}</div></div>
  <div class="foot">పుట ${teluguNumber(i + 2)} / ${teluguNumber(total)}</div>
</div>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="te" data-paged="1">
<head>
<meta charset="utf-8">
<title>${escapeHtml(safeName(title))}_${today()}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&display=swap">
${site.links}
<style>${site.css}</style>
<style>
  @page { size: 210mm 297mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: ${fontStack(SITE_FONT)}; color: #0f172a; }
  .page { width: 210mm; height: 296.4mm; display: flex; flex-direction: column; overflow: hidden; break-after: page; page-break-after: always; }
  .page:last-child { break-after: auto; page-break-after: auto; }
  .content { flex: 1; min-height: 0; padding: 12mm 12mm 0; }
  .foot { height: 12mm; display: flex; align-items: center; justify-content: center; gap: 0.6em; font-size: 9pt; color: #64748b; }
  .foot::before, .foot::after { content: ""; width: 2.2em; height: 0.5pt; background: #cbd5e1; }
  .foot:empty { visibility: hidden; }

  .chart { height: 100%; display: grid; grid-template-columns: repeat(${AKSHARA_COLS}, 1fr); grid-template-rows: repeat(4, 1fr); gap: 4mm; }
  .cell { border: 0.8pt solid #c7d2fe; border-radius: 4mm; background: #f8faff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3mm; text-align: center; overflow: hidden; }
  .pic { height: 26mm; display: flex; align-items: center; justify-content: center; }
  .pic img { max-height: 26mm; max-width: 100%; object-fit: contain; }
  .letter { font-size: 34pt; font-weight: 900; line-height: 1.15; color: #1a237e; }
  .word { font-size: 14pt; font-weight: 700; line-height: 1.4; color: #6a1b9a; }
  .type { font-size: 8pt; color: #64748b; margin-top: 1mm; }

  .cover { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .cover img { width: 36mm; height: 36mm; object-fit: contain; margin-bottom: 8mm; }
  .cover h1 { font-size: 34pt; margin: 0 0 4mm; color: #1a237e; }
  .cover .sample { font-size: 22pt; letter-spacing: 0.25em; color: #6a1b9a; margin: 0 0 8mm; }
  .cover p { margin: 1mm 0; color: #475569; font-size: 11pt; }

  @media screen {
    html, body { background: #d9dee5; }
    body { padding: 6mm 0; }
    .page { margin: 0 auto 6mm; background: #fff; box-shadow: 0 2px 12px rgba(15, 23, 42, 0.18); }
  }
</style>
</head>
<body>
<div class="page">
  <div class="content"><section class="cover">
    <img src="${logo}" alt="">
    <h1>${escapeHtml(title)}</h1>
    <p class="sample">${rows.slice(0, 5).map((r) => escapeHtml(r.letter)).join(" ")}</p>
    <p>${teluguNumber(rows.length)} అక్షరాలు</p>
    <p>${SITE_NAME} · ${madeOn}</p>
  </section></div>
  <div class="foot"></div>
</div>
${pages}
</body>
</html>`;
}

export async function exportAksharasToPdf(
  title: string,
  rows: AksharaExportRow[],
  onProgress: ProgressFn = () => {}
): Promise<void> {
  if (!rows.length) return;
  onProgress(10, "అక్షరాలు సిద్ధం చేస్తున్నాం…");
  return printHtml(buildAksharaChartHtml(title, rows), onProgress);
}

export async function exportAksharasToExcel(
  title: string,
  rows: AksharaExportRow[],
  onProgress: ProgressFn = () => {}
): Promise<void> {
  if (!rows.length) return;

  onProgress(10, "అక్షరాలు సిద్ధం చేస్తున్నాం…");
  const XLSX = await import("xlsx");

  onProgress(50, "Excel పట్టిక తయారవుతోంది…");
  await pause(50);

  const header = ["సంఖ్య", "అక్షరం", "పదం", "వర్గం", "చిత్రం"];
  const body = rows.map((r, i) => [i + 1, r.letter, r.word, r.typeLabel, r.image ? absoluteSrc(r.image) : ""]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = [{ wch: 7 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 50 }];
  ws["!autofilter"] = { ref: `A1:E${body.length + 1}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (title.replace(/[\\/?*[\]:]/g, "").trim() || "అక్షరమాల").slice(0, 31));

  onProgress(90, "డౌన్‌లోడ్ అవుతోంది…");
  XLSX.writeFile(wb, `${safeName(title)}_${today()}.xlsx`);
  onProgress(100, "Excel డౌన్‌లోడ్ అయింది ✓");
}

/* ================================================================== */
/* ఏ జాబితానైనా (సంధులు, పదాలు, కథలు…) — PDF మరియు Excel                */
/* పద్యాల PDF రూపమే: ముఖపేజీ, తెలుగు పుట సంఖ్యలు, చివరి పేజీ             */
/* ================================================================== */

export type RecordColumn = { key: string; label: string };
export type RecordRow = { id: string } & Record<string, string>;

export type RecordsExport = {
  /** PDF ముఖపేజీ / file పేరు, ఉదా: "సంధి మాల" */
  title: string;
  /** ఉదా: "సంధులు", "పదాలు" */
  unitLabel: string;
  columns: RecordColumn[];
  rows: RecordRow[];
  /** ప్రతి అంశం శీర్షికగా వచ్చే column */
  titleKey: string;
  /** PDF లో highlight పెట్టెలో వచ్చే column (ఐచ్ఛికం) */
  highlightKey?: string;
};

function recordsToPoems({ columns, rows, titleKey, highlightKey }: RecordsExport): ExportPoem[] {
  return rows.map((r) => ({
    title: r[titleKey] ?? "",
    content: columns
      .filter((c) => c.key !== titleKey && c.key !== highlightKey && (r[c.key] ?? "").trim())
      .map((c) => `${c.label}: ${r[c.key]}`)
      .join("\n"),
    specialLine: highlightKey ? r[highlightKey] ?? "" : "",
  }));
}

export async function exportRecordsToPdf(data: RecordsExport, onProgress: ProgressFn = () => {}): Promise<void> {
  if (!data.rows.length) return;
  onProgress(10, `${data.unitLabel} సిద్ధం చేస్తున్నాం…`);
  const html = buildPdfHtml(
    { poems: recordsToPoems(data), poetryName: data.title, unitLabel: data.unitLabel, collectionLabel: "విభాగం" },
    { ...DEFAULT_PDF_SETTINGS, theme: "neeli", showSpecialLine: Boolean(data.highlightKey) },
    SITE_FONT
  ).replace(/<span>ప్రత్యేక పంక్తి<\/span>/g, `<span>${escapeHtml(data.columns.find((c) => c.key === data.highlightKey)?.label ?? "")}</span>`);
  return printHtml(html, onProgress);
}

export async function exportRecordsToExcel(data: RecordsExport, onProgress: ProgressFn = () => {}): Promise<void> {
  if (!data.rows.length) return;

  onProgress(10, `${data.unitLabel} సిద్ధం చేస్తున్నాం…`);
  const XLSX = await import("xlsx");

  onProgress(50, "Excel పట్టిక తయారవుతోంది…");
  await pause(50);

  const header = ["సంఖ్య", ...data.columns.map((c) => c.label)];
  const body = data.rows.map((r, i) => [i + 1, ...data.columns.map((c) => r[c.key] ?? "")]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = [{ wch: 7 }, ...data.columns.map((c) => ({ wch: Math.min(60, Math.max(12, ...data.rows.slice(0, 50).map((r) => (r[c.key] ?? "").length))) }))];
  ws["!autofilter"] = { ref: `A1:${String.fromCharCode(65 + data.columns.length)}${body.length + 1}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (data.title.replace(/[\\/?*[\]:]/g, "").trim() || "జాబితా").slice(0, 31));

  onProgress(90, "డౌన్‌లోడ్ అవుతోంది…");
  XLSX.writeFile(wb, `${safeName(data.title)}_${today()}.xlsx`);
  onProgress(100, "Excel డౌన్‌లోడ్ అయింది ✓");
}