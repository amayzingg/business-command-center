// Create a few FAKE customers and invoices in your Stripe *test mode* account so the
// dashboard has something to show. Reads STRIPE_SECRET_KEY from .dev.vars.
//
//   npm run seed:stripe
//
// Refuses to run with a live key. Safe to run more than once (it just adds more).
import { readFileSync } from 'node:fs'

const vars = Object.fromEntries(
  readFileSync('.dev.vars', 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Z_]+\s*=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const key = vars.STRIPE_SECRET_KEY
if (!key || !/^(sk|rk)_test_/.test(key)) {
  console.error('STRIPE_SECRET_KEY in .dev.vars must be a Stripe TEST key (sk_test_…). Nothing was created.')
  process.exit(1)
}

async function stripe(path, params = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`${path}: ${body.error?.message ?? res.status}`)
  return body
}

const fake = [
  { name: 'Acme Logistics', email: 'billing@acme-logistics.example', amount: 4000, days: 14, desc: 'Brand voice workshop' },
  { name: 'Granite Legal', email: 'ap@granite-legal.example', amount: 7500, days: 30, desc: 'Website copy, phase 1' },
  { name: 'Bluebird Cafe', email: 'owner@bluebird-cafe.example', amount: 1200, days: 7, desc: 'Social content pack' },
  { name: 'Harbor Books', email: 'hello@harbor-books.example', amount: 2600, days: 14, desc: 'Podcast intro script', paid: true },
]

for (const f of fake) {
  const customer = await stripe('customers', { name: f.name, email: f.email, description: 'Workshop demo (fake)' })
  const invoice = await stripe('invoices', {
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: String(f.days),
    currency: 'eur',
  })
  await stripe('invoiceitems', {
    customer: customer.id,
    invoice: invoice.id,
    amount: String(f.amount * 100),
    currency: 'eur',
    description: f.desc,
  })
  await stripe(`invoices/${invoice.id}/finalize`)
  if (f.paid) await stripe(`invoices/${invoice.id}/pay`, { paid_out_of_band: 'true' })
  console.log(`${f.paid ? 'paid' : 'open'}  €${f.amount}  ${f.name}`)
}
console.log('Done. These are test-mode records; they never charge anyone.')
