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

## How safe is this?
**What Access does:** Cloudflare checks every request before it reaches your Worker.
Anyone without a valid login gets the Cloudflare sign-in page instead: not the dashboard,
not `/api/*`, not your uploads. Knowing or guessing the URL doesn't help, because
there's nothing behind the login screen to load until you've signed in.

**How you sign in:** Cloudflare emails a one-time code to the address in the policy. Only
someone who can read that inbox can get in, so **your dashboard is as safe as that email
account**. Turn on two-step verification for it.

**Your keys and data:**
- API keys are encrypted Worker secrets. The browser never gets them; only the Worker
  uses them. See `REAL-DATA.md` → "Where your keys live" for keeping them off your
  computer (and away from AI tools) entirely.
- Uploaded CSVs are stored as parsed rows in a private KV store in your Cloudflare
  account. The raw file isn't kept.
- The weekly email runs inside Cloudflare on its schedule, not through the website, so
  Access doesn't apply to it and it doesn't need to. It only goes to the addresses in
  `worker/email/email.config.json`.
- Cloudflare hosts all of it, so it runs on Cloudflare's servers, the same as any site
  they host.

**Limits to know:**
- **Access protects only the address you turned it on for** (your `workers.dev` URL). If
  you later add a custom domain, or turn `preview_urls` back on in `wrangler.toml`, protect
  those in Access too before putting real data behind them.
- **If you ever turn Access off, the site is public at once**, real data included. The
  Worker doesn't do its own login check.
- Sign-ins last a while, so you don't type a code every visit. To change how long, go to
  **Manage Cloudflare Access** (step 2) → your application → session duration. To see
  who signed in, go to Zero Trust → **Logs → Access**.
- Anyone you add to the policy sees everything on the dashboard. There are no per-person
  views.

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
- **Don't like your subdomain** (the part before `.workers.dev`)? **Workers & Pages** →
  **Change** next to **Your subdomain** (in the panel on the right). It renames the URL of
  every Worker on your account, and the old URL stops working. Run `npm run deploy` to
  print the new one.
- **"error code: 1042" or the page won't load right after a first deploy or a subdomain
  change:** Cloudflare is still setting it up. Wait a minute or two and reload.
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
