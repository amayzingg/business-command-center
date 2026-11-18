# Business Command Center

A private dashboard for your business that only you can open, on your phone or computer.
It's built with React + Tailwind and runs on **Cloudflare Workers**, with **Cloudflare
Access** for the login. You build and change it by asking an AI coding agent (Claude Code
or OpenAI Codex) in plain English.

You're on the **`starter` branch**: the app is already built to [`SPEC.md`](SPEC.md)
(dashboard shell, two example widgets, sample data, and working examples for real data).
To build the shell from scratch yourself instead, switch to `main`.

## What you need
- **Node.js 22.12 or newer** (check with `node -v`) and **Git**
- **Claude Code** or **Codex**, installed and signed in
- A **Cloudflare** account (free), with the free **Zero Trust** plan for the login screen.
  Zero Trust asks for a card, but the Free plan charges nothing.
- Optional: a **GitHub** account, to keep your own private copy

## The fastest way: let your agent set it up
Open this folder in Claude Code or Codex and paste:

> Set this project up for me following README.md and DEPLOY.md. Go one step at a time,
> run the commands yourself, and stop to tell me exactly what to click whenever a step
> needs me (signing in, the Cloudflare dashboard, or keys). Never ask me to paste an API
> key into chat.

It reads this file, `CLAUDE.md` and `DEPLOY.md` and walks you through the steps below.
The parts only you can do are signing in to Cloudflare in your browser, turning on the
login screen in the Cloudflare dashboard, and adding any API keys.

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

### 2. Run it on your computer
From the folder you just cloned (`cd my-command-center` or `cd business-command-center`):
```bash
git switch starter
```
```bash
npm install
```
```bash
npm run dev
```
Open http://localhost:5173. You should see the dashboard with a revenue card and a cash
flow card, all showing sample data.

### 3. Make it yours
Try colors with the **Customize** button first if you like (it only saves in that
browser), then make them permanent. Ask your agent:
> Set my brand in src/brand.json: name "Your Business", primary color #…, accent color #….
> (Optional: use my logo at public/logo.svg.) Then build and show me.

### 4. Put it online, locked to your email
Follow [`DEPLOY.md`](DEPLOY.md): name your Worker in `wrangler.toml`, run
`npx wrangler login` and `npm run deploy`, then turn on Cloudflare Access so only your
email can open it. About 10 minutes.

### 5. Add widgets and real data
- **Widgets:** ask for one in plain English, e.g. "Add a widget showing tasks due this
  week." Or use `/new-widget <description>` (Claude Code) / `$new-widget <description>`
  (Codex). Ideas in [`PROMPTS.md`](PROMPTS.md).
- **Real data:** [`REAL-DATA.md`](REAL-DATA.md) has working examples (bank statement CSV,
  Stripe, a weekly summary email) and a recipe for any other API. It also explains the
  most private way to store your API keys: only in Cloudflare, where your AI agent can't
  read them.

**Windows:** if you create a file like `.dev.vars` yourself, make sure it isn't saved as
`.dev.vars.txt` (in Notepad, choose "Save as type: All files"), or ask your agent to create it.

## Project layout
```
CLAUDE.md            rules every AI agent follows in this project (read it first)
AGENTS.md            points Codex and other agents to CLAUDE.md
SPEC.md              what the starter was built from
src/App.jsx          dashboard shell (auto-loads every widget)
src/widgets/         one file per widget; RevenueCard.jsx is the example
src/data/sample.json fake business data
src/brand.json       your business name, colors and logo
worker/              the Cloudflare Worker: API routes for real data, weekly email
wrangler.toml        Cloudflare settings: Worker name, schedule, storage
scripts/             npm run helpers (deploy, secrets, bank import…)
DEPLOY.md            deploy + lock-down checklist
REAL-DATA.md         bank CSV, Stripe, weekly email, your own sources, where keys live
GOOGLE-SHEETS.md     connect a private Google Sheet (service account)
GOOGLE-ANALYTICS.md  connect Google Search Console and GA4
PROMPTS.md           prompts to copy (Claude Code + Codex)
CHEATSHEET.md        one page: commands, and Claude Code vs Codex
```
