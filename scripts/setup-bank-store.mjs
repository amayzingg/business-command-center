// One-time setup for "Upload bank CSV": creates a private Cloudflare KV store and links it
// to the dashboard (wrangler.toml) and the weekly email (email-worker/wrangler.toml).
//
//   npm run setup:bank-store      (then: npm run deploy && npm run email:deploy)
//
// Safe to re-run: if both files already have a BANK binding, it does nothing.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const project = JSON.parse(readFileSync('package.json', 'utf8')).config?.pagesProject
if (!project) {
  console.error('Set "config": { "pagesProject": "<your Pages project name>" } in package.json first.')
  process.exit(1)
}

const files = ['wrangler.toml', 'email-worker/wrangler.toml'].filter((f) => f === 'wrangler.toml' || existsSync(f))
const hasBinding = (f) => existsSync(f) && /binding\s*=\s*"BANK"/.test(readFileSync(f, 'utf8'))
if (files.every(hasBinding)) {
  console.log('Bank upload storage is already set up.')
  process.exit(0)
}

// Reuse an id already in one file; otherwise create a namespace.
let id = files.map((f) => existsSync(f) && readFileSync(f, 'utf8').match(/binding\s*=\s*"BANK"\s*\n\s*id\s*=\s*"([0-9a-f]+)"/)?.[1]).find(Boolean)
const title = `${project}-bank`
const run = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
// An existing namespace with this title (e.g. from an earlier run) is reused.
const findExisting = () => {
  try {
    const list = JSON.parse(run('npx wrangler kv namespace list').replace(/^[^[]*/s, ''))
    return list.find((n) => n.title === title)?.id
  } catch {
    return undefined
  }
}
if (!id) id = findExisting()
if (!id) {
  try {
    const out = run(`npx wrangler kv namespace create ${title}`)
    id = out.match(/"?id"?\s*[=:]\s*"([0-9a-f]{32})"/)?.[1]
  } catch (err) {
    console.error(err.stdout || err.message)
  }
  id ??= findExisting()
  if (!id) {
    console.error(`Could not create or find the KV namespace "${title}". Check \`npx wrangler whoami\` and try again.`)
    process.exit(1)
  }
}

const block = `\n# Private storage for "Upload bank CSV" (created by npm run setup:bank-store)\n[[kv_namespaces]]\nbinding = "BANK"\nid = "${id}"\n`

// The dashboard's wrangler.toml (Pages). Created if missing.
if (!existsSync('wrangler.toml')) {
  writeFileSync(
    'wrangler.toml',
    `# Cloudflare Pages settings for the dashboard (used by wrangler pages dev / deploy).\nname = "${project}"\npages_build_output_dir = "dist"\ncompatibility_date = "2026-10-01"\n`,
  )
}
for (const f of files) {
  if (!hasBinding(f)) writeFileSync(f, readFileSync(f, 'utf8').trimEnd() + '\n' + block)
}
console.log(`Bank upload storage ready (KV ${id}). Now run: npm run deploy && npm run email:deploy`)
