# Real data

Your dashboard starts with sample data. This guide swaps in your real numbers. Start
with **one** example. The easiest way: ask your AI assistant, e.g. *"Connect my bank
statement CSV following REAL-DATA.md"*, and it walks you through it.

Most real sources need an **API key**: a password that lets your dashboard read data from
another service. Read "Where your keys live" below first. It keeps those keys away
from your AI assistant.

They all feed the same `data` object your widgets read, so widgets don't care where the
data came from.

| Easiest first | How |
|---|---|
| Upload a spreadsheet (CSV) from the dashboard | "Upload CSV" button, below |
| A Google Sheet you already keep | `GOOGLE-SHEETS.md` |

| Other examples | Needs | Live? |
|---|---|---|
| A. Bank statement CSV | nothing (a CSV export) | when you re-import |
| B. Stripe (test mode) | only if you already use Stripe | yes, on every page load |
| C. Weekly summary email | free Resend account, or your own domain on Cloudflare | every Monday |

Everything server-side runs in **one Cloudflare Worker** (`worker/`, set up in
`wrangler.toml`): the API routes in `worker/api/` and the weekly email in `worker/email/`.
Deploy it with `npm run deploy` (see `DEPLOY.md`).

## Where your keys live
API keys (Stripe, Google, Resend…) are only ever read by the Worker, never by the
browser. There are two places to keep them. You can use either, or both.

### Option 1: only in Cloudflare (most private, best for real accounts)
Type each key straight into the Cloudflare dashboard. It's stored encrypted on
Cloudflare and never touches your computer.
1. https://dash.cloudflare.com → **Workers & Pages** → your Worker (the `name` in
   `wrangler.toml`) → **Settings** → **Variables and Secrets** → **+ Add**.
2. **Type: Secret**, for every value, even ones that aren't passwords (IDs, emails).
   Text values can be read by anyone with access to your Cloudflare account, AI tools
   using it included. **Variable name:** exactly as in `.dev.vars.example`, e.g.
   `STRIPE_SECRET_KEY`. **Value:** paste it **without quotes**:

   | In `.dev.vars` | In the Cloudflare **Value** box |
   |---|---|
   | `GOOGLE_SHEET_ID="1AbC..."` | `1AbC...` |
   | `STRIPE_SECRET_KEY=sk_test_123` | `sk_test_123` |

   In `.dev.vars`, quotes just wrap a value. Cloudflare keeps them as part of it, and the
   key then fails.
   For `GOOGLE_SA_PRIVATE_KEY`, paste the `private_key` value from the JSON file as it
   is (from `-----BEGIN` to the final `\n`), without the quotes around it.
3. Click **Deploy**. The Worker uses it straight away, and later `npm run deploy`s keep it.

Why it's safer:
- **Your AI assistant never sees the key.** Claude Code, Codex and any other tool on your
  computer can read files in this folder, `.dev.vars` included. A key that exists only in
  Cloudflare isn't in any file they can open, chat they can read or command output they
  can see. After you save it, even the Cloudflare dashboard won't show it again.
- **Your business data doesn't go through AI either.** The Worker calls Stripe, Google
  and so on from Cloudflare's servers and sends the results straight to your browser,
  behind your Access login. Your AI assistant writes the code but isn't in that path,
  so it doesn't see your real invoices, balances or analytics. It only would if you
  paste them into chat, ask it to open or read your live dashboard, or run the Worker
  locally with real keys.
- **Only Cloudflare and the service itself** (e.g. Stripe) handle the key and the data.

The trade-off: locally (`npm run dev:worker`) those keys don't exist, so that source
shows sample data on your computer. Test with a **test-mode** key in `.dev.vars`
(Option 2), then put the real key only in Cloudflare.

### Option 2: in `.dev.vars` (convenient for local testing)
Keys go in a file called **`.dev.vars`** in the project folder. It's never uploaded to
GitHub. Files starting with a dot are hidden in Windows Explorer and Mac Finder, so ask your
assistant: *"Create .dev.vars from .dev.vars.example and open it in Notepad (or TextEdit)
for me."* Then **paste the keys in yourself** in that window, save, and close it. Never
paste them into the chat.

- Locally, `npm run dev:worker` reads it (dashboard, API routes and email).
- `npm run secrets:push` uploads every key in it to your Worker as encrypted secrets
  (deploy once first so the Worker exists).
- `secrets:push` **overwrites** a secret with the same name. If a key lives only in
  Cloudflare (Option 1), keep it out of `.dev.vars`.

Either way: never put keys in `src/`, never commit `.dev.vars`, and never paste a key
into chat.

## Upload CSVs from the dashboard (any device)
The easiest way to get real data in: export a spreadsheet as CSV and upload it, from any
device, no keys needed.

**One-time setup:** ask your assistant *"Set up Upload CSV and put it online."* It runs
`npm run setup:bank-store` (which creates private storage in your Cloudflare account,
called a **KV store**, and links it to the Worker in `wrangler.toml`), then `npm run deploy`.

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
   `npm run deploy` (it updates the dashboard and the weekly email).

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
3. `npm run dev:worker` → http://localhost:8788. Plain `npm run dev` doesn't run the API.
   The header shows **Live: stripe (test)**, and `data.invoices` now comes from Stripe.
   Build an invoices widget (see `PROMPTS.md`) to see it.
4. `npm run deploy`, then add the key to the Worker (`npm run secrets:push`, or type it
   in the Cloudflare dashboard: "Where your keys live"). `/api/stripe` sits behind your
   Access login.

How it works: `worker/api/stripe.js` (server-side) → `shared/stripe.js` →
`src/liveData.js` merges the result over the sample data when the page loads.

### Switch to live Stripe data (advanced: real money data)
> **Status: untested with a live Stripe account.** Try the same restricted key in a sandbox
> first if you can.

By default `shared/stripe.js` accepts only test keys. To show real invoices:
1. In Stripe's **live mode**: **Developers → API keys → Create restricted key**. Set
   **Invoices** to **Read** and leave everything else as **None**. Copy the `rk_live_…` key.
   If Stripe returns a permissions error, its message names what to add.
2. Paste this into Claude Code or Codex:
   > Allow live Stripe data. In shared/stripe.js, accept test keys and restricted live keys
   > (rk_live_), but keep rejecting full live secret keys (sk_live_). Set live.stripe.mode from
   > the key, and update every label that says "test," including the weekly email. Then build
   > and show me.
3. **These are real invoices.** Before deploying, open your URL in an incognito window and
   confirm it asks for a login. Then `npm run deploy`.
4. Put the live key **only in Cloudflare** ("Where your keys live" → Option 1), as
   `STRIPE_SECRET_KEY`. Keep the test key in `.dev.vars` for local testing, and don't run
   `npm run secrets:push` afterwards, or it replaces the live key with the test one.
   Never paste the key into chat.

Don't run `npm run seed:stripe` against a live account: it's for creating fake test data
(the script refuses anything but a test key, so keep it that way).

## C. Weekly summary email
The same Worker that runs the dashboard also runs on a schedule and emails you the key
numbers, using the same data as the dashboard. It sends with **Cloudflare Email** if you
turned that on (below), otherwise with **Resend**.

1. Pick how it sends:
   - **No domain of your own (simplest):** resend.com → API Keys → **Create** (Sending
     access) → `RESEND_API_KEY` (in `.dev.vars` or the Cloudflare dashboard). Keep `from`
     as `onboarding@resend.dev`. It only delivers to the email your Resend account uses,
     so put that address in `to`.
   - **Your domain is on Cloudflare:** see "Send with Cloudflare Email" below. No extra
     account or API key.
2. Edit `worker/email/email.config.json`: `to`, `subject`, `intro`, which `sections`
   and in what order, and `dashboardUrl` (your workers.dev URL). It's sent Mondays at
   08:00 UTC (London time in winter). To change it, ask *"Send the weekly email on
   Fridays at 5pm my time"* (it's the `[triggers]` line in `wrangler.toml`). Change the look in
   `worker/email/render.js`.
3. `npm run dev:worker` → open http://localhost:8788/email/preview. Open
   http://localhost:8788/email/send to send yourself one now. These two addresses only
   work locally. The deployed Worker answers them with "Not found".
4. `npm run deploy`. The schedule starts with the next deploy.

### Send with Cloudflare Email (advanced: needs your own domain)
> **Status: tested locally only.** Cloudflare Email Service is in beta, so follow what
> the dashboard shows if its screens differ.

Sends straight from your Worker, with no Resend account. You need a domain that uses
Cloudflare DNS (added to your Cloudflare account).
1. https://dash.cloudflare.com → your domain → **Email** → **Email Sending** (part of
   Email Service) → onboard the domain, or a subdomain such as `updates.yourdomain.com`.
   Let Cloudflare add the DNS records it suggests (SPF, DKIM, DMARC).
2. Sending to **your own verified address** is free: turn on **Email Routing** for the
   domain, add your inbox under **Destination addresses**, and click the link Cloudflare
   emails you. Sending to anyone
   else needs the **Workers Paid** plan.
3. In `wrangler.toml`, remove the `#` from the two `[[send_email]]` lines.
4. In `worker/email/email.config.json`, set `from` to an address on that domain, e.g.
   `"Command center <dashboard@updates.yourdomain.com>"`, and `to` to your verified address.
5. `npm run dev:worker` → http://localhost:8788/email/send. Locally nothing is really sent:
   the terminal prints where it saved the email. Then `npm run deploy`.

Once the binding is on, the Worker uses it and ignores `RESEND_API_KEY`.

### Send from your own domain with Resend (advanced)
> **Status: untested as written.** Follow what Resend shows if its screens differ.

Lets Resend send to any address, not only your Resend login.
1. **Resend → Domains → Add domain.** Use a subdomain such as `updates.yourdomain.com`,
   which keeps this email's reputation separate from your main domain.
2. Add the DNS records Resend shows at your DNS provider. On Cloudflare: your domain →
   **DNS → Records**. Copy each value exactly, and set any CNAME records to **DNS only**
   (not proxied).
3. Recommended: add a DMARC **TXT** record named `_dmarc` with `v=DMARC1; p=none;`.
4. Click **Verify**. It's often done within 15 minutes, but DNS changes can take up to 72 hours.
5. In `worker/email/email.config.json`, set `from` to an address on that domain, such as
   `"Control Center <dashboard@updates.yourdomain.com>"`, and `to` to any address.
6. Create a new Resend API key limited to that domain, and replace `RESEND_API_KEY`
   wherever you keep it (`.dev.vars` + `npm run secrets:push`, or the Cloudflare dashboard).

## Add your own source (e.g. Notion tasks)
Any API works the same way. Example: tasks from a Notion database instead of the sample.
1. Notion → Settings → Connections → **Develop or manage integrations** → new internal
   integration → copy the token. Share your tasks database with it (••• → Connections).
2. In `.dev.vars`: `NOTION_TOKEN=…` and `NOTION_TASKS_DB=<database id>`.
3. Ask your agent:
   > Add `worker/api/notion.js` (default-export `async (request, env) => Response`, like
   > `worker/api/stripe.js`) that queries the Notion database `NOTION_TASKS_DB` with
   > `NOTION_TOKEN` and returns `{ tasks: [...], live: { notion: {} } }` in the same shape as
   > `data.tasks` in sample.json (id, title, due, priority, done). Map my properties
   > Name→title, Due→due, Priority→priority, Status=Done→done. Put the fetch logic in
   > `shared/notion.js`, add the route to `ROUTES` in `worker/index.js`, and add
   > `/api/notion` to `SOURCES` in `src/liveData.js`.
4. `npm run dev:worker` to test, then `npm run deploy` and add the keys to the Worker
   ("Where your keys live"). The tasks widget doesn't change: it still reads `data.tasks`.
5. Want it in the weekly email too? Ask the agent to load `shared/notion.js` in
   `worker/email/index.js` the same way Stripe is loaded.

The rule that keeps this simple: **every source returns data in the shape the widgets
already read**, so widgets never know where data came from.

## Built your app from `SPEC.md` on `main`?
> The example files are here (`worker/`,
> `shared/`, `scripts/`, `wrangler.toml`), but your app needs wiring up first. Ask your agent:
> "Wire up the REAL-DATA.md examples like the `starter` branch: check package.json has the
> scripts listed in SPEC.md; in App.jsx merge every extra `src/data/*.json` into
> `data` by file name, preferring `<name>.json` over `<name>.sample.json`; copy
> `src/liveData.js` from `starter` and use its `{ data, refresh, refreshing }` with the
> header's live-source chips and Refresh button; add the `CashFlow` widget and
> `src/components/DataUpload.jsx` (in the header) from `starter`."
> To see exactly what `starter` has, run `git diff main starter -- package.json src/`.
> Or switch to `starter`, where it's already done.
