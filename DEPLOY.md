# Deploy and lock down

Goal: the dashboard lives at a `*.pages.dev` URL that **only your email** can open.

## 1. Deploy to Cloudflare Pages
```bash
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name business-command-center
```
- The first run asks to create the project; say yes and pick `main` as the production branch.
- You'll get a URL like `https://business-command-center.pages.dev`. Open it to check.
- To redeploy later, run the build and deploy commands again.

## 2. Lock it down with Cloudflare Access
In the Cloudflare dashboard:
1. **Workers & Pages** → your project → **Settings** → **General** →
   **Access policy** → **Enable**. This protects preview URLs.
2. Go to **Zero Trust** → **Access** → **Applications** → **Add an application** →
   **Self-hosted**. (First time in Zero Trust: pick a team name and the Free plan.)
3. Application domain: `business-command-center.pages.dev` (your production URL).
4. Add a policy: Action **Allow**, Include → **Emails** → your email address.
5. Save.

## 3. Check it
- Open the URL in a private/incognito window. You should get a Cloudflare login
  screen asking for your email, not the dashboard.
- Enter your email, type in the code you're sent, and the dashboard loads.
- On your phone: open the URL, sign in once, then "Add to Home Screen".

## Troubleshooting
- **Dashboard loads without a login:** the Access application domain doesn't
  match the URL exactly. Check for typos and that you saved the policy.
- **Blank page after deploy:** run `npm run build` locally and fix errors first.
