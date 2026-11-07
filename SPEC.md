# Spec: Business Command Center

Build a private, mobile-friendly dashboard for a small business.

## Stack
- Vite + React 19 + Tailwind CSS v4 (via `@tailwindcss/vite`), plain JavaScript (JSX).
- Static site, deployed to Cloudflare Pages (see `DEPLOY.md`).
- No UI or charting libraries.

## Shell
- `index.html` → `src/main.jsx` → `src/App.jsx`, styles in `src/index.css`.
- Header: business name from `data.business.name`, a "Command center" subtitle,
  and "Data as of <date>" from `data.asOf` (show it in the viewer's local date).
- A responsive grid of widget cards: 1 column on phones, 2 on tablets, 4 on desktop.
- Light and dark mode, following the system setting.

## Branding
- `src/brand.json` holds `{ name, primary, accent }` (hex colors). An empty `name`
  falls back to `data.business.name`.
- `src/index.css` maps CSS variables `--brand` and `--brand-accent` to Tailwind colors
  with `@theme inline`, so `bg-brand`, `text-brand`, `bg-brand-accent` etc. work.
  `App.jsx` sets the variables at runtime.
- Header shows a brand-colored badge with the name's first letter, plus a thin
  primary→accent stripe across the top. The browser tab title uses the brand name.
- A "Customize" button in the header opens a small panel: brand name, primary and
  accent color pickers, a few presets, and "Reset to defaults". Its changes are saved
  in `localStorage` and override `brand.json` on that device only.
- The panel lives in `src/components/` (not `src/widgets/`).

## Widgets
- `App.jsx` auto-loads every file in `src/widgets/` with `import.meta.glob`
  (eager), so adding a widget never requires editing `App.jsx`.
- Each widget file default-exports a component `({ data }) => ...` and exports
  `meta = { title, order, size }`. `size` is `sm` (1 col), `md` (2 cols) or
  `lg` (full width). Widgets are sorted by `order`.
- The shell draws each widget's card frame and title; widgets render only their content.
- `data` is the whole of `src/data/sample.json`.

## First widget: RevenueCard
- This month's revenue (last entry in `data.revenue.monthly`) as a large number,
  formatted in `data.business.currency`.
- Change vs last month as a percentage, green ▲ or red ▼.
- A 12-month bar chart drawn with divs, current month highlighted in `bg-brand`.
- `meta = { title: 'Revenue this month', order: 10, size: 'md' }`.

## Done when
- `npm run dev` shows the dashboard with the revenue card.
- `npm run build` passes.
- It looks right at phone width (~375px) and in dark mode.
