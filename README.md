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

## Before the workshop (10 minutes)
1. Install **Node.js 20 or newer** (https://nodejs.org) and **Git**.
2. Install **Claude Code** and sign in.
3. Create a free **Cloudflare account** (needed for the deploy step).
4. Clone this repo, then check your setup works:
   ```bash
   git switch starter
   npm install
   npm run dev
   ```
   Open http://localhost:5173. You should see "Venture Voice" and a revenue card.
   Then `git switch main` to be ready for the first exercise.

**Please do this before you arrive.** Venue Wi-Fi struggles when a whole room runs
`npm install` at once.

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
```

## First exercise
Start Claude Code in this folder, switch to plan mode, and ask:
> Read SPEC.md and CLAUDE.md, then plan how to build the dashboard.

Review the plan, then let it build. You're done when `npm run dev` shows the dashboard.
