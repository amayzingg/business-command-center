# Business Command Center

A private business dashboard built with Vite + React 19 + Tailwind CSS v4,
deployed as a static site to Cloudflare Pages behind Cloudflare Access.

## Commands
- `npm install` — install dependencies
- `npm run dev` — local dev server (http://localhost:5173)
- `npm run build` — production build into `dist/`; run this to check your work

## How the dashboard works
- `src/App.jsx` is the shell: header + responsive grid. It auto-loads every
  file in `src/widgets/` with `import.meta.glob`. **Don't register widgets in App.jsx.**
- `src/data/sample.json` is fake business data (revenue, leads, tasks, invoices).
  Every widget receives the whole object as its `data` prop.
- `functions/` is for Cloudflare Pages Functions (serverless API routes) once
  real data sources are connected. Secrets go in Cloudflare env vars, never in `src/`.

## Rules for widgets
- **One widget = one file** in `src/widgets/`, PascalCase name ending in what it is
  (`LeadsPipeline.jsx`, `TasksDue.jsx`).
- Each file default-exports a component `({ data }) => ...` and exports
  `meta = { title, order, size }`, where `size` is `sm` | `md` | `lg`.
  Follow `src/widgets/RevenueCard.jsx` as the reference.
- Widgets only read from `data`. They don't fetch, and don't change shared files.
  If a widget needs new data, add a field to `sample.json`, not a hard-coded value.
- Style with Tailwind utility classes only; no new CSS files or UI libraries.
  Always include `dark:` variants. Must look right at phone width (~375px).
- For highlight colors use the brand colors (`bg-brand`, `text-brand`, `bg-brand-accent`,
  `text-brand-accent`, with opacity like `bg-brand/25`), not fixed ones like
  `indigo-500`, so widgets follow the user's branding. Keep green/red for good/bad.
- To change the default brand name or colors, edit `src/brand.json`.
- No charting library: draw small charts with divs or inline SVG, like RevenueCard.

## Before you say you're done
- `npm run build` passes with no errors.
- The new widget shows up in the browser and looks fine in light and dark mode.
