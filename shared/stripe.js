// Shared by the website's API route (functions/api/stripe.js) and the weekly email Worker
// (email-worker/). Runs on Cloudflare only: the key never reaches the browser.

const STATUS = { paid: 'paid', draft: 'draft', void: 'void', uncollectible: 'overdue' }

function isoDate(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString().slice(0, 10) : null
}

// Returns { invoices, live } to merge over the dashboard data, or throws with a reason.
export async function fetchStripeData(key) {
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  // Workshop safety: this demo only ever talks to Stripe test mode.
  if (!/^(sk|rk)_test_/.test(key)) throw new Error('Use a Stripe *test* key (sk_test_… or rk_test_…)')

  const res = await fetch('https://api.stripe.com/v1/invoices?limit=50', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Stripe returned ${res.status}`)
  const { data } = await res.json()
  const now = Date.now() / 1000

  const invoices = data
    .filter((inv) => inv.status !== 'void')
    .map((inv) => ({
      id: inv.number ?? inv.id,
      client: inv.customer_name ?? inv.customer_email ?? 'Unknown customer',
      // `total`, not amount_paid: invoices marked paid outside Stripe report amount_paid 0.
      amount: inv.total / 100,
      issued: isoDate(inv.status_transitions?.finalized_at ?? inv.created),
      due: isoDate(inv.due_date ?? inv.created),
      status:
        inv.status === 'open'
          ? inv.due_date && inv.due_date < now
            ? 'overdue'
            : 'sent'
          : (STATUS[inv.status] ?? inv.status),
    }))

  return { invoices, live: { stripe: { mode: 'test', count: invoices.length, fetchedAt: new Date().toISOString() } } }
}
