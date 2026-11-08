# Starter prompts

Copy, paste, then change the details to fit your business.

## Make it yours (do this before your first deploy)
Works the same in Claude Code and Codex:
- "Set my brand in src/brand.json: name '<your business>', primary color <#hex>, accent
  color <#hex>. Then build and show me."
- "Use my logo: I've put it at public/logo.svg. Set it in brand.json and check it looks
  right on a phone in light and dark mode." (Add `logoDark` if your logo is dark.)
- "Suggest three color pairs that suit a <type of business>, show me each with the
  Customize panel's presets, then save the one I pick to brand.json."

## Widgets (sample data)
- Add a widget showing open tasks due in the next 7 days, overdue ones highlighted in red.
- Add a leads pipeline widget: count and total value per stage, as a horizontal bar.
- Add an invoices widget that shows overdue and unpaid totals, and lists overdue invoices.
- Add a "lead sources" widget comparing where won and open leads came from.
- Add a full-width "today" widget: date, top 3 priorities, and money due this week.

## Techniques (Claude Code)
- **Plan mode:** "Plan a widget that forecasts next month's revenue from the last
  6 months. Don't write code yet."
- **Parallel work:** run two or three Claude sessions in separate worktrees, each
  building a different widget. Widgets are separate files, so they won't conflict.
  Make the worktrees from `starter`, not `main`, so the app is there.
- **Subagents:** "Use a subagent to review every widget for phone-width layout and
  missing dark-mode styles, then fix what it finds."
- **Hooks:** "Add a hook that runs `npm run build` after every file edit and shows
  me the errors."
- **Custom command/skill:** "Create a /new-widget command that takes a one-line
  description and builds a widget following CLAUDE.md."

## Techniques in Codex
Same ideas, Codex's own files. See `CHEATSHEET.md` for the side-by-side.
- **Plan mode:** type `/plan` (or Shift+Tab), then: "Plan a widget that forecasts next
  month's revenue from the last 6 months. Don't write code yet."
- **Parallel work:** make a worktree per widget (`git worktree add ../bcc-leads -b leads starter`),
  run `codex` in each, and give each a different widget. Use a different dev port in each.
- **Subagents:** "Spawn a subagent to review every file in `src/widgets/` for phone-width
  layout and missing `dark:` styles, wait for it, then fix what it finds." Use
  `/subagents` to watch it.
- **Hooks:** "Create `.codex/hooks.json` with a PostToolUse hook matching `Edit|Write` that
  runs `npm run build`; if the build fails, write the last 30 lines to stderr and exit 2.
  Add a `commandWindows` version in PowerShell." Then run **`/hooks` and trust it**.
  Codex skips new or changed hooks until you do.
- **Custom skill:** "Create a skill at `.agents/skills/new-widget/SKILL.md` that takes a
  one-line description and builds a widget following CLAUDE.md." Use it by typing
  `$new-widget` followed by your description.

## Real data
Working examples (bank CSV, Stripe test mode, weekly email) and a recipe for
adding your own source are in `REAL-DATA.md`.
- **Bank statement from the dashboard:** after `npm run setup:bank-store` and a deploy, use
  **Upload CSV** in the header on any device: bank statement, tasks, leads or invoices,
  detected from the column names (templates in `data/templates/`). If your bank's columns differ, ask:
  "My bank CSV has columns <paste the header row>. Update COLUMNS in shared/bank.js so
  uploads and imports read it, then build and deploy."
- **Bank statement:** export a CSV into `data/`, then run **`/update-bank data/my-bank.csv`**
  (Claude Code) or **`$update-bank`** (Codex). It imports the CSV, adapts the column mapping if
  your bank's format differs (asking you first), checks the Cash flow card, and
  redeploys. Your CSV and `src/data/bank.json` stay git-ignored. Never commit them.
- **Google Search Console + GA4:** follow `GOOGLE-ANALYTICS.md`, which has a ready-made prompt.
- **Google Sheet (kept private):** follow `GOOGLE-SHEETS.md`. It covers service account
  setup and has a ready-made prompt.

Prompts to adapt:
- Replace the sample invoices with data from [Stripe / QuickBooks / a Google Sheet]
  using a Cloudflare Pages Function in `functions/api/`. Keep the API key in an
  environment variable.
- Use the [Notion / Gmail / Calendar] connector to pull [my tasks / unread
  client emails / today's meetings] into a widget.

## Stretch
- Make it installable on my phone's home screen (web app manifest + icons).
- Add a scheduled task that writes a morning summary of the dashboard.
- Add a light/dark toggle that remembers my choice.
