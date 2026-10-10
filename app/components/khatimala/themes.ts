/* ═══════════════════════════════════════════════════════════════
   ఖతి మాల — 10 రూపాలు (themes): పత్రాలకు, స్లైడ్లకు రెండింటికీ

   ప్రతి రూపం = రంగులు + canvas పై గీసే అలంకరణ (అంచులు, తోరణం …)
   అన్నీ ఇక్కడే గీస్తాం (బయటి చిత్రాలు లేవు) — ఆఫ్‌లైన్‌లోనూ పని చేస్తుంది.
   పాఠ్యం రంగులు నేపథ్యంపై 7:1 కంటే ఎక్కువ (WCAG AAA) — శీర్షికలు ≥ 4.5:1.
   ═══════════════════════════════════════════════════════════════ */

export type Theme = {
  id: string;
  name: string;
  /** Background: one colour, or top→bottom gradient */
  bg: string[];
  text: string;
  heading: string;
  accent: string;
  muted: string;
  quoteBg: string;
  tableHead: string;
  tableHeadText: string;
  tableBorder: string;
  tableStripe: string;
  /** Extra page margin (fraction of the short side) for frames / bands */
  pad: { t: number; r: number; b: number; l: number };
  /** Short accent line under headings */
  headingRule: boolean;
  /** Draws the decoration (in pt) */
  decor: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
};

const BASE_PAD = 0.075;
const pad = (t = 0, r = 0, b = 0, l = 0) => ({ t: BASE_PAD + t, r: BASE_PAD + r, b: BASE_PAD + b, l: BASE_PAD + l });

/** Same "random" stars every time (no Math.random — output must not change) */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, lw: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
}

export const THEMES: Theme[] = [
  {
    id: "plain",
    name: "తెల్ల కాగితం",
    bg: ["#ffffff"],
    text: "#1a1a1a",
    heading: "#1a1a1a",
    accent: "#8a4b2a",
    muted: "#555555",
    quoteBg: "#f5f1ea",
    tableHead: "#efe8dc",
    tableHeadText: "#1a1a1a",
    tableBorder: "#9a8f80",
    tableStripe: "#faf8f4",
    pad: pad(),
    headingRule: false,
    decor: () => {},
  },
  {
    id: "palm",
    name: "తాళపత్రం",
    bg: ["#f7e9c4", "#ecd7a2"],
    text: "#2f1d0e",
    heading: "#5a2509",
    accent: "#7a4a1e",
    muted: "#5b4330",
    quoteBg: "rgba(122,74,30,0.10)",
    tableHead: "#7a4a1e",
    tableHeadText: "#fff8e8",
    tableBorder: "#8a6a44",
    tableStripe: "rgba(255,255,255,0.35)",
    pad: pad(0.03, 0.03, 0.03, 0.03),
    headingRule: false,
    decor: (ctx, w, h) => {
      const m = Math.min(w, h) * 0.035;
      frame(ctx, m, m, w - 2 * m, h - 2 * m, "#7a4a1e", 2.2);
      frame(ctx, m + 6, m + 6, w - 2 * m - 12, h - 2 * m - 12, "#7a4a1e", 0.8);
      for (const [x, y] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
        ctx.fillStyle = "#7a4a1e";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "festive",
    name: "పండుగ తోరణం",
    bg: ["#fffaf0"],
    text: "#2b1608",
    heading: "#a31515",
    accent: "#c62828",
    muted: "#5d4037",
    quoteBg: "#fff1d0",
    tableHead: "#c62828",
    tableHeadText: "#ffffff",
    tableBorder: "#d9a441",
    tableStripe: "#fff6e0",
    pad: pad(0.06, 0, 0.03, 0),
    headingRule: false,
    decor: (ctx, w, h) => {
      const s = Math.min(w, h);
      const y0 = s * 0.03;
      const n = Math.max(8, Math.round(w / (s * 0.075)));
      const tw = w / n;
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(w, y0);
      ctx.stroke();
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 ? "#f9a825" : "#c62828";
        ctx.beginPath();
        ctx.moveTo(i * tw + 2, y0);
        ctx.lineTo((i + 1) * tw - 2, y0);
        ctx.lineTo((i + 0.5) * tw, y0 + tw * 0.95);
        ctx.closePath();
        ctx.fill();
      }
      const yb = h - s * 0.035;
      ctx.fillStyle = "#c62828";
      ctx.fillRect(0, yb, w, 3);
      ctx.fillStyle = "#f9a825";
      ctx.fillRect(0, yb + 6, w, 3);
    },
  },
  {
    id: "sky",
    name: "నీలాకాశం",
    bg: ["#dcecfb", "#ffffff"],
    text: "#0f2236",
    heading: "#0b3d91",
    accent: "#1565c0",
    muted: "#36506b",
    quoteBg: "rgba(21,101,192,0.08)",
    tableHead: "#1565c0",
    tableHeadText: "#ffffff",
    tableBorder: "#90a9c6",
    tableStripe: "rgba(21,101,192,0.05)",
    pad: pad(0, 0, 0, 0.02),
    headingRule: true,
    decor: (ctx, w, h) => {
      const s = Math.min(w, h);
      ctx.fillStyle = "#1565c0";
      ctx.fillRect(0, 0, s * 0.022, h);
      ctx.fillStyle = "rgba(21,101,192,0.35)";
      ctx.fillRect(s * 0.03, 0, s * 0.006, h);
    },
  },
  {
    id: "field",
    name: "పచ్చని పొలం",
    bg: ["#f3f9ea"],
    text: "#18240f",
    heading: "#1b5e20",
    accent: "#2e7d32",
    muted: "#3b5230",
    quoteBg: "rgba(46,125,50,0.09)",
    tableHead: "#2e7d32",
    tableHeadText: "#ffffff",
    tableBorder: "#9cb98a",
    tableStripe: "rgba(46,125,50,0.05)",
    pad: pad(0, 0, 0.09, 0),
    headingRule: false,
    decor: (ctx, w, h) => {
      const s = Math.min(w, h);
      const waves: [string, number][] = [["#c5e1a5", 0.16], ["#8bc34a", 0.11], ["#558b2f", 0.065]];
      for (const [color, k] of waves) {
        const top = h - s * k;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, top);
        const parts = 4;
        for (let i = 0; i < parts; i++) {
          const x0 = (w / parts) * i;
          const x1 = (w / parts) * (i + 1);
          ctx.quadraticCurveTo((x0 + x1) / 2, top + (i % 2 ? s * 0.03 : -s * 0.03), x1, top);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }
    },
  },
  {
    id: "night",
    name: "వెన్నెల రాత్రి",
    bg: ["#0d1b2a", "#1b2a41"],
    text: "#f3eee3",
    heading: "#f4c95d",
    accent: "#f4c95d",
    muted: "#c9c2b2",
    quoteBg: "rgba(255,255,255,0.08)",
    tableHead: "#f4c95d",
    tableHeadText: "#0d1b2a",
    tableBorder: "rgba(244,201,93,0.55)",
    tableStripe: "rgba(255,255,255,0.05)",
    pad: pad(0.02, 0, 0, 0),
    headingRule: false,
    decor: (ctx, w, h) => {
      const s = Math.min(w, h);
      const rnd = seeded(7);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (let i = 0; i < 70; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 0.4 + rnd() * 1.1;
        ctx.globalAlpha = 0.35 + rnd() * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const R = s * 0.06;
      const cx = w - s * 0.11;
      const cy = s * 0.11;
      ctx.fillStyle = "#f4e4ba";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f1d2e";
      ctx.beginPath();
      ctx.arc(cx + R * 0.45, cy - R * 0.2, R * 0.9, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "gold",
    name: "బంగారు అంచు",
    bg: ["#fffdf6"],
    text: "#24190a",
    heading: "#5e4100",
    accent: "#b8860b",
    muted: "#5a4a2e",
    quoteBg: "rgba(184,134,11,0.09)",
    tableHead: "#8a6508",
    tableHeadText: "#ffffff",
    tableBorder: "#c9a54a",
    tableStripe: "rgba(184,134,11,0.05)",
    pad: pad(0.035, 0.035, 0.035, 0.035),
    headingRule: true,
    decor: (ctx, w, h) => {
      const m = Math.min(w, h) * 0.04;
      frame(ctx, m, m, w - 2 * m, h - 2 * m, "#b8860b", 3);
      frame(ctx, m + 7, m + 7, w - 2 * m - 14, h - 2 * m - 14, "#b8860b", 1);
      const r = Math.min(w, h) * 0.018;
      for (const [x, y] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) diamond(ctx, x, y, r, "#b8860b");
      diamond(ctx, w / 2, m, r * 0.8, "#b8860b");
      diamond(ctx, w / 2, h - m, r * 0.8, "#b8860b");
    },
  },
  {
    id: "silk",
    name: "పట్టు అంచు",
    bg: ["#fbf3e4"],
    text: "#2b1a12",
    heading: "#7b1e1e",
    accent: "#7b1e1e",
    muted: "#5a3b2c",
    quoteBg: "rgba(123,30,30,0.07)",
    tableHead: "#7b1e1e",
    tableHeadText: "#fff6e6",
    tableBorder: "#c08a4a",
    tableStripe: "rgba(123,30,30,0.04)",
    pad: pad(0.05, 0.05, 0.05, 0.05),
    headingRule: false,
    decor: (ctx, w, h) => {
      const b = Math.min(w, h) * 0.045;
      ctx.fillStyle = "#7b1e1e";
      ctx.fillRect(0, 0, w, b);
      ctx.fillRect(0, h - b, w, b);
      ctx.fillRect(0, 0, b, h);
      ctx.fillRect(w - b, 0, b, h);
      ctx.strokeStyle = "#e0a63c";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(b + 3, b + 3, w - 2 * b - 6, h - 2 * b - 6);
      const step = b * 1.1;
      const dot = (x: number, y: number) => diamond(ctx, x, y, b * 0.22, "#e0a63c");
      for (let x = b / 2; x < w; x += step) {
        dot(x, b / 2);
        dot(x, h - b / 2);
      }
      for (let y = b / 2 + step; y < h - step / 2; y += step) {
        dot(b / 2, y);
        dot(w - b / 2, y);
      }
    },
  },
  {
    id: "modern",
    name: "ఆధునిక",
    bg: ["#ffffff"],
    text: "#16211f",
    heading: "#004d40",
    accent: "#00796b",
    muted: "#3e504d",
    quoteBg: "#e8f3f1",
    tableHead: "#00695c",
    tableHeadText: "#ffffff",
    tableBorder: "#9fbcb7",
    tableStripe: "#f3f8f7",
    pad: pad(0.02, 0, 0, 0),
    headingRule: true,
    decor: (ctx, w, h) => {
      const s = Math.min(w, h);
      ctx.fillStyle = "#00796b";
      ctx.fillRect(0, 0, w, s * 0.016);
      ctx.fillRect(w - s * 0.09, h - s * 0.03, s * 0.09, s * 0.03);
    },
  },
  {
    id: "rose",
    name: "గులాబీ తోట",
    bg: ["#fff4f6"],
    text: "#33141f",
    heading: "#9c0f4c",
    accent: "#c2185b",
    muted: "#5c3443",
    quoteBg: "rgba(194,24,91,0.07)",
    tableHead: "#ad1457",
    tableHeadText: "#ffffff",
    tableBorder: "#e3a1bb",
    tableStripe: "rgba(194,24,91,0.04)",
    pad: pad(0.02, 0.02, 0.02, 0.02),
    headingRule: false,
    decor: (ctx, w, h) => {
      const s = Math.min(w, h);
      const blob = (x: number, y: number, r: number, a: number) => {
        ctx.fillStyle = `rgba(236,64,122,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      blob(0, 0, s * 0.2, 0.14);
      blob(s * 0.12, s * 0.02, s * 0.08, 0.16);
      blob(w, h, s * 0.22, 0.14);
      blob(w - s * 0.14, h - s * 0.02, s * 0.07, 0.16);
    },
  },
];

export const getTheme = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

function rgba(c: string): [number, number, number, number] {
  const m = c.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const [r, g, b, a = "1"] = m[1].split(",").map((x) => x.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  let h = c.replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
}

/** A see-through colour mixed onto the page colour → one solid colour
    (overlapping see-through strips would show darker seams) */
export function solid(color: string, theme: Theme): string {
  const [r, g, b, a] = rgba(color);
  if (a >= 1) return color;
  const stops = theme.bg.map(rgba);
  const base = stops.reduce((s, x) => [s[0] + x[0] / stops.length, s[1] + x[1] / stops.length, s[2] + x[2] / stops.length], [0, 0, 0]);
  const mix = (x: number, y: number) => Math.round(x * a + y * (1 - a));
  return `rgb(${mix(r, base[0])}, ${mix(g, base[1])}, ${mix(b, base[2])})`;
}

/** Solid colour for Word page / editor boxes */
export const themeSolid = (t: Theme) => t.bg[0];
