#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   style-audit.mjs — రత్నాలబాల స్టైల్ రిపోర్ట్ (ఏమీ మార్చదు, చదువుతుంది మాత్రమే)

   VS Code terminal లో, project folder లో:
       node scripts/style-audit.mjs

   ఫలితం: project లో  style-audit-report.md  (VS Code లో Ctrl+Shift+V తో చదవండి)

   ఏం వెతుకుతుంది:
     1. inline styles      — sx={{…}}, style={{…}}
     2. hard-coded రంగులు  — #hex, rgb(), rgba(), hsl()  (tokens బదులు)
     3. fonts              — fontFamily / font-family (fonts main.py నుంచే రావాలి)
     4. !important          — ఎక్కడ, ఎన్ని
     5. MUI components     — ఏ ఫైల్ ఏవి వాడుతోంది
     6. icons              — @mui/icons-material, మన icons.tsx, Yuktai icons
     7. CSS ఫైళ్ళు          — *.css / *.module.css, ఎవరు import చేస్తున్నారు (వాడనివి కూడా)
     8. Tailwind classes   — className లో Tailwind వాడకం
     9. పదే పదే వచ్చే విలువలు — borderRadius, minHeight, fontSize, fontWeight, boxShadow
        → ఇవి globals.css లో ఒక class / token గా మారే అభ్యర్థులు
    10. 44px కంటే చిన్న నొక్కే చోట్లు (minHeight / height < 44)
   ═══════════════════════════════════════════════════════════════ */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", "dist", "build", ".vercel", "out", "coverage", "baml_client", ".turbo", "__pycache__", ".venv", "venv"]);
const CODE_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs"]);
const CSS_EXT = new Set([".css", ".scss"]);
const SELF = "style-audit.mjs";

/* ── walk ── */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if ((CODE_EXT.has(extname(name)) || CSS_EXT.has(extname(name))) && name !== SELF && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const rel = (p) => relative(ROOT, p).replaceAll("\\", "/");
const lineOf = (text, index) => text.slice(0, index).split("\n").length;
const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
const addWhere = (map, key, where) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(where);
};

/* ── patterns ── */
const RE = {
  sx: /\bsx=\{/g,
  style: /\bstyle=\{\{/g,
  hex: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
  rgb: /\b(?:rgba?|hsla?)\([^)]*\)/g,
  fontFamily: /\bfont-?[fF]amily\s*:\s*([^;,}\n]+)/g,
  important: /!important/g,
  muiImport: /import\s*\{([^}]*)\}\s*from\s*["']@mui\/material["']/g,
  muiDeep: /import\s+(\w+)\s+from\s*["']@mui\/material\/(\w+)["']/g,
  muiIcon: /from\s*["']@mui\/icons-material\/(\w+)["']/g,
  muiIconBarrel: /import\s*\{([^}]*)\}\s*from\s*["']@mui\/icons-material["']/g,
  ownIcons: /import\s*\{([^}]*)\}\s*from\s*["'][^"']*\/icons["']/g,
  yuktaiIcons: /\b(SearchIcon|SortUpIcon|SortDownIcon|ChevronLeftIcon|ChevronRightIcon|CheckIcon|CloseIcon)\b/g,
  cssImport: /import\s+(?:\w+\s+from\s+)?["']([^"']+\.(?:module\.)?s?css)["']/g,
  className: /className=(?:"([^"]*)"|\{`([^`]*)`\})/g,
  radius: /\bborderRadius\s*:\s*("[^"]*"|'[^']*'|[\d.]+)/g,
  minH: /\b(minHeight|height)\s*:\s*("[^"]*"|'[^']*'|[\d.]+)/g,
  fSize: /\bfontSize\s*:\s*("[^"]*"|'[^']*'|[\d.]+)/g,
  fWeight: /\bfontWeight\s*:\s*("[^"]*"|'[^']*'|[\d.]+)/g,
  shadow: /\bboxShadow\s*:\s*("[^"]*"|'[^']*'|`[^`]*`)/g,
  cssVar: /var\(--([\w-]+)/g,
};
const TAILWIND_HINT = /(?:^|\s)(?:flex|grid|block|hidden|p[xytrbl]?-\d|m[xytrbl]?-\d|gap-\d|text-(?:xs|sm|base|lg|xl|\dxl)|font-(?:bold|semibold|extrabold)|rounded(?:-\w+)?|w-\d|h-\d|max-w-|bg-\[|text-\[|border(?:-\w+)?|items-|justify-|sm:|md:|lg:)/;

/* ── collect ── */
const perFile = [];
const colors = new Map(); // value → count
const colorWhere = new Map();
const fonts = new Map();
const fontWhere = new Map();
const muiComps = new Map();
const muiCompFiles = new Map();
const muiIcons = new Map();
const iconWhere = new Map();
const ownIcons = new Map();
const cssFiles = [];
const cssImports = new Map(); // css basename → importers
const radius = new Map(), minH = new Map(), fSize = new Map(), fWeight = new Map(), shadow = new Map();
const smallTaps = [];
const tokensUsed = new Map();
let tailwindFiles = 0;

for (const f of files) {
  const text = readFileSync(f, "utf8");
  const r = rel(f);
  const isCss = CSS_EXT.has(extname(f));
  const count = (re) => (text.match(re) || []).length;

  const row = {
    file: r,
    lines: text.split("\n").length,
    sx: isCss ? 0 : count(RE.sx),
    style: isCss ? 0 : count(RE.style),
    colors: 0,
    fonts: 0,
    important: count(RE.important),
    mui: 0,
    icons: 0,
    tailwind: 0,
  };

  // colours (skip comments roughly: lines starting with // or inside /* */ are still counted — report says where)
  // globals.css is where the tokens are DEFINED — its colours are fine
  const isTokenFile = basename(f) === "globals.css";
  for (const re of isTokenFile ? [] : [RE.hex, RE.rgb]) {
    for (const m of text.matchAll(re)) {
      const v = m[0].toLowerCase().replace(/\s+/g, "");
      // ignore things like "#main-content" anchors and "#t=0.1"
      if (/^#[0-9a-f]{3,8}$/.test(v) === false && v.startsWith("#")) continue;
      const before = text.slice(Math.max(0, m.index - 6), m.index);
      if (/href=|["']#$/.test(before)) continue;
      row.colors++;
      bump(colors, v);
      addWhere(colorWhere, v, `${r}:${lineOf(text, m.index)}`);
    }
  }

  for (const m of text.matchAll(RE.fontFamily)) {
    const v = m[1].trim().replace(/["'`]/g, "").slice(0, 60);
    if (/^inherit|^var\(/.test(v)) continue;
    row.fonts++;
    bump(fonts, v);
    addWhere(fontWhere, v, `${r}:${lineOf(text, m.index)}`);
  }

  if (!isCss) {
    const comps = new Set();
    for (const m of text.matchAll(RE.muiImport)) m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]).filter((s) => s && !/^type\s/.test(s)).forEach((c) => comps.add(c));
    for (const m of text.matchAll(RE.muiDeep)) comps.add(m[2]);
    comps.forEach((c) => {
      bump(muiComps, c);
      addWhere(muiCompFiles, c, r);
    });
    row.mui = comps.size;

    const icons = [];
    for (const m of text.matchAll(RE.muiIcon)) icons.push(m[1]);
    for (const m of text.matchAll(RE.muiIconBarrel)) m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach((i) => icons.push(i));
    icons.forEach((i) => {
      bump(muiIcons, i);
      addWhere(iconWhere, i, r);
    });
    row.icons = icons.length;

    for (const m of text.matchAll(RE.ownIcons)) m[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((i) => bump(ownIcons, i));

    for (const m of text.matchAll(RE.cssImport)) addWhere(cssImports, basename(m[1]), r);

    for (const m of text.matchAll(RE.className)) if (TAILWIND_HINT.test(m[1] ?? m[2] ?? "")) row.tailwind++;
    if (row.tailwind) tailwindFiles++;

    for (const [re, map] of [[RE.radius, radius], [RE.fSize, fSize], [RE.fWeight, fWeight], [RE.shadow, shadow]])
      for (const m of text.matchAll(re)) bump(map, m[1].replace(/["'`]/g, ""));
    for (const m of text.matchAll(RE.minH)) {
      const raw = m[2].replace(/["']/g, "");
      bump(minH, `${m[1]}: ${raw}`);
      const px = /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : /^(\d+)px$/.test(raw) ? Number(raw.slice(0, -2)) : null;
      if (px !== null && px > 0 && px < 44 && m[1] === "minHeight") smallTaps.push(`${r}:${lineOf(text, m.index)} → ${m[1]}: ${raw}`);
    }
  } else {
    cssFiles.push(r);
  }

  for (const m of text.matchAll(RE.cssVar)) bump(tokensUsed, `--${m[1]}`);

  perFile.push(row);
}

/* ── report ── */
const top = (map, n = 15) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const sum = (k) => perFile.reduce((s, r) => s + r[k], 0);
const where = (map, key, n = 4) => [...(map.get(key) ?? [])].slice(0, n).join(", ") + ((map.get(key)?.size ?? 0) > n ? ` …+${map.get(key).size - n}` : "");

const L = [];
const p = (s = "") => L.push(s);

p("# 🎨 రత్నాలబాల — Style Audit Report");
p();
p(`_${new Date().toLocaleString("en-IN")} · ${files.length} ఫైళ్ళు చూశాం (node_modules, .next, public తప్ప)_`);
p();
p("## 1. సారాంశం");
p();
p("| ఏమిటి | ఎన్ని | అర్థం |");
p("|---|---:|---|");
p(`| \`sx={{}}\` inline styles | ${sum("sx")} | పదే పదే ఉన్నవి globals.css class లుగా మార్చవచ్చు |`);
p(`| \`style={{}}\` inline styles | ${sum("style")} | వీలైతే sx లేదా class కి |`);
p(`| Hard-coded రంగులు (#hex / rgb) | ${sum("colors")} (${colors.size} వేర్వేరు) | var(--token) కి మార్చాలి |`);
p(`| font-family ప్రకటనలు | ${sum("fonts")} | fonts lib/teluguFonts నుంచే రావాలి |`);
p(`| \`!important\` | ${sum("important")} | MUI theme పెడితే చాలా పోతాయి |`);
p(`| MUI components (వేర్వేరు) | ${muiComps.size} | |`);
p(`| MUI icons (వేర్వేరు) | ${muiIcons.size} | సాధారణమైనవి icons.tsx కి |`);
p(`| Tailwind వాడే ఫైళ్ళు | ${tailwindFiles} | MUI తో కలిపి 2 పద్ధతులు — ఒకటి ఎంచుకోవాలి |`);
p(`| CSS ఫైళ్ళు | ${cssFiles.length} | |`);
p(`| 44px కంటే చిన్న minHeight | ${smallTaps.length} | 60+ పాఠకులకు నొక్కడం కష్టం |`);
p();

p("## 2. ఫైళ్ళ వారీగా (inline styles ఎక్కువ ఉన్నవి ముందు)");
p();
p("| ఫైల్ | గీతలు | sx | style | రంగులు | fonts | !important | MUI | icons | Tailwind |");
p("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
perFile
  .filter((r) => r.sx + r.style + r.colors + r.fonts + r.important + r.mui + r.icons + r.tailwind > 0)
  .sort((a, b) => b.sx + b.style + b.colors - (a.sx + a.style + a.colors))
  .forEach((r) => p(`| ${r.file} | ${r.lines} | ${r.sx} | ${r.style} | ${r.colors} | ${r.fonts} | ${r.important} | ${r.mui} | ${r.icons} | ${r.tailwind} |`));
p();

p("## 3. Hard-coded రంగులు (ఎక్కువ వాడినవి ముందు)");
p();
p("globals.css లో ఇప్పటికే ఉన్న token తో సరిపోతే → `var(--…)` పెట్టండి. కొత్తది అయితే → token గా చేర్చండి.");
p("(globals.css లెక్కలో లేదు — tokens అక్కడే నిర్వచిస్తాం. khatimala/themes.ts లోని రంగులు పోస్టర్ రూపాలవి, అవి అలాగే ఉండాలి.)");
p();
p("| రంగు | ఎన్నిసార్లు | ఎక్కడ |");
p("|---|---:|---|");
top(colors, 30).forEach(([c, n]) => p(`| \`${c}\` | ${n} | ${where(colorWhere, c)} |`));
p();

p("## 4. Fonts (font-family)");
p();
if (!fonts.size) p("✅ ఏ ఫైల్‌లోనూ hard-coded font లేదు.");
else {
  p("| font | ఎన్ని | ఎక్కడ |");
  p("|---|---:|---|");
  top(fonts, 20).forEach(([f, n]) => p(`| ${f} | ${n} | ${where(fontWhere, f)} |`));
}
p();

p("## 5. MUI components");
p();
p("| component | ఎన్ని ఫైళ్ళు | ఎక్కడ |");
p("|---|---:|---|");
top(muiComps, 60).forEach(([c, n]) => p(`| ${c} | ${n} | ${where(muiCompFiles, c, 3)} |`));
p();

p("## 6. Icons");
p();
p(`**MUI icons:** ${muiIcons.size} వేర్వేరు, ${sum("icons")} సార్లు import`);
p();
p("| icon | ఎన్ని ఫైళ్ళు | ఎక్కడ |");
p("|---|---:|---|");
top(muiIcons, 80).forEach(([i, n]) => p(`| ${i} | ${n} | ${where(iconWhere, i, 3)} |`));
p();
p(`**మన icons.tsx (Yuktai శైలి):** ${ownIcons.size ? [...ownIcons.keys()].join(", ") : "ఇంకా ఎక్కడా వాడలేదు"}`);
p();
p("💡 ExpandMore / ArrowForward / Close / Search / Download / Check లాంటి సాధారణ MUI icons → `app/components/icons.tsx` లోని వాటితో మార్చవచ్చు (bundle తేలిక, ఒకే శైలి).");
p();

p("## 7. CSS ఫైళ్ళు — ఎవరు వాడుతున్నారు?");
p();
p("| CSS ఫైల్ | import చేసినవి |");
p("|---|---|");
cssFiles.forEach((c) => {
  const who = cssImports.get(basename(c));
  p(`| ${c} | ${who ? [...who].join(", ") : "⚠️ **ఎవరూ import చేయడం లేదు — తీసేయవచ్చు**"} |`);
});
p();

p("## 8. పదే పదే వచ్చే విలువలు → globals.css token / class అభ్యర్థులు");
p();
for (const [title, map] of [
  ["borderRadius", radius],
  ["minHeight / height", minH],
  ["fontSize", fSize],
  ["fontWeight", fWeight],
  ["boxShadow", shadow],
]) {
  p(`**${title}**`);
  p();
  p("| విలువ | ఎన్నిసార్లు |");
  p("|---|---:|");
  top(map, 12).forEach(([v, n]) => p(`| \`${v}\` | ${n} |`));
  p();
}

p("## 9. 44px కంటే చిన్న నొక్కే చోట్లు");
p();
if (!smallTaps.length) p("✅ ఏవీ లేవు.");
else smallTaps.slice(0, 60).forEach((s) => p(`- ${s}`));
p();

p("## 10. ఎక్కువ వాడే CSS tokens");
p();
p("| token | ఎన్నిసార్లు |");
p("|---|---:|");
top(tokensUsed, 30).forEach(([t, n]) => p(`| \`${t}\` | ${n} |`));
p();

p("---");
p("**తర్వాత:** ఈ ఫైల్ (`style-audit-report.md`) పంపితే, దాని ఆధారంగా globals.css లో tokens / classes చేర్చి, ఏ ఫైళ్ళలో ఏది మార్చాలో జాబితా ఇస్తాను.");

const OUT = join(ROOT, "style-audit-report.md");
writeFileSync(OUT, L.join("\n"), "utf8");

console.log(`\n✅ style-audit-report.md తయారైంది  (${files.length} ఫైళ్ళు)\n`);
console.log(`   sx: ${sum("sx")}  ·  style: ${sum("style")}  ·  రంగులు: ${sum("colors")} (${colors.size} వేర్వేరు)  ·  !important: ${sum("important")}`);
console.log(`   MUI components: ${muiComps.size}  ·  MUI icons: ${muiIcons.size}  ·  Tailwind ఫైళ్ళు: ${tailwindFiles}  ·  CSS ఫైళ్ళు: ${cssFiles.length}  ·  <44px: ${smallTaps.length}\n`);
console.log("   VS Code లో తెరవండి:  code style-audit-report.md   (Ctrl+Shift+V = preview)\n");
