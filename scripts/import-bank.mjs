// Turn a bank-statement CSV export into src/data/bank.json, which widgets see as `data.bank`.
//
//   npm run import:bank                      # uses data/bank-statement.sample.csv (fake)
//   npm run import:bank -- data/my-bank.csv  # your own export (git-ignored)
//
// Expected columns (rename them here if your bank's export differs):
//   Date (YYYY-MM-DD), Description, Category, Amount (negative = money out), Balance
import { readFileSync, writeFileSync } from 'node:fs'

const COLUMNS = { date: 'Date', description: 'Description', category: 'Category', amount: 'Amount', balance: 'Balance' }
const csvPath = process.argv[2] ?? 'data/bank-statement.sample.csv'
const outPath = 'src/data/bank.json'

// Minimal CSV parser: handles quoted fields with commas and "" escapes.
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const txns = parseCsv(readFileSync(csvPath, 'utf8'))
  .map((r) => ({
    date: r[COLUMNS.date],
    description: r[COLUMNS.description],
    category: r[COLUMNS.category] || 'Other',
    amount: Number(r[COLUMNS.amount]),
    balance: Number(r[COLUMNS.balance]),
  }))
  .filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(t.amount))
  .sort((a, b) => a.date.localeCompare(b.date))

if (txns.length === 0) {
  console.error(`No transactions found in ${csvPath}. Check the column names at the top of this script.`)
  process.exit(1)
}

const round = (n) => Math.round(n * 100) / 100
const byMonth = new Map()
for (const t of txns) {
  const m = t.date.slice(0, 7)
  const entry = byMonth.get(m) ?? { month: m, in: 0, out: 0 }
  if (t.amount >= 0) entry.in += t.amount
  else entry.out += -t.amount
  byMonth.set(m, entry)
}
const months = [...byMonth.values()].map((m) => ({ month: m.month, in: round(m.in), out: round(m.out) }))

const latestMonth = months.at(-1).month
const spend = new Map()
for (const t of txns) {
  if (t.amount < 0 && t.date.startsWith(latestMonth)) spend.set(t.category, (spend.get(t.category) ?? 0) - t.amount)
}

const last = txns.at(-1)
const bank = {
  source: csvPath.replace(/\\/g, '/').split('/').pop(),
  asOf: last.date,
  balance: Number.isFinite(last.balance) ? last.balance : null,
  months,
  spendByCategory: [...spend].map(([name, total]) => ({ name, total: round(total) })).sort((a, b) => b.total - a.total),
  recent: txns.slice(-5).reverse().map(({ date, description, amount }) => ({ date, description, amount })),
}

writeFileSync(outPath, JSON.stringify(bank, null, 2) + '\n')
console.log(`Imported ${txns.length} transactions from ${csvPath} (${months[0].month} to ${latestMonth}) into ${outPath}.`)
