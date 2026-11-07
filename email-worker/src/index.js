// Weekly summary email. Runs on the cron schedule in ../wrangler.toml.
// Customize what it says in ../email.config.json, the look in ./render.js.
import config from '../email.config.json'
import sample from '../../src/data/sample.json'
// Written by scripts/pick-bank.mjs (run by npm run email:dev / email:deploy): your
// imported bank.json if it exists, otherwise the fictional bank.sample.json.
import bank from '../.generated/bank.json'
import brand from '../../src/brand.json'
import { fetchStripeData } from '../../shared/stripe.js'
import { buildSummary } from '../../shared/summary.js'
import { readUploads } from '../../shared/datasets.js'
import { renderEmail } from './render.js'

// Same data the dashboard shows: sample data + imported files + live APIs.
async function loadData(env) {
  // Uploaded CSVs (from the dashboard, in KV) win over imported files and the sample.
  const up = env.BANK ? await readUploads(env.BANK).catch(() => ({ uploads: {} })) : { uploads: {} }
  const { uploads, ...uploadedData } = up
  const data = { ...sample, bank, ...uploadedData }
  const bankData = data.bank
  const notes = [
    bankData.sample
      ? 'Cash figures are sample bank data (upload a CSV on the dashboard, or use /update-bank).'
      : `Cash figures from ${bankData.source}, ${bankData.uploaded ? 'uploaded' : 'imported'} ${(bankData.importedAt ?? '').slice(0, 10) || 'earlier'} (last transaction ${bankData.asOf}).`,
  ]
  const others = Object.entries(uploads).filter(([k]) => k !== 'bank')
  if (others.length) {
    notes.push(`Uploaded: ${others.map(([, u]) => `${u.label} (${u.source}, ${u.uploadedAt.slice(0, 10)})`).join('; ')}.`)
  }
  if (env.STRIPE_SECRET_KEY) {
    try {
      Object.assign(data, await fetchStripeData(env.STRIPE_SECRET_KEY))
      const fetched = new Date()
      notes.push(`Invoices are live from Stripe (test mode), fetched ${fetched.toUTCString().slice(5, 22)} UTC.`)
    } catch (err) {
      notes.push(`Stripe unavailable (${err.message}); invoices are sample data.`)
    }
  }
  // With any live source, "today" is now (UTC): overdue / due-this-week counts and the
  // "data as of" line follow the clock instead of the sample file's date.
  if (data.live && Object.keys(data.live).length) {
    data.asOf = new Date().toISOString().slice(0, 10)
  } else {
    notes.push('No live sources connected; all figures are sample data.')
  }
  return { data, notes }
}

async function buildEmail(env) {
  const { data, notes } = await loadData(env)
  const name = brand.name?.trim() || data.business.name
  const summary = buildSummary(data)
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const subject = config.subject.replace('{name}', name).replace('{date}', date)
  const { html, text } = renderEmail({ config, brand: { ...brand, name }, currency: data.business.currency, summary, notes, asOf: data.asOf })
  return { subject, html, text }
}

async function send(env) {
  if (!config.enabled) return 'disabled in email.config.json'
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
  const { subject, html, text } = await buildEmail(env)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.from, to: config.to, subject, html, text }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${body}`)
  return `sent to ${config.to.join(', ')}`
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(send(env).then(console.log, (err) => console.error('Weekly email failed:', err.message)))
  },

  // Local testing only (npm run email:dev sets ALLOW_PREVIEW=1; there's no public URL):
  //   /preview → see the email in the browser    /send → send it now
  async fetch(request, env) {
    if (env.ALLOW_PREVIEW !== '1') return new Response('Not found', { status: 404 })
    const { pathname } = new URL(request.url)
    try {
      if (pathname === '/send') return new Response(await send(env))
      const { subject, html } = await buildEmail(env)
      return new Response(html.replace('<body', `<body data-subject="${subject.replace(/"/g, '')}"`), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } catch (err) {
      return new Response(err.message, { status: 500 })
    }
  },
}
