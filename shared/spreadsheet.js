// Any spreadsheet file a bank or Excel gives you → CSV text the upload reads.
//   .csv / .txt / .tsv   in any encoding Excel saves (see decodeText in shared/table.js)
//   .xlsx                Excel workbook (first sheet), read here without any library
//   .xls                 many banks' ".xls" is really an HTML table or text: both work.
//                        A genuine old Excel 97 file doesn't; the error says how to resave it.
// Used in the browser by the Upload button and in Node by scripts/import-bank.mjs.
import { decodeText } from './table.js'

export async function spreadsheetToCsv(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (b[0] === 0x50 && b[1] === 0x4b) return rowsToCsv(await readXlsx(b)) // "PK": a zip, so .xlsx
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) {
    throw new Error(
      'This is an old-style Excel file (.xls) that can\'t be read directly. Open it in Excel (or Google ' +
        'Sheets), choose File → Save As → "Excel Workbook (.xlsx)" or "CSV UTF-8", and upload that.',
    )
  }
  const text = decodeText(b)
  if (/^\s*<(!doctype|html|table|\?xml)/i.test(text)) return rowsToCsv(htmlTableRows(text))
  return text
}

// Rows (arrays of cells) → CSV text with commas, quoting where needed.
export function rowsToCsv(rows) {
  const cell = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map((r) => r.map(cell).join(',')).join('\n')
}

const unescapeXml = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

// An HTML page saved with an .xls name: read its biggest table.
function htmlTableRows(html) {
  const tables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map((m) => m[0])
  const table = tables.sort((a, b) => b.length - a.length)[0] ?? ''
  return [...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((td) => unescapeXml(td[1].replace(/<br\s*\/?>/gi, ' ')).replace(/\s+/g, ' ').trim()),
  )
}

// ---------- .xlsx: a zip of XML files ----------

async function unzip(b) {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let eocd = -1
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('This Excel file looks damaged. Open it in Excel and save it again.')
  const files = new Map()
  let p = view.getUint32(eocd + 16, true)
  const count = view.getUint16(eocd + 10, true)
  for (let n = 0; n < count && view.getUint32(p, true) === 0x02014b50; n++) {
    const method = view.getUint16(p + 10, true)
    const size = view.getUint32(p + 20, true)
    const nameLen = view.getUint16(p + 28, true)
    const extraLen = view.getUint16(p + 30, true)
    const commentLen = view.getUint16(p + 32, true)
    const local = view.getUint32(p + 42, true)
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen))
    files.set(name, { method, size, local })
    p += 46 + nameLen + extraLen + commentLen
  }
  return async (name) => {
    const f = files.get(name)
    if (!f) return null
    const start = f.local + 30 + view.getUint16(f.local + 26, true) + view.getUint16(f.local + 28, true)
    const data = b.subarray(start, start + f.size)
    if (f.method === 0) return new TextDecoder().decode(data)
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return new Response(stream).text()
  }
}

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]

// Excel's built-in date formats, plus custom ones that show days or years.
function dateStyles(stylesXml) {
  const custom = new Map(
    [...(stylesXml ?? '').matchAll(/<numFmt\b[^>]*>/g)].map((m) => [attr(m[0], 'numFmtId'), unescapeXml(attr(m[0], 'formatCode') ?? '')]),
  )
  const xfs = (stylesXml ?? '').match(/<cellXfs\b[\s\S]*?<\/cellXfs>/)?.[0] ?? ''
  return [...xfs.matchAll(/<xf\b[^>]*>/g)].map((m) => {
    const id = Number(attr(m[0], 'numFmtId') ?? 0)
    if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (id >= 27 && id <= 36) || (id >= 50 && id <= 58)) return true
    const code = (custom.get(String(id)) ?? '').replace(/"[^"]*"|\[[^\]]*\]|\\./g, '')
    return /[dy]/i.test(code)
  })
}

const serialToIso = (n) => new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000).toISOString().slice(0, 10)
const colIndex = (ref) => [...(ref.match(/^[A-Z]+/)?.[0] ?? 'A')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1

async function readXlsx(b) {
  const read = await unzip(b)
  const workbook = (await read('xl/workbook.xml')) ?? ''
  const rels = (await read('xl/_rels/workbook.xml.rels')) ?? ''
  const firstSheet = workbook.match(/<sheet\b[^>]*>/)?.[0] ?? ''
  const relId = attr(firstSheet, 'r:id')
  const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((r) => attr(r, 'Id') === relId)
  let target = rel ? attr(rel, 'Target') : 'worksheets/sheet1.xml'
  target = target.startsWith('/') ? target.slice(1) : `xl/${target}`
  const sheet = await read(target)
  if (!sheet) throw new Error('Couldn\'t find a sheet in this Excel file. Save it as CSV and upload that.')

  const shared = [...((await read('xl/sharedStrings.xml')) ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t\b[^>]*?(?<!\/)>([\s\S]*?)<\/t>/g)].map((t) => unescapeXml(t[1])).join(''),
  )
  const isDate = dateStyles(await read('xl/styles.xml'))

  const rows = []
  for (const row of sheet.matchAll(/<row\b[^>]*?(?<!\/)>([\s\S]*?)<\/row>/g)) {
    const cells = []
    for (const c of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, attrs, inner = ''] = c
      const type = attr(attrs, 't')
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1]
      let value = ''
      if (type === 's') value = shared[Number(v)] ?? ''
      else if (type === 'inlineStr') value = [...inner.matchAll(/<t\b[^>]*?(?<!\/)>([\s\S]*?)<\/t>/g)].map((t) => unescapeXml(t[1])).join('')
      else if (type === 'str' || type === 'e') value = v == null ? '' : unescapeXml(v)
      else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE'
      else if (v != null) value = isDate[Number(attr(attrs, 's') ?? 0)] ? serialToIso(Number(v)) : String(Number(v))
      const ref = attr(attrs, 'r')
      cells[ref ? colIndex(ref) : cells.length] = value
    }
    rows.push(Array.from(cells, (x) => x ?? ''))
  }
  return rows
}
