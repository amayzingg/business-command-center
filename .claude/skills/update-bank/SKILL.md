---
name: update-bank
description: Import a bank-statement CSV into the dashboard's Cash flow data, check it, and redeploy the site and weekly email. Use when the user runs /update-bank or asks to update bank data from a CSV.
argument-hint: <path to bank CSV, e.g. data/my-bank.csv>
---

Update the dashboard's bank data from this CSV: $ARGUMENTS

Bank data is private. **Never commit or push the CSV or `src/data/bank.json`** (both are
git-ignored, so don't `git add -f` them, and don't paste transaction rows into chat
beyond what's needed to confirm columns).

1. **Find the file.** If no path was given, list `data/*.csv` (excluding `*.sample.csv`)
   and ask which one. If the file is outside `data/`, suggest moving it into `data/`
   (git-ignored) first. Check that `git check-ignore` confirms it's ignored.
2. **Check the columns.** Read only the header row and the first data row. Compare with
   `COLUMNS` in `shared/bank.js` (Date, Description, Category, Amount,
   Balance; dates as YYYY-MM-DD; negative amounts = money out).
   - If they differ (other names, separate Debit/Credit columns, DD/MM/YYYY dates, no
     Category…), propose the exact change to `COLUMNS` (and, if needed, the parsing) in `shared/bank.js` and **ask the
     user to confirm before editing**. Keep the change minimal and keep the output shape
     of `bank.json` the same.
3. **Import:** `npm run import:bank -- <path>`. Report the transaction count and date
   range it prints. If it says no transactions were found, go back to step 2.
4. **Build:** `npm run build`, and fix any errors.
5. **Check in the browser:** run the dev server and confirm the **Cash flow** card shows
   the new balance, the right months and "Imported <date> from <file>" (not "Sample bank
   data"). Check light mode and 375px dark mode.
6. **Redeploy** (ask first if the user hasn't said to deploy):
   - Dashboard: `npm run deploy` (uses `config.pagesProject` from package.json, production).
   - Weekly email, if `email-worker/` exists: `npm run email:deploy`.
7. **Confirm** in 2–3 lines: the balance and period now shown, what was deployed, and a
   reminder that the CSV and `bank.json` stay on this machine only.
