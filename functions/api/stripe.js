// GET /api/stripe → { invoices: [...], live: { stripe: {...} } }
//
// Runs on Cloudflare (a Pages Function), never in the browser. The key comes from the
// STRIPE_SECRET_KEY environment variable:
//   - locally: a git-ignored .dev.vars file (see .dev.vars.example)
//   - deployed: `npx wrangler pages secret put STRIPE_SECRET_KEY --project-name <project>`
// The deployed route sits behind Cloudflare Access like the rest of the site.
import { fetchStripeData } from '../../shared/stripe.js'

export async function onRequestGet({ env }) {
  try {
    const body = await fetchStripeData(env.STRIPE_SECRET_KEY)
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    const status = /not set/.test(err.message) ? 501 : /test/.test(err.message) ? 400 : 502
    return Response.json({ error: err.message }, { status })
  }
}
