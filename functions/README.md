# Cloudflare Pages Functions

Files here become API routes when deployed to Cloudflare Pages.
`functions/api/invoices.js` → `/api/invoices`.

Use this to fetch real data (Stripe, a Google Sheet, etc.) with secrets kept in
Cloudflare environment variables instead of in the browser code.

```js
// functions/api/hello.js
export function onRequest() {
  return Response.json({ ok: true })
}
```
