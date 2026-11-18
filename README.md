# Business Command Center

A private dashboard for your business that only you can open, on your phone or computer.
It's built with React + Tailwind and runs on **Cloudflare Workers**, with **Cloudflare
Access** for the login. You build and change it by asking an AI coding agent (Claude Code
or OpenAI Codex) in plain English.

## Two starting points
- **`starter` branch (recommended):** the app is already built (dashboard shell, two
  example widgets, sample data, working examples for real data). Its README walks you
  through setup step by step.
- **`main` (this branch):** no app yet, only [`SPEC.md`](SPEC.md). Pick this if you want to
  watch your agent build the dashboard from the spec first.

## What you need
- **Node.js 22.12 or newer** (check with `node -v`) and **Git**
- **Claude Code** or **Codex**, installed and signed in
- A **Cloudflare** account (free), with the free **Zero Trust** plan for the login screen.
  Zero Trust asks for a card, but the Free plan charges nothing.
- Optional: a **GitHub** account, to keep your own private copy

## The fastest way: let your agent set it up
Get a copy (step 1 below), open the folder in Claude Code or Codex, and paste:

> Set this project up for me. Switch to the `starter` branch, then follow its README.md
> and DEPLOY.md one step at a time. Run the commands yourself, and stop to tell me exactly
> what to click whenever a step needs me (signing in, the Cloudflare dashboard, or keys).
> Never ask me to paste an API key into chat.

## Step by step

### 1. Get your own copy
**With GitHub (recommended, so your changes are backed up):**
1. On this repo's GitHub page, click **Use this template → Create a new repository**.
2. Tick **Include all branches**. Without it your copy has no `starter` branch.
3. Choose **Private**, give it a name (e.g. `my-command-center`), and create it.
4. Clone it (use your own username and repo name):
   ```bash
   git clone https://github.com/<your-username>/my-command-center.git
   ```
   Git asks you to sign in to GitHub the first time, because your copy is private.

**Without GitHub:** clone the public template. Everything works the same, but your changes
stay only on your computer.
```bash
git clone https://github.com/amayzingg/business-command-center.git
```

### 2a. Use the ready-made app (recommended)
From the folder you just cloned:
```bash
git switch starter
```
Then continue with the README on that branch (it changes when you switch).

### 2b. Or build it from the spec
Stay on `main`. Open the folder in Claude Code or Codex, switch to **plan mode**, and ask:
> Read SPEC.md and CLAUDE.md, then plan how to build the dashboard.

Review the plan, then let it build. You're done when `npm run dev` shows the dashboard
at http://localhost:5173. Then:
- **Make it yours:** ask "Set my brand in src/brand.json: name "Your Business", primary
  color #…, accent color #…. Then build and show me."
- **Put it online:** follow [`DEPLOY.md`](DEPLOY.md).
- **Real data:** [`REAL-DATA.md`](REAL-DATA.md) starts with a prompt that wires the examples
  into your build.

If your build goes sideways, `git switch starter` gets you the known-good app (commit
your work first).

**Windows:** if you create a file like `.dev.vars` yourself, make sure it isn't saved as
`.dev.vars.txt` (in Notepad, choose "Save as type: All files"), or ask your agent to create it.

## What's here
```
SPEC.md              what to build (the starter branch is built from it)
CLAUDE.md            rules every AI agent follows in this project (read it first)
AGENTS.md            points Codex and other agents to CLAUDE.md
src/data/sample.json fake business data
worker/              the Cloudflare Worker: API routes for real data, weekly email
wrangler.toml        Cloudflare settings: Worker name, schedule, storage
scripts/             helpers the starter's npm scripts run (deploy, secrets, bank import…)
DEPLOY.md            deploy + lock-down checklist
REAL-DATA.md         bank CSV, Stripe, weekly email, your own sources, where keys live
GOOGLE-SHEETS.md     connect a private Google Sheet (service account)
GOOGLE-ANALYTICS.md  connect Google Search Console and GA4
PROMPTS.md           prompts to copy (Claude Code + Codex)
CHEATSHEET.md        one page: commands, and Claude Code vs Codex
```
