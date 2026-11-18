# Put it online and lock it to your email

**Goal:** your dashboard gets its own web address (like
`https://jane-dashboard.jane.workers.dev`) that **only your email can open**. About 15
minutes, most of it clicking through Cloudflare's website.

**Easiest:** ask your AI assistant *"Put my dashboard online following DEPLOY.md."* It runs
the commands and tells you when to click. The steps below say what happens, so you know
what to expect.

> **For the curious:** it runs on **Cloudflare Workers**. One Worker serves the website,
> the API routes for real data (`worker/api/`) and the weekly email, all set up in
> `wrangler.toml`.

## Before you start
- **A Cloudflare account:** sign up at https://dash.cloudflare.com/sign-up and click the
  link in the confirmation email.
- **Your name and colors set** (README → "Make it yours"), so your first online version
  already looks like yours. You can change them any time.

## 1. Put it online
**Choose a name** for your dashboard: lowercase letters, numbers and hyphens, e.g.
`jane-dashboard`. It becomes the start of your web address. Ask your assistant to set it
(it goes on the `name = "..."` line at the top of **`wrangler.toml`**).

Your assistant then runs:
```bash
npx wrangler login
```
- **Wrangler** is Cloudflare's tool for this. Your browser opens a Cloudflare page asking
  to allow access, with a long list of permissions. That's normal: click **Allow**. The
  page then says you can close it. (No browser opened? Copy the link the terminal
  printed into your browser.)

```bash
npm run deploy
```
- It takes about a minute and ends by printing your address, e.g.
  `https://jane-dashboard.<something>.workers.dev`. **That's your dashboard's address:
  save it.**
- The `<something>` part is your account's **subdomain**. Cloudflare picks one for you,
  and you can change it later (Troubleshooting below).
- Open the address. You should see your dashboard with **sample data**.

**Right now anyone with the address could open it.** It only has sample data, so nothing
real is exposed, but lock it now (step 2) before adding anything real.

## 2. Lock it with Cloudflare Access (only you can do this part)
Cloudflare Access is the login screen: it emails a one-time code to the addresses you
allow. In your browser:

1. Go to https://dash.cloudflare.com → **Workers & Pages** in the left menu → click your
   dashboard's name → the **Settings** tab → **Domains & Routes**.
2. On the **workers.dev** row, click **Enable Cloudflare Access**.
   - **First time only:** Cloudflare asks you to set up **Zero Trust** (the service behind
     the login screen):
     - **Team name:** anything, e.g. your business name. It's part of the login page's
       address, and visitors rarely notice it.
     - **Plan:** choose **Free** ($0, up to 50 people).
     - **Card:** Cloudflare asks for one to confirm who you are. **On the Free plan you
       won't be charged.**
     - Then come back to this page and click **Enable Cloudflare Access** again if needed.
3. Click **Manage Cloudflare Access**. Check the rule (Cloudflare calls it a **policy**)
   says **Allow → Include → Emails → your email address**. In plain words: "only these
   emails can get in." Cloudflare usually fills in your account email. To let someone
   else in too, add their email. Click **Save**.

Screens look different? Take a screenshot, paste it into your assistant's chat and ask
what to click.

This covers the whole Worker: the dashboard, `/api/*` and anything you add later.
Preview URLs are turned off in `wrangler.toml` (`preview_urls = false`), so there's no
second address to protect.

## 3. Check it works
1. Open a **private window** (Chrome or Edge: **Ctrl+Shift+N**, or **Cmd+Shift+N** on Mac;
   Safari or Firefox: **Cmd/Ctrl+Shift+P**) and go to your address. You should see a
   **Cloudflare sign-in page asking for your email**, not the dashboard. Give it a minute
   after saving step 2, then reload.
2. Enter your email. A code arrives from Cloudflare (**check spam** if you don't see it).
   Type it in and your dashboard loads.
3. **On your phone:** open the address, sign in once, then use **Share → Add to Home
   Screen** (iPhone) or **⋮ → Add to Home screen** (Android) to get an app icon.
4. Using the weekly email? Ask your assistant to put this address in the email settings
   (`worker/email/email.config.json` → `dashboardUrl`).

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

## Putting changes online later
Ask your assistant *"Put my changes online,"* or run:
```bash
npm run deploy
```
This updates the website, API routes and weekly email together. You don't need to log in
or set up Access again.
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
