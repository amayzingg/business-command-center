# Real data

Three working examples you can copy, plus a recipe for adding your own source.
Pick **one** for the workshop; they all feed the same `data` object your widgets read.

> **Built your app from `SPEC.md` on `main`?** The example files are here, but your app
> needs wiring up first. Ask your agent:
> "Wire up the REAL-DATA.md examples like the `starter` branch: add the `import:bank`,
> `seed:stripe`, `dev:functions`, `email:dev`, `email:deploy`, `deploy` and `secrets:push`
> scripts and `config.pagesProject` to package.json; in App.jsx merge every extra
> `src/data/*.json` into `data` by file name, preferring `<name>.json` over
> `<name>.sample.json`; copy `src/liveData.js` from `starter` and use its
> `{ data, refresh, refreshing }` with the header's live-source chips and Refresh button;
> add the `CashFlow` widget and `src/components/DataUpload.jsx` (in the header) from `starter`."
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

## Upload CSVs from the dashboard (any device)
One-time setup: `npm run setup:bank-store` (creates a private Cloudflare KV store and links it
to the dashboard and the email), then `npm run deploy && npm run email:deploy`.

Then click **Upload CSV** in the header and pick a bank statement, tasks, leads or invoices
CSV. It works out the type from the column names (common variations like "Task", "Due
Date" or "Company" are fine; dates as 2026-11-14 or 14/11/2026). It shows **"Looks like
Tasks · 7 rows"** for you to confirm or change, then saves. If it can't tell, it says so and
won't save until you pick a type that fits. Uploads replace that table on the dashboard and
in the weekly email (live Stripe still wins for invoices). Remove one with the × on its
chip. Only the parsed rows (for bank statements, the summary) are stored, behind your
Access login. Example files: `data/templates/`. Add a new table type in
`shared/datasets.js`.

## A. Bank statement CSV
Easiest: **`/update-bank data/my-bank.csv`** (Claude Code) or **`$update-bank`** (Codex)
does all of this for you. By hand:
1. Export a CSV from your bank into `data/` (e.g. `data/my-bank.csv`). It's git-ignored,
   so it stays on your machine.
2. `npm run import:bank -- data/my-bank.csv` writes `src/data/bank.json` (balance, monthly
   in/out, spending by category). If your bank uses different column names, change
   them at the top of `scripts/import-bank.mjs`.
3. The **Cash flow** widget shows it, with "Imported <date> from <file>". Then
   `npm run deploy` (and `npm run email:deploy` if you use the weekly email).

`src/data/bank.json` holds your real transactions, so it's **git-ignored**. Until you
import, the dashboard and email use the fictional `src/data/bank.sample.json` and say
**Sample bank data**. Try the flow with the fake `data/bank-statement.sample.csv`
(`npm run import:bank`).

**Live sources and "today":** when any live source (Stripe, a Sheet…) loads, the
dashboard treats *now* as today for due/overdue maths, shows each source's fetch time,
and refetches when you return to the tab, every 5 minutes while it's open, and on
**Refresh**. Imported files (bank CSV) and `sample.json` stay as they are until you
re-import or edit them.

**Google Sheet:** see `GOOGLE-SHEETS.md` to read a private sheet with a service account
(Google Workspace users: it covers what to do if key creation is blocked).

**Google Search Console and GA4:** see `GOOGLE-ANALYTICS.md` (reuses the same service account).

## B. Stripe (test mode)
Only worth it if your business already uses Stripe. Otherwise use A, or follow
"Add your own source" for the tool you do use.
1. Stripe dashboard → **Test mode** → Developers → API keys → copy the `sk_test_…` key
   into `.dev.vars` as `STRIPE_SECRET_KEY`. Only test keys are accepted until you follow "Switch to live Stripe data" below.
2. `npm run seed:stripe` creates a few fake customers and invoices (a new account is empty).
3. `npm run dev:functions` → http://localhost:8788. Plain `npm run dev` doesn't run the API.
   The header shows **Live: stripe (test)**, and `data.invoices` now comes from Stripe.
   Build an invoices widget (see `PROMPTS.md`) to see it.
4. `npm run secrets:push`, then build + deploy. `/api/stripe` sits behind your Access login.

How it works: `functions/api/stripe.js` (server-side) → `shared/stripe.js` →
`src/liveData.js` merges the result over the sample data when the page loads.

### Switch to live Stripe data
> **Status: untested with a live Stripe account.** Try the same restricted key in a sandbox
> first if you can.

By default `shared/stripe.js` accepts only test keys. To show real invoices:
1. In Stripe's **live mode**: **Developers → API keys → Create restricted key**. Set
   **Invoices** to **Read** and leave everything else as **None**. Copy the `rk_live_…` key.
   If Stripe returns a permissions error, its message names what to add.
2. Replace `STRIPE_SECRET_KEY` in `.dev.vars` with it. Never paste the key into chat.
3. Paste this into Claude Code or Codex:
   > Allow live Stripe data. In shared/stripe.js, accept test keys and restricted live keys
   > (rk_live_), but keep rejecting full live secret keys (sk_live_). Set live.stripe.mode from
   > the key, and update every label that says "test," including the weekly email. Then build
   > and show me.
4. **These are real invoices.** Before deploying, open your URL in an incognito window and
   confirm it asks for a login. Then `npm run secrets:push` and `npm run deploy`.

Don't run `npm run seed:stripe` against a live account: it's for creating fake test data
(the script refuses anything but a test key, so keep it that way).

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

### Send from your own domain
> **Status: untested as written.** Follow what Resend shows if its screens differ.

Lets you send to any address, not only your Resend login.
1. **Resend → Domains → Add domain.** Use a subdomain such as `updates.yourdomain.com`,
   which keeps this email's reputation separate from your main domain.
2. Add the DNS records Resend shows at your DNS provider. On Cloudflare: your domain →
   **DNS → Records**. Copy each value exactly, and set any CNAME records to **DNS only**
   (not proxied).
3. Recommended: add a DMARC **TXT** record named `_dmarc` with `v=DMARC1; p=none;`.
4. Click **Verify**. It's often done within 15 minutes, but DNS changes can take up to 72 hours.
5. In `email-worker/email.config.json`, set `from` to an address on that domain, such as
   `"Control Center <dashboard@updates.yourdomain.com>"`, and `to` to any address.
6. Create a new Resend API key limited to that domain, update `RESEND_API_KEY` in `.dev.vars`,
   then run `npm run secrets:push`.

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
