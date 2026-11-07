# Business Command Center — workshop starter

A private dashboard for your business: React + Tailwind on the front,
Cloudflare Pages + Access for hosting so only you can open it, on phone or PC.

You're on the **`starter` branch**: the app is already built to [`SPEC.md`](SPEC.md)
(dashboard shell, one example widget, sample data). You'll spend the workshop
adding widgets, connecting real data and shipping it. To build the shell yourself
instead, switch to `main`.

## Before the workshop
You'll need these ready (setup steps are sent separately):
- **Node.js 22+** and **Git**
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

**No GitHub account?** You can clone the public template instead:
`git clone https://github.com/amayzingg/business-command-center.git`, then
`cd business-command-center` and the same `git switch starter` / `npm install` / `npm run dev`
steps. It works for the whole workshop, but you won't have your own copy on GitHub to save and back up your changes.

**Windows:** when you create a file like `.dev.vars`, make sure it isn't saved as
`.dev.vars.txt` (in Notepad, choose "Save as type: All files"), or let your AI tool create it.

## Project layout
```
CLAUDE.md            rules Claude follows in this project
SPEC.md              what the starter was built from
src/App.jsx          dashboard shell (auto-loads every widget)
src/widgets/         one file per widget; RevenueCard.jsx is the example
src/data/sample.json fake business data
functions/           Cloudflare Pages Functions, for real data later
PROMPTS.md           starter prompts if you're stuck (Claude Code + Codex)
CHEATSHEET.md        one-page guide: desktop app vs terminal vs Codex
AGENTS.md            points Codex and other agents to CLAUDE.md
DEPLOY.md            deploy + lock-down checklist
REAL-DATA.md         bank CSV, Stripe, weekly email, add your own source
GOOGLE-SHEETS.md     connect a private Google Sheet (service account)
```

## Make it yours (before your first deploy)
Try colors with the **Customize** button first if you like (it only saves in your browser),
then make them permanent. Ask your agent:
> Set my brand in src/brand.json: name "Your Business", primary color #…, accent color #….
> (Optional: use my logo at public/logo.svg.) Then build and show me.

Your name, colors and logo then appear on every device and in your first deploy (`DEPLOY.md`).

## Add a widget
Drop a new file in `src/widgets/` that default-exports a component and exports
`meta`. It appears on the dashboard automatically. Or ask Claude, for example:
"Add a widget showing tasks due this week."
