# Business Command Center

A private business dashboard built with Vite + React 19 + Tailwind CSS v4. It runs on
Cloudflare Workers (static assets + API routes + a scheduled weekly email, one Worker)
behind Cloudflare Access.

**The app isn't built yet on this branch.** `SPEC.md` describes what to build. Follow it
exactly, especially the widget structure, so the other docs (`DEPLOY.md`, `REAL-DATA.md`,
`PROMPTS.md`) work as written. The `starter` branch has the finished app built from it.

The person you're working with may be setting this up alone from the repo, with no other
guidance, and may not be a developer. Explain in plain language, run commands yourself,
and tell them exactly what to click when a step needs them. If they just want a working
dashboard rather than building one, suggest `git switch starter` and follow its README.
Never ask for API keys in chat or print `.dev.vars`; see `REAL-DATA.md` → "Where your
keys live".

## Commands (once built)
- `npm install` — install dependencies
- `npm run dev` — local dev server (http://localhost:5173)
- `npm run build` — production build into `dist/`; run this to check your work

## Data
- `src/data/sample.json` is fake business data (revenue, leads, tasks, invoices).
  Every widget receives the whole object as its `data` prop.
- `worker/` is the Cloudflare Worker (`wrangler.toml` points at `worker/index.js`): it
  serves the built `dist/`, runs API routes in `worker/api/` (listed in `ROUTES` in
  `worker/index.js`) once real data sources are connected, and sends the weekly email
  (`worker/email/`). Secrets are Cloudflare Worker secrets, never in `src/`.
  Leave `worker/`, `shared/`, `scripts/` and `wrangler.toml` as they are while building
  from the spec; `REAL-DATA.md` explains how to wire them in afterwards.

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
