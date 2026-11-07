import { useCallback, useEffect, useRef, useState } from 'react'

// API routes (Cloudflare Pages Functions in functions/api/) whose JSON is merged over the
// sample data. Each returns a partial `data` object, e.g. { invoices: [...], live: {...} }.
// If a route isn't available (plain `npm run dev`, no key set), the dashboard quietly
// keeps the sample data.
const SOURCES = ['/api/stripe']

const REFRESH_EVERY_MS = 5 * 60 * 1000 // while the tab is visible
const MIN_GAP_MS = 15 * 1000 // don't refetch more often than this on tab switches

// "YYYY-MM-DD" in the viewer's local time zone.
function localDay(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

async function fetchLive(base) {
  const results = await Promise.all(
    SOURCES.map((url) =>
      fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
        .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null))
        .catch(() => null),
    ),
  )
  const parts = results.filter(Boolean)
  const merged = parts.reduce((acc, part) => ({ ...acc, ...part, live: { ...acc.live, ...part.live } }), {
    ...base,
    live: {},
  })
  // With live data, "today" is now: widgets that count days (due this week, overdue)
  // use data.asOf, so it must follow the clock, not the sample file's date.
  if (parts.length > 0) {
    merged.sampleAsOf = base.asOf
    merged.asOf = localDay(new Date())
  }
  return merged
}

// Returns { data, refresh, refreshing, fetchedAt }. Refetches when the tab becomes
// visible again, every 5 minutes while it's visible, and when refresh() is called.
export function useLiveData(base) {
  const [data, setData] = useState(base)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchedAt, setFetchedAt] = useState(null)
  const lastRun = useRef(0)
  const inFlight = useRef(false)

  const refresh = useCallback(
    async ({ force = true } = {}) => {
      if (inFlight.current) return
      if (!force && Date.now() - lastRun.current < MIN_GAP_MS) return
      inFlight.current = true
      lastRun.current = Date.now()
      setRefreshing(true)
      try {
        const next = await fetchLive(base)
        setData(next)
        setFetchedAt(new Date())
      } finally {
        inFlight.current = false
        setRefreshing(false)
      }
    },
    [base],
  )

  useEffect(() => {
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh({ force: false })
    }
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, REFRESH_EVERY_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return { data, refresh, refreshing, fetchedAt }
}
