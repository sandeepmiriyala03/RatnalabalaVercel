/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — canvas engine (కొలవడం, పేజీలుగా విభజించడం, గీయడం)

   ఎందుకు సొంత engine?
   • html-to-image (SVG foreignObject) iPhone లో పెద్ద తెలుగు ఫాంట్లను
     తరచుగా వదిలేసేది; blob: ఫాంట్లకు cacheBust "?…" జోడించి పాడుచేసేది.
   • canvas నేరుగా document.fonts లోని ఫాంట్‌తో గీస్తుంది — బ్రౌజర్ తెలుగు
     గుణింతాలు, వత్తులు సరిగ్గా కూర్చుతుంది (HarfBuzz). ప్రతి పరికరంలో ఒకటే.
   • ఒకే layout (pt లలో): preview = PDF = poster = PPT. ఫోన్ వెడల్పు మారినా
     పేజీ మారదు, కేవలం zoom మాత్రమే.
   ═══════════════════════════════════════════════════════════════ */

import type { Block, ImageBlock, Project, Slide, TextStyle, VAlign } from "./model";
import { SIZES } from "./model";
import { getTheme, solid, type Theme } from "./themes";

/* ─────────────────────────────────────────────────────────────── */
/* FONTS                                                             */
/* ─────────────────────────────────────────────────────────────── */

/** Telugu system fallbacks — plain names only (canvas does not understand var()) */
export const CANVAS_FALLBACK = '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Vani", "Telugu Sangam MN", "Kohinoor Telugu", sans-serif';

let siteStackCache: string | null = null;

/** The site font the reader chose (a CSS variable) as a real family list */
export function siteFontStack(): string {
  if (typeof document === "undefined") return CANVAS_FALLBACK;
  const probe = document.createElement("span");
  probe.style.fontFamily = "var(--telugu-font-family)";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily;
  probe.remove();
  siteStackCache = fam && !fam.includes("var(") ? `${fam}, ${CANVAS_FALLBACK}` : CANVAS_FALLBACK;
  return siteStackCache;
}

/** First family of the site font (for Word / PowerPoint) */
export function siteFontName(): string {
  const first = (siteStackCache ?? siteFontStack()).split(",")[0].trim().replace(/^["']|["']$/g, "");
  return first || "Nirmala UI";
}

export const familyStack = (value: string) => (value ? `"${value.replace(/"/g, "")}", ${CANVAS_FALLBACK}` : siteStackCache ?? siteFontStack());

export const fontsUsed = (p: Project): string[] => {
  const set = new Set<string>([p.font]);
  const add = (blocks: Block[]) => blocks.forEach((b) => "style" in b && b.style.font !== null && set.add(b.style.font));
  add(p.blocks);
  p.slides.forEach((s) => add(s.blocks));
  return [...set];
};

/* ─────────────────────────────────────────────────────────────── */
/* IMAGES (cache + "picture arrived" listeners)                      */
/* ─────────────────────────────────────────────────────────────── */

const images = new Map<string, HTMLImageElement>();
const imageListeners = new Set<() => void>();
export const onImageLoad = (fn: () => void) => {
  imageListeners.add(fn);
  return () => void imageListeners.delete(fn);
};

export function getImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.onload = () => imageListeners.forEach((fn) => fn());
    img.src = src;
    images.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export async function preloadImages(srcs: string[]) {
  await Promise.all(
    srcs.filter(Boolean).map(async (src) => {
      getImage(src);
      const img = images.get(src)!;
      if (img.complete && img.naturalWidth) return;
      try {
        await img.decode();
      } catch {
        /* broken picture: drawn as an empty box */
      }
    })
  );
}

export const imagesUsed = (p: Project) => {
  const list: string[] = [];
  const add = (blocks: Block[]) => blocks.forEach((b) => b.type === "image" && b.src && list.push(b.src));
  add(p.mode === "doc" ? p.blocks : p.slides.flatMap((s) => s.blocks));
  if (p.bg?.src) list.push(p.bg.src);
  return list;
};

/* ─────────────────────────────────────────────────────────────── */
/* DRAW ITEMS + LAYOUT RESULT                                        */
/* ─────────────────────────────────────────────────────────────── */

export type Item =
  | { k: "text"; x: number; y: number; t: string; font: string; color: string; ul?: number; size: number }
  | { k: "rect"; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; lw?: number; r?: number; dash?: boolean }
  | { k: "img"; src: string; x: number; y: number; w: number; h: number; r: number }
  | { k: "dot"; cx: number; cy: number; r: number; fill: string }
  | { k: "diamond"; cx: number; cy: number; r: number; fill: string }
  | { k: "label"; x: number; y: number; t: string; size: number; color: string };

/** What part of a block landed on a page — used by the editable PowerPoint export */
export type Part = { text: string; end: boolean; item?: number };

export type Box = {
  blockId: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** fit-to-page scale used on this page (multiply font sizes) */
  scale: number;
  parts: Part[];
  rows: number[];
  /** picture position (image blocks) */
  img?: { x: number; y: number; w: number; h: number };
};

export type LaidPage = { items: Item[]; scale: number; overflow: boolean };

export type Layout = { w: number; h: number; pages: LaidPage[]; boxes: Box[]; theme: Theme };

/* ─────────────────────────────────────────────────────────────── */
/* MEASURING                                                          */
/* ─────────────────────────────────────────────────────────────── */

let measureCtx: CanvasRenderingContext2D | null = null;
const mctx = () => {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")!;
  return measureCtx;
};

const fontString = (size: number, bold: boolean, italic: boolean, stack: string) =>
  `${italic ? "italic " : ""}${bold ? "bold " : ""}${Math.max(1, size).toFixed(2)}px ${stack}`;

const metricsCache = new Map<string, { asc: number; desc: number }>();
function metrics(font: string, size: number) {
  let m = metricsCache.get(font);
  if (!m) {
    const ctx = mctx();
    ctx.font = font;
    const t = ctx.measureText("అక్షౄగ్య్రాషు");
    const asc = t.fontBoundingBoxAscent ?? t.actualBoundingBoxAscent ?? size * 0.9;
    const desc = t.fontBoundingBoxDescent ?? t.actualBoundingBoxDescent ?? size * 0.4;
    m = { asc: asc || size * 0.9, desc: desc || size * 0.4 };
    metricsCache.set(font, m);
  }
  return m;
}

/** Fonts changed (one finished loading) — forget old measurements */
export const clearMeasureCache = () => metricsCache.clear();

const measure = (font: string, t: string) => {
  const ctx = mctx();
  if (ctx.font !== font) ctx.font = font;
  return ctx.measureText(t).width;
};

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("te", { granularity: "grapheme" }) : null;
const graphemes = (s: string) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));

type Line = { text: string; w: number; words: { t: string; w: number }[]; end: boolean };

/** Telugu-safe wrapping: breaks at spaces; a too-long word breaks between letters (never inside a గుణింతం) */
function wrap(font: string, text: string, maxW: number): Line[] {
  const out: Line[] = [];
  const space = measure(font, " ");
  for (const hard of text.split(/\r?\n/)) {
    const words = hard.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push({ text: "", w: 0, words: [], end: true });
      continue;
    }
    let cur: { t: string; w: number }[] = [];
    let curW = 0;
    const flush = () => {
      if (!cur.length) return;
      const t = cur.map((x) => x.t).join(" ");
      out.push({ text: t, w: measure(font, t), words: cur, end: false });
      cur = [];
      curW = 0;
    };
    for (const word of words) {
      let ww = measure(font, word);
      let piece = word;
      if (ww > maxW) {
        flush();
        let buf = "";
        for (const g of graphemes(word)) {
          if (buf && measure(font, buf + g) > maxW) {
            out.push({ text: buf, w: measure(font, buf), words: [{ t: buf, w: measure(font, buf) }], end: false });
            buf = g;
          } else buf += g;
        }
        piece = buf;
        ww = measure(font, buf);
      }
      if (!cur.length) {
        cur = [{ t: piece, w: ww }];
        curW = ww;
      } else if (curW + space + ww <= maxW + 0.01) {
        cur.push({ t: piece, w: ww });
        curW += space + ww;
      } else {
        flush();
        cur = [{ t: piece, w: ww }];
        curW = ww;
      }
    }
    flush();
    out[out.length - 1].end = true;
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────── */
/* BLOCK → UNITS (a unit never splits across pages)                  */
/* ─────────────────────────────────────────────────────────────── */

type Unit = {
  h: number;
  items: Item[]; // y relative to the unit top, x absolute
  blockId: string;
  gap?: boolean; // spacing — dropped at the top of a page
  keepWithNext?: boolean;
  part?: Part;
  row?: number;
  pageBreak?: boolean;
};

type Env = {
  theme: Theme;
  docFont: string;
  scale: number;
  x0: number;
  cw: number; // content width
  maxH: number; // content height
  forExport: boolean;
};

const resolveStack = (s: TextStyle, env: Env) => familyStack(s.font ?? env.docFont);

function textLines(
  text: string,
  s: TextStyle,
  env: Env,
  opts: { x: number; w: number; color: string; blockId: string; bg?: { fill: string; bar: string; padX: number }; item?: number; ordered?: number | null }
): Unit[] {
  const size = s.size * env.scale;
  const font = fontString(size, s.bold, s.italic, resolveStack(s, env));
  const lineH = size * s.lineHeight;
  const { asc, desc } = metrics(font, size);
  const base = (lineH - (asc + desc)) / 2 + asc;
  const lines = wrap(font, text, opts.w);
  const units: Unit[] = [];
  lines.forEach((ln, i) => {
    const items: Item[] = [];
    if (opts.bg) {
      // +1 overlaps the next line, so no thin seams between lines
      items.push({ k: "rect", x: opts.x - opts.bg.padX, y: 0, w: opts.w + opts.bg.padX * 2, h: lineH + 1, fill: opts.bg.fill });
      items.push({ k: "rect", x: opts.x - opts.bg.padX, y: 0, w: Math.max(2, size * 0.18), h: lineH + 1, fill: opts.bg.bar });
    }
    if (i === 0 && opts.item !== undefined) {
      if (opts.ordered) {
        const label = `${opts.ordered}.`;
        const lw = measure(font, label);
        items.push({ k: "text", x: opts.x - lw - size * 0.35, y: base, t: label, font, color: env.theme.accent, size });
      } else {
        items.push({ k: "dot", cx: opts.x - size * 0.6, cy: base - size * 0.32, r: size * 0.16, fill: env.theme.accent });
      }
    }
    const align = s.align;
    const ul = s.underline ? 1 : undefined;
    if (align === "justify" && !ln.end && ln.words.length > 1) {
      const sum = ln.words.reduce((a, w) => a + w.w, 0);
      const gap = (opts.w - sum) / (ln.words.length - 1);
      let x = opts.x;
      ln.words.forEach((w, wi) => {
        items.push({ k: "text", x, y: base, t: w.t, font, color: opts.color, size, ul: ul && (wi < ln.words.length - 1 ? w.w + gap : w.w) });
        x += w.w + gap;
      });
    } else if (ln.text) {
      const x = align === "center" ? opts.x + (opts.w - ln.w) / 2 : align === "right" ? opts.x + opts.w - ln.w : opts.x;
      items.push({ k: "text", x, y: base, t: ln.text, font, color: opts.color, size, ul: ul && ln.w });
    }
    units.push({ h: lineH, items, blockId: opts.blockId, part: { text: ln.text, end: ln.end, item: opts.item } });
  });
  return units;
}

function blockUnits(b: Block, env: Env, first: boolean): Unit[] {
  const t = env.theme;
  const { x0, cw, scale } = env;
  const gap = (h: number, blockId: string): Unit => ({ h: h * scale, items: [], blockId, gap: true });

  switch (b.type) {
    case "pagebreak":
      return [{ h: 0, items: [], blockId: b.id, pageBreak: true }];

    case "divider": {
      const s = 16 * scale;
      const y = s * 0.6;
      const items: Item[] = [
        { k: "rect", x: x0 + cw * 0.2, y: y - 0.6, w: cw * 0.6, h: 1.2, fill: t.accent },
        { k: "diamond", cx: x0 + cw / 2, cy: y, r: s * 0.28, fill: t.accent },
      ];
      return [{ h: s * 1.2, items, blockId: b.id }, gap(8, b.id)];
    }

    case "heading":
    case "text":
    case "quote": {
      const s = b.style;
      const size = s.size * scale;
      const isQ = b.type === "quote";
      const padX = isQ ? size * 0.9 : 0;
      const qbg = solid(t.quoteBg, t);
      const color = s.color ?? (b.type === "heading" ? t.heading : t.text);
      const text = b.text || (env.forExport ? "" : " ");
      if (!b.text.trim() && env.forExport) return [];
      const units: Unit[] = [];
      if (b.type === "heading" && !first) units.push(gap(s.size * 0.45, b.id));
      if (isQ) units.push({ h: size * 0.55, items: [{ k: "rect", x: x0, y: 0, w: cw, h: size * 0.55 + 1, fill: qbg }, { k: "rect", x: x0, y: 0, w: Math.max(2, size * 0.18), h: size * 0.55 + 1, fill: t.accent }], blockId: b.id });
      const lines = textLines(text, s, env, { x: x0 + padX, w: cw - padX * 2, color, blockId: b.id, bg: isQ ? { fill: qbg, bar: t.accent, padX } : undefined });
      units.push(...lines);
      if (isQ) units.push({ h: size * 0.55, items: [{ k: "rect", x: x0, y: 0, w: cw, h: size * 0.55, fill: qbg }, { k: "rect", x: x0, y: 0, w: Math.max(2, size * 0.18), h: size * 0.55, fill: t.accent }], blockId: b.id });
      if (b.type === "heading") {
        lines.forEach((u) => (u.keepWithNext = true));
        if (t.headingRule && b.text.trim()) {
          const rw = Math.min(cw * 0.25, size * 3);
          const rx = s.align === "center" ? x0 + (cw - rw) / 2 : s.align === "right" ? x0 + cw - rw : x0;
          units.push({ h: size * 0.45, items: [{ k: "rect", x: rx, y: size * 0.1, w: rw, h: Math.max(1.5, size * 0.08), fill: t.accent }], blockId: b.id, keepWithNext: true });
        }
        units.push(gap(s.size * 0.35, b.id));
      } else units.push(gap(s.size * (isQ ? 0.8 : 0.6), b.id));
      return units;
    }

    case "list": {
      const s = b.style;
      const size = s.size * scale;
      const items = b.text.split(/\r?\n/).filter((l) => l.trim() || !env.forExport);
      if (!items.some((l) => l.trim()) && env.forExport) return [];
      const indent = size * (b.ordered ? 1.8 : 1.3);
      const color = s.color ?? t.text;
      const units: Unit[] = [];
      let n = 0;
      items.forEach((line, i) => {
        if (!line.trim()) return;
        n++;
        units.push(...textLines(line, { ...s, align: s.align === "justify" ? "left" : s.align }, env, { x: x0 + indent, w: cw - indent, color, blockId: b.id, item: i, ordered: b.ordered ? n : null }));
        units.push(gap(s.size * 0.2, b.id));
      });
      units.push(gap(s.size * 0.5, b.id));
      return units;
    }

    case "table": {
      const s = b.style;
      const size = s.size * scale;
      const cols = Math.max(1, ...b.rows.map((r) => r.length));
      const colW = cw / cols;
      const padC = size * 0.5;
      const units: Unit[] = [];
      const rowUnit = (row: string[], ri: number): Unit => {
        const head = b.header && ri === 0;
        const st: TextStyle = { ...s, bold: head || s.bold, align: s.align === "justify" ? "left" : s.align };
        const color = head ? t.tableHeadText : s.color ?? t.text;
        const cells = Array.from({ length: cols }, (_, ci) => textLines(row[ci] ?? "", st, env, { x: x0 + ci * colW + padC, w: colW - padC * 2, color, blockId: b.id }));
        const contentH = Math.max(...cells.map((c) => c.reduce((a, u) => a + u.h, 0)), size * s.lineHeight);
        const h = contentH + padC * 1.2;
        const items: Item[] = [];
        const fill = head ? t.tableHead : ri % 2 === (b.header ? 0 : 1) ? t.tableStripe : undefined;
        if (fill) items.push({ k: "rect", x: x0, y: 0, w: cw, h, fill });
        cells.forEach((cell, ci) => {
          let y = padC * 0.6;
          cell.forEach((u) => {
            u.items.forEach((it) => items.push(shift(it, y)));
            y += u.h;
          });
          items.push({ k: "rect", x: x0 + ci * colW, y: 0, w: colW, h, stroke: t.tableBorder, lw: 0.8 });
        });
        return { h, items, blockId: b.id, row: ri };
      };
      b.rows.forEach((row, ri) => units.push(rowUnit(row, ri)));
      units.push(gap(s.size * 0.8, b.id));
      return units;
    }

    case "image": {
      if (!b.src && env.forExport) return [];
      const w0 = (cw * Math.min(100, Math.max(10, b.width))) / 100;
      const ratio = b.ih / Math.max(1, b.iw);
      let w = w0 * (scale < 1 ? Math.max(scale, 0.3) : 1);
      let h = w * ratio;
      const captionUnits = b.caption.trim() ? textLines(b.caption, b.style, env, { x: x0, w: cw, color: b.style.color ?? t.muted, blockId: b.id }) : [];
      const capH = captionUnits.reduce((a, u) => a + u.h, 0);
      const maxH = env.maxH * 0.92 - capH;
      if (h > maxH) {
        h = maxH;
        w = h / ratio;
      }
      const x = b.align === "left" ? x0 : b.align === "right" ? x0 + cw - w : x0 + (cw - w) / 2;
      const items: Item[] = b.src
        ? [{ k: "img", src: b.src, x, y: 0, w, h, r: b.rounded ? Math.min(w, h) * 0.04 : 0 }]
        : [
            { k: "rect", x, y: 0, w, h, stroke: t.muted, lw: 1.2, r: 8, dash: true },
            { k: "label", x: x + w / 2, y: h / 2, t: "📷 చిత్రం జోడించండి", size: Math.max(10, Math.min(w, h) * 0.07), color: t.muted },
          ];
      const units: Unit[] = [{ h: h + (capH ? 6 * scale : 0), items, blockId: b.id }];
      units.push(...captionUnits);
      units.push(gap(14, b.id));
      return units;
    }
  }
}

/* ─────────────────────────────────────────────────────────────── */
/* PAGINATION                                                         */
/* ─────────────────────────────────────────────────────────────── */

type FlowOpts = { w: number; h: number; theme: Theme; docFont: string; scale: number; vAlign: VAlign; forExport: boolean; reserveFooter: boolean };

function contentBox(w: number, h: number, theme: Theme, reserveFooter: boolean) {
  const s = Math.min(w, h);
  const pt = theme.pad.t * s;
  const pr = theme.pad.r * s;
  const pb = theme.pad.b * s + (reserveFooter ? s * 0.035 : 0);
  const pl = theme.pad.l * s;
  return { x: pl, y: pt, w: w - pl - pr, h: h - pt - pb };
}

function flow(blocks: Block[], o: FlowOpts): { pages: LaidPage[]; boxes: Box[] } {
  const cb = contentBox(o.w, o.h, o.theme, o.reserveFooter);
  const env: Env = { theme: o.theme, docFont: o.docFont, scale: o.scale, x0: cb.x, cw: cb.w, maxH: cb.h, forExport: o.forExport };
  const units: Unit[] = [];
  let first = true;
  for (const b of blocks) {
    const u = blockUnits(b, env, first);
    if (u.length && b.type !== "pagebreak") first = false;
    units.push(...u);
  }

  const pages: LaidPage[] = [{ items: [], scale: o.scale, overflow: false }];
  const boxes: Box[] = [];
  const used: number[] = [0];
  let y = 0;
  let page = 0;
  const newPage = () => {
    used[page] = y;
    pages.push({ items: [], scale: o.scale, overflow: false });
    page++;
    y = 0;
  };

  units.forEach((u, i) => {
    if (u.pageBreak) {
      if (y > 0) newPage();
      return;
    }
    if (u.gap) {
      // spacing never starts a new page by itself (no empty last pages)
      if (y === 0) return;
      y = Math.min(cb.h, y + u.h);
      return;
    }
    let need = u.h;
    if (u.keepWithNext) {
      // a heading never sits alone at the bottom of a page
      const next = units.slice(i + 1).find((n) => !n.gap && !n.keepWithNext);
      if (next) need += next.h;
    }
    if (y > 0 && y + need > cb.h && need <= cb.h) newPage();
    if (y + u.h > cb.h + 0.5) pages[page].overflow = true;
    const top = cb.y + y;
    for (const it of u.items) pages[page].items.push(shift(it, top));
    let box = boxes.find((bx) => bx.blockId === u.blockId && bx.page === page);
    if (!box) {
      box = { blockId: u.blockId, page, x: cb.x, y: top, w: cb.w, h: 0, scale: o.scale, parts: [], rows: [] };
      boxes.push(box);
    }
    box.h = top + u.h - box.y;
    if (u.part) box.parts.push(u.part);
    if (u.row !== undefined) box.rows.push(u.row);
    const im = u.items.find((it) => it.k === "img");
    if (im && im.k === "img") box.img = { x: im.x, y: im.y + top, w: im.w, h: im.h };
    y += u.h;
  });
  used[page] = y;

  if (o.vAlign === "middle") {
    pages.forEach((p, i) => {
      const off = Math.max(0, (cb.h - (used[i] ?? 0)) / 2);
      if (!off) return;
      p.items = p.items.map((it) => shift(it, off));
      boxes
        .filter((b) => b.page === i)
        .forEach((b) => {
          b.y += off;
          if (b.img) b.img.y += off;
        });
    });
  }
  return { pages, boxes };
}

function shift(it: Item, dy: number): Item {
  switch (it.k) {
    case "dot":
    case "diamond":
      return { ...it, cy: it.cy + dy };
    default:
      return { ...it, y: it.y + dy };
  }
}

/** Biggest scale (≤ 1) that keeps everything on one page */
function flowFit(blocks: Block[], o: FlowOpts) {
  const one = flow(blocks, { ...o, scale: 1 });
  if (one.pages.length === 1 && !one.pages[0].overflow) return one;
  let lo = 0.3;
  let hi = 1;
  let best = flow(blocks, { ...o, scale: lo });
  if (best.pages.length > 1 || best.pages[0].overflow) {
    best.pages = [{ ...best.pages[0], overflow: true }];
    best.boxes = best.boxes.filter((b) => b.page === 0);
    return best;
  }
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    const r = flow(blocks, { ...o, scale: mid });
    if (r.pages.length === 1 && !r.pages[0].overflow) {
      best = r;
      lo = mid;
    } else hi = mid;
  }
  return best;
}

/* ─────────────────────────────────────────────────────────────── */
/* PUBLIC: layout a whole project                                    */
/* ─────────────────────────────────────────────────────────────── */

export function pageSize(p: Project) {
  const s = SIZES[p.mode === "doc" ? p.docSize : p.slideSize];
  return { w: s.w, h: s.h };
}

export function layoutProject(p: Project, forExport = false): Layout {
  siteFontStack(); // refresh the site font (reader may have changed it)
  const theme = getTheme(p.theme);
  const { w, h } = pageSize(p);
  const reserveFooter = p.pageNumbers || !!p.footer.trim();
  const base: Omit<FlowOpts, "vAlign"> = { w, h, theme, docFont: p.font, scale: 1, forExport, reserveFooter };

  if (p.mode === "doc") {
    const r = p.fit ? flowFit(p.blocks, { ...base, vAlign: p.vAlign }) : flow(p.blocks, { ...base, vAlign: p.vAlign });
    return { w, h, theme, ...r };
  }

  const pages: LaidPage[] = [];
  const boxes: Box[] = [];
  p.slides.forEach((s: Slide, i) => {
    const r = flowFit(s.blocks.filter((b) => b.type !== "pagebreak"), { ...base, vAlign: s.vAlign });
    pages.push(r.pages[0]);
    r.boxes.forEach((b) => boxes.push({ ...b, page: i }));
  });
  if (!pages.length) pages.push({ items: [], scale: 1, overflow: false });
  return { w, h, theme, pages, boxes };
}

/* ─────────────────────────────────────────────────────────────── */
/* PAINT                                                              */
/* ─────────────────────────────────────────────────────────────── */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Background + photo + decoration (no text) — also used for Word / editable PowerPoint */
export function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, bg: Project["bg"]) {
  if (theme.bg.length > 1) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    theme.bg.forEach((c, i) => g.addColorStop(i / (theme.bg.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = theme.bg[0];
  ctx.fillRect(0, 0, w, h);

  if (bg?.src) {
    const img = getImage(bg.src);
    if (img) {
      const r = Math.max(w / bg.iw, h / bg.ih);
      const dw = bg.iw * r;
      const dh = bg.ih * r;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.globalAlpha = Math.min(0.95, Math.max(0, bg.dim));
      ctx.fillStyle = theme.bg[0];
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }
  ctx.save();
  theme.decor(ctx, w, h);
  ctx.restore();
}

export type PaintOpts = { project: Project; pageNo?: number; pageCount?: number };

export function paintPage(ctx: CanvasRenderingContext2D, layout: Layout, index: number, pxPerPt: number, opts: PaintOpts) {
  const { w, h, theme } = layout;
  const page = layout.pages[index];
  ctx.setTransform(pxPerPt, 0, 0, pxPerPt, 0, 0);
  ctx.textBaseline = "alphabetic";
  paintBackground(ctx, w, h, theme, opts.project.bg);
  if (!page) return;

  for (const it of page.items) {
    switch (it.k) {
      case "rect":
        ctx.save();
        roundRect(ctx, it.x, it.y, it.w, it.h, it.r ?? 0);
        if (it.fill) {
          ctx.fillStyle = it.fill;
          ctx.fill();
        }
        if (it.stroke) {
          ctx.strokeStyle = it.stroke;
          ctx.lineWidth = it.lw ?? 1;
          if (it.dash) ctx.setLineDash([6, 5]);
          ctx.stroke();
        }
        ctx.restore();
        break;
      case "text":
        ctx.font = it.font;
        ctx.fillStyle = it.color;
        ctx.fillText(it.t, it.x, it.y);
        if (it.ul) ctx.fillRect(it.x, it.y + it.size * 0.42, it.ul, Math.max(0.8, it.size * 0.06));
        break;
      case "dot":
        ctx.fillStyle = it.fill;
        ctx.beginPath();
        ctx.arc(it.cx, it.cy, it.r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "diamond":
        ctx.fillStyle = it.fill;
        ctx.beginPath();
        ctx.moveTo(it.cx, it.cy - it.r);
        ctx.lineTo(it.cx + it.r, it.cy);
        ctx.lineTo(it.cx, it.cy + it.r);
        ctx.lineTo(it.cx - it.r, it.cy);
        ctx.closePath();
        ctx.fill();
        break;
      case "img": {
        const img = getImage(it.src);
        ctx.save();
        roundRect(ctx, it.x, it.y, it.w, it.h, it.r);
        ctx.clip();
        if (img) ctx.drawImage(img, it.x, it.y, it.w, it.h);
        else {
          ctx.fillStyle = "rgba(127,127,127,0.15)";
          ctx.fillRect(it.x, it.y, it.w, it.h);
        }
        ctx.restore();
        break;
      }
      case "label":
        ctx.font = `${it.size}px ${CANVAS_FALLBACK}`;
        ctx.fillStyle = it.color;
        ctx.textAlign = "center";
        ctx.fillText(it.t, it.x, it.y + it.size * 0.35);
        ctx.textAlign = "left";
        break;
    }
  }

  // footer line: "రచన … · 2"
  const footer = opts.project.footer.trim();
  const showNo = opts.project.pageNumbers && layout.pages.length > 1;
  if (footer || showNo) {
    const s = Math.min(w, h);
    const size = Math.max(9, s * 0.02);
    ctx.font = fontString(size, false, false, familyStack(opts.project.font));
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    const text = [footer, showNo ? `${index + 1} / ${layout.pages.length}` : ""].filter(Boolean).join("  ·  ");
    ctx.fillText(text, w / 2, h - theme.pad.b * s * 0.55 - (theme.id === "field" ? 0 : 0));
    ctx.textAlign = "left";
  }
}

/** One page as a canvas, `widthPx` wide */
export function renderPage(layout: Layout, index: number, widthPx: number, opts: PaintOpts, withBackgroundOnly = false): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const k = widthPx / layout.w;
  c.width = Math.round(widthPx);
  c.height = Math.round(layout.h * k);
  const ctx = c.getContext("2d")!;
  if (withBackgroundOnly) {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paintBackground(ctx, layout.w, layout.h, layout.theme, opts.project.bg);
  } else paintPage(ctx, layout, index, k, opts);
  return c;
}

/** Click on the preview → which block is there? */
export function hitTest(layout: Layout, page: number, xPt: number, yPt: number): string | null {
  const hit = layout.boxes.filter((b) => b.page === page && xPt >= b.x - 6 && xPt <= b.x + b.w + 6 && yPt >= b.y - 4 && yPt <= b.y + b.h + 4);
  return hit.length ? hit[hit.length - 1].blockId : null;
}

export const isImageBlock = (b: Block): b is ImageBlock => b.type === "image";
