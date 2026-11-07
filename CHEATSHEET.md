# Cheat sheet

The same workshop works in three tools. Find your column.

| | Claude Code — desktop app | Claude Code — terminal | Codex CLI |
|---|---|---|---|
| **Start** | Open the repo folder in the Code tab | `cd` into the repo, run `claude` | `cd` into the repo, run `codex` |
| **Project rules** | `CLAUDE.md` (read automatically) | `CLAUDE.md` (read automatically) | `AGENTS.md` → points to `CLAUDE.md` |
| **Plan mode** | Mode picker → Plan | **Shift+Tab** until "plan mode" shows | `/plan` or **Shift+Tab** |
| **See the app** | Browser pane opens it for you | `npm run dev`, open http://localhost:5173 | `npm run dev`, open http://localhost:5173 |
| **Parallel work** | Start extra sessions from the sidebar; each gets its own worktree | One terminal per worktree (below) + `claude` in each | One terminal per worktree (below) + `codex` in each |
| **Subagents** | Ask: "Use a subagent to…" | Ask: "Use a subagent to…" | Ask: "Spawn a subagent to…" (`/subagents` to watch) |
| **Hooks** | `.claude/settings.json` | `.claude/settings.json` (`/hooks` to view) | `.codex/hooks.json`, then **`/hooks` → trust it** |
| **Custom command** | `.claude/skills/<name>/SKILL.md` → `/name` | same → `/name` | `.agents/skills/<name>/SKILL.md` → `$name` |
| **Stop / undo** | Stop button; ask it to revert | **Esc** to stop; **Esc Esc** to rewind | **Esc** to stop; ask it to revert |

## Every tool: the commands you'll type

```bash
npm install                 # once
npm run dev                 # local preview at http://localhost:5173
npm run build               # check for errors before saying "done"
```

**Parallel worktree** (terminal and Codex users), from the repo folder:
```bash
git worktree add ../bcc-leads -b leads starter
cd ../bcc-leads && npm install && npm run dev -- --port 5180
```
Branch from `starter` (not `main`) so the app is there. Give each copy its own port.

**Deploy** (after the one-time setup in `DEPLOY.md`; set `config.pagesProject` in package.json):
```bash
npm run deploy          # build + deploy to production (--branch main)
```

**Update bank data, two ways:**
- **From the dashboard (any device):** click **Upload CSV** in the header (bank statement, tasks, leads or invoices; it detects which from the columns and asks you to confirm). It's stored
  privately in Cloudflare (behind your login) and used by the dashboard and the weekly
  email right away, with no redeploy. The × on an upload chip goes back to the imported/sample data.
  One-time setup: `npm run setup:bank-store`, then `npm run deploy && npm run email:deploy`.
- **From your agent:** `/update-bank data/my-bank.csv` (Claude Code) or `$update-bank`
  (Codex). It imports into `src/data/bank.json` (git-ignored), checks Cash flow, then
  redeploys. Use this one if your bank's columns need mapping (the upload expects
  `Date, Description, Category, Amount, Balance`).

Until you import or upload, the card shows **Sample bank data**.

**Real data** (details in `REAL-DATA.md`; keys go in the root `.dev.vars`):
```bash
npm run import:bank -- data/my-bank.csv   # bank CSV → Cash flow widget
npm run dev:functions                     # app + API routes at http://localhost:8788
npm run email:dev                         # weekly email preview at http://localhost:8790/preview
npm run secrets:push                      # upload .dev.vars to Cloudflare (dashboard + email)
```

## If something goes wrong
- **Blank page / errors:** run `npm run build` and paste the error to your agent.
- **New widget looks unstyled locally but fine after build:** stop `npm run dev`
  (Ctrl+C) and start it again; the dev server sometimes misses a new file's styles.
- **Key "not set" although you added it:** the file must be named exactly `.dev.vars`
  (Windows Notepad adds `.txt`) and the key name spelled exactly as in `.dev.vars.example`.
- **localhost:8788 / 8790 hangs:** an old `wrangler` is still running. Close its
  terminal, or ask your agent to stop leftover `wrangler`/`workerd` processes.
- **Port already in use:** Vite picks the next port (5174…) — read the URL it prints.
- **Widget doesn't appear:** the file must be in `src/widgets/`, export `meta`, and
  default-export the component. No change to `App.jsx` needed.
- **Way off track:** `git switch starter` (commit or stash your work first) to get the
  known-good app back.
- **Live site not locked:** see `DEPLOY.md` → the Access app needs your exact
  `*.pages.dev` hostname with an *empty* subdomain.
