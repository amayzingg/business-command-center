// Bank-statement CSV → the `bank` summary the Cash flow widget and the weekly email read.
// Shared by `npm run import:bank` (scripts/import-bank.mjs), the dashboard's upload
// button (functions/api/bank.js) and /update-bank, so every path reads CSVs the same way.
//
// Expected columns. If your bank's export uses other names, change them HERE once:
//   Date (YYYY-MM-DD), Description, Category, Amount (negative = money out), Balance
export const COLUMNS = {
  date: 'Date',
  description: 'Description',
  category: 'Category',
  amount: 'Amount',
  balance: 'Balance',
}

// Minimal CSV parser: handles quoted fields with commas and "" escapes.
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header = [], ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.replace(/^﻿/, '').trim(), (r[i] ?? '').trim()])))
}

// Returns the summary, or throws an Error whose message explains what to fix.
export function summarizeBankCsv(text, source = 'bank.csv') {
  const txns = parseCsv(text)
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
    throw new Error(
      `No transactions found. Expected columns ${Object.values(COLUMNS).join(', ')} with dates as YYYY-MM-DD ` +
        '(change COLUMNS in shared/bank.js, or run /update-bank to adapt it).',
    )
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
  return {
    source: String(source).replace(/\\/g, '/').split('/').pop(),
    importedAt: new Date().toISOString(),
    transactions: txns.length,
    asOf: last.date,
    balance: Number.isFinite(last.balance) ? last.balance : null,
    months,
    spendByCategory: [...spend]
      .map(([name, total]) => ({ name, total: round(total) }))
      .sort((a, b) => b.total - a.total),
    recent: txns
      .slice(-5)
      .reverse()
      .map(({ date, description, amount }) => ({ date, description, amount })),
  }
}
