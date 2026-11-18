// Private Google Sheet → dashboard data (tasks, leads, invoices), read with a service
// account (see GOOGLE-SHEETS.md). Used by worker/api/sheets.js and the weekly email.
// Runs on Cloudflare only: the key never reaches the browser.
//
// Every tab is checked: a tab named Tasks / Leads / Invoices is read as that table, any
// other tab is recognised from its header row (same rules as "Upload CSV", so headers like
// "Task", "Due Date" or "Company" work). Tabs that match nothing are ignored.
import { DATASETS, detectDataset, parseRecords } from './datasets.js'

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const TABLES = ['tasks', 'leads', 'invoices'] // bank statements come from CSV, not Sheets

// Values pasted into the Cloudflare dashboard or .dev.vars sometimes keep their quotes.
const clean = (v) => String(v ?? '').trim().replace(/^"(.*)"$/s, '$1').trim()

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64urlJson = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)))

async function importKey(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
}

// An access token is good for an hour; reuse it while this Worker instance is warm.
let cached = null

async function accessToken(email, privateKey) {
  if (cached && cached.email === email && cached.expires > Date.now() + 60_000) return cached.token
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64urlJson({ alg: 'RS256', typ: 'JWT' })}.${b64urlJson({
    iss: email,
    scope: SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`
  let key
  try {
    key = await importKey(privateKey)
  } catch {
    throw new Error('GOOGLE_SA_PRIVATE_KEY is not a valid private key. Paste the whole private_key value from the JSON file.')
  }
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${b64url(sig)}`,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Google sign-in failed (${body.error_description || body.error || res.status}). Check GOOGLE_SA_EMAIL and GOOGLE_SA_PRIVATE_KEY.`)
  cached = { email, token: body.access_token, expires: Date.now() + (body.expires_in ?? 3600) * 1000 }
  return cached.token
}

async function google(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json().catch(() => ({}))
  if (res.status === 403 || res.status === 404) {
    throw new Error(
      `Google says ${res.status}: share the sheet with the service account email (Viewer), check GOOGLE_SHEET_ID, and that the Sheets API is enabled.`,
    )
  }
  if (!res.ok) throw new Error(`Google Sheets returned ${res.status}: ${body.error?.message ?? ''}`.trim())
  return body
}

// Turns one tab's rows (first row = headers) into a table, or null if it isn't one.
export function readTab(title, values) {
  const [headerRow = [], ...rest] = values ?? []
  const headers = headerRow.map((h) => String(h ?? '').trim())
  const named = TABLES.find((k) => k === title.toLowerCase().trim())
  const dataset = named ?? detectDataset(headers)
  if (!dataset || !TABLES.includes(dataset)) return null
  const records = rest
    .filter((row) => row.some((v) => v !== '' && v != null))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])))
  try {
    return { dataset, ...parseRecords(dataset, headers, records) }
  } catch (err) {
    return { dataset, error: `Tab "${title}": ${err.message}` }
  }
}

// Returns { tasks?, leads?, invoices?, live: { sheets: {...} } } to merge over the
// dashboard data, or throws with a reason.
export async function fetchSheetsData(env) {
  const email = clean(env.GOOGLE_SA_EMAIL)
  const privateKey = clean(env.GOOGLE_SA_PRIVATE_KEY)
  const sheetId = clean(env.GOOGLE_SHEET_ID)
  const missing = [!email && 'GOOGLE_SA_EMAIL', !privateKey && 'GOOGLE_SA_PRIVATE_KEY', !sheetId && 'GOOGLE_SHEET_ID'].filter(Boolean)
  if (missing.length) throw new Error(`${missing.join(', ')} not set`)

  const token = await accessToken(email, privateKey)
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`
  const meta = await google(`${base}?fields=sheets.properties.title`, token)
  const titles = (meta.sheets ?? []).map((s) => s.properties.title)
  if (!titles.length) throw new Error('The sheet has no tabs.')

  // Raw values: dates as serial numbers and checkboxes as true/false, so the sheet's
  // display format (14/11/2026, Nov 14…) doesn't matter.
  const ranges = titles.map((t) => `ranges=${encodeURIComponent(`'${t.replace(/'/g, "''")}'`)}`).join('&')
  const batch = await google(
    `${base}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER`,
    token,
  )

  const out = {}
  const tabs = {}
  const problems = []
  batch.valueRanges?.forEach((range, i) => {
    const table = readTab(titles[i], range.values)
    if (!table) return
    if (table.error) return problems.push(table.error)
    if (out[table.dataset]) return // first matching tab wins
    out[table.dataset] = table.value
    tabs[table.dataset] = { tab: titles[i], count: table.count, label: DATASETS[table.dataset].label }
  })
  if (!Object.keys(tabs).length) {
    throw new Error(
      problems.join(' ') ||
        `No tab looks like tasks, leads or invoices (tabs: ${titles.join(', ')}). Name a tab Tasks or Leads, or use headers like title, due / name, stage, value.`,
    )
  }
  return { ...out, live: { sheets: { fetchedAt: new Date().toISOString(), tabs, problems } } }
}
