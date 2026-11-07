// CSV uploads: which table a CSV belongs to, and how to turn it into dashboard data.
// Used by functions/api/uploads.js (and the email Worker reads what it stores).
//
// To support another table, add an entry to DATASETS: its columns (with alternative
// header names people commonly use) and a `parse` that returns the value stored under
// data[<key>]. Detection picks the dataset whose required columns all appear in the
// header row, preferring the one that matches the most columns.
import { parseCsv, summarizeBankCsv } from './bank.js'

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')

// A date as YYYY-MM-DD. Accepts YYYY-MM-DD, YYYY/MM/DD and DD/MM/YYYY (or DD.MM.YYYY).
export function toIsoDate(value) {
  const v = String(value ?? '').trim()
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}
const toNumber = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, ''))
const toBool = (v) => /^(true|yes|y|1|x|done|✓|✔)$/i.test(String(v ?? '').trim())

export const DATASETS = {
  bank: {
    label: 'Bank statement',
    widget: 'Cash flow',
    required: { date: ['date', 'transaction date', 'booking date'], amount: ['amount', 'value'] },
    optional: { description: ['description', 'details', 'memo'], balance: ['balance'], category: ['category'] },
    // Bank parsing (and its COLUMNS mapping) lives in shared/bank.js.
    parse: (text, source) => {
      const bank = summarizeBankCsv(text, source)
      return { value: bank, count: bank.transactions }
    },
  },
  tasks: {
    label: 'Tasks',
    widget: 'Tasks due this week',
    required: { title: ['title', 'task', 'name', 'todo'], due: ['due', 'due date', 'deadline', 'date'] },
    optional: { priority: ['priority'], done: ['done', 'completed', 'complete', 'status'], id: ['id'] },
    parse: (rows) =>
      rows
        .map((r, i) => ({
          id: r.id || `T-${i + 1}`,
          title: r.title,
          due: toIsoDate(r.due),
          priority: ['high', 'medium', 'low'].includes(String(r.priority).toLowerCase())
            ? String(r.priority).toLowerCase()
            : 'medium',
          done: toBool(r.done),
        }))
        .filter((t) => t.title && t.due),
  },
  leads: {
    label: 'Leads',
    widget: 'Leads pipeline',
    required: { name: ['name', 'company', 'lead', 'client'], stage: ['stage', 'status'], value: ['value', 'amount', 'deal value'] },
    optional: { source: ['source', 'channel'], lastContact: ['last contact', 'lastcontact', 'last contacted'], id: ['id'] },
    parse: (rows) =>
      rows
        .map((r, i) => ({
          id: r.id || `L-${i + 1}`,
          name: r.name,
          stage: String(r.stage).toLowerCase().trim(),
          value: toNumber(r.value),
          source: r.source ? String(r.source).toLowerCase() : 'other',
          lastContact: toIsoDate(r.lastContact),
        }))
        .filter((l) => l.name && l.stage && Number.isFinite(l.value)),
  },
  invoices: {
    label: 'Invoices',
    widget: 'Invoices',
    required: { client: ['client', 'customer'], amount: ['amount', 'total'], due: ['due', 'due date'], status: ['status'] },
    optional: { id: ['id', 'invoice', 'number', 'invoice number'], issued: ['issued', 'date', 'issue date'] },
    parse: (rows) =>
      rows
        .map((r, i) => ({
          id: r.id || `INV-${i + 1}`,
          client: r.client,
          amount: toNumber(r.amount),
          issued: toIsoDate(r.issued),
          due: toIsoDate(r.due),
          status: String(r.status).toLowerCase().trim(),
        }))
        .filter((inv) => inv.client && Number.isFinite(inv.amount) && inv.due),
  },
}

// Map a dataset's fields to this CSV's actual header names (or null if a required one is missing).
function mapHeaders(def, headers) {
  const byNorm = new Map(headers.map((h) => [norm(h), h]))
  const find = (aliases) => aliases.map(norm).map((a) => byNorm.get(a)).find(Boolean)
  const map = {}
  for (const [field, aliases] of Object.entries(def.required)) {
    const h = find(aliases)
    if (!h) return null
    map[field] = h
  }
  for (const [field, aliases] of Object.entries(def.optional ?? {})) {
    const h = find(aliases)
    if (h) map[field] = h
  }
  return map
}

// The header row's column names (parsed with the same CSV rules as the data).
export function csvHeaders(text) {
  const firstLine = String(text).replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? ''
  const [row] = parseCsv(`${firstLine}\nx`)
  return row ? Object.keys(row).filter(Boolean) : []
}

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

// Parse a CSV as `key`. Returns { value, count } or throws with a helpful message.
export function parseDataset(key, text, source) {
  const def = DATASETS[key]
  if (!def) throw new Error(`Unknown data type "${key}".`)
  if (key === 'bank') return def.parse(text, source)

  const headers = csvHeaders(text)
  const map = mapHeaders(def, headers)
  if (!map) {
    const need = Object.values(def.required).map((a) => a[0])
    throw new Error(`${def.label} need the columns ${need.join(', ')}. This file has: ${headers.join(', ') || 'no header row'}.`)
  }
  const rows = parseCsv(text).map((r) => Object.fromEntries(Object.entries(map).map(([field, h]) => [field, r[h]])))
  const value = def.parse(rows)
  if (value.length === 0) {
    throw new Error(`No usable ${def.label.toLowerCase()} rows found. Check dates are like 2026-11-14 or 14/11/2026.`)
  }
  return { value, count: value.length }
}

// Everything uploaded from the dashboard (stored in KV by functions/api/uploads.js), ready
// to merge over the dashboard data. Used by the API route and the weekly email Worker.
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
