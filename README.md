# Business Command Center — workshop

A private dashboard for your business: React + Tailwind on the front,
Cloudflare Pages + Access for hosting so only you can open it, on phone or PC.

## Two starting points
- **`main` (this branch):** no app yet. Your first exercise is to have Claude
  build it from [`SPEC.md`](SPEC.md) using plan mode.
- **`starter` branch:** the app already built to that spec (dashboard shell,
  one example widget, sample data). Use it to skip the first exercise, or to
  catch up if your build goes sideways:
  ```bash
  git switch starter
  ```

## Before the workshop
You'll need these ready (setup steps are sent separately):
- **Node.js 22.12 or newer** (check with `node -v`) and **Git**
- **Claude Code** or **Codex**, installed and signed in
- A **GitHub** account
- A **Cloudflare** account with the free **Zero Trust** plan set up (it needs a card, but
  nothing is charged)

## At the workshop
We'll do this together. The repo link is shared on the day.
1. **Make your own private copy of the repo:**
   1. On the repo page, click **Use this template → Create a new repository**.
   2. Tick **Include all branches**. This is required: without it your copy has no
      `starter` branch, and `git switch starter` fails.
   3. Choose **Private**, give it a name (e.g. `my-command-center`), and create it.
2. Clone **your** new repo and check it works (use your own username and repo name):
   ```bash
   git clone https://github.com/<your-username>/my-command-center.git
   cd my-command-center
   git switch starter
   npm install
   npm run dev
   ```
   Git asks you to sign in to GitHub the first time, because your copy is private.
   Open http://localhost:5173. You should see "Venture Voice" and a revenue card.
   Then `git switch main` to be ready for the first exercise.

**No GitHub account?** You can clone the public template instead:
`git clone https://github.com/amayzingg/business-command-center.git`, then
`cd business-command-center` and the same `git switch starter` / `npm install` / `npm run dev`
steps. It works for the whole workshop, but you won't have your own copy on GitHub to save and back up your changes.

**Windows:** when you create a file like `.dev.vars`, make sure it isn't saved as
`.dev.vars.txt` (in Notepad, choose "Save as type: All files"), or let your AI tool create it.

## What's here
```
SPEC.md              what to build in the first exercise
CLAUDE.md            rules Claude follows in this project
src/data/sample.json fake business data
functions/           Cloudflare Pages Functions, for real data later
PROMPTS.md           starter prompts if you're stuck (Claude Code + Codex)
CHEATSHEET.md        one-page guide: desktop app vs terminal vs Codex
AGENTS.md            points Codex and other agents to CLAUDE.md
DEPLOY.md            deploy + lock-down checklist
REAL-DATA.md         bank CSV, Stripe, weekly email, add your own source
GOOGLE-SHEETS.md     connect a private Google Sheet (service account)
GOOGLE-ANALYTICS.md  connect Google Search Console and GA4
```

## First exercise
Open this folder in your AI tool (Claude Code or Codex), switch to plan mode, and ask:
> Read SPEC.md and CLAUDE.md, then plan how to build the dashboard.

Review the plan, then let it build. You're done when `npm run dev` shows the dashboard.

## Make it yours (before your first deploy)
Try colors with the **Customize** button first if you like (it only saves in your browser),
then make them permanent. Ask your agent:
> Set my brand in src/brand.json: name "Your Business", primary color #…, accent color #….
> (Optional: use my logo at public/logo.svg.) Then build and show me.

Your name, colors and logo then appear on every device and in your first deploy (`DEPLOY.md`).
