<!-- BEGIN:footer-rules -->
# Fontselection Component Rules

## What it does
Shows on every page: site tagline, view counter, current date, load time,
and app/Next.js version info.

## Simple rules for agents editing this file

1. **Keep it lightweight.** This component renders on every route.
   Don't add heavy libraries, images, or animations here.

2. **One API call per piece of data.** The view counter should POST once
   and get the updated count back in the same response — never POST then
   GET separately.

3. **Don't block page load.** All data (views, load time, build info)
   must load *after* the page renders — never make the Footer wait on
   a fetch before showing.

4. **Fail silently.** If an API call fails (views, build info), show a
   placeholder like "…" — never crash the page or show an error to the user.

5. **Telugu text stays as-is.** Don't translate or reword the Telugu
   strings unless explicitly asked.

6. **New info goes in the small strip at the bottom**, styled like the
   existing chips (load time, version, commit) — not as a new full-width
   line, to keep the footer compact.
<!-- END:footer-rules -->