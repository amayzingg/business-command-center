# Business Command Center — workshop starter

A private dashboard for your business: React + Tailwind on the front,
Cloudflare Pages + Access for hosting so only you can open it, on phone or PC.

You're on the **`starter` branch**: the app is already built to [`SPEC.md`](SPEC.md)
(dashboard shell, one example widget, sample data). You'll spend the workshop
adding widgets, connecting real data and shipping it. To build the shell yourself
instead, switch to `main`.

## Before the workshop (15 minutes)
1. Install **Node.js 22 LTS or newer** (https://nodejs.org). Check with `node -v`; it
   must say v22 or higher (older versions, including most of Node 20, won't run this app).
2. Install **Git** (https://git-scm.com).
3. Install an AI coding tool and sign in: **Claude Code** (desktop app or terminal)
   or **Codex CLI**. See `CHEATSHEET.md` for how each one works here.
4. Create a free **Cloudflare account** (https://dash.cloudflare.com) and verify your
   email. **Have a credit card ready:** Cloudflare may ask for one at signup, and its
   Zero Trust Free plan (used to lock your site) asks for one. Nothing is charged.
5. Clone this repo and check it works:
   ```bash
   git clone https://github.com/amayzingg/business-command-center.git
   cd business-command-center
   git switch starter
   npm install
   npm run dev
   ```
   Open http://localhost:5173. You should see "Venture Voice" and a revenue card.

**Optional, for the real-data block:** if your business already uses **Stripe**, you can
connect it (test mode). Not needed otherwise: there's a bank-statement CSV example that
needs no account. See `REAL-DATA.md`.

**Windows:** when you create a file like `.dev.vars`, make sure it isn't saved as
`.dev.vars.txt` (in Notepad, choose "Save as type: All files"), or let your AI tool create it.

**Please do this before you arrive.** Venue Wi-Fi struggles when a whole room runs
`npm install` at once.

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
