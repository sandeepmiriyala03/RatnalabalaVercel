/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — పత్రం / స్లైడ్ల నమూనా (data model)

   ఒకే నమూనా నుంచి preview, PDF, poster, Word, PowerPoint అన్నీ.
   కొలతలు అన్నీ "pt" లలో (1 pt = 1/72 అంగుళం) — Word, PowerPoint లు
   కూడా pt లే వాడతాయి, కాబట్టి ఫైళ్ళలో సైజులు సరిగ్గా సరిపోతాయి.

   Next.js 16.4 Cache Components: ఇక్కడి డిఫాల్ట్‌లలో Math.random()/Date
   లేవు (స్థిర id లు). uid() బటన్ నొక్కినప్పుడు మాత్రమే.
   ═══════════════════════════════════════════════════════════════ */

export type Align = "left" | "center" | "right" | "justify";
export type Mode = "doc" | "slides";
export type VAlign = "top" | "middle";

export type TextStyle = {
  align: Align;
  size: number; // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  /** null = theme colour */
  color: string | null;
  /** CSS font-family value of a Telugu font; null = the document font */
  font: string | null;
  lineHeight: number;
};

type Base = { id: string };
export type TextBlock = Base & { type: "heading" | "text" | "quote"; text: string; style: TextStyle };
export type ListBlock = Base & { type: "list"; text: string; ordered: boolean; style: TextStyle };
export type TableBlock = Base & { type: "table"; rows: string[][]; header: boolean; style: TextStyle };
export type ImageBlock = Base & {
  type: "image";
  src: string; // data: URL ("" = placeholder, only shown in the editor preview)
  iw: number; // natural size, so layout never waits for the picture
  ih: number;
  width: number; // % of the text width
  align: "left" | "center" | "right";
  rounded: boolean;
  caption: string;
  style: TextStyle; // caption style
};
export type DividerBlock = Base & { type: "divider" };
export type PageBreakBlock = Base & { type: "pagebreak" };

export type Block = TextBlock | ListBlock | TableBlock | ImageBlock | DividerBlock | PageBreakBlock;
export type BlockType = Block["type"];
export type StyledBlock = TextBlock | ListBlock | TableBlock | ImageBlock;

export type Slide = { id: string; blocks: Block[]; vAlign: VAlign };

export type BgImage = { src: string; iw: number; ih: number; dim: number } | null;

export type SizeId = "a4" | "a4l" | "square" | "story" | "wide" | "std";

export type Project = {
  v: 2;
  mode: Mode;
  title: string; // file name + PDF/PPT title
  docSize: SizeId;
  slideSize: SizeId;
  theme: string;
  /** Document font (CSS family). "" = the site font the reader chose */
  font: string;
  blocks: Block[];
  slides: Slide[];
  /** One page only: shrink everything to fit (posters) */
  fit: boolean;
  vAlign: VAlign;
  pageNumbers: boolean;
  footer: string;
  bg: BgImage;
  show: { seconds: number; transition: "fade" | "slide" | "zoom" | "none"; loop: boolean };
};

export const SIZES: Record<SizeId, { label: string; hint: string; w: number; h: number; modes: Mode[] }> = {
  a4: { label: "A4", hint: "ప్రింట్ / Word", w: 595, h: 842, modes: ["doc"] },
  a4l: { label: "A4 అడ్డం", hint: "ప్రింట్", w: 842, h: 595, modes: ["doc"] },
  square: { label: "చతురస్రం", hint: "Instagram / Facebook", w: 600, h: 600, modes: ["doc", "slides"] },
  story: { label: "స్టోరీ", hint: "WhatsApp స్టేటస్", w: 540, h: 960, modes: ["doc", "slides"] },
  wide: { label: "16:9", hint: "TV / ల్యాప్‌టాప్", w: 960, h: 540, modes: ["slides"] },
  std: { label: "4:3", hint: "ప్రొజెక్టర్", w: 800, h: 600, modes: ["slides"] },
};

/** Poster (PNG) width in pixels for each size */
export const POSTER_PX: Record<SizeId, number> = { a4: 1654, a4l: 2339, square: 1080, story: 1080, wide: 1920, std: 1600 };

export const BLOCK_LABEL: Record<BlockType, string> = {
  heading: "శీర్షిక",
  text: "పేరా",
  quote: "పద్యం / ఉల్లేఖన",
  list: "జాబితా",
  table: "పట్టిక",
  image: "చిత్రం",
  divider: "అలంకరణ గీత",
  pagebreak: "కొత్త పేజీ",
};

export const style = (over: Partial<TextStyle> = {}): TextStyle => ({
  align: "left",
  size: 16,
  bold: false,
  italic: false,
  underline: false,
  color: null,
  font: null,
  lineHeight: 1.7,
  ...over,
});

/** Starting style for a new block; slides get bigger letters */
export function defaultStyle(type: BlockType, mode: Mode): TextStyle {
  const k = mode === "slides" ? 1.6 : 1;
  switch (type) {
    case "heading":
      return style({ size: Math.round(28 * k), bold: true, align: "center", lineHeight: 1.45 });
    case "quote":
      return style({ size: Math.round(18 * k), align: "center", lineHeight: 1.8 });
    case "list":
      return style({ size: Math.round(16 * k) });
    case "table":
      return style({ size: Math.round(13 * k), lineHeight: 1.5 });
    case "image":
      return style({ size: Math.round(11 * k), align: "center", italic: true, lineHeight: 1.4 });
    default:
      return style({ size: Math.round(16 * k), align: mode === "slides" ? "center" : "justify" });
  }
}

let counter = 0;
/** Only in event handlers (never during render) */
export const uid = () => `b${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function newBlock(type: BlockType, mode: Mode): Block {
  const id = uid();
  const s = defaultStyle(type, mode);
  switch (type) {
    case "heading":
      return { id, type, text: "", style: s };
    case "text":
    case "quote":
      return { id, type, text: "", style: s };
    case "list":
      return { id, type, text: "", ordered: false, style: s };
    case "table":
      return { id, type, rows: [["", ""], ["", ""], ["", ""]], header: true, style: s };
    case "image":
      return { id, type, src: "", iw: 4, ih: 3, width: 80, align: "center", rounded: true, caption: "", style: s };
    case "divider":
      return { id, type };
    case "pagebreak":
      return { id, type };
  }
}

/** Deep copy with fresh ids (duplicate) */
export function cloneBlock(b: Block): Block {
  return { ...structuredClone(b), id: uid() };
}

export function isStyled(b: Block): b is StyledBlock {
  return "style" in b;
}

/** Plain text of a block (speaker notes, slide splitting) */
export function blockText(b: Block): string {
  switch (b.type) {
    case "heading":
    case "text":
    case "quote":
    case "list":
      return b.text;
    case "table":
      return b.rows.map((r) => r.join(" | ")).join("\n");
    case "image":
      return b.caption;
    default:
      return "";
  }
}

/* ─────────────────────────────────────────────────────────────── */
/* SLIDE LAYOUTS (new slide)                                         */
/* ─────────────────────────────────────────────────────────────── */

export type SlideLayout = "title" | "content" | "image" | "quote" | "end";

export const SLIDE_LAYOUTS: { id: SlideLayout; label: string }[] = [
  { id: "title", label: "శీర్షిక స్లైడ్" },
  { id: "content", label: "శీర్షిక + జాబితా" },
  { id: "image", label: "శీర్షిక + చిత్రం" },
  { id: "quote", label: "పద్యం / సూక్తి" },
  { id: "end", label: "ముగింపు" },
];

export function newSlide(layout: SlideLayout): Slide {
  const m: Mode = "slides";
  const h = (text: string, over: Partial<TextStyle> = {}): Block => ({ ...(newBlock("heading", m) as TextBlock), text, style: { ...defaultStyle("heading", m), ...over } });
  const t = (text: string, over: Partial<TextStyle> = {}): Block => ({ ...(newBlock("text", m) as TextBlock), text, style: { ...defaultStyle("text", m), ...over } });
  switch (layout) {
    case "title":
      return { id: uid(), vAlign: "middle", blocks: [h("శీర్షిక", { size: 54 }), t("ఉపశీర్షిక / మీ పేరు", { size: 26 })] };
    case "content":
      return {
        id: uid(),
        vAlign: "top",
        blocks: [h("విషయం", { align: "left", size: 40 }), { ...(newBlock("list", m) as ListBlock), text: "మొదటి అంశం\nరెండవ అంశం\nమూడవ అంశం" }],
      };
    case "image":
      return { id: uid(), vAlign: "top", blocks: [h("చిత్రం శీర్షిక", { size: 38 }), { ...(newBlock("image", m) as ImageBlock), width: 70 }] };
    case "quote":
      return {
        id: uid(),
        vAlign: "middle",
        blocks: [{ ...(newBlock("quote", m) as TextBlock), text: "మీ పద్యం లేదా సూక్తి\nఇక్కడ వ్రాయండి" }, t("— రచయిత", { align: "right", size: 22, italic: true })],
      };
    case "end":
      return { id: uid(), vAlign: "middle", blocks: [h("ధన్యవాదాలు 🙏", { size: 60 }), t("రత్నాలబాల – జ్ఞానమాల", { size: 24 })] };
  }
}

/* ─────────────────────────────────────────────────────────────── */
/* DEFAULTS + TEMPLATES (fixed ids — safe to build during render)    */
/* ─────────────────────────────────────────────────────────────── */

const VEMANA = "ఉప్పు కప్పురంబు నొక్కపోలికనుండు\nచూడ చూడ రుచుల జాడ వేరు\nపురుషులందు పుణ్య పురుషులు వేరయా\nవిశ్వదాభిరామ వినురవేమ";

const SHOW = { seconds: 6, transition: "fade" as const, loop: true };

const base = (over: Partial<Project>): Project => ({
  v: 2,
  mode: "doc",
  title: "",
  docSize: "a4",
  slideSize: "wide",
  theme: "plain",
  font: "",
  blocks: [],
  slides: [],
  fit: false,
  vAlign: "top",
  pageNumbers: false,
  footer: "",
  bg: null,
  show: SHOW,
  ...over,
});

const S = (id: string, blocks: Block[], vAlign: VAlign = "top"): Slide => ({ id, blocks, vAlign });
const H = (id: string, text: string, mode: Mode, over: Partial<TextStyle> = {}): TextBlock => ({ id, type: "heading", text, style: { ...defaultStyle("heading", mode), ...over } });
const T = (id: string, text: string, mode: Mode, over: Partial<TextStyle> = {}): TextBlock => ({ id, type: "text", text, style: { ...defaultStyle("text", mode), ...over } });
const Q = (id: string, text: string, mode: Mode, over: Partial<TextStyle> = {}): TextBlock => ({ id, type: "quote", text, style: { ...defaultStyle("quote", mode), ...over } });
const L = (id: string, text: string, mode: Mode, ordered = false): ListBlock => ({ id, type: "list", text, ordered, style: defaultStyle("list", mode) });

const DEFAULT_SLIDES: Slide[] = [
  S("s1", [H("s1a", "మా ఊరి జ్ఞాపకాలు", "slides", { size: 56 }), T("s1b", "ఒక చిన్న స్లైడ్ షో", "slides", { size: 26 })], "middle"),
  S("s2", [H("s2a", "మనసుకు నచ్చినవి", "slides", { align: "left", size: 40 }), L("s2b", "పచ్చని పొలాలు\nగుడి గంటల శబ్దం\nఅమ్మ చేతి వంట", "slides")]),
  S("s3", [Q("s3a", VEMANA, "slides", { size: 30 }), T("s3b", "— వేమన", "slides", { align: "right", italic: true, size: 22 })], "middle"),
  S("s4", [H("s4a", "ధన్యవాదాలు 🙏", "slides", { size: 60 })], "middle"),
];

export const DEFAULT_PROJECT: Project = base({
  title: "నా పత్రం",
  blocks: [
    H("d1", "శీర్షిక ఇక్కడ", "doc"),
    T("d2", "ఇక్కడ మీ పాఠ్యం వ్రాయండి. పై పెట్టెలో అక్షరాల రంగు, సైజు, ఎడమ / మధ్య / కుడి అమరిక, ఫాంట్ — అన్నీ Word లాగే మార్చుకోవచ్చు.", "doc"),
    Q("d3", VEMANA, "doc"),
  ],
  slides: DEFAULT_SLIDES,
});

export type Template = { id: string; label: string; hint: string; make: () => Project };

export const TEMPLATES: Template[] = [
  { id: "blank", label: "ఖాళీ పత్రం", hint: "A4 · Word / PDF", make: () => base({ title: "నా పత్రం", blocks: [H("t1", "", "doc"), T("t2", "", "doc")], slides: DEFAULT_SLIDES }) },
  {
    id: "poem-poster",
    label: "పద్య పోస్టర్",
    hint: "చతురస్రం · WhatsApp / Instagram",
    make: () =>
      base({
        title: "పద్య పోస్టర్",
        docSize: "square",
        theme: "palm",
        fit: true,
        vAlign: "middle",
        blocks: [H("p1", "నేటి పద్యం", "doc", { size: 34 }), Q("p2", VEMANA, "doc", { size: 24 }), T("p3", "— వేమన", "doc", { align: "right", italic: true, size: 18 })],
        footer: "రత్నాలబాల – జ్ఞానమాల",
        slides: DEFAULT_SLIDES,
      }),
  },
  {
    id: "greeting",
    label: "శుభాకాంక్షలు",
    hint: "స్టోరీ · WhatsApp స్టేటస్",
    make: () =>
      base({
        title: "శుభాకాంక్షలు",
        docSize: "story",
        theme: "festive",
        fit: true,
        vAlign: "middle",
        blocks: [
          H("g1", "పండుగ శుభాకాంక్షలు", "doc", { size: 44 }),
          { id: "g2", type: "divider" },
          T("g3", "మీకు, మీ కుటుంబానికి\nఆయురారోగ్య ఐశ్వర్యాలు\nకలగాలని కోరుకుంటూ", "doc", { size: 26, align: "center" }),
          T("g4", "— మీ పేరు", "doc", { size: 22, align: "center", bold: true }),
        ],
        slides: DEFAULT_SLIDES,
      }),
  },
  {
    id: "article",
    label: "వ్యాసం / పుస్తకం",
    hint: "A4 · పేజీ సంఖ్యలతో",
    make: () =>
      base({
        title: "వ్యాసం",
        theme: "modern",
        pageNumbers: true,
        blocks: [
          H("a1", "తెలుగు భాష గొప్పదనం", "doc"),
          T("a2", "తెలుగు భాషను \"దేశ భాషలందు తెలుగు లెస్స\" అని శ్రీకృష్ణదేవరాయలు కొనియాడారు. అజంత భాష కావడం వల్ల తెలుగు పలుకుకు ఒక తీపి ఉంటుంది.", "doc"),
          H("a3", "ముఖ్యాంశాలు", "doc", { align: "left", size: 20 }),
          L("a4", "అజంత భాష — ప్రతి పదం అచ్చుతో ముగుస్తుంది\nవిశాలమైన సాహిత్య సంపద\nఅవధానం వంటి ప్రత్యేక కళలు", "doc"),
          { id: "a5", type: "table", header: true, style: defaultStyle("table", "doc"), rows: [["కవి", "కాలం", "ప్రసిద్ధ రచన"], ["నన్నయ", "11వ శతాబ్దం", "ఆంధ్ర మహాభారతం"], ["పోతన", "15వ శతాబ్దం", "భాగవతం"], ["వేమన", "17వ శతాబ్దం", "వేమన శతకం"]] },
        ],
        slides: DEFAULT_SLIDES,
      }),
  },
  { id: "slideshow", label: "స్లైడ్ షో", hint: "16:9 · సంగీతంతో · PowerPoint", make: () => base({ title: "స్లైడ్ షో", mode: "slides", theme: "night", slides: DEFAULT_SLIDES, blocks: DEFAULT_PROJECT.blocks }) },
];

/** Clean up anything read back from storage (older saves, bad data) */
export function sanitizeProject(p: unknown): Project | null {
  const x = p as Partial<Project> | null;
  if (!x || x.v !== 2 || !Array.isArray(x.blocks) || !Array.isArray(x.slides)) return null;
  return { ...base({}), ...x, show: { ...SHOW, ...(x.show ?? {}) } } as Project;
}

/** Turn the document into N slides (title + content slides) */
export function docToSlides(blocks: Block[], count: number, title: string): Slide[] {
  const m: Mode = "slides";
  const pieces = blocks.filter((b) => b.type !== "pagebreak" && b.type !== "divider" && !(b.type === "image" && !b.src));
  const firstHeading = pieces.find((b) => b.type === "heading") as TextBlock | undefined;
  const mainTitle = firstHeading?.text.trim() || title || "శీర్షిక";
  const rest = pieces.filter((b) => b !== firstHeading).map((b) => restyleForSlides(b));
  const titleSlide: Slide = { id: uid(), vAlign: "middle", blocks: [{ ...(newBlock("heading", m) as TextBlock), text: mainTitle, style: { ...defaultStyle("heading", m), size: 54 } }] };
  if (count <= 1) return [{ ...titleSlide, vAlign: "top", blocks: [...titleSlide.blocks, ...rest] }];
  const slots = Math.max(1, count - 1);
  const weight = (b: Block) => (b.type === "image" ? 160 : b.type === "table" ? 40 + blockText(b).length : 20 + blockText(b).length);
  const sum = (g: Block[]) => g.reduce((a, b) => a + weight(b), 0);

  // every heading starts a new slide (it becomes that slide's title)
  let groups: Block[][] = [];
  for (const b of rest) {
    if (b.type === "heading" || groups.length === 0) groups.push([b]);
    else groups[groups.length - 1].push(b);
  }
  // too many → join the lightest neighbours; too few → split the biggest
  while (groups.length > slots) {
    let best = 0;
    for (let i = 1; i < groups.length - 1; i++) if (sum(groups[i]) + sum(groups[i + 1]) < sum(groups[best]) + sum(groups[best + 1])) best = i;
    groups.splice(best, 2, [...groups[best], ...groups[best + 1]]);
  }
  while (groups.length < slots) {
    let big = -1;
    groups.forEach((g, i) => g.length > 1 && (big < 0 || sum(g) > sum(groups[big])) && (big = i));
    if (big < 0) break;
    const g = groups[big];
    const cut = Math.ceil(g.length / 2);
    groups.splice(big, 1, g.slice(0, cut), g.slice(cut));
  }
  const slides: Slide[] = [titleSlide, ...groups.map((blocks) => ({ id: uid(), vAlign: "top" as const, blocks }))];
  while (slides.length < count) slides.push(newSlide("content"));
  return slides;
}

function restyleForSlides(b: Block): Block {
  if (!isStyled(b)) return { ...b, id: uid() };
  const k = 1.6;
  return { ...structuredClone(b), id: uid(), style: { ...b.style, size: Math.round(b.style.size * k), align: b.style.align === "justify" ? "left" : b.style.align } } as Block;
}
