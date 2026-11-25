# Cheat sheet

The everyday things first. Most of the time you just **ask your AI assistant in plain
English**, and it runs the commands for you.

## Everyday: what to ask
| You want to… | Ask your assistant |
|---|---|
| See the dashboard on your computer | "Show me the dashboard." |
| Add a card to the dashboard | "Add a widget showing …" (or `/new-widget …` in Claude Code, `$new-widget …` in Codex) |
| Change name, colors or logo | "Make the colors match my website, example.com." |
| Put your changes online | "Put my changes online." |
| Save a backup to GitHub | "Save my changes to GitHub." |
| Undo something | "Undo that last change." |
| Start over with the original | "Save my work, then take me back to the original starter version." |
| Fix an error | Paste the error message and ask "What does this mean? Please fix it." |

## Everyday: the commands (if you type them yourself)
Type these in a terminal opened in the project folder (Windows: **Git Bash**; Mac:
**Terminal**), pressing Enter after each one.

```bash
npm install                 # once, after downloading the project
npm run dev                 # see it on your computer at http://localhost:5173
npm run build               # check for errors
npm run deploy              # put it online (after the setup in DEPLOY.md)
```
`npm run dev` keeps the terminal busy while the preview runs. Press **Ctrl+C** in it to stop.

## Your data
- **Upload a spreadsheet:** click **Upload CSV** at the top of your dashboard (bank
  statement, tasks, leads or invoices; CSV or Excel .xlsx, any language's number and date
  style). It works out which from the column names, shows how it read the numbers and
  dates, and asks you to confirm. It's stored privately in your Cloudflare account and used right
  away, with no redeploy. The × on an upload chip removes it again.
  One-time setup: ask *"Set up Upload CSV and put it online."*
- **Bank statement your bank formats oddly:** `/update-bank data/my-bank.csv` (Claude Code)
  or `$update-bank` (Codex). It maps the columns, imports, checks and redeploys.
- **Google Sheet, Stripe, weekly email:** see `REAL-DATA.md` and `GOOGLE-SHEETS.md`.
- **API keys:** the most private place is the Cloudflare dashboard only (Workers & Pages →
  your Worker → Settings → Variables and Secrets → Add → type **Secret**, no quotes).
  Then they're never on your computer, so your AI assistant can't read them. See
  `REAL-DATA.md` → "Where your keys live".

Until you import or upload, cards show **Sample … data**.

## If something goes wrong
- **"node"/"git"/"npm" not recognized or command not found:** install it (README → Step 0),
  then restart your computer.
- **Windows: "running scripts is disabled on this system":** use **Git Bash** instead of
  PowerShell, or ask your assistant to fix it.
- **Blank page / errors:** run `npm run build` and paste the error to your assistant.
- **New widget looks unstyled locally:** stop `npm run dev` (Ctrl+C) and start it again.
- **Key "not set" although you added it:** the file must be named exactly `.dev.vars`
  (Windows Notepad adds `.txt`), and the key name spelled exactly as in `.dev.vars.example`.
  In the Cloudflare dashboard: type **Secret**, and no quotes around the value.
- **localhost:8788 hangs:** an old preview is still running. Close its terminal, or ask
  your assistant to stop leftover `wrangler`/`workerd` processes.
- **Port already in use:** it picks the next port (5174…). Use the address it prints.
- **Widget doesn't appear:** the file must be in `src/widgets/`, export `meta`, and
  default-export the component. No change to `App.jsx` needed.
- **Live site not locked:** `DEPLOY.md` step 2: Worker → Settings → Domains & Routes →
  **Enable Cloudflare Access** on the workers.dev row.

## Commands for real data (reference)
```bash
npm run import:bank -- data/my-bank.csv   # bank CSV → Cash flow widget
npm run dev:worker                        # full app incl. live data at http://localhost:8788
                                          #   weekly email preview: /email/preview
npm run setup:bank-store                  # one-time: storage for Upload CSV
npm run secrets:push                      # upload .dev.vars keys to your Worker
```

## Advanced (skip until you're comfortable)
The same features in each AI tool:

| | Claude Code — desktop app | Claude Code — terminal | Codex CLI |
|---|---|---|---|
| **Start** | Open the project folder in the Code tab | `cd` into the folder, run `claude` | `cd` into the folder, run `codex` |
| **Project rules** | `CLAUDE.md` (read automatically) | `CLAUDE.md` (read automatically) | `AGENTS.md` → points to `CLAUDE.md` |
| **Plan mode** (plan before changing anything) | Mode picker → Plan | **Shift+Tab** until "plan mode" shows | `/plan` or **Shift+Tab** |
| **See the app** | Browser pane opens it for you | `npm run dev`, open http://localhost:5173 | `npm run dev`, open http://localhost:5173 |
| **Parallel work** | Start extra sessions from the sidebar; each gets its own worktree | One terminal per worktree (below) + `claude` in each | One terminal per worktree (below) + `codex` in each |
| **Subagents** | Ask: "Use a subagent to…" | Ask: "Use a subagent to…" | Ask: "Spawn a subagent to…" (`/subagents` to watch) |
| **Hooks** | `.claude/settings.json` | `.claude/settings.json` (`/hooks` to view) | `.codex/hooks.json`, then **`/hooks` → trust it** |
| **Custom command** | `.claude/skills/<name>/SKILL.md` → `/name` | same → `/name` | `.agents/skills/<name>/SKILL.md` → `$name` |
| **Stop / undo** | Stop button; ask it to revert | **Esc** to stop; **Esc Esc** to rewind | **Esc** to stop; ask it to revert |

**Parallel worktree** (a second copy of the project to work on two things at once), from
the project folder:
```bash
git worktree add ../bcc-leads -b leads starter
cd ../bcc-leads && npm install && npm run dev -- --port 5180
```
Branch from `starter` (not `main`) so the app is there. Give each copy its own port.
