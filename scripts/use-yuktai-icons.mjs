#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// use-yuktai-icons.mjs · Ratnalabala
//
// Replaces Material icons (@mui/icons-material) and react-feather icons with
// yuktai icons (@yuktishaalaa/yuktai 5.3.2+) wherever a yuktai icon means the
// same thing. Icons with no good yuktai match (WhatsApp, Android, delete,
// robot, heart, code, lock …) stay as Material icons.
//
// How it works
//   1. Writes lib/yuktai-icons.tsx: each icon is a MUI <SvgIcon> drawing the
//      yuktai shape, so sx, fontSize, color, titleAccess and the
//      SvgIconComponent type keep working exactly as before.
//   2. Rewrites   import XIcon from "@mui/icons-material/X"
//      into       import { X as XIcon } from "@/lib/yuktai-icons"
//   3. Swaps react-feather imports for yuktai React icons.
//
// Run from the repo root:   node use-yuktai-icons.mjs
// Preview without writing:  node use-yuktai-icons.mjs --dry
// Safe to run again: it only touches imports it can map.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs"
import path from "node:path"

const DRY = process.argv.includes("--dry")
const ROOT = process.cwd()
const WRAPPER_REL = "lib/yuktai-icons.tsx"
const WRAPPER_IMPORT = "@/lib/yuktai-icons"
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build", "dist", "android", "gradle", "rust", "baml_client", ".vercel", "public"])
const EXTS = new Set([".tsx", ".ts", ".jsx", ".js"])

// Material icon (without Rounded/TwoTone/Outlined/Sharp) → yuktai icon name
const MAP = {
  ExpandMore: "sortDown", ExpandLess: "sortUp",
  ChevronRight: "right", NavigateNext: "right", ChevronLeft: "left", NavigateBefore: "left",
  ArrowForward: "arrowRight", ArrowBack: "arrowLeft", ArrowUpward: "arrowUp", KeyboardArrowUp: "arrowUp",
  SkipNext: "last", SkipPrevious: "first", SwapVert: "sort",
  Close: "close", Clear: "close", Cancel: "close",
  Add: "plus", Remove: "minus", HorizontalRule: "minus",
  Check: "check", CheckCircle: "check", DoneAll: "check",
  Search: "search", FindInPage: "search", TravelExplore: "search",
  Download: "download", DownloadForOffline: "download",
  ContentCopy: "copy", Share: "share", IosShare: "share", OpenInNew: "external",
  Send: "send", Menu: "menu", Home: "home", Settings: "tools", Tune: "filter",
  Undo: "undo", RestartAlt: "reset", Refresh: "reset", Autorenew: "reset",
  Edit: "wand", HistoryEdu: "pen",
  AutoAwesome: "spark", Bolt: "spark",
  MenuBook: "book", AutoStories: "book", ImportContacts: "book",
  PictureAsPdf: "file", Description: "file", Article: "file", Newspaper: "file", NoteAdd: "file",
  Notes: "reading", FormatListBulleted: "reading", ChromeReaderMode: "reading",
  TableRows: "cards", TableChart: "grid", GridOn: "grid", GridView: "grid", Apps: "grid",
  VolumeUp: "speaker", VolumeDown: "speaker", RecordVoiceOver: "speaker",
  Mic: "mic", MusicNote: "music", GraphicEq: "music", Headphones: "headphones",
  PlayArrow: "play", PlayCircleFilled: "play", Pause: "pause", Stop: "stop", StopCircle: "stop",
  QuestionAnswer: "chat", ChatBubbleOutline: "chat", Forum: "chat",
  HelpOutline: "help", Quiz: "help", Info: "info", InfoOutlined: "info", ErrorOutline: "alert",
  TipsAndUpdates: "bulb",
  Image: "image", Palette: "palette", Brush: "palette", FormatColorFill: "palette",
  Contrast: "contrast", Visibility: "eye", LightMode: "sun", WbSunny: "sun", DarkMode: "moon",
  Translate: "globe", Schedule: "clock", Timer: "clock",
  TempleHindu: "temple", SelfImprovement: "meditate", InstallMobile: "install",
}

// react-feather → yuktai React components
const FEATHER = {
  Calendar: "CalendarIcon", User: "PersonIcon", Users: "UsersIcon", Home: "HomeIcon", Book: "BookIcon",
  Award: "TrophyIcon", MapPin: "PinIcon", FileText: "FileIcon", Search: "SearchIcon", X: "CloseIcon",
  Check: "CheckIcon", Download: "DownloadIcon", Share2: "ShareIcon", Menu: "MenuIcon", Mic: "MicIcon",
  Play: "PlayIcon", Pause: "PauseIcon", Clock: "ClockIcon", Globe: "GlobeIcon", Image: "ImageIcon",
  Music: "MusicIcon", Send: "SendIcon", Sun: "SunIcon", Moon: "MoonIcon", Info: "InfoIcon",
  ChevronLeft: "ChevronLeftIcon", ChevronRight: "ChevronRightIcon", ArrowLeft: "ArrowLeftIcon",
  ArrowRight: "ArrowRightIcon", ArrowUp: "ArrowUpIcon", ExternalLink: "ExternalIcon", Copy: "CopyIcon",
  Plus: "PlusIcon", Minus: "MinusIcon", Gift: "GiftIcon", Headphones: "HeadphonesIcon",
}

const baseOf = (mui) => {
  if (MAP[mui]) return mui
  const b = mui.replace(/(Rounded|TwoTone|Outlined|Sharp)$/, "")
  return MAP[b] ? b : null
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") && e.name !== ".") { if (e.isDirectory()) continue }
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out) }
    else if (EXTS.has(path.extname(e.name)) && !p.endsWith(path.normalize(WRAPPER_REL))) out.push(p)
  }
  return out
}

const used = new Set()            // MUI names exported by the wrapper
const kept = new Map()            // Material icons left as they are → count
let filesChanged = 0, muiSwapped = 0, featherSwapped = 0
const MUI_RE = /import\s+(\w+)\s+from\s+(["'])@mui\/icons-material\/(\w+)(?:\.js)?\2;?/g
const WRAP_RE = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${WRAPPER_IMPORT.replace(/[/@]/g, "\\$&")}["']`, "g")
const FEATHER_RE = /import\s*\{([^}]*)\}\s*from\s*(["'])react-feather\2;?/g

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8")
  // names already imported from the wrapper (when run a second time)
  for (const m of src.matchAll(WRAP_RE)) m[1].split(",").forEach((s) => { const n = s.trim().split(/\s+as\s+/)[0]; if (n) used.add(n) })

  let changed = false
  let out = src.replace(MUI_RE, (all, local, _q, mui) => {
    if (!baseOf(mui)) { kept.set(mui, (kept.get(mui) || 0) + 1); return all }
    used.add(mui); muiSwapped++; changed = true
    return `import { ${mui} as ${local} } from "${WRAPPER_IMPORT}";`
  })

  out = out.replace(FEATHER_RE, (all, list) => {
    const parts = list.split(",").map((s) => s.trim()).filter(Boolean)
    const mapped = [], rest = []
    for (const p of parts) {
      const [name, alias] = p.split(/\s+as\s+/)
      if (FEATHER[name]) mapped.push(`${FEATHER[name]} as ${alias || name}`)
      else rest.push(p)
    }
    if (!mapped.length) return all
    featherSwapped += mapped.length; changed = true
    let s = `import { ${mapped.join(", ")} } from "@yuktishaalaa/yuktai/icons";`
    if (rest.length) s += `\nimport { ${rest.join(", ")} } from "react-feather";`
    return s
  })

  if (changed) {
    filesChanged++
    if (!DRY) fs.writeFileSync(file, out)
  }
}

// ── the wrapper: yuktai shapes inside MUI SvgIcon ────────────────────────────
const names = [...used].filter(baseOf).sort()
const wrapper = `"use client"
// ─────────────────────────────────────────────────────────────────────────────
// lib/yuktai-icons.tsx — generated by use-yuktai-icons.mjs, safe to re-generate.
//
// yuktai icons (@yuktishaalaa/yuktai) drawn inside MUI's <SvgIcon>, so every
// Material prop still works: sx, fontSize, color, htmlColor, titleAccess.
// Each export keeps its Material name, so the rest of the code did not change.
// ─────────────────────────────────────────────────────────────────────────────

import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon"
import type { SvgIconComponent } from "@mui/icons-material"
import { ICON_PATHS, type IconName } from "@yuktishaalaa/yuktai/icons"

function yuktai(name: IconName, displayName: string): SvgIconComponent {
  const Icon = (props: SvgIconProps) => (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
      />
    </SvgIcon>
  )
  Icon.displayName = displayName
  Icon.muiName = SvgIcon.muiName
  return Icon as unknown as SvgIconComponent
}

${names.map((n) => `export const ${n} = yuktai("${MAP[baseOf(n)]}", "${n}")`).join("\n")}
`

if (!DRY && names.length) {
  fs.mkdirSync(path.dirname(path.join(ROOT, WRAPPER_REL)), { recursive: true })
  fs.writeFileSync(path.join(ROOT, WRAPPER_REL), wrapper)
}

const keptList = [...kept.entries()].sort((a, b) => b[1] - a[1])
console.log(`${DRY ? "[dry run] " : ""}yuktai icons`)
console.log(`  files changed:            ${filesChanged}`)
console.log(`  Material imports swapped: ${muiSwapped} (${names.length} different icons)`)
console.log(`  react-feather swapped:    ${featherSwapped}`)
console.log(`  Material imports kept:    ${keptList.reduce((a, [, n]) => a + n, 0)} (${keptList.length} icons with no yuktai match)`)
if (keptList.length) console.log("  kept: " + keptList.map(([n, c]) => `${n}×${c}`).join(", "))
if (!DRY) console.log(`  wrote ${WRAPPER_REL}`)
