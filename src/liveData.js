import { useEffect, useState } from 'react'

// API routes (Cloudflare Pages Functions in functions/api/) whose JSON is merged over the
// sample data when the dashboard loads. Each returns a partial `data` object, e.g.
// { invoices: [...] }. If a route isn't available (plain `npm run dev`, no key set),
// the dashboard quietly keeps the sample data.
const SOURCES = ['/api/stripe']

export function useLiveData(base) {
  const [data, setData] = useState(base)

  useEffect(() => {
    let cancelled = false
    Promise.all(
      SOURCES.map((url) =>
        fetch(url, { headers: { Accept: 'application/json' } })
          .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      const merged = results.filter(Boolean).reduce(
        (acc, part) => ({ ...acc, ...part, live: { ...acc.live, ...part.live } }),
        { ...base, live: {} },
      )
      setData(merged)
    })
    return () => {
      cancelled = true
    }
  }, [base])

  return data
}
