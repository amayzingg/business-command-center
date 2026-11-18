# The Cloudflare Worker

One Worker runs the whole dashboard (settings in `../wrangler.toml`):

- `index.js` serves the built site from `dist/`, sends `/api/*` to the route files
  in `api/`, and sends the weekly email on the cron schedule.
- `api/` holds server-side API routes. They fetch real data (Stripe, a Google Sheet,
  etc.) with secrets kept in Cloudflare instead of in the browser code.
- `email/` holds the weekly summary email: `email.config.json` (who, what, when) and
  `render.js` (the look).

Add a route in two steps:

```js
// 1. worker/api/hello.js
export default async function hello(request, env) {
  return Response.json({ ok: true })
}
```

```js
// 2. worker/index.js: import it and add it to ROUTES
import hello from './api/hello.js'
const ROUTES = { ..., '/api/hello': hello }
```

Test with `npm run dev:worker` (http://localhost:8788/api/hello).
