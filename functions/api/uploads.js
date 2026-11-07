// /api/uploads: CSV uploads from the dashboard (bank statement, tasks, leads, invoices),
// stored in Cloudflare KV (binding `BANK`, set up with `npm run setup:bank-store`).
// Behind Cloudflare Access like the rest of the site. The raw CSV isn't stored, only
// the parsed rows (or, for bank statements, the summary).
//
//   GET                                → { tasks?, leads?, …, uploads: { tasks: {source, uploadedAt, count} } }
//   POST ?dataset=auto&preview=1 + CSV → { dataset, label, count, headers } (nothing saved)
//   POST ?dataset=<key> + CSV          → saves; { dataset, label, count }
//   DELETE ?dataset=<key>              → removes that upload
import { DATASETS, csvHeaders, detectDataset, parseDataset, readUploads, uploadKey as keyFor } from '../../shared/datasets.js'

const MAX_BYTES = 2 * 1024 * 1024
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

// Writes must come from the dashboard's own JavaScript: a custom header can't be sent
// cross-site without a CORS preflight, which this route never approves.
const fromDashboard = (request) => request.headers.get('X-Requested-With') === 'command-center'

export async function onRequest({ request, env }) {
  if (!env.BANK) {
    return json({ error: 'Upload storage is not set up. Run `npm run setup:bank-store`, then redeploy.' }, 501)
  }
  const url = new URL(request.url)
  const requested = url.searchParams.get('dataset') || 'auto'

  if (request.method === 'GET') return json(await readUploads(env.BANK))

  if (!fromDashboard(request)) return json({ error: 'Not allowed' }, 403)

  if (request.method === 'DELETE') {
    if (!DATASETS[requested]) return json({ error: 'Unknown data type' }, 400)
    await env.BANK.delete(keyFor(requested))
    return json({ ok: true })
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const text = await request.text()
  if (text.length > MAX_BYTES) return json({ error: 'That file is over 2 MB. Export a shorter range.' }, 413)
  const headers = csvHeaders(text)
  const dataset = requested === 'auto' ? detectDataset(headers) : requested
  if (!dataset || !DATASETS[dataset]) {
    return json(
      {
        error: `Couldn't tell what this file is (columns: ${headers.join(', ') || 'none'}). Pick a type.`,
        headers,
        choices: Object.fromEntries(Object.entries(DATASETS).map(([k, d]) => [k, d.label])),
      },
      422,
    )
  }

  const source = (request.headers.get('X-Filename') || 'upload.csv').slice(0, 120)
  let parsed
  try {
    parsed = parseDataset(dataset, text, source)
  } catch (err) {
    return json({ error: err.message, dataset, label: DATASETS[dataset].label, headers }, 400)
  }

  const summary = { dataset, label: DATASETS[dataset].label, widget: DATASETS[dataset].widget, count: parsed.count, headers }
  if (url.searchParams.get('preview') === '1') return json(summary)

  await env.BANK.put(keyFor(dataset), JSON.stringify({ value: parsed.value, source, uploadedAt: new Date().toISOString(), count: parsed.count }))
  return json(summary)
}
