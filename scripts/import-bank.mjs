// Turn a bank-statement export (CSV, or Excel .xlsx) into src/data/bank.json, which widgets
// see as `data.bank`. src/data/bank.json is git-ignored (it holds your real transactions).
// Without it, the dashboard and email fall back to the fictional src/data/bank.sample.json.
// (You can also upload a file from the dashboard header; see REAL-DATA.md.)
//
//   npm run import:bank                       # uses data/bank-statement.sample.csv (fake)
//   npm run import:bank -- data/my-bank.csv   # your own export (git-ignored)
//
// Column names (in several languages), separators, number styles and date order are worked
// out from the file by shared/bank.js. It prints how it read them, so check those lines.
import { readFileSync, writeFileSync } from 'node:fs'
import { summarizeBankCsv } from '../shared/bank.js'
import { spreadsheetToCsv } from '../shared/spreadsheet.js'

const csvPath = process.argv[2] ?? 'data/bank-statement.sample.csv'
const outPath = 'src/data/bank.json'

let bank
try {
  bank = summarizeBankCsv(await spreadsheetToCsv(readFileSync(csvPath)), csvPath)
} catch (err) {
  console.error(`${csvPath}: ${err.message}`)
  process.exit(1)
}

const { notes, ...value } = bank
writeFileSync(outPath, JSON.stringify(value, null, 2) + '\n')
console.log(
  `Imported ${bank.transactions} transactions from ${csvPath} (${bank.months[0].month} to ${bank.months.at(-1).month}) into ${outPath}.`,
)
for (const note of notes) console.log(`  ${note}`)
