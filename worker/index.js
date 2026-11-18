// The dashboard's Cloudflare Worker (configured in ../wrangler.toml).
//   /api/*           → the route files in ./api/ (server-side: keys never reach the browser)
//   /email/*         → weekly email preview and test send, local only (npm run dev:worker)
//   everything else  → the built website in dist/
//   on the schedule  → sends the weekly email (./email/)
// Once you lock the URL with Cloudflare Access (DEPLOY.md), all of it needs your login.
import sheets from './api/sheets.js'
import stripe from './api/stripe.js'
import uploads from './api/uploads.js'
import { emailPreview, sendWeeklyEmail } from './email/index.js'

// To add an API route: create ./api/<name>.js that default-exports
// `async (request, env) => Response`, import it above and list it here.
const ROUTES = {
  '/api/sheets': sheets,
  '/api/stripe': stripe,
  '/api/uploads': uploads,
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const route = ROUTES[pathname]
    if (route) return route(request, env)
    if (pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 })
    if (pathname.startsWith('/email/')) return emailPreview(request, env)
    return env.ASSETS.fetch(request)
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(sendWeeklyEmail(env).then(console.log, (err) => console.error('Weekly email failed:', err.message)))
  },
}
