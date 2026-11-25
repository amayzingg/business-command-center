import { useRef, useState } from 'react'
import { spreadsheetToCsv } from '../../shared/spreadsheet.js'

// Header control: upload a CSV or Excel file (bank statement, tasks, leads or invoices).
// Excel files are turned into CSV here in the browser. The server detects the type from
// the header row and says how it read numbers and dates; you confirm or change it, then
// it's saved privately (Cloudflare KV, behind Access) and the dashboard refreshes.
const TYPES = { bank: 'Bank statement', tasks: 'Tasks', leads: 'Leads', invoices: 'Invoices' }
const HEADERS = { 'Content-Type': 'text/csv', 'X-Requested-With': 'command-center' }
const ACCEPT = '.csv,.txt,.tsv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const NO_SERVER =
  "Upload couldn't reach the dashboard's server. On your computer, open the dashboard with npm run dev " +
  '(or ask your assistant to "show me the dashboard") and try again.'

const chip =
  'inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

// Always resolves to { ok, status, body }, with body.error set when something went wrong.
async function post(dataset, file, text, preview) {
  try {
    const res = await fetch(`/api/uploads?dataset=${dataset}${preview ? '&preview=1' : ''}`, {
      method: 'POST',
      headers: { ...HEADERS, 'X-Filename': encodeURIComponent(file.name) },
      body: text,
    })
    if (!res.headers.get('content-type')?.includes('json')) return { ok: false, status: res.status, body: { error: NO_SERVER } }
    return { ok: res.ok, status: res.status, body: await res.json() }
  } catch {
    return { ok: false, status: 0, body: { error: NO_SERVER } }
  }
}

export default function DataUpload({ uploads = {}, onDone }) {
  const input = useRef(null)
  const [pending, setPending] = useState(null) // { file, text, dataset, count, notes, error }
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { text, error }

  async function check(file, text, dataset) {
    setBusy(true)
    const { ok, status, body } = await post(dataset, file, text, true)
    setBusy(false)
    if (status === 501 || body.error === NO_SERVER) {
      setPending(null)
      setMessage({ error: true, text: body.error })
      return
    }
    setPending({
      file,
      text,
      dataset: body.dataset || (dataset === 'auto' ? '' : dataset),
      count: ok ? body.count : 0,
      notes: ok ? (body.notes ?? []) : [],
      error: ok ? '' : body.error || 'Something went wrong reading that file.',
    })
  }

  async function save() {
    setBusy(true)
    const { ok, body } = await post(pending.dataset, pending.file, pending.text, false)
    setBusy(false)
    if (!ok) return setPending({ ...pending, error: body.error || 'Upload failed' })
    setPending(null)
    setMessage({
      text:
        `Saved ${body.count} rows of ${body.label.toLowerCase()} → ${body.widget}` +
        (body.local ? ' (test upload on this computer: gone when you stop the dev server)' : ''),
    })
    onDone?.()
  }

  async function pick(file) {
    setMessage(null)
    setPending(null)
    if (file.size > 5 * 1024 * 1024) return setMessage({ error: true, text: 'That file is over 5 MB. Export a shorter date range.' })
    let text
    try {
      text = await spreadsheetToCsv(await file.arrayBuffer())
    } catch (err) {
      return setMessage({ error: true, text: `${file.name}: ${err.message}` })
    }
    check(file, text, 'auto')
  }

  async function remove(dataset) {
    setBusy(true)
    await fetch(`/api/uploads?dataset=${dataset}`, { method: 'DELETE', headers: HEADERS }).catch(() => null)
    setBusy(false)
    setMessage({ text: `Removed uploaded ${TYPES[dataset].toLowerCase()}` })
    onDone?.()
  }

  return (
    <>
      <button
        type="button"
        className={chip}
        disabled={busy}
        title="CSV or Excel (.xlsx): bank statement, tasks, leads or invoices"
        onClick={() => input.current?.click()}
      >
        ⇪ Upload CSV
      </button>
      {Object.entries(uploads).map(([key, u]) => (
        <span key={key} className={chip} title={`${u.source}, uploaded ${new Date(u.uploadedAt).toLocaleString()}`}>
          {TYPES[key] ?? key}: {u.count}
          <button
            type="button"
            aria-label={`Remove uploaded ${TYPES[key] ?? key}`}
            className="ml-0.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
            onClick={() => remove(key)}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) pick(file)
        }}
      />

      {pending && (
        <div className="basis-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate font-medium">{pending.file.name}</span>
            <label className="flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">{pending.error ? 'Type:' : 'Looks like'}</span>
              <select
                value={pending.dataset}
                onChange={(e) => check(pending.file, pending.text, e.target.value)}
                className="rounded border border-slate-300 bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-800"
              >
                {!pending.dataset && <option value="">Choose…</option>}
                {Object.entries(TYPES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {!pending.error && <span className="text-slate-500 dark:text-slate-400">{pending.count} rows</span>}
            <span className="ml-auto flex gap-1">
              <button
                type="button"
                disabled={busy || Boolean(pending.error) || !pending.dataset}
                onClick={save}
                className="rounded bg-brand px-2 py-0.5 font-medium text-white disabled:opacity-50"
              >
                Save
              </button>
              <button type="button" onClick={() => setPending(null)} className={chip}>
                Cancel
              </button>
            </span>
          </div>
          {pending.error && <p className="mt-1 text-rose-600 dark:text-rose-400">{pending.error}</p>}
          {!pending.error && pending.notes.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
              {pending.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          )}
          {!pending.error && pending.dataset && (
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Check the lines above, then Save. Replaces the {TYPES[pending.dataset].toLowerCase()} shown on the dashboard.
            </p>
          )}
        </div>
      )}
      {message && (
        <span role="status" className={`basis-full text-xs ${message.error ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
          {message.text}
        </span>
      )}
    </>
  )
}
