// Turn a bank-statement CSV export into src/data/bank.json, which widgets see as `data.bank`.
// src/data/bank.json is git-ignored (it holds your real transactions). Without it, the
// dashboard and email fall back to the fictional src/data/bank.sample.json.
// (You can also upload a CSV from the dashboard header; see REAL-DATA.md.)
//
//   npm run import:bank                      # uses data/bank-statement.sample.csv (fake)
//   npm run import:bank -- data/my-bank.csv  # your own export (git-ignored)
//
// Column names live in shared/bank.js (COLUMNS). Change them there if your bank differs.
import { readFileSync, writeFileSync } from 'node:fs'
import { summarizeBankCsv } from '../shared/bank.js'

const csvPath = process.argv[2] ?? 'data/bank-statement.sample.csv'
const outPath = 'src/data/bank.json'

let bank
try {
  bank = summarizeBankCsv(readFileSync(csvPath, 'utf8'), csvPath)
} catch (err) {
  console.error(`${csvPath}: ${err.message}`)
  process.exit(1)
}

writeFileSync(outPath, JSON.stringify(bank, null, 2) + '\n')
console.log(
  `Imported ${bank.transactions} transactions from ${csvPath} (${bank.months[0].month} to ${bank.months.at(-1).month}) into ${outPath}.`,
)
