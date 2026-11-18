// GET /api/sheets → { tasks?, leads?, invoices?, live: { sheets: {...} } }
//
// Reads your private Google Sheet with a service account (GOOGLE-SHEETS.md). Runs in the
// Worker (listed in ../index.js), never in the browser. Needs GOOGLE_SA_EMAIL,
// GOOGLE_SA_PRIVATE_KEY and GOOGLE_SHEET_ID (REAL-DATA.md → "Where your keys live").
// The deployed route sits behind Cloudflare Access like the rest of the site.
import { fetchSheetsData } from '../../shared/sheets.js'

export default async function sheets(request, env) {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 })
  try {
    const body = await fetchSheetsData(env)
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    const status = /not set/.test(err.message) ? 501 : /No tab|Tab "|no tabs/.test(err.message) ? 422 : 502
    return Response.json({ error: err.message }, { status, headers: { 'Cache-Control': 'no-store' } })
  }
}
