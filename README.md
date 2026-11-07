# Business Command Center — workshop starter

A private dashboard for your business: React + Tailwind on the front,
Cloudflare Pages + Access for hosting so only you can open it, on phone or PC.

You're on the **`starter` branch**: the app is already built to [`SPEC.md`](SPEC.md)
(dashboard shell, one example widget, sample data). You'll spend the workshop
adding widgets, connecting real data and shipping it. To build the shell yourself
instead, switch to `main`.

## Before the workshop (10 minutes)
1. Install **Node.js 20 or newer** (https://nodejs.org) and **Git**.
2. Install **Claude Code** and sign in.
3. Create a free **Cloudflare account** (needed for the deploy step).
4. Check it works:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173. You should see "Venture Voice" and a revenue card.

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
```

## Add a widget
Drop a new file in `src/widgets/` that default-exports a component and exports
`meta`. It appears on the dashboard automatically. Or ask Claude, for example:
"Add a widget showing tasks due this week."
