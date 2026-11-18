# Deploy and lock down

Goal: the dashboard lives at a `*.workers.dev` URL that **only your email** can open.

It runs on **Cloudflare Workers**: one Worker serves the website, the API routes for real
data (`worker/api/`) and the weekly email, all set up in `wrangler.toml`.

You need a Cloudflare account with the free **Zero Trust** plan set up (it needs a card, but nothing is charged).

## 0. Make it yours first (2 minutes)
Set your name, colors and (optionally) logo in `src/brand.json` so your first live URL
already looks like yours. See `CLAUDE.md` → brand rules.

## 1. Deploy to Cloudflare Workers
Pick a name that's likely to be unique, e.g. `jane-command-center`, and set it at the
top of **`wrangler.toml`**: `name = "jane-command-center"`. It becomes part of your URL.

```bash
npx wrangler login
npm run deploy
```
- `wrangler login` opens your browser and asks for a long list of permissions. That's normal.
- The first time, Cloudflare may ask you to pick a **workers.dev subdomain** for your
  account (e.g. `jane`). Your URL is then `https://<name>.<subdomain>.workers.dev`.
- The deploy prints your URL. **Use the URL it prints** from here on.
- Open the URL to check the dashboard loads. **Right now anyone can open it**, so lock it next.

## 2. Lock it down with Cloudflare Access
In the Cloudflare dashboard (https://dash.cloudflare.com):
1. **Workers & Pages** → your Worker → **Settings** → **Domains & Routes**.
2. On the **workers.dev** row, click **Enable Cloudflare Access**. (If you haven't set up
   Zero Trust yet, Cloudflare asks for a team name, the Free plan and a card now.)
3. Click **Manage Cloudflare Access** and check the policy is **Allow** → Include →
   **Emails** → your email address. Cloudflare usually fills in your account email.
   Change it if you want a different address, then **Save**.

This covers the whole Worker: the dashboard, `/api/*` and anything you add later.
Preview URLs are turned off in `wrangler.toml` (`preview_urls = false`), so there's no
second address to protect.

## 3. Check it
- Open your URL in a **private/incognito window**. You should get a Cloudflare login
  screen asking for your email, not the dashboard. It can take a minute after saving.
- Enter your email, type in the code you're sent, and the dashboard loads.
- On your phone: open the URL, sign in once, then "Add to Home Screen".
- Using the weekly email? Put this URL in `worker/email/email.config.json` → `dashboardUrl`.

## Redeploy after changes
```bash
npm run deploy
```
This builds the site and deploys the website, API routes and weekly email together.
Using API keys (`REAL-DATA.md`)? Add them in the Cloudflare dashboard (most private,
see `REAL-DATA.md` → "Where your keys live"), or run `npm run secrets:push` after
changing `.dev.vars`. Either way they apply straight away, with no redeploy needed.

## Troubleshooting
- **"You need a workers.dev subdomain":** open **Workers & Pages** in the dashboard once
  and pick one, then run `npm run deploy` again.
- **"name already taken" / wrong URL:** change `name` in `wrangler.toml` and redeploy.
- **Dashboard loads without a login:** Access isn't on for workers.dev (step 2.2), or
  you're opening a different hostname from the one it printed.
- **Login works but says you're not allowed:** the policy email doesn't match the one you
  typed (step 2.3).
- **Blank page after deploy:** run `npm run build` locally and fix errors first.

## Moving from Cloudflare Pages
Deployed an earlier version of this project to Pages? The Worker is a new, separate
project with a new `*.workers.dev` URL. Deploy and lock it as above, add your keys to the
Worker, then delete the old Pages project (and the old `…-weekly` email Worker, now part
of this one) under **Workers & Pages** so nothing is left running.
