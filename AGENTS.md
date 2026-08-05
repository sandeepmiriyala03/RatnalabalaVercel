<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
Before any Next.js work, find and read the relevant doc in
`node_modules/next/dist/docs/`. Your training data is outdated —
the docs are the source of truth.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ratnalabala-project-rules -->
# Ratnalabala — Project-Wide Agent Rules

## Filesystem access in API routes
- NEVER use `path.join(process.cwd(), dynamicVar)` directly — this causes
  Turbopack to trace the entire project (100k+ files) and bloats the
  serverless bundle.
- All poem/content folders live under `content/`. Always scope filesystem
  reads as `path.join(process.cwd(), "content", folder)`.
- If a truly dynamic/unscoped path is unavoidable, wrap it explicitly:
  `path.join(/* turbopackIgnore: true */ process.cwd(), folder)` — and
  note in a comment why it's needed.

## TypeScript config
- This project is on TypeScript 5.9+ (bundled with Next 16.3). Do NOT
  reintroduce `baseUrl` in tsconfig.json — it was removed. Use `paths`
  with `"./"`-relative entries instead.

## API routes
- `/api/pageview`: POST should return the updated count in the same
  response. Never call POST then a separate GET for the same data —
  that's two blocking round-trips per page load.
- Redis client connections must guard against concurrent connect() calls
  (race condition causes "Socket already opened"). Use a shared
  connecting-promise pattern, not just a boolean `ready` flag.

## Client components / layout
- `ClientWrapper` wraps every route (Footer, MusicPlayer, GoToTopButton,
  PwaInstallPrompt, PageLoadTime). Keep anything added here lightweight —
  it ships on every single page.
- `PwaInstallPrompt` is lazy-loaded via `dynamic(..., { ssr: false })`.
  Follow the same pattern for any new component that isn't needed for
  first paint.
- Don't duplicate globally-rendered components (`PageLoadTime`, `Footer`,
  etc.) inside page-level or feature components — they already render
  once via `ClientWrapper`.

## Build/deploy
- Build tool: Turbopack (`next build`). Treat any new
  "Dynamic filesystem access" warning as a build-blocking issue to fix,
  not something to ignore.
- Serwist (PWA) does not support `next dev --turbopack` — this warning on
  dev is expected and safe to ignore; it does not affect production builds.
<!-- END:ratnalabala-project-rules -->

<!-- BEGIN:error-monitoring-rules -->
# Error Monitoring & Logging Rules

## Goal
Catch and log bugs/errors happening on the live (Vercel) site — not just
in local dev — so issues can be found and fixed without waiting for a
user to report them.

## Rules
1. Every API route must catch errors, not crash silently. Wrap route
   logic in try/catch; log with `console.error()` (Vercel captures this
   in function logs) and return a proper JSON error response with a
   status code.
2. Client-side errors need a boundary. Any page/component that can throw
   during render should be coverable by an `error.tsx` (Next.js App
   Router convention) so a crash shows a fallback UI, not a blank page.
3. Log with context, not just the error — include the route/key being
   processed, not just `console.error(error)`.
4. Don't log sensitive data — no API keys, tokens, full request bodies,
   or env variables in logs.
5. Check Vercel's Runtime Logs dashboard before assuming a fix worked.
6. New routes/components must include try/catch + console.error from
   day one, not added later as a patch.
<!-- END:error-monitoring-rules -->

<!-- BEGIN:poetry-collections-rules -->
# శతకముల (Poetry Collections) నియమాలు

## వర్తించే కలెక్షన్‌లు
Jandhyala, Sumati, SriKalahastheeswara, KrishnaSatakam, NarayanaSatakam,
Annamacharya, ShivanandaLahari, RamachandraPrabhu, YajnavalkyaSatakam,
DasarathiKaruNapaYonidhi, TeaShatakam

## నియమాలు
1. అన్ని ఫోల్డర్లు `content/` కింద ఉండాలి — ఇదే పేరుతో
   `POETRY_FOLDERS` (app/api/shatakamu/route.ts) మరియు
   `POETRY_COLLECTIONS` (types/poetry.ts) లో సరిపోలాలి (case-sensitive).
2. ప్రతి `.md` ఫైల్‌కు frontmatter‌లో `title` తప్పనిసరి.
3. తెలుగు టెక్స్ట్ ఉన్నట్టుగానే ఉంచాలి — అనువదించవద్దు.
4. కొత్త శతకం జోడించేటప్పుడు మూడు చోట్లా అప్‌డేట్ చేయాలి:
   `content/` ఫోల్డర్, `POETRY_FOLDERS`, `POETRY_COLLECTIONS`.
<!-- END:poetry-collections-rules -->

<!-- BEGIN:homepage-rules -->
# Homepage (app/page.tsx) Rules

## What it does
The site's root landing page. Renders sections in order:
FeaturedContent → RatnalabalaHighlights → RatnalabalaBackground → MiraIntro.

## Rules
1. Section order is intentional — FeaturedContent sits first so the
   rotating pick is the first thing a visitor sees. Don't reorder without
   explicit instruction; update the inline comment if you do.
2. This file only composes sections — no logic here. No `useState`,
   `useEffect`, or data fetching directly in `page.tsx`.
3. New sections get their own component file under `app/components/`.
4. `"use client"` is required because child sections use client features.
5. Keep the wrapping `<Box>` minimal — no layout logic or conditionals
   on it directly.
6. Comment new additions the same way as the existing FeaturedContent
   comment — explain placement/ordering reasoning.
<!-- END:homepage-rules -->

<!-- BEGIN:poems-page-rules -->
# PoemsPage (app/poems/page.tsx) Rules

## What it does
Lets users pick a poetry collection from a dropdown, shows platform-wide
stats, then renders that collection's poems via `PoemListByKey`.

## Rules
1. `POETRY_COLLECTIONS` is the single source of truth for collection
   metadata (key, label, authors, totalPoems). Don't hardcode these
   values directly in this component.
2. Every `key` in `POETRY_COLLECTIONS` must exactly match a folder name
   under `content/` and an entry in `POETRY_FOLDERS`. Adding a collection
   requires updating all three places (see poetry-collections-rules).
3. `selected` must never be undefined — keep the `.find(...) ?? POETRY_COLLECTIONS[0]`
   fallback pattern for any similar lookups.
4. `displayTotalPoems` has a special case for `"Jandhyala"` (shows
   platform-wide total instead of its own count) — confirm this is
   intentional before changing it.
5. This page doesn't fetch poems directly — delegates to
   `<PoemListByKey apiKey={selected.key} .../>`. Don't duplicate fetch
   logic here.
6. Telugu UI text stays as-is.
7. Preserve the gradient title styling (`linear-gradient` +
   `WebkitBackgroundClip: "text"`) unless asked to change it.
<!-- END:poems-page-rules -->

<!-- BEGIN:footer-rules -->
# Footer Component Rules

## What it does
Shows on every page: site tagline, view counter, current date, load time,
and app/Next.js version info.

## Rules
1. Keep it lightweight — this component renders on every route. No heavy
   libraries, images, or animations.
2. One API call per piece of data — the view counter should POST once
   and get the updated count back in the same response.
3. Don't block page load — all data (views, load time, build info) loads
   *after* the page renders.
4. Fail silently — if an API call fails, show a placeholder like "…",
   never crash the page.
5. Telugu text stays as-is.
6. New info goes in the small strip at the bottom, styled like the
   existing chips — not as a new full-width line.
<!-- END:footer-rules -->

<!-- BEGIN:font-controls-rules -->
# FontControlsTelugu Component Rules

## What it does
Lets users pick a Telugu font and adjust font size, with a reset-to-default
button and a confirmation snackbar. Used wherever readers customize how
Telugu text displays.

## Simple rules for agents editing this file

1. **Don't duplicate global components here.** `PageLoadTime`, `Footer`,
   etc. already render once via `ClientWrapper`. Never re-import or
   re-render them inside this component.

2. **Keep the font list intact.** `TELUGU_FONTS` is a curated, ordered
   list of 50+ fonts with Telugu labels. Don't reorder, rename, or remove
   entries unless explicitly asked — adding new fonts is fine, append them
   under a dated comment block like the existing "🆕 Newly Added" section.

3. **Respect device-based size bounds.** `getDeviceBounds()` gives
   different min/max font sizes for mobile vs desktop. Don't hardcode a
   single min/max — always go through this function.

4. **Font size changes are relative, not absolute.** Increase/decrease
   adjust by `0.2` and clamp with `Math.min`/`Math.max`. Keep this pattern
   for any new size-related controls.

5. **Reset must always restore known-good defaults.** `restoreDefaults()`
   sets font to `"Gurajada"` and size to `1.0` — these are the app's
   canonical defaults. Don't change them without explicit instruction.

6. **Telugu UI text stays as-is.** Don't translate or reword any Telugu
   labels, button text, or snackbar messages unless explicitly asked.

7. **This is a controlled component.** `fontFamily`/`fontSize` come in as
   props with their setters. Never add local state that duplicates or
   shadows them — always call `setFontFamily`/`setFontSize` from the
   parent.
<!-- END:font-controls-rules -->

<!-- BEGIN:featured-content-rules -->
# FeaturedContent Component Rules
(app/components/FeaturedContent.tsx)

## What it does
Shows one random poem on the homepage, rotating automatically every
5 minutes — no button, no user action required. Sits first on the
homepage (see homepage-rules, rule 1).

## Data source
Reuses the existing `/api/shatakamu` endpoint and `POETRY_COLLECTIONS`
from `@/types/poetry`. Never create a separate poem-fetching endpoint
for this component.

## Simple rules for agents editing this file

1. **Rotation is fully automatic — never gate it behind a click or any
   user interaction.** The `setInterval` inside `useEffect` is the only
   trigger. Don't add a "next poem" button unless explicitly asked.

2. **5-minute interval is fixed.** `ROTATION_INTERVAL_MS` controls this —
   don't hardcode a different duration elsewhere or make it user-
   configurable unless asked.

3. **Never repeat the immediately-previous poem.** `lastKeyRef` tracks
   the last shown poem's `collectionKey-title`. Keep this exclusion
   check when modifying the random-pick logic — don't remove it for
   "simplicity."

4. **Always clean up the timer.** The `clearInterval` in the `useEffect`
   cleanup function is required — removing it causes a memory leak and
   multiple overlapping timers if the component remounts.

5. **Fail gracefully, never show a broken/blank section.** If a fetch
   fails mid-rotation, keep showing the last successfully loaded poem.
   Only render `null` if the very first load fails (no poem to fall
   back to yet). Don't throw unhandled errors from this component.

6. **This is per-visitor, independent rotation — not synced across
   users.** Each browser tab runs its own timer; two visitors can see
   different poems at the same moment. If synced/shared rotation is
   ever requested instead, that requires a server-driven time-bucket
   calculation — a different implementation, not a small tweak to this
   file. Flag this distinction if asked to "sync" rotation.

7. **Don't duplicate global components.** `PageLoadTime`, `Footer`, etc.
   already render via `ClientWrapper` — never import them here.

8. **Telugu poem text and UI labels stay as-is** — don't translate or
   reword.

9. **Fade transition on poem change is intentional.** Keep the
   fade-out → swap → fade-in pattern (currently ~250ms) rather than an
   instant content swap, to avoid a jarring flash every 5 minutes.

10. **Font sizing follows the site convention.** Uses the
    `--telugu-font-size` CSS variable (same pattern as
    `FontControlsTelugu`) — don't hardcode font sizes independent of
    that variable.
<!-- END:featured-content-rules -->

<!-- BEGIN:poem-rotation-module-rules -->
# Poem Rotation Module — Agent Rules
(app/api/featured-content/route.ts + app/components/FeaturedContent.tsx)

## ఇది ఏం చేస్తుంది
ప్రతి 5 నిమిషాలకు ఒక రాండమ్ పద్యాన్ని హోంపేజీలో చూపిస్తుంది.

## Data source
- పద్యాలు `content/<FolderName>/*.md` నుండి వస్తాయి.
- ఇప్పటికే ఉన్న `/api/shatakamu` logic ను తిరిగి వాడాలి, కొత్త
  డేటా సోర్స్ సృష్టించవద్దు.

## నియమాలు
1. ఏ శతకం నుండైనా ఎంపిక చేయాలి — ప్రత్యేకంగా చెప్పనంత వరకు ఒకే
   కలెక్షన్‌కి పరిమితం చేయవద్దు.
2. వెంటవెంటనే అదే పద్యం రిపీట్ కాకూడదు — చివరిగా చూపించిన పద్యం ID
   ఎక్స్‌క్లూడ్ చేయాలి.
3. డిఫాల్ట్‌గా client-side (`setInterval`) తో మొదలుపెట్టాలి —
   సైట్‌లో ఇప్పటికే ఉన్న pattern (Footer, PageLoadTime కూడా client-side).
4. `/api/featured-content` తప్పనిసరిగా try/catch వాడాలి, ఎర్రర్ వస్తే
   fallback పద్యం చూపించాలి.
5. టైమర్ క్లీనప్ తప్పనిసరి — `useEffect` లో `setInterval` వాడితే
   `clearInterval` తో cleanup చేయాలి.
6. పద్యం మారుతున్నప్పుడు fade transition వాడాలి, అకస్మాత్తుగా
   content మాయం కాకూడదు.
7. తెలుగు పద్య టెక్స్ట్ ఉన్నట్టుగానే చూపించాలి.

## చేయకూడనివి
- మాన్యువల్‌గా పద్యం ఎంచుకునే admin panel కట్టవద్దు (అడగనంత వరకు).
- ఏ పద్యం ఎప్పుడు చూపారో database లో save చేయవద్దు (అడగనంత వరకు).
- ఇప్పటికే ఉన్న `/api/shatakamu` logic ను duplicate చేయవద్దు.
<!-- END:poem-rotation-module-rules -->