// Upload every key in the root .dev.vars to Cloudflare, for both the dashboard (Pages)
// and the weekly email (Worker), so you only manage keys in one place.
//
//   npm run secrets:push
//
// Set your Pages project name in package.json → "config": { "pagesProject": "…" }.
// Run it again whenever you add or change a key in .dev.vars.
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const SKIP = new Set(['ALLOW_PREVIEW']) // local-only switches never go to Cloudflare

if (!existsSync('.dev.vars')) {
  console.error('No .dev.vars in this folder. Copy .dev.vars.example to .dev.vars and add your keys.')
  process.exit(1)
}
const keys = readFileSync('.dev.vars', 'utf8')
  .split(/\r?\n/)
  .filter((l) => /^\s*[A-Z][A-Z0-9_]*\s*=/.test(l))
  .map((l) => l.slice(0, l.indexOf('=')).trim())
  .filter((k) => !SKIP.has(k))
if (keys.length === 0) {
  console.error('.dev.vars has no KEY=value lines. Nothing to upload.')
  process.exit(1)
}

const project = JSON.parse(readFileSync('package.json', 'utf8')).config?.pagesProject
if (!project) {
  console.error('Set "config": { "pagesProject": "<your Pages project name>" } in package.json.')
  process.exit(1)
}

console.log(`Uploading ${keys.join(', ')} (values hidden)…`)
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
run(`npx wrangler pages secret bulk .dev.vars --project-name ${project}`)
if (existsSync('email-worker/wrangler.toml')) {
  run('npx wrangler secret bulk .dev.vars --config email-worker/wrangler.toml')
}
console.log('Done. Redeploy the dashboard (and the email Worker) so they pick up new keys.')
