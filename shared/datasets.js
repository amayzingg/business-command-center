// CSV uploads: which table a CSV belongs to, and how to turn it into dashboard data.
// Used by worker/api/uploads.js (and the weekly email reads what it stores).
//
// To support another table, add an entry to DATASETS: its columns (with alternative
// header names people commonly use, in any language) and a `parse` that returns the value
// stored under data[<key>]. Detection picks the dataset whose required columns all appear
// in the header row, preferring the one that matches the most columns. Separators, number
// styles and date order are worked out per file (shared/table.js).
import { bankColumns, summarizeBankCsv } from './bank.js'
import { dateReader, matchColumns, numberReader, readTable } from './table.js'

const toBool = (v) => /^(true|yes|y|1|x|done|✓|✔|sim|s|si|sí|ja|oui|feito|concluído|concluido|hecho)$/i.test(String(v ?? '').trim())

export const DATASETS = {
  bank: {
    label: 'Bank statement',
    widget: 'Cash flow',
    // Bank columns (in several languages) and parsing live in shared/bank.js.
    match: bankColumns,
    parse: (text, source) => {
      const bank = summarizeBankCsv(text, source)
      const { notes, ...value } = bank
      return { value, count: bank.transactions, notes }
    },
  },
  tasks: {
    label: 'Tasks',
    widget: 'Tasks due this week',
    required: {
      title: ['title', 'task', 'name', 'todo', 'tarefa', 'tarea', 'tâche', 'aufgabe'],
      due: ['due', 'due date', 'deadline', 'date', 'prazo', 'data limite', 'vencimento', 'fecha límite', 'échéance', 'fällig'],
    },
    optional: { priority: ['priority', 'prioridade', 'prioridad', 'priorité'], done: ['done', 'completed', 'complete', 'status', 'feito', 'concluído', 'estado'], id: ['id'] },
    parse: (rows, { date }) =>
      rows
        .map((r, i) => ({
          id: r.id || `T-${i + 1}`,
          title: r.title,
          due: date(r.due),
          priority: priority(r.priority),
          done: toBool(r.done),
        }))
        .filter((t) => t.title && t.due),
  },
  leads: {
    label: 'Leads',
    widget: 'Leads pipeline',
    required: {
      name: ['name', 'company', 'lead', 'client', 'nome', 'empresa', 'cliente'],
      stage: ['stage', 'status', 'fase', 'etapa', 'estado'],
      value: ['value', 'amount', 'deal value', 'valor', 'montante'],
    },
    optional: { source: ['source', 'channel', 'origem', 'canal', 'origen'], lastContact: ['last contact', 'lastcontact', 'last contacted', 'último contacto', 'último contato'], id: ['id'] },
    numbers: ['value'],
    parse: (rows, { date, number }) =>
      rows
        .map((r, i) => ({
          id: r.id || `L-${i + 1}`,
          name: r.name,
          stage: String(r.stage).toLowerCase().trim(),
          value: number(r.value),
          source: r.source ? String(r.source).toLowerCase() : 'other',
          lastContact: date(r.lastContact),
        }))
        .filter((l) => l.name && l.stage && Number.isFinite(l.value)),
  },
  invoices: {
    label: 'Invoices',
    widget: 'Invoices',
    required: {
      client: ['client', 'customer', 'cliente'],
      amount: ['amount', 'total', 'valor', 'montante', 'importe'],
      due: ['due', 'due date', 'vencimento', 'data de vencimento', 'fecha de vencimiento'],
      status: ['status', 'estado'],
    },
    optional: { id: ['id', 'invoice', 'number', 'invoice number', 'fatura', 'factura', 'número'], issued: ['issued', 'date', 'issue date', 'data', 'data de emissão', 'fecha'] },
    numbers: ['amount'],
    parse: (rows, { date, number }) =>
      rows
        .map((r, i) => ({
          id: r.id || `INV-${i + 1}`,
          client: r.client,
          amount: number(r.amount),
          issued: date(r.issued),
          due: date(r.due),
          status: String(r.status).toLowerCase().trim(),
        }))
        .filter((inv) => inv.client && Number.isFinite(inv.amount) && inv.due),
  },
}

const PRIORITY = { high: 'high', alta: 'high', alto: 'high', haute: 'high', hoch: 'high', low: 'low', baixa: 'low', baja: 'low', basse: 'low', niedrig: 'low' }
const priority = (v) => PRIORITY[String(v ?? '').toLowerCase().trim()] ?? 'medium'

// Map a dataset's fields to this CSV's actual header names (or null if a required one is missing).
function mapHeaders(def, headers) {
  if (def.match) return def.match(headers)
  const map = matchColumns({ ...def.required, ...def.optional }, headers)
  return Object.keys(def.required).every((f) => map[f]) ? map : null
}

const matchesAny = (headers) => Object.values(DATASETS).some((def) => mapHeaders(def, headers))

// The file's header row, its rows as objects, and its separator. The header row is the first
// row (of the top 30) that some dataset recognises, so lines above it are skipped.
export const readCsv = (text) => readTable(text, matchesAny)

// The header row's column names.
export const csvHeaders = (text) => readCsv(text).headers

// Best-matching dataset key for these headers, or null.
export function detectDataset(headers) {
  let best = null
  for (const [key, def] of Object.entries(DATASETS)) {
    const map = mapHeaders(def, headers)
    if (!map) continue
    const score = Object.keys(map).length
    if (!best || score > best.score) best = { key, score }
  }
  return best?.key ?? null
}

// Parse a CSV as `key`. Returns { value, count, notes } or throws with a helpful message.
export function parseDataset(key, text, source) {
  const def = DATASETS[key]
  if (!def) throw new Error(`Unknown data type "${key}".`)
  if (key === 'bank') return def.parse(text, source)

  const { headers, records, delimiter } = readCsv(text)
  return parseRecords(key, headers, records, { decimal: delimiter === ';' ? 'comma' : 'dot' })
}

// Same as parseDataset, for rows that are already objects keyed by header (e.g. a Google
// Sheet tab). Returns { value, count, notes } or throws with a helpful message.
export function parseRecords(key, headers, records, { decimal = 'dot' } = {}) {
  const def = DATASETS[key]
  const map = mapHeaders(def, headers)
  if (!map) {
    const need = Object.values(def.required).map((a) => `"${a[0]}"`)
    throw new Error(
      `${def.label} need the columns ${need.join(', ')}. Found: ${headers.join(', ') || 'no header row'}. ` +
        'Rename those columns in your spreadsheet, save it as CSV and try again.',
    )
  }
  const rows = records.map((r) => Object.fromEntries(Object.entries(map).map(([field, h]) => [field, r[h]])))

  // Decide date order and number style per file, from all its values.
  const dateFields = ['due', 'issued', 'lastContact'].filter((f) => map[f])
  const dates = dateReader(dateFields.flatMap((f) => rows.map((r) => r[f])))
  const numFields = (def.numbers ?? []).filter((f) => map[f])
  const nums = numberReader(numFields.flatMap((f) => rows.map((r) => r[f])), { fallback: decimal })

  const value = def.parse(rows, { date: dates.read, number: nums.read })
  if (value.length === 0) {
    throw new Error(`No usable ${def.label.toLowerCase()} rows found. Check dates are like 2026-11-14 or 14/11/2026.`)
  }
  const notes = []
  if (nums.example) notes.push(`Numbers read as ${nums.decimal === 'comma' ? '1.234,56' : '1,234.56'}: "${nums.example}" = ${nums.read(nums.example)}.`)
  if (dates.example) {
    notes.push(
      `Dates read as ${dates.order === 'mdy' ? 'month/day/year' : 'day/month/year'}: "${dates.example}" = ${dates.read(dates.example)}` +
        `${dates.guessed ? ' (a guess: no day above 12)' : ''}.`,
    )
  }
  return { value, count: value.length, notes }
}

// Everything uploaded from the dashboard (stored in KV by worker/api/uploads.js), ready
// to merge over the dashboard data. Used by the API route and the weekly email.
export const uploadKey = (dataset) => `upload:${dataset}`
export async function readUploads(kv) {
  const out = { uploads: {} }
  for (const dataset of Object.keys(DATASETS)) {
    const saved = await kv.get(uploadKey(dataset), 'json')
    if (!saved) continue
    out[dataset] = dataset === 'bank' ? { ...saved.value, uploaded: true, importedAt: saved.uploadedAt } : saved.value
    out.uploads[dataset] = { label: DATASETS[dataset].label, source: saved.source, uploadedAt: saved.uploadedAt, count: saved.count }
  }
  return out
}
