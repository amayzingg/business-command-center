# Real data

Three working examples you can copy, plus a recipe for adding your own source.
Pick **one** for the workshop; they all feed the same `data` object your widgets read.

> **Built your app from `SPEC.md` on `main`?** The example files are here, but your app
> needs wiring up first. Ask your agent:
> "Wire up the REAL-DATA.md examples: add the `import:bank`, `seed:stripe`,
> `dev:functions`, `email:dev`, `email:deploy` and `secrets:push` scripts and
> `config.pagesProject` to package.json like the `starter` branch; in App.jsx merge every
> extra `src/data/*.json` into `data` by file name and use `useLiveData` from
> `src/liveData.js` (copy it from `starter`); add the `CashFlow` widget from `starter`."
> Or use `starter`, where it's already done.

| Example | Needs | Live? |
|---|---|---|
| A. Bank statement CSV | nothing (a CSV export) | when you re-import |
| B. Stripe (test mode) | only if you already use Stripe | yes, on every page load |
| C. Weekly summary email | free Resend account | every Monday |

## One place for keys
All keys live in **`.dev.vars`** at the project root (git-ignored). Copy
`.dev.vars.example` → `.dev.vars` and fill in what you use. Create it from your editor or
ask your agent to. On Windows, Notepad saves `.dev.vars.txt`, which won't work.

- Locally, the dashboard and the email both read it.
- `npm run secrets:push` uploads it to Cloudflare for the dashboard **and** the email.
  Set your Pages project name first: `package.json` → `"config": { "pagesProject": "…" }`.
- Never put keys in `src/`, and never commit `.dev.vars`.

## A. Bank statement CSV
1. Export a CSV from your bank into `data/` (e.g. `data/my-bank.csv`). It's git-ignored,
   so it stays on your machine.
2. `npm run import:bank -- data/my-bank.csv` writes `src/data/bank.json` (balance, monthly
   in/out, spending by category). If your bank uses different column names, change
   them at the top of `scripts/import-bank.mjs`.
3. The **Cash flow** widget shows it. Rebuild + deploy to update the live site.

Try it first with the fake `data/bank-statement.sample.csv` (`npm run import:bank`).

## B. Stripe (test mode)
Only worth it if your business already uses Stripe. Otherwise use A, or follow
"Add your own source" for the tool you do use.
1. Stripe dashboard → **Test mode** → Developers → API keys → copy the `sk_test_…` key
   into `.dev.vars` as `STRIPE_SECRET_KEY`. Only test keys are accepted.
2. `npm run seed:stripe` creates a few fake customers and invoices (a new account is empty).
3. `npm run dev:functions` → http://localhost:8788. Plain `npm run dev` doesn't run the API.
   The header shows **Live: stripe (test)**, and `data.invoices` now comes from Stripe.
   Build an invoices widget (see `PROMPTS.md`) to see it.
4. `npm run secrets:push`, then build + deploy. `/api/stripe` sits behind your Access login.

How it works: `functions/api/stripe.js` (server-side) → `shared/stripe.js` →
`src/liveData.js` merges the result over the sample data when the page loads.

## C. Weekly summary email
A small separate Cloudflare Worker (`email-worker/`) runs on a schedule and emails you
the key numbers, using the same data as the dashboard.
1. resend.com → API Keys → **Create** (Sending access) → `RESEND_API_KEY` in `.dev.vars`.
   With no domain set up, keep `from` as `onboarding@resend.dev`. It only delivers to the
   email your Resend account uses, so put that address in `to`.
2. Edit `email-worker/email.config.json`: `to`, `subject`, `intro`, which `sections`
   and in what order, `dashboardUrl`. Change the schedule in `email-worker/wrangler.toml`
   (UTC cron, default Mondays 08:00). Change the look in `email-worker/src/render.js`.
3. `npm run email:dev` → open http://localhost:8790/preview. Use `/send` to send yourself one now.
4. `npm run email:deploy`, then `npm run secrets:push`. The Worker has no public URL.

## Add your own source (e.g. Notion tasks)
Any API works the same way. Example: tasks from a Notion database instead of the sample.
1. Notion → Settings → Connections → **Develop or manage integrations** → new internal
   integration → copy the token. Share your tasks database with it (••• → Connections).
2. In `.dev.vars`: `NOTION_TOKEN=…` and `NOTION_TASKS_DB=<database id>`.
3. Ask your agent:
   > Add `functions/api/notion.js` that queries the Notion database `NOTION_TASKS_DB` with
   > `NOTION_TOKEN` and returns `{ tasks: [...], live: { notion: {} } }` in the same shape as
   > `data.tasks` in sample.json (id, title, due, priority, done). Map my properties
   > Name→title, Due→due, Priority→priority, Status=Done→done. Put the fetch logic in
   > `shared/notion.js` and add `/api/notion` to `SOURCES` in `src/liveData.js`.
4. `npm run dev:functions` to test, then `npm run secrets:push` and deploy.
   The tasks widget doesn't change: it still reads `data.tasks`.
5. Want it in the weekly email too? Ask the agent to load `shared/notion.js` in
   `email-worker/src/index.js` the same way Stripe is loaded.

The rule that keeps this simple: **every source returns data in the shape the widgets
already read**, so widgets never know where data came from.
