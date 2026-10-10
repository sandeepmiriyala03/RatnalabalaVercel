/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — ఎగుమతులు: PDF · పోస్టర్ (PNG) · Word · PowerPoint

   ఫాంట్ ఎలా వస్తుంది?
   • PDF / పోస్టర్ / PPT (చిత్రం రూపం): canvas engine ఎంచుకున్న ఫాంట్‌తోనే
     గీస్తుంది → ఏ పరికరంలో తెరిచినా అదే రూపం (ఫాంట్ install అవసరం లేదు).
   • Word: ఫాంట్ ఫైల్‌నే .docx లోపల పెడతాం (embedded font) — Word
     (Windows / Mac) లో అదే ఫాంట్ కనిపిస్తుంది, టెక్స్ట్ ఎడిట్ చేయవచ్చు.
   • PPT (ఎడిట్ రూపం): అక్షరాలు ఎడిట్ చేయగలిగే text boxes; అలంకరణ
     నేపథ్య చిత్రంగా. ఫాంట్ ఆ కంప్యూటర్‌లో ఉంటేనే అదే రూపం.

   పెద్ద libraries (jspdf, docx, pptxgenjs) బటన్ నొక్కినప్పుడే వస్తాయి
   (dynamic import) — పేజీ ఫోన్‌లో వేగంగా తెరుచుకుంటుంది.
   ═══════════════════════════════════════════════════════════════ */

import { findFont, loadTeluguFont } from "@/lib/teluguFonts";
import { blockText, isStyled, POSTER_PX, SIZES, type Block, type Project, type TextStyle } from "./model";
import { clearMeasureCache, fontsUsed, imagesUsed, layoutProject, preloadImages, renderPage, siteFontName, type Layout } from "./engine";
import type { Theme } from "./themes";

export type Progress = (step: number, percent: number, detail?: string) => void;

const today = () => new Date().toISOString().slice(0, 10);
export const fileBase = (title: string) => `${(title.trim() || "ఖతి_మాల").replace(/[\\/:*?"<>|#%]+/g, "").replace(/\s+/g, "_")}_${today()}`;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/* ─────────────────────────────────────────────────────────────── */
/* 1. FONTS READY — before anything is drawn                         */
/* ─────────────────────────────────────────────────────────────── */

/** Loads every font the project uses; waits (up to 25 s) until each can draw Telugu */
export async function ensureFonts(p: Project): Promise<string[]> {
  const failed: string[] = [];
  for (const value of fontsUsed(p)) {
    if (!value) continue; // site font: already on the page
    const ok = await loadTeluguFont(value);
    const started = Date.now();
    while (ok && !document.fonts.check(`16px "${value}"`, "అ") && Date.now() - started < 25000) {
      await document.fonts.load(`16px "${value}"`, "అ").catch(() => []);
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ok || !document.fonts.check(`16px "${value}"`, "అ")) failed.push(findFont(value)?.label ?? value);
  }
  await document.fonts.ready;
  clearMeasureCache();
  return failed;
}

async function prepare(p: Project) {
  const failed = await ensureFonts(p);
  await preloadImages(imagesUsed(p));
  const layout = layoutProject(p, true);
  return { failed, layout };
}

/* ─────────────────────────────────────────────────────────────── */
/* 2. PDF                                                             */
/* ─────────────────────────────────────────────────────────────── */

const PDF_DPI = 200;

export async function exportPdf(p: Project, progress: Progress): Promise<{ blob: Blob; name: string; failed: string[] }> {
  progress(0, 5);
  const { failed, layout } = await prepare(p);
  progress(1, 15);
  const { jsPDF } = await import("jspdf");
  const { w, h } = layout;
  const pdf = new jsPDF({ unit: "pt", format: [w, h], orientation: w > h ? "landscape" : "portrait", compress: true });
  const n = layout.pages.length;
  for (let i = 0; i < n; i++) {
    progress(1, 15 + Math.round((70 * i) / n), `${i + 1} / ${n}`);
    await nextFrame();
    const canvas = renderPage(layout, i, (w * PDF_DPI) / 72, { project: p });
    const data = canvas.toDataURL("image/jpeg", 0.93);
    canvas.width = canvas.height = 0; // free memory (phones)
    if (i > 0) pdf.addPage([w, h], w > h ? "landscape" : "portrait");
    pdf.addImage(data, "JPEG", 0, 0, w, h, undefined, "FAST");
  }
  progress(2, 90);
  pdf.setProperties({ title: p.title || "ఖతి మాల", creator: "రత్నాలబాల – ఖతి మాల", subject: pdfSubject(p) });
  const blob = pdf.output("blob");
  progress(3, 100);
  return { blob, name: `${fileBase(p.title)}.pdf`, failed };
}

const pdfSubject = (p: Project) =>
  (p.mode === "doc" ? p.blocks : p.slides.flatMap((s) => s.blocks))
    .map(blockText)
    .join(" ")
    .slice(0, 400);

/* ─────────────────────────────────────────────────────────────── */
/* 3. POSTER (PNG) — one page                                        */
/* ─────────────────────────────────────────────────────────────── */

export async function exportPng(p: Project, page: number, progress: Progress) {
  progress(0, 10);
  const { failed, layout } = await prepare(p);
  progress(1, 40);
  await nextFrame();
  const size = p.mode === "doc" ? p.docSize : p.slideSize;
  const i = Math.min(page, layout.pages.length - 1);
  const canvas = renderPage(layout, i, POSTER_WIDTH(size), { project: p });
  progress(2, 80);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
  canvas.width = canvas.height = 0;
  progress(3, 100);
  const suffix = layout.pages.length > 1 ? `_${i + 1}` : "";
  return { blob, name: `${fileBase(p.title)}${suffix}.png`, failed };
}

const POSTER_WIDTH = (s: keyof typeof POSTER_PX) => POSTER_PX[s];

/* ─────────────────────────────────────────────────────────────── */
/* 4. FONT FILES for Word — the real name inside the font            */
/* ─────────────────────────────────────────────────────────────── */

type FontFile = { name: string; data: Uint8Array; embeddable: boolean } | null;

/** Reads "name" (family) and "OS/2" (may it be embedded?) from a TTF/OTF */
export function readFontInfo(buf: ArrayBuffer): { family: string | null; embeddable: boolean } {
  try {
    const v = new DataView(buf);
    const numTables = v.getUint16(4);
    let nameOff = -1;
    let os2Off = -1;
    for (let i = 0; i < numTables; i++) {
      const rec = 12 + i * 16;
      const tag = String.fromCharCode(v.getUint8(rec), v.getUint8(rec + 1), v.getUint8(rec + 2), v.getUint8(rec + 3));
      if (tag === "name") nameOff = v.getUint32(rec + 8);
      if (tag === "OS/2") os2Off = v.getUint32(rec + 8);
    }
    // fsType bit 1 (0x0002) = "restricted license embedding": must not be embedded
    const embeddable = os2Off < 0 ? true : (v.getUint16(os2Off + 8) & 0x000f) !== 0x0002;
    if (nameOff < 0) return { family: null, embeddable };
    const count = v.getUint16(nameOff + 2);
    const strOff = nameOff + v.getUint16(nameOff + 4);
    let best: string | null = null;
    let bestScore = -1;
    for (let i = 0; i < count; i++) {
      const r = nameOff + 6 + i * 12;
      const platform = v.getUint16(r);
      const lang = v.getUint16(r + 4);
      const nameId = v.getUint16(r + 6);
      const len = v.getUint16(r + 8);
      const off = strOff + v.getUint16(r + 10);
      if (nameId !== 1) continue;
      let s = "";
      if (platform === 3 || platform === 0) {
        for (let j = 0; j < len; j += 2) s += String.fromCharCode(v.getUint16(off + j));
      } else if (platform === 1) {
        for (let j = 0; j < len; j++) s += String.fromCharCode(v.getUint8(off + j));
      } else continue;
      const score = (platform === 3 ? 10 : 0) + (lang === 0x409 ? 5 : 0);
      if (s.trim() && score > bestScore) {
        best = s.trim();
        bestScore = score;
      }
    }
    return { family: best, embeddable };
  } catch {
    return { family: null, embeddable: false };
  }
}

const fontFileCache = new Map<string, Promise<FontFile>>();

/** The font file of a Telugu font (site or uploaded), ready to embed */
function fontFile(value: string): Promise<FontFile> {
  let job = fontFileCache.get(value);
  if (!job) {
    job = (async () => {
      const info = findFont(value);
      if (!info || info.kind === "device" || !info.src.length) return null;
      const src = info.src.find((s) => s.format === "truetype") ?? info.src.find((s) => s.format === "opentype") ?? info.src[0];
      try {
        const res = await fetch(src.url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const head = new Uint8Array(buf.slice(0, 4));
        const tag = String.fromCharCode(...head);
        const sfnt = tag === "OTTO" || tag === "true" || (head[0] === 0 && head[1] === 1 && head[2] === 0 && head[3] === 0);
        if (!sfnt) return null; // woff / woff2: Word cannot embed those
        const meta = readFontInfo(buf);
        return { name: meta.family ?? value, data: new Uint8Array(buf), embeddable: meta.embeddable };
      } catch {
        return null;
      }
    })();
    fontFileCache.set(value, job);
  }
  return job;
}

/** Name Word / PowerPoint should use for a font value ("" = site font) */
async function officeFontName(value: string): Promise<string> {
  const v = value || findFont(siteFontName())?.value || "";
  if (!v) return siteFontName();
  const info = findFont(v);
  if (info?.kind === "device") return info.value;
  const file = await fontFile(v);
  return file?.name ?? v;
}

/* ─────────────────────────────────────────────────────────────── */
/* colours                                                            */
/* ─────────────────────────────────────────────────────────────── */

function parseColor(c: string): [number, number, number, number] {
  const m = c.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const [r, g, b, a = "1"] = m[1].split(",").map((s) => s.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  let hex = c.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((x) => x + x).join("");
  const n = parseInt(hex.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
}

/** "#RRGGBB" (no #) — rgba() is blended onto the page colour */
export function hex(c: string, over = "#ffffff"): string {
  const [r, g, b, a] = parseColor(c);
  const [R, G, B] = parseColor(over);
  const mix = (x: number, y: number) => Math.round(x * a + y * (1 - a));
  return [mix(r, R), mix(g, G), mix(b, B)].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

const dataUrlBytes = (src: string) => {
  const b64 = src.slice(src.indexOf(",") + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const contentBoxOf = (layout: Layout, p: Project) => {
  const s = Math.min(layout.w, layout.h);
  const t = layout.theme.pad;
  const reserve = p.pageNumbers || !!p.footer.trim();
  return { t: t.t * s, r: t.r * s, b: t.b * s + (reserve ? s * 0.035 : 0), l: t.l * s };
};

const needsDecor = (theme: Theme, p: Project) => theme.id !== "plain" || !!p.bg?.src;

/* ─────────────────────────────────────────────────────────────── */
/* 5. WORD (.docx) — editable text + embedded fonts + theme picture  */
/* ─────────────────────────────────────────────────────────────── */

export async function exportDocx(p: Project, progress: Progress) {
  progress(0, 5);
  const { failed, layout } = await prepare(p);
  const d = await import("docx");
  progress(1, 25);

  const theme = layout.theme;
  const pageBg = theme.bg[0];
  const { w, h } = layout;
  const box = contentBoxOf(layout, p);
  const tw = (pt: number) => Math.round(pt * 20); // twips

  // fonts: real names + files to embed
  const values = [...new Set(fontsUsed(p).map((v) => v || findFont(siteFontName())?.value || ""))].filter(Boolean);
  const names = new Map<string, string>();
  const embedded: { name: string; data: Uint8Array }[] = [];
  const notEmbedded: string[] = [];
  for (const v of values) {
    const file = await fontFile(v);
    names.set(v, file?.name ?? findFont(v)?.value ?? v);
    if (file && file.embeddable) {
      if (!embedded.some((e) => e.name === file.name)) embedded.push({ name: file.name, data: file.data });
    } else if (findFont(v)?.kind !== "device") notEmbedded.push(findFont(v)?.label ?? v);
  }
  const siteName = await officeFontName("");
  const nameOf = (s: TextStyle) => {
    const v = s.font ?? p.font;
    return v ? names.get(v) ?? v : siteName;
  };
  progress(1, 45);

  const align = (a: TextStyle["align"]) =>
    a === "center" ? d.AlignmentType.CENTER : a === "right" ? d.AlignmentType.RIGHT : a === "justify" ? d.AlignmentType.JUSTIFIED : d.AlignmentType.LEFT;

  const runs = (text: string, s: TextStyle, k: number, color: string, extra: Partial<{ bold: boolean }> = {}) =>
    text.split(/\r?\n/).map((line, i) => {
      const name = nameOf(s);
      const bold = extra.bold ?? s.bold;
      return new d.TextRun({
        text: line,
        break: i > 0 ? 1 : undefined,
        font: { ascii: name, hAnsi: name, cs: name, eastAsia: name },
        size: Math.max(2, Math.round(s.size * k * 2)),
        sizeComplexScript: Math.max(2, Math.round(s.size * k * 2)),
        bold,
        boldComplexScript: bold,
        italics: s.italic,
        italicsComplexScript: s.italic,
        underline: s.underline ? {} : undefined,
        color: hex(color, pageBg),
      });
    });

  // "at least size × line-height" — Word's "auto" multiplies the font's own (tall) Telugu
  // line box, which made lines far apart; this matches the canvas pages
  const lineOf = (s: TextStyle, k: number) => ({ line: Math.round(s.size * k * s.lineHeight * 20), lineRule: d.LineRuleType.AT_LEAST });
  const spacing = (s: TextStyle, k: number, after: number, before = 0) => ({
    ...lineOf(s, k),
    after: tw(s.size * k * after),
    before: tw(s.size * k * before),
  });

  let numberInstance = 0;
  const contentW = w - box.l - box.r;

  const blockToDocx = (b: Block, k: number, first: boolean): (InstanceType<typeof d.Paragraph> | InstanceType<typeof d.Table>)[] => {
    switch (b.type) {
      case "pagebreak":
        return [new d.Paragraph({ children: [new d.PageBreak()] })];
      case "divider":
        return [
          new d.Paragraph({
            border: { bottom: { style: d.BorderStyle.SINGLE, size: 8, color: hex(theme.accent, pageBg), space: 1 } },
            indent: { left: tw(contentW * 0.2), right: tw(contentW * 0.2) },
            spacing: { after: 240 },
            children: [],
          }),
        ];
      case "heading":
      case "text":
      case "quote": {
        if (!b.text.trim()) return [];
        const s = b.style;
        const color = s.color ?? (b.type === "heading" ? theme.heading : theme.text);
        const isQ = b.type === "quote";
        return [
          new d.Paragraph({
            alignment: align(s.align),
            spacing: spacing(s, k, b.type === "heading" ? 0.35 : isQ ? 0.8 : 0.6, b.type === "heading" && !first ? 0.45 : 0),
            keepNext: b.type === "heading",
            ...(isQ
              ? {
                  shading: { type: d.ShadingType.CLEAR, fill: hex(theme.quoteBg, pageBg), color: "auto" },
                  border: { left: { style: d.BorderStyle.SINGLE, size: 24, color: hex(theme.accent, pageBg), space: 10 } },
                  indent: { left: tw(s.size * k * 0.9), right: tw(s.size * k * 0.9) },
                }
              : {}),
            children: runs(b.text, s, k, color),
          }),
        ];
      }
      case "list": {
        const items = b.text.split(/\r?\n/).filter((l) => l.trim());
        if (!items.length) return [];
        const instance = b.ordered ? ++numberInstance : 0;
        const s = { ...b.style, align: b.style.align === "justify" ? ("left" as const) : b.style.align };
        return items.map(
          (line, i) =>
            new d.Paragraph({
              alignment: align(s.align),
              numbering: { reference: b.ordered ? "rb-number" : "rb-bullet", level: 0, ...(b.ordered ? { instance } : {}) },
              spacing: spacing(s, k, i === items.length - 1 ? 0.6 : 0.2),
              children: runs(line, s, k, s.color ?? theme.text),
            })
        );
      }
      case "table": {
        const cols = Math.max(1, ...b.rows.map((r) => r.length));
        const s = { ...b.style, align: b.style.align === "justify" ? ("left" as const) : b.style.align };
        const border = { style: d.BorderStyle.SINGLE, size: 4, color: hex(theme.tableBorder, pageBg) };
        const colTw = Math.floor(tw(contentW) / cols);
        return [
          new d.Table({
            width: { size: tw(contentW), type: d.WidthType.DXA },
            columnWidths: Array(cols).fill(colTw),
            borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
            rows: b.rows.map((row, ri) => {
              const head = b.header && ri === 0;
              const stripe = !head && ri % 2 === (b.header ? 0 : 1);
              const fill = head ? theme.tableHead : stripe ? theme.tableStripe : null;
              return new d.TableRow({
                tableHeader: head,
                cantSplit: true,
                children: Array.from({ length: cols }, (_, ci) =>
                  new d.TableCell({
                    width: { size: colTw, type: d.WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 110, right: 110 },
                    ...(fill ? { shading: { type: d.ShadingType.CLEAR, fill: hex(fill, pageBg), color: "auto" } } : {}),
                    children: [
                      new d.Paragraph({
                        alignment: align(s.align),
                        spacing: lineOf(s, k),
                        children: runs(row[ci] ?? "", s, k, head ? theme.tableHeadText : s.color ?? theme.text, { bold: head || s.bold }),
                      }),
                    ],
                  })
                ),
              });
            }),
          }),
          new d.Paragraph({ spacing: { after: tw(b.style.size * k * 0.6) }, children: [] }),
        ];
      }
      case "image": {
        if (!b.src) return [];
        const wPt = (contentW * Math.min(100, Math.max(10, b.width))) / 100;
        let widthPt = wPt;
        let heightPt = (wPt * b.ih) / b.iw;
        const maxH = (h - box.t - box.b) * 0.85;
        if (heightPt > maxH) {
          heightPt = maxH;
          widthPt = (heightPt * b.iw) / b.ih;
        }
        const px = (pt: number) => Math.round((pt * 96) / 72);
        const type = b.src.startsWith("data:image/png") ? "png" : "jpg";
        const out: InstanceType<typeof d.Paragraph>[] = [
          new d.Paragraph({
            alignment: b.align === "left" ? d.AlignmentType.LEFT : b.align === "right" ? d.AlignmentType.RIGHT : d.AlignmentType.CENTER,
            spacing: { after: b.caption.trim() ? 60 : 240 },
            children: [new d.ImageRun({ type, data: dataUrlBytes(b.src), transformation: { width: px(widthPt), height: px(heightPt) } })],
          }),
        ];
        if (b.caption.trim())
          out.push(new d.Paragraph({ alignment: align(b.style.align), spacing: { after: 240 }, children: runs(b.caption, b.style, k, b.style.color ?? theme.muted) }));
        return out;
      }
    }
  };

  // theme decoration → one picture behind the text on every page (header, behind document)
  let decorPara: InstanceType<typeof d.Paragraph> | null = null;
  if (needsDecor(theme, p)) {
    const c = renderPage(layout, 0, (w * 150) / 72, { project: p }, true);
    const data = dataUrlBytes(c.toDataURL("image/jpeg", 0.9));
    c.width = c.height = 0;
    const emu = (pt: number) => Math.round(pt * 12700);
    decorPara = new d.Paragraph({
      children: [
        new d.ImageRun({
          type: "jpg",
          data,
          transformation: { width: Math.round((w * 96) / 72), height: Math.round((h * 96) / 72) },
          floating: {
            horizontalPosition: { relative: d.HorizontalPositionRelativeFrom.PAGE, offset: emu(0) },
            verticalPosition: { relative: d.VerticalPositionRelativeFrom.PAGE, offset: emu(0) },
            behindDocument: true,
            allowOverlap: true,
            lockAnchor: true,
            layoutInCell: true,
          },
        }),
      ],
    });
  }

  const footerText = p.footer.trim();
  const footerChildren = () => {
    const s: TextStyle = { ...isStyledFallback(), size: Math.max(9, Math.min(w, h) * 0.02) };
    const kids: InstanceType<typeof d.TextRun>[] = [];
    if (footerText) kids.push(...runs(footerText, s, 1, theme.muted));
    if (p.pageNumbers) {
      if (footerText) kids.push(...runs("  ·  ", s, 1, theme.muted));
      const name = nameOf(s);
      kids.push(new d.TextRun({ children: [d.PageNumber.CURRENT], font: { ascii: name, hAnsi: name, cs: name }, size: Math.round(s.size * 2), color: hex(theme.muted, pageBg) }));
    }
    return kids;
  };

  const sectionProps = (vMiddle: boolean) => ({
    page: {
      size: { width: tw(w), height: tw(h), orientation: w > h ? d.PageOrientation.LANDSCAPE : d.PageOrientation.PORTRAIT },
      margin: { top: tw(box.t), right: tw(box.r), bottom: tw(box.b), left: tw(box.l), header: 120, footer: tw(Math.max(14, box.b * 0.35)) },
    },
    ...(vMiddle ? { verticalAlign: d.VerticalAlignSection.CENTER } : {}),
  });
  const headers = decorPara ? { default: new d.Header({ children: [decorPara] }) } : undefined;
  const footers = footerText || p.pageNumbers ? { default: new d.Footer({ children: [new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: footerChildren() })] }) } : undefined;

  type Section = ConstructorParameters<typeof d.Document>[0]["sections"][number];
  const sections: Section[] = [];
  if (p.mode === "doc") {
    const k = p.fit ? layout.pages[0]?.scale ?? 1 : 1;
    const kids = p.blocks.flatMap((b, i) => blockToDocx(b, k, i === 0));
    sections.push({ properties: sectionProps(p.vAlign === "middle" && layout.pages.length === 1), headers, footers, children: kids.length ? kids : [new d.Paragraph({ children: [] })] });
  } else {
    p.slides.forEach((s, i) => {
      const k = layout.pages[i]?.scale ?? 1;
      const kids = s.blocks.flatMap((b, j) => blockToDocx(b, k, j === 0));
      sections.push({ properties: sectionProps(s.vAlign === "middle"), headers, footers, children: kids.length ? kids : [new d.Paragraph({ children: [] })] });
    });
  }
  progress(2, 75);

  const bulletIndent = { indent: { left: 540, hanging: 300 } };
  const doc = new d.Document({
    creator: "రత్నాలబాల – ఖతి మాల",
    title: p.title || "ఖతి మాల",
    background: theme.bg[0] !== "#ffffff" ? { color: hex(theme.bg[0]) } : undefined,
    fonts: embedded.map((e) => ({ name: e.name, data: e.data as unknown as Buffer, characterSet: d.CharacterSet.ANSI })),
    styles: {
      default: {
        document: {
          run: { font: { ascii: siteName, hAnsi: siteName, cs: names.get(p.font) ?? siteName }, color: hex(theme.text, pageBg) },
        },
      },
    },
    numbering: {
      config: [
        { reference: "rb-bullet", levels: [{ level: 0, format: d.LevelFormat.BULLET, text: "●", alignment: d.AlignmentType.LEFT, style: { paragraph: bulletIndent, run: { color: hex(theme.accent, pageBg) } } }] },
        { reference: "rb-number", levels: [{ level: 0, format: d.LevelFormat.DECIMAL, text: "%1.", alignment: d.AlignmentType.LEFT, style: { paragraph: bulletIndent, run: { color: hex(theme.accent, pageBg) } } }] },
      ],
    },
    sections,
  });
  const blob = await d.Packer.toBlob(doc);
  progress(3, 100);
  return { blob, name: `${fileBase(p.title)}.docx`, failed, notEmbedded };
}

const isStyledFallback = (): TextStyle => ({ align: "center", size: 10, bold: false, italic: false, underline: false, color: null, font: null, lineHeight: 1.3 });

/* ─────────────────────────────────────────────────────────────── */
/* 6. POWERPOINT (.pptx)                                              */
/* ─────────────────────────────────────────────────────────────── */

const strip = (dataUrl: string) => dataUrl.replace(/^data:/, "");

export async function exportPptx(p: Project, editable: boolean, progress: Progress) {
  progress(0, 5);
  const { failed, layout } = await prepare(p);
  const PptxGenJS = (await import("pptxgenjs")).default;
  progress(1, 15);
  const pptx = new PptxGenJS();
  const { w, h, theme } = layout;
  const IN = (pt: number) => pt / 72;
  pptx.defineLayout({ name: "RB", width: IN(w), height: IN(h) });
  pptx.layout = "RB";
  pptx.title = p.title || "ఖతి మాల";
  pptx.company = "రత్నాలబాల – జ్ఞానమాల";

  const pageBg = theme.bg[0];
  const siteName = await officeFontName("");
  const names = new Map<string, string>();
  for (const v of fontsUsed(p)) names.set(v, v ? await officeFontName(v) : siteName);
  const nameOf = (s: TextStyle) => names.get(s.font ?? p.font) ?? siteName;

  const blocks = p.mode === "doc" ? p.blocks : p.slides.flatMap((s) => s.blocks);
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const n = layout.pages.length;

  for (let i = 0; i < n; i++) {
    progress(1, 15 + Math.round((70 * i) / n), `${i + 1} / ${n}`);
    await nextFrame();
    const slide = pptx.addSlide();
    const pageBlocks = p.mode === "slides" ? p.slides[i]?.blocks ?? [] : layout.boxes.filter((b) => b.page === i).map((b) => byId.get(b.blockId)!).filter(Boolean);
    slide.addNotes(pageBlocks.map(blockText).filter((t) => t.trim()).join("\n\n"));

    if (!editable) {
      const c = renderPage(layout, i, Math.min(2400, (w * 200) / 72), { project: p });
      slide.addImage({ data: strip(c.toDataURL("image/jpeg", 0.92)), x: 0, y: 0, w: IN(w), h: IN(h) });
      c.width = c.height = 0;
      continue;
    }

    const bgc = renderPage(layout, i, Math.min(2400, (w * 150) / 72), { project: p }, true);
    slide.background = { data: strip(bgc.toDataURL("image/jpeg", 0.9)) };
    bgc.width = bgc.height = 0;

    for (const bx of layout.boxes.filter((b) => b.page === i)) {
      const b = byId.get(bx.blockId);
      if (!b) continue;
      const k = bx.scale;
      const pos = { x: IN(bx.x), y: IN(bx.y), w: IN(bx.w), h: IN(Math.max(bx.h, 8)) };
      if (b.type === "divider") {
        slide.addShape(pptx.ShapeType.line, { x: IN(bx.x + bx.w * 0.2), y: IN(bx.y + bx.h / 2), w: IN(bx.w * 0.6), h: 0, line: { color: hex(theme.accent, pageBg), width: 1.2 } });
        continue;
      }
      if (!isStyled(b)) continue;
      const s = b.style;
      const base = {
        fontFace: nameOf(s),
        fontSize: Math.max(6, Math.round(s.size * k * 10) / 10),
        bold: s.bold,
        italic: s.italic,
        underline: s.underline ? { style: "sng" as const } : undefined,
        align: (s.align === "justify" ? "justify" : s.align) as "left" | "center" | "right" | "justify",
        valign: "top" as const,
        margin: 0,
        lineSpacingMultiple: s.lineHeight,
        fit: "none" as const,
      };
      if (b.type === "heading" || b.type === "text" || b.type === "quote") {
        const color = hex(s.color ?? (b.type === "heading" ? theme.heading : theme.text), pageBg);
        if (b.type === "quote") {
          slide.addShape(pptx.ShapeType.rect, { ...pos, fill: { color: hex(theme.quoteBg, pageBg) }, line: { color: hex(theme.quoteBg, pageBg), width: 0 } });
          slide.addShape(pptx.ShapeType.rect, { x: pos.x, y: pos.y, w: IN(Math.max(2, s.size * k * 0.18)), h: pos.h, fill: { color: hex(theme.accent, pageBg) }, line: { color: hex(theme.accent, pageBg), width: 0 } });
        }
        const text = partsToText(bx.parts);
        const inset = b.type === "quote" ? IN(s.size * k * 0.9) : 0;
        slide.addText(text, { ...base, color, x: pos.x + inset, y: pos.y, w: pos.w - inset * 2, h: pos.h });
      } else if (b.type === "list") {
        const items = partsToItems(bx.parts);
        slide.addText(
          items.map((t, j) => ({ text: t, options: { bullet: b.ordered ? { type: "number" as const } : { code: "25CF" }, breakLine: j < items.length - 1 } })),
          { ...base, align: base.align === "justify" ? "left" : base.align, color: hex(s.color ?? theme.text, pageBg), ...pos, paraSpaceAfter: s.size * k * 0.2 }
        );
      } else if (b.type === "table") {
        const rows = bx.rows.map((ri) => b.rows[ri] ?? []);
        const cols = Math.max(1, ...b.rows.map((r) => r.length));
        slide.addTable(
          rows.map((row, j) => {
            const head = b.header && bx.rows[j] === 0;
            return Array.from({ length: cols }, (_, ci) => ({
              text: row[ci] ?? "",
              options: {
                bold: head || s.bold,
                color: hex(head ? theme.tableHeadText : s.color ?? theme.text, pageBg),
                fill: head ? { color: hex(theme.tableHead, pageBg) } : undefined,
              },
            }));
          }),
          { x: pos.x, y: pos.y, w: pos.w, colW: Array(cols).fill(pos.w / cols), fontFace: nameOf(s), fontSize: base.fontSize, border: { type: "solid", pt: 0.75, color: hex(theme.tableBorder, pageBg) }, valign: "top", margin: 0.05 }
        );
      } else if (b.type === "image" && b.src && bx.img) {
        slide.addImage({ data: strip(b.src), x: IN(bx.img.x), y: IN(bx.img.y), w: IN(bx.img.w), h: IN(bx.img.h), rounding: false });
        if (b.caption.trim()) {
          slide.addText(b.caption, { ...base, color: hex(s.color ?? theme.muted, pageBg), x: pos.x, y: IN(bx.img.y + bx.img.h + 4), w: pos.w, h: IN(Math.max(12, bx.y + bx.h - bx.img.y - bx.img.h)) });
        }
      }
    }
  }

  progress(2, 88);
  const raw = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  const blob = await addTransitions(raw, p);
  progress(3, 100);
  return { blob, name: `${fileBase(p.title)}.pptx`, failed };
}

const partsToText = (parts: { text: string; end: boolean }[]) => {
  let out = "";
  parts.forEach((pt) => {
    out += pt.text + (pt.end ? "\n" : " ");
  });
  return out.replace(/\s+$/, "");
};

const partsToItems = (parts: { text: string; end: boolean; item?: number }[]) => {
  const map = new Map<number, string[]>();
  parts.forEach((pt) => {
    const k = pt.item ?? 0;
    map.set(k, [...(map.get(k) ?? []), pt.text]);
  });
  return [...map.values()].map((l) => l.join(" "));
};

/** Slide changes on its own every N seconds, with the chosen effect (PowerPoint "Transitions") */
async function addTransitions(buf: ArrayBuffer, p: Project): Promise<Blob> {
  const type = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  const { seconds, transition } = p.show;
  if (p.mode === "doc" || (!seconds && transition === "none")) return new Blob([buf], { type });
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buf);
  const effect = transition === "fade" ? "<p:fade/>" : transition === "slide" ? '<p:push dir="l"/>' : transition === "zoom" ? "<p:zoom/>" : "";
  const adv = seconds ? ` advTm="${Math.round(seconds * 1000)}"` : "";
  const xml = `<p:transition spd="med"${adv}>${effect}</p:transition>`;
  const files = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  for (const f of files) {
    let s = await zip.file(f)!.async("string");
    if (s.includes("<p:transition")) continue;
    if (s.includes("<p:timing")) s = s.replace("<p:timing", `${xml}<p:timing`);
    else if (s.includes("</p:clrMapOvr>")) s = s.replace("</p:clrMapOvr>", `</p:clrMapOvr>${xml}`);
    else s = s.replace("</p:sld>", `${xml}</p:sld>`);
    zip.file(f, s);
  }
  const out = await zip.generateAsync({ type: "blob", mimeType: type, compression: "DEFLATE" });
  return out;
}

/* ─────────────────────────────────────────────────────────────── */
/* 7. SAVE / SHARE                                                    */
/* ─────────────────────────────────────────────────────────────── */

/** Plain browser download (no library: file-saver's CommonJS export broke in production builds) */
export async function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // give slow phones time to start the download before the link is freed
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const canShareFiles = (blob: Blob, name: string) => {
  try {
    const file = new File([blob], name, { type: blob.type });
    return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
};

export async function shareBlob(blob: Blob, name: string, title: string) {
  const file = new File([blob], name, { type: blob.type });
  await navigator.share({ files: [file], title });
}

export const sizeLabel = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const pagesIn = (p: Project) => (p.mode === "doc" ? null : p.slides.length);
export const sizeOf = (p: Project) => SIZES[p.mode === "doc" ? p.docSize : p.slideSize];
