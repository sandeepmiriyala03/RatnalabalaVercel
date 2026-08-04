<!-- BEGIN:homepage-rules -->
# Homepage (app/page.tsx) Rules

## What it does
The site's root landing page. Renders four sections in order:
FeaturedContent → RatnalabalaHighlights → RatnalabalaBackground → MiraIntro.

## Simple rules for agents editing this file

1. **Section order is intentional.** `FeaturedContent` sits first so the
   rotating pick is the first thing a visitor sees. Don't reorder these
   sections without an explicit instruction — if you do move one, update
   the inline comment explaining why.

2. **This file only composes sections — no logic here.** Don't add
   `useState`, `useEffect`, data fetching, or business logic directly in
   `page.tsx`. Each section owns its own logic inside its component file
   (`FeaturedContent.tsx`, `RatnalabalaHighlights.tsx`, etc.).

3. **New sections get their own component file.** If asked to add a new
   homepage section, create it under `app/components/`, import it here,
   and place it in the `<Box>` — don't inline JSX for a new section
   directly in `page.tsx`.

4. **`"use client"` is required here** because child sections use client
   features (state, effects, MUI interactivity). Don't try to convert
   this to a server component without first checking whether all four
   child components can also become server components.

5. **Keep the wrapping `<Box>` minimal.** No layout logic, styling, or
   conditionals on the `<Box>` itself — it's just a container. Section-
   specific spacing/styling belongs inside each section's own component.

6. **Comment new additions like the existing `FeaturedContent` comment**
   — briefly explain placement/ordering reasoning so future edits
   (by agents or humans) understand *why* it's positioned there, not
   just *that* it's there.
<!-- END:homepage-rules -->