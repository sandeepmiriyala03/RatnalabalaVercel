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