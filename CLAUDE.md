# Business Command Center

A private business dashboard built with Vite + React 19 + Tailwind CSS v4. It runs on
Cloudflare Workers (static assets + API routes + a scheduled weekly email, one Worker)
behind Cloudflare Access.

The person you're working with may be setting this up alone from the repo, with no other
guidance, and may not be a developer. Explain in plain language, run commands yourself,
and tell them exactly what to click when a step needs them.

## Commands
- `npm install` — install dependencies
- `npm run dev` — local dev server (http://localhost:5173), sample + imported data only
- `npm run build` — production build into `dist/`; run this to check your work
- `npm run dev:worker` — the full app through the Worker at http://localhost:8788, with
  the API routes, `.dev.vars` keys and the email preview at `/email/preview`
- `npm run deploy` — build and deploy everything (the Worker named in `wrangler.toml`)
- `npm run secrets:push` — upload the keys in `.dev.vars` to the Worker
- `npm run setup:bank-store` — one-time: storage for the dashboard's "Upload CSV"

## Setting it up for someone
Follow `README.md` → "Step by step", then `DEPLOY.md`, in order. Check each step worked
before the next one.
- They must do these themselves; tell them what to click and wait: approve
  `npx wrangler login` in their browser, pick a workers.dev subdomain if Cloudflare asks,
  enable Cloudflare Access in the dashboard (`DEPLOY.md` step 2), and enter API keys.
- **Never ask for API keys in chat, and never print `.dev.vars`.** For real (live)
  accounts, recommend storing keys only in the Cloudflare dashboard (`REAL-DATA.md` →
  "Where your keys live" → Option 1), so you never see them. For test keys, offer to
  create `.dev.vars` from `.dev.vars.example` and let them paste the values in their editor.
- Before anything with real data goes live, confirm the deployed URL asks for a login in
  a private window (`DEPLOY.md` step 3).
- Don't commit or push unless they ask. Never commit `.dev.vars`, `src/data/bank.json`
  or bank CSVs (all git-ignored).

## How the dashboard works
- `src/App.jsx` is the shell: header + responsive grid. It auto-loads every
  file in `src/widgets/` with `import.meta.glob`. **Don't register widgets in App.jsx.**
- `src/data/sample.json` is fake business data (revenue, leads, tasks, invoices).
  Every widget receives the whole object as its `data` prop.
- `worker/` is the Cloudflare Worker (`wrangler.toml` points at `worker/index.js`). API
  routes live in `worker/api/` and are listed in `ROUTES` in `worker/index.js`;
  `src/liveData.js` fetches them and merges the results over the sample data. The weekly
  email is in `worker/email/`. Secrets are Cloudflare Worker secrets, never in `src/`.
  See `worker/README.md` and `REAL-DATA.md`.

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
- To change the default brand name, colors or logo, edit `src/brand.json`. Logo files go
  in `public/` (e.g. `public/logo.svg` → `"logo": "/logo.svg"`).
- No charting library: draw small charts with divs or inline SVG, like RevenueCard.

## Before you say you're done
- `npm run build` passes with no errors.
- The change shows up in the browser and looks fine in light and dark mode.
- If you changed `worker/`, check it with `npm run dev:worker`.
