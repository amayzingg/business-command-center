// One-time setup for "Upload CSV": creates a private Cloudflare KV store and links it to
// the Worker in wrangler.toml (the dashboard and the weekly email both use it).
//
//   npm run setup:bank-store      (then: npm run deploy)
//
// Safe to re-run: if wrangler.toml already has a BANK binding, it does nothing.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { workerName } from './worker-name.mjs'

const file = 'wrangler.toml'
if (/binding\s*=\s*"BANK"/.test(readFileSync(file, 'utf8'))) {
  console.log('Upload storage is already set up.')
  process.exit(0)
}

const title = `${workerName()}-bank`
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
let id = findExisting()
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

const block = `\n# Private storage for "Upload CSV" (created by npm run setup:bank-store)\n[[kv_namespaces]]\nbinding = "BANK"\nid = "${id}"\n`
writeFileSync(file, readFileSync(file, 'utf8').trimEnd() + '\n' + block)
console.log(`Upload storage ready (KV ${id}). Now run: npm run deploy`)
