---
name: new-widget
description: Build a new dashboard widget from a one-line description, following CLAUDE.md. Use when the user runs $new-widget or asks to add a widget.
---

Build a new widget for this dashboard from the description the user gave (ask for one if they didn't).

1. Re-read `CLAUDE.md` (widget rules) and look at `src/widgets/RevenueCard.jsx` as the pattern.
2. Read `src/data/sample.json` and decide which fields the widget needs. If something is
   missing, add a field to `sample.json` with realistic sample values. Never hard-code data.
3. Create one file, `src/widgets/<PascalCaseName>.jsx` (the name ends in what it is, e.g.
   `CashRunway.jsx`):
   - `export const meta = { title, order, size }`, with `size` sm/md/lg and an `order` that
     doesn't clash with existing widgets (check their `meta.order`).
   - default export `({ data }) => ...` that only reads `data`.
   - Tailwind only, `dark:` variants on every neutral color, brand colors (`bg-brand`,
     `text-brand`, `bg-brand/50`, `bg-brand-accent`) for highlights, green/red only for
     good/bad, and no libraries. Charts use divs or inline SVG.
   - Works at 375px: use `min-w-0` + `truncate` on text that can be long.
   - Dates in the data are "YYYY-MM-DD". Parse them as local dates, and treat `data.asOf`
     as "today".
4. Don't touch `App.jsx` or any other widget.
5. Run `npm run build` and fix any errors.
6. If a dev server is running, check the widget in the browser at desktop width (light) and
   375px (dark).
7. Reply in 2–3 lines: file created, what it shows, any `sample.json` fields added.
