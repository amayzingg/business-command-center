# Deploy and lock down

Goal: the dashboard lives at a `*.pages.dev` URL that **only your email** can open.

You need a Cloudflare account with the free **Zero Trust** plan set up (it needs a card, but nothing is charged).

## 0. Make it yours first (2 minutes)
Set your name, colors and (optionally) logo in `src/brand.json` so your first live URL
already looks like yours. See `CLAUDE.md` → brand rules.

## 1. Deploy to Cloudflare Pages
Pick a project name that's likely to be unique, e.g. `jane-command-center`. It becomes
your URL. Use it everywhere below in place of `<project>`.

```bash
npm run build
npx wrangler login
npx wrangler pages project create <project> --production-branch main
npx wrangler pages deploy dist --project-name <project> --branch main
```
- `wrangler login` opens your browser and asks for a long list of permissions. That's normal.
- **Keep `--branch main` on every deploy.** Without it, wrangler uses your current git
  branch (e.g. `starter`), and the upload becomes a *preview*. Your main URL then
  shows "not found".
- The deploy prints your URL, e.g. `https://<project>.pages.dev`. If the name was taken,
  Cloudflare adds a suffix, so **use the URL it prints** from here on.
- Open the URL to check the dashboard loads. **Right now anyone can open it**, so lock it next.
- If you use the real-data examples, also set your project name in `package.json` →
  `"config": { "pagesProject": "<project>" }`.

## 2. Lock it down with Cloudflare Access
In the Cloudflare dashboard (https://dash.cloudflare.com):
1. **Workers & Pages** → your project → **Settings** → **General** → **Preview access** →
   **Enable**. (If you haven't set up Zero Trust yet, Cloudflare asks for a team name, the Free plan and a card now.)
2. Still under **Preview access**, click **Manage**. This opens the Access application
   Cloudflare just created ("<project> - Cloudflare Pages").
3. **This step matters:** that application only covers *preview* URLs
   (`*.<project>.pages.dev`). Click **Edit** → **Destinations** → **+ Add public hostname**,
   leave **Subdomain empty**, choose `<project>.pages.dev` as the **Domain**, and leave
   Path empty. Keep the existing `*` row.
4. **Policies** tab: open the policy and check it's **Allow** → Include → **Emails** →
   your email address. Cloudflare usually fills in your account email. Change it if you
   want a different address.
5. **Save.**

## 3. Check it
- Open your URL in a **private/incognito window**. You should get a Cloudflare login
  screen asking for your email, not the dashboard. It can take a minute after saving.
- Enter your email, type in the code you're sent, and the dashboard loads.
- On your phone: open the URL, sign in once, then "Add to Home Screen".

## Redeploy after changes
```bash
npm run build
npx wrangler pages deploy dist --project-name <project> --branch main
```
Using API keys (`REAL-DATA.md`)? Run `npm run secrets:push` after changing `.dev.vars`,
then redeploy.

## Troubleshooting
- **"Not found" / 404 on your main URL:** the deploy went to preview. Redeploy with
  `--branch main`. If the project's production branch isn't `main`, check
  **Settings → Builds & deployments**, or delete and recreate the project with
  `--production-branch main`.
- **Dashboard loads without a login:** the Access app is missing your main hostname
  (step 2.3), or there's a typo in it. Preview access alone does *not* protect it.
- **Login works but says you're not allowed:** the policy email doesn't match the one you
  typed (step 2.4).
- **Blank page after deploy:** run `npm run build` locally and fix errors first.
