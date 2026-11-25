// Lets "Upload CSV" work in the plain local preview (`npm run dev`, http://localhost:5173),
// which otherwise has no API. Add it to vite.config.js: `plugins: [react(), tailwindcss(), devApi()]`.
// Uploads are kept in memory until you stop the dev server (shared/memory-kv.js). Other
// /api/* routes answer "Not found" here, so the dashboard keeps its sample data for them;
// use `npm run dev:worker` to test those with your keys.
import uploads from './api/uploads.js'

export function devApi() {
  return {
    name: 'command-center-dev-api',
    apply: 'serve', // local servers only (npm run dev / vite preview), never part of the build
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

async function handle(req, res, next) {
  if (!req.url?.startsWith('/api/')) return next()
  try {
    const url = new URL(req.url, 'http://localhost')
    let response
    if (url.pathname === '/api/uploads') {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
      response = await uploads(new Request(url, { method: req.method, headers: req.headers, body }), { ALLOW_PREVIEW: '1' })
    } else {
      response = Response.json({ error: 'Not found (run npm run dev:worker for this route)' }, { status: 404 })
    }
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (err) {
    next(err)
  }
}
