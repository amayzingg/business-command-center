// Weekly summary email, sent by the dashboard's Worker on the cron schedule in
// ../../wrangler.toml. Customize what it says in ./email.config.json, the look in ./render.js.
import config from './email.config.json'
import sample from '../../src/data/sample.json'
// Written by scripts/pick-bank.mjs (run by npm run dev:worker / deploy): your imported
// bank.json if it exists, otherwise the fictional bank.sample.json.
import bank from '../.generated/bank.json'
import brand from '../../src/brand.json'
import { fetchStripeData } from '../../shared/stripe.js'
import { fetchSheetsData } from '../../shared/sheets.js'
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
  if (env.GOOGLE_SHEET_ID) {
    try {
      const sheet = await fetchSheetsData(env)
      Object.assign(data, sheet, { live: { ...data.live, ...sheet.live } })
      notes.push(`${Object.values(sheet.live.sheets.tabs).map((t) => t.label).join(' and ')} live from your Google Sheet.`)
    } catch (err) {
      notes.push(`Google Sheet unavailable (${err.message}).`)
    }
  }
  if (env.STRIPE_SECRET_KEY) {
    try {
      const stripe = await fetchStripeData(env.STRIPE_SECRET_KEY)
      Object.assign(data, stripe, { live: { ...data.live, ...stripe.live } })
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

// "Name <me@example.com>" → { name, email }; a bare address stays a string.
function parseAddress(value) {
  const m = /^\s*(.+?)\s*<([^>]+)>\s*$/.exec(value)
  return m ? { name: m[1].replace(/^"|"$/g, ''), email: m[2] } : value.trim()
}

// Cloudflare Email Service if the EMAIL binding is on (wrangler.toml → [[send_email]]),
// otherwise Resend if RESEND_API_KEY is set.
async function deliver(env, { subject, html, text }) {
  if (env.EMAIL) {
    const { messageId } = await env.EMAIL.send({ from: parseAddress(config.from), to: config.to, subject, html, text })
    return `sent with Cloudflare Email to ${config.to.join(', ')} (${messageId})`
  }
  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.from, to: config.to, subject, html, text }),
    })
    const body = await res.text()
    if (!res.ok) throw new Error(`Resend returned ${res.status}: ${body}`)
    return `sent with Resend to ${config.to.join(', ')}`
  }
  throw new Error('No way to send: turn on [[send_email]] in wrangler.toml, or set RESEND_API_KEY in .dev.vars')
}

export async function sendWeeklyEmail(env) {
  if (!config.enabled) return 'disabled in email.config.json'
  return deliver(env, await buildEmail(env))
}

// Local testing only: npm run dev:worker sets ALLOW_PREVIEW=1. The deployed Worker
// never does, so these paths return 404 there.
//   /email/preview → see the email in the browser    /email/send → send it now
export async function emailPreview(request, env) {
  if (env.ALLOW_PREVIEW !== '1') return new Response('Not found', { status: 404 })
  const { pathname } = new URL(request.url)
  try {
    if (pathname === '/email/send') return new Response(await sendWeeklyEmail(env))
    if (pathname !== '/email/preview') return new Response('Not found', { status: 404 })
    const { subject, html } = await buildEmail(env)
    return new Response(html.replace('<body', `<body data-subject="${subject.replace(/"/g, '')}"`), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    return new Response(err.message, { status: 500 })
  }
}
