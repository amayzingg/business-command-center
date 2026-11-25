// Bank-statement CSV → the `bank` summary the Cash flow widget and the weekly email read.
// Shared by `npm run import:bank` (scripts/import-bank.mjs), the dashboard's upload
// button (worker/api/uploads.js) and /update-bank, so every path reads CSVs the same way.
//
// It finds the columns by name, in several languages (the first matching name wins), so
// most bank exports work as they are. A statement needs a date and either one amount
// column (negative = money out) or separate money-in / money-out columns. Separators,
// number styles (1,234.56 or 1.234,56) and date order are worked out from the file
// (shared/table.js). If your bank uses a name that isn't here, add it to the right list.
import { dateReader, matchColumns, numberReader, readTable } from './table.js'

export const COLUMNS = {
  date: [
    'Date', 'Transaction date', 'Booking date', 'Posting date', 'Posted date', 'Completed date', 'Started date',
    'Data', 'Data movimento', 'Data mov', 'Data lançamento', 'Data de lançamento', 'Data operação', 'Data transação',
    'Fecha', 'Fecha operación', 'Fecha movimiento', 'Datum', 'Buchungstag', 'Buchungsdatum', 'Date opération',
    'Data operazione', 'Value date', 'Data valor', 'Fecha valor', 'Valuta', 'Date valeur',
  ],
  description: [
    'Description', 'Details', 'Transaction description', 'Memo', 'Narrative', 'Payee', 'Merchant', 'Name',
    'Reference', 'Descrição', 'Descritivo', 'Histórico', 'Movimento', 'Lançamento', 'Designação', 'Concepto',
    'Descripción', 'Verwendungszweck', 'Buchungstext', 'Beschreibung', 'Libellé', 'Descrizione', 'Causale',
  ],
  category: ['Category', 'Categoria', 'Categoría', 'Kategorie', 'Catégorie'],
  amount: [
    'Amount', 'Value', 'Transaction amount', 'Net amount', 'Valor', 'Montante', 'Importância', 'Importe',
    'Cantidad', 'Betrag', 'Umsatz', 'Montant', 'Importo',
  ],
  moneyIn: [
    'Money in', 'Paid in', 'Credit', 'Credits', 'Credit amount', 'Deposit', 'Deposits', 'In', 'Crédito', 'Créditos',
    'Entrada', 'Entradas', 'Recebimentos', 'Haber', 'Abono', 'Abonos', 'Ingresos', 'Gutschrift', 'Haben', 'Crédit',
    'Entrate', 'Avere',
  ],
  moneyOut: [
    'Money out', 'Paid out', 'Debit', 'Debits', 'Debit amount', 'Withdrawal', 'Withdrawals', 'Out', 'Débito',
    'Débitos', 'Saída', 'Saídas', 'Pagamentos', 'Debe', 'Cargo', 'Cargos', 'Gastos', 'Lastschrift', 'Soll', 'Débit',
    'Uscite', 'Dare',
  ],
  balance: [
    'Balance', 'Running balance', 'Saldo', 'Saldo contabilístico', 'Saldo disponível', 'Saldo após movimento',
    'Solde', 'Kontostand', 'Saldo contable',
  ],
}

// This header row's columns, or null if it isn't a bank statement (needs a date and an amount).
export function bankColumns(headers) {
  const map = matchColumns(COLUMNS, headers)
  return map.date && (map.amount || map.moneyIn || map.moneyOut) ? map : null
}

const hasValue = (v) => String(v ?? '').trim() !== ''

// Returns the summary (with `notes` saying how dates and numbers were read), or throws an
// Error whose message explains, in plain words, what to fix.
export function summarizeBankCsv(text, source = 'bank.csv') {
  const { headers, records, delimiter } = readTable(text, (row) => Boolean(bankColumns(row)))
  const cols = bankColumns(headers)
  if (!cols) {
    throw new Error(
      `Couldn't find the columns a bank statement needs: a date and an amount (or "money in" and "money out"). ` +
        `Columns found: ${headers.join(', ') || 'none'}. ` +
        'Easiest fix: open the file in Excel or Google Sheets, rename the date column to "Date" and the amount ' +
        'column to "Amount", save it as CSV and upload it again. Or ask your AI assistant to add your bank\'s ' +
        'column names in shared/bank.js.',
    )
  }

  const notes = []
  const pick = (field) => (cols[field] ? records.map((r) => r[cols[field]]) : [])
  // Semicolon files almost always come from a comma-decimal Excel (Portugal, Spain, France…).
  const fallback = delimiter === ';' ? 'comma' : 'dot'
  const moneyCols = ['amount', 'moneyIn', 'moneyOut', 'balance'].filter((f) => cols[f])
  const nums = numberReader(moneyCols.flatMap(pick), { fallback })
  const dates = dateReader(pick('date'))

  const bad = []
  const txns = []
  records.forEach((r, i) => {
    const date = dates.read(r[cols.date])
    if (!date) return // blank lines, "Opening balance" rows, totals…
    let amount
    if (cols.amount && hasValue(r[cols.amount])) amount = nums.read(r[cols.amount])
    else if (hasValue(r[cols.moneyIn]) || hasValue(r[cols.moneyOut])) {
      const inn = hasValue(r[cols.moneyIn]) ? Math.abs(nums.read(r[cols.moneyIn])) : 0
      const out = hasValue(r[cols.moneyOut]) ? Math.abs(nums.read(r[cols.moneyOut])) : 0
      amount = inn - out
    } else return
    if (!Number.isFinite(amount)) {
      bad.push(`row ${i + 2}: "${r[cols.amount] ?? r[cols.moneyIn] ?? r[cols.moneyOut]}"`)
      return
    }
    txns.push({
      date,
      description: (cols.description && r[cols.description]) || '',
      category: (cols.category && r[cols.category]) || 'Other',
      amount,
      balance: cols.balance && hasValue(r[cols.balance]) ? nums.read(r[cols.balance]) : NaN,
    })
  })

  if (bad.length) {
    throw new Error(`Couldn't read these amounts as numbers: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}.`)
  }
  if (txns.length === 0) {
    throw new Error(
      `Found the columns (${cols.date}, ${cols.amount ?? [cols.moneyIn, cols.moneyOut].filter(Boolean).join(' / ')}) ` +
        `but no rows with a date I could read${dates.example ? ` (e.g. "${dates.example}")` : ''}. ` +
        'Dates like 2026-11-14, 14/11/2026 or 14 Nov 2026 work.',
    )
  }

  // Tell the person how ambiguous values were read, so a wrong guess is visible.
  const columnsUsed = [cols.date, cols.amount, cols.moneyIn, cols.moneyOut, cols.description, cols.balance].filter(Boolean)
  notes.push(`Columns used: ${columnsUsed.join(', ')}.`)
  if (nums.example) {
    notes.push(`Numbers read as ${nums.decimal === 'comma' ? '1.234,56' : '1,234.56'}: "${nums.example}" = ${nums.read(nums.example)}.`)
  } else if (nums.guessed && moneyCols.flatMap(pick).some((v) => /\d[.,]\d{3}\b/.test(v))) {
    notes.push(`Couldn't tell if "." or "," is the decimal mark; assumed "${nums.decimal === 'comma' ? ',' : '.'}". Check the totals.`)
  }
  if (dates.example) {
    notes.push(
      `Dates read as ${dates.order === 'mdy' ? 'month/day/year' : 'day/month/year'}: "${dates.example}" = ${dates.read(dates.example)}` +
        `${dates.guessed ? ' (a guess: no day above 12)' : ''}.`,
    )
  }

  // Banks list newest first or oldest first. The closing balance is on the newest row: the
  // last row of the latest day in an oldest-first file, the first one in a newest-first file.
  const newestFirst = txns[0].date > txns.at(-1).date
  const lastDay = txns.reduce((d, t) => (t.date > d ? t.date : d), txns[0].date)
  const onLastDay = txns.filter((t) => t.date === lastDay)
  const last = newestFirst ? onLastDay[0] : onLastDay.at(-1)

  txns.sort((a, b) => a.date.localeCompare(b.date)) // stable: same-day rows keep file order

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

  return {
    source: String(source).replace(/\\/g, '/').split('/').pop(),
    importedAt: new Date().toISOString(),
    transactions: txns.length,
    asOf: lastDay,
    balance: Number.isFinite(last.balance) ? round(last.balance) : null,
    months,
    spendByCategory: [...spend]
      .map(([name, total]) => ({ name, total: round(total) }))
      .sort((a, b) => b.total - a.total),
    recent: txns
      .slice(-5)
      .reverse()
      .map(({ date, description, amount }) => ({ date, description, amount: round(amount) })),
    notes,
  }
}
