// GET /api/stripe → { invoices: [...], live: { stripe: {...} } }
//
// Runs in the Worker (listed in ../index.js), never in the browser. The key comes from
// the STRIPE_SECRET_KEY environment variable:
//   - locally: the git-ignored .dev.vars file (see .dev.vars.example)
//   - deployed: `npm run secrets:push`
// The deployed route sits behind Cloudflare Access like the rest of the site.
import { fetchStripeData } from '../../shared/stripe.js'

export default async function stripe(request, env) {
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 })
  try {
    const body = await fetchStripeData(env.STRIPE_SECRET_KEY)
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    const status = /not set/.test(err.message) ? 501 : /test/.test(err.message) ? 400 : 502
    return Response.json({ error: err.message }, { status })
  }
}
