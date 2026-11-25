---
name: update-bank
description: Import a bank-statement CSV into the dashboard's Cash flow data, check it, and redeploy the site and weekly email. Use when the user asks to update bank data from a CSV ($update-bank).
---

Update the dashboard's bank data from the CSV the user named (ask for the path if they didn't).

Bank data is private. **Never commit or push the CSV or `src/data/bank.json`** (both are
git-ignored, so don't `git add -f` them, and don't paste transaction rows into chat
beyond what's needed to confirm columns).

1. **Find the file.** If no path was given, list `data/*.csv` and `data/*.xlsx` (excluding
   `*.sample.csv`) and ask which one. If the file is outside `data/`, suggest moving it into
   `data/` (git-ignored) first. Check that `git check-ignore` confirms it's ignored.
2. **Import:** `npm run import:bank -- <path>`. It already handles CSV or `.xlsx`, `,`/`;`/tab
   separators, Excel's Windows encoding, account details above the header row, common
   column names in several languages (`COLUMNS` in `shared/bank.js`), separate money
   in/out columns, numbers like `1.234,56` and DD/MM vs MM/DD dates. Report the
   transaction count, date range and the "Columns used / Numbers read as / Dates read as"
   lines it prints, and ask the user whether those look right.
3. **If it fails or something was misread:** read only the header row and the first data
   row. Propose the smallest fix, usually adding the bank's column names to the right list
   in `COLUMNS` in `shared/bank.js` (or, if needed, the parsing in `shared/table.js`), and
   **ask the user to confirm before editing**. Keep the output shape of `bank.json` the
   same, then go back to step 2.
4. **Build:** `npm run build`, and fix any errors.
5. **Check in the browser:** run the dev server and confirm the **Cash flow** card shows
   the new balance, the right months and "Imported <date> from <file>" (not "Sample bank
   data"). Check light mode and 375px dark mode.
6. **Redeploy** (ask first if the user hasn't said to deploy):
   - `npm run deploy` (the Worker named in `wrangler.toml`: dashboard and weekly email together).
7. **Confirm** in 2–3 lines: the balance and period now shown, what was deployed, and a
   reminder that the CSV and `bank.json` stay on this machine only.
