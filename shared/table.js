// Reading spreadsheet exports the way people actually have them, not just US-English CSVs:
//   - any text encoding Excel saves (UTF-8, UTF-16, or Windows "ANSI" with accents)
//   - comma, semicolon (Excel in Portuguese, Spanish, French, German…), tab or | separators
//   - a few lines of account details above the real header row (common in bank exports)
//   - numbers like 1,234.56 or 1.234,56 or 1 234,56 or (12.00), decided per column
//   - dates like 2026-11-14, 14/11/2026, 11/14/2026, 14.11.26 or 14 Nov 2026, decided per column
// Used by shared/bank.js and shared/datasets.js (and so by the upload button, the import
// script and the Google Sheets source).

// Bytes (ArrayBuffer / Uint8Array) → text, guessing the encoding.
export function decodeText(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.subarray(2))
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(b.subarray(2))
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^﻿/, '')
  } catch {
    // Not valid UTF-8: Excel's "CSV (comma/semicolon delimited)" on Windows saves Windows-1252.
    return new TextDecoder('windows-1252').decode(b)
  }
}

// Lowercase, no accents, letters and digits only: "Data Lançamento" → "datalancamento".
export const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

// The separator used in this file: the candidate that splits the first lines most consistently.
export function detectDelimiter(text) {
  const sep = String(text).match(/^﻿?sep=(.)\s*$/m) // Excel's "sep=;" first line
  if (sep) return sep[1]
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim()).slice(0, 30)
  let best = { d: ',', score: 0 }
  for (const d of [',', ';', '\t', '|']) {
    const counts = lines.map((l) => countOutsideQuotes(l, d)).filter((n) => n > 0)
    if (!counts.length) continue
    const freq = new Map()
    for (const n of counts) freq.set(n, (freq.get(n) ?? 0) + 1)
    const [n, times] = [...freq].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]
    const score = times * 100 + n // lines that agree, then columns
    if (score > best.score) best = { d, score }
  }
  return best.d
}

function countOutsideQuotes(line, d) {
  let n = 0
  let quoted = false
  for (const c of line) {
    if (c === '"') quoted = !quoted
    else if (c === d && !quoted) n++
  }
  return n
}

// CSV text → array of rows (arrays of trimmed strings). Handles quotes and "" escapes.
export function parseRows(text, delimiter = detectDelimiter(text)) {
  const src = String(text).replace(/^﻿/, '').replace(/^sep=.\s*\r?\n/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const endRow = () => {
    row.push(field)
    field = ''
    if (row.some((f) => f.trim() !== '')) rows.push(row.map((f) => f.trim()))
    row = []
  }
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      endRow()
    } else field += c
  }
  if (field !== '' || row.length) endRow()
  return rows
}

// Find the header row (the first of the top 30 rows that `isHeader` accepts, else the first
// row with 2+ filled cells) and return { headers, records, delimiter }.
export function readTable(text, isHeader = () => false) {
  const delimiter = detectDelimiter(text)
  const rows = parseRows(text, delimiter)
  let at = rows.slice(0, 30).findIndex((r) => isHeader(r.filter(Boolean)))
  if (at < 0) at = Math.max(0, rows.findIndex((r) => r.filter(Boolean).length >= 2))
  const headers = (rows[at] ?? []).map((h) => h.trim())
  const records = rows.slice(at + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
  return { headers: headers.filter(Boolean), records, delimiter }
}

// Match fields to header names. `spec` is { field: [aliases…] }. Exact matches (ignoring
// case, accents, spaces and punctuation) win; otherwise an alias followed by a currency
// code counts ("Amount (GBP)", "Valor EUR", "Amount in USD"). Each header is used once.
const withCurrency = (header, alias) => header.startsWith(alias) && /^(in|em|en)?[a-z]{3}$/.test(header.slice(alias.length))
export function matchColumns(spec, headers) {
  const hs = headers.map((h) => ({ h, n: norm(h) })).filter((x) => x.n)
  const used = new Set()
  const map = {}
  for (const pass of ['exact', 'prefix']) {
    for (const [field, aliases] of Object.entries(spec)) {
      if (map[field]) continue
      for (const a of aliases.map(norm)) {
        const hit = hs.find((x) => !used.has(x.h) && (pass === 'exact' ? x.n === a : withCurrency(x.n, a)))
        if (hit) {
          map[field] = hit.h
          used.add(hit.h)
          break
        }
      }
    }
  }
  return map
}

// ---------- Numbers ----------

const clean = (v) =>
  String(v ?? '')
    .replace(/[\s  '’]/g, '')
    .replace(/[^\d.,()+\-a-z]/gi, '') // currency symbols, then codes: R$ -12,90 / -R$12,90 / 12.50 EUR
    .replace(/^([+-]?)(eur|usd|gbp|brl|chf|aud|cad|aoa|mzn|r|us|kz|mt)(?=[\d(+-])/i, '$1')
    .replace(/(eur|usd|gbp|brl|chf|aud|cad|aoa|mzn)$/i, '')

// What a value says about the decimal separator: 'dot', 'comma' or null (can't tell).
function decimalHint(raw) {
  const s = clean(raw).replace(/[^\d.,]/g, '')
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) return lastDot > lastComma ? 'dot' : 'comma'
  const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : null
  if (!sep) return null
  const parts = s.split(sep)
  if (parts.length > 2) return sep === '.' ? 'comma' : 'dot' // 1.234.567 → dots are thousands
  if (parts[1].length !== 3 || parts[0] === '' || parts[0] === '0') return sep === '.' ? 'dot' : 'comma'
  return null // 1.234 or 1,234: thousands or decimals, can't tell from this value alone
}

// Reads one number given the decimal separator. NaN if it isn't one.
export function parseNumber(value, decimal = 'dot') {
  if (typeof value === 'number') return value
  let s = clean(value)
  if (!s) return NaN
  let sign = 1
  if (/^\(.*\)$/.test(s)) {
    sign = -1
    s = s.slice(1, -1)
  }
  const suffix = s.match(/(-|\+|dr|db|d|cr|c)$/i) // "12,50-", "12.50 DR", "12,50 C"
  if (suffix && /\d/.test(s.slice(0, -suffix[0].length))) {
    if (/^(-|dr|db|d)$/i.test(suffix[0])) sign = -sign
    s = s.slice(0, -suffix[0].length)
  }
  const [thousands, dec] = decimal === 'comma' ? ['.', ','] : [',', '.']
  s = s.split(thousands).join('').replace(dec, '.')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN
  return sign * Number(s)
}

// Decide how a whole column writes numbers, so 1.234,56 isn't read as 1.23 and 1.234 isn't
// read differently on different rows. `fallback` is used when no value settles it.
// Returns { decimal, read(value) → number, example } and throws if the column mixes styles.
export function numberReader(values, { fallback = 'dot', label = 'amounts' } = {}) {
  const seen = { dot: null, comma: null }
  for (const v of values) {
    if (typeof v === 'number') continue
    const h = decimalHint(v)
    if (h && seen[h] == null) seen[h] = String(v).trim()
  }
  if (seen.dot && seen.comma) {
    throw new Error(
      `The ${label} mix two number styles ("${seen.dot}" and "${seen.comma}"), so it isn't clear which ` +
        'mark is the decimal point. Make them all look the same in your spreadsheet and try again.',
    )
  }
  const decimal = seen.comma ? 'comma' : seen.dot ? 'dot' : fallback
  return { decimal, guessed: !seen.comma && !seen.dot, read: (v) => parseNumber(v, decimal), example: seen[decimal] }
}

// ---------- Dates ----------

const MONTHS = {
  jan: 1, janeiro: 1, ene: 1, enero: 1, janv: 1, janvier: 1, januar: 1, gen: 1,
  feb: 2, fev: 2, fevereiro: 2, febrero: 2, fevr: 2, fevrier: 2, februar: 2,
  mar: 3, marco: 3, marzo: 3, mars: 3, marz: 3, maerz: 3,
  apr: 4, abr: 4, abril: 4, avr: 4, avril: 4, april: 4,
  may: 5, mai: 5, maio: 5, mayo: 5, mag: 5,
  jun: 6, june: 6, junho: 6, junio: 6, juin: 6, juni: 6, giu: 6,
  jul: 7, july: 7, julho: 7, julio: 7, juil: 7, juillet: 7, juli: 7, lug: 7,
  aug: 8, ago: 8, agosto: 8, aout: 8, august: 8,
  sep: 9, sept: 9, set: 9, setembro: 9, septiembre: 9, septembre: 9, september: 9,
  oct: 10, out: 10, outubro: 10, octubre: 10, octobre: 10, okt: 10, oktober: 10, ott: 10,
  nov: 11, novembro: 11, noviembre: 11, novembre: 11, november: 11,
  dec: 12, dez: 12, dezembro: 12, dic: 12, diciembre: 12, decembre: 12, dezember: 12,
  january: 1, february: 2, march: 3, october: 10, december: 12,
}
const pad = (n) => String(n).padStart(2, '0')
const fullYear = (y) => (y.length === 2 ? 2000 + Number(y) : Number(y))
const iso = (y, m, d) =>
  m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2200 ? `${y}-${pad(m)}-${pad(d)}` : null

function dateParts(value) {
  if (typeof value === 'number' || /^\d{5}(\.\d+)?$/.test(String(value ?? '').trim())) {
    const n = Number(value) // Excel / Google Sheets serial number (days since 1899-12-30)
    if (n > 20000 && n < 80000) return { iso: new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000).toISOString().slice(0, 10) }
  }
  const v = String(value ?? '').trim()
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:$|[T\s])/)
  if (m) return { iso: iso(+m[1], +m[2], +m[3]) }
  m = v.match(/^(\d{4})(\d{2})(\d{2})$/) // 20261114
  if (m) return { iso: iso(+m[1], +m[2], +m[3]) }
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:$|\s)/)
  if (m) return { a: +m[1], b: +m[2], y: fullYear(m[3]) } // day/month or month/day: decided per column
  m = norm(v.replace(/[,.]/g, ' ')).match(/^(\d{1,2})(?:de)?([a-z]+?)(?:de)?(\d{4}|\d{2})$/) // 14 Nov 2026, 14 de novembro de 2026
  if (m && MONTHS[m[2]]) return { iso: iso(fullYear(m[3]), MONTHS[m[2]], +m[1]) }
  m = norm(v.replace(/[,.]/g, ' ')).match(/^([a-z]+?)(\d{1,2})(\d{4})$/) // Nov 14 2026
  if (m && MONTHS[m[1]]) return { iso: iso(+m[3], MONTHS[m[1]], +m[2]) }
  return null
}

// Decide how a whole column writes dates (day/month or month/day) from values where only one
// reading works, e.g. 25/11 or 11/25. Returns { order, read(value) → 'YYYY-MM-DD' | null, example }.
export function dateReader(values, { fallback = 'dmy', label = 'dates' } = {}) {
  let dmy = null
  let mdy = null
  for (const v of values) {
    const p = dateParts(v)
    if (!p || p.iso !== undefined) continue
    if (p.a > 12 && p.b <= 12) dmy ??= String(v).trim()
    if (p.b > 12 && p.a <= 12) mdy ??= String(v).trim()
  }
  if (dmy && mdy) {
    throw new Error(
      `The ${label} mix day/month ("${dmy}") and month/day ("${mdy}") order. ` +
        'Make them all the same in your spreadsheet (or use 2026-11-14) and try again.',
    )
  }
  const order = mdy ? 'mdy' : dmy ? 'dmy' : fallback
  const read = (v) => {
    const p = dateParts(v)
    if (!p) return null
    if (p.iso !== undefined) return p.iso
    return order === 'mdy' ? iso(p.y, p.a, p.b) : iso(p.y, p.b, p.a)
  }
  const example = values.find((v) => dateParts(v)?.a !== undefined)
  return { order, guessed: !dmy && !mdy, read, example: example == null ? null : String(example).trim() }
}
