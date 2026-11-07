# Business Command Center

A private business dashboard built with Vite + React 19 + Tailwind CSS v4,
deployed as a static site to Cloudflare Pages behind Cloudflare Access.

**The app isn't built yet.** `SPEC.md` describes what to build. Follow it exactly,
especially the widget structure, so later workshop steps work the same for everyone.

## Commands (once built)
- `npm install` — install dependencies
- `npm run dev` — local dev server (http://localhost:5173)
- `npm run build` — production build into `dist/`; run this to check your work

## Data
- `src/data/sample.json` is fake business data (revenue, leads, tasks, invoices).
  Every widget receives the whole object as its `data` prop.
- `functions/` is for Cloudflare Pages Functions (serverless API routes) once
  real data sources are connected. Secrets go in Cloudflare env vars, never in `src/`.

## Rules for widgets
- **One widget = one file** in `src/widgets/`, PascalCase name ending in what it is
  (`LeadsPipeline.jsx`, `TasksDue.jsx`). Never register widgets in `App.jsx`.
- Each file default-exports a component `({ data }) => ...` and exports
  `meta = { title, order, size }`, where `size` is `sm` | `md` | `lg`.
- Widgets only read from `data`. They don't fetch, and don't change shared files.
  If a widget needs new data, add a field to `sample.json`, not a hard-coded value.
- Style with Tailwind utility classes only; no new CSS files or UI libraries.
  Always include `dark:` variants. Must look right at phone width (~375px).
- For highlight colors use the brand colors (`bg-brand`, `text-brand`, `bg-brand-accent`,
  `text-brand-accent`), not fixed ones like `indigo-500`, so widgets follow the user's
  branding. Keep green/red for good/bad (e.g. ▲/▼).
- To change the default brand name, colors or logo, edit `src/brand.json`. Logo files go
  in `public/` (e.g. `public/logo.svg` → `"logo": "/logo.svg"`).
- No charting library: draw small charts with divs or inline SVG.

## Before you say you're done
- `npm run build` passes with no errors.
- The change shows up in the browser and looks fine in light and dark mode.
