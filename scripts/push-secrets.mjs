// Upload every key in the root .dev.vars to your Cloudflare Worker (dashboard, API
// routes and weekly email all share it), so you only manage keys in one place.
//
//   npm run secrets:push
//
// Deploy once first (npm run deploy) so the Worker exists. Run this again whenever you
// add or change a key in .dev.vars. Secrets apply straight away, no redeploy needed.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { workerName } from './worker-name.mjs'

// Local-only switches never go to Cloudflare (ALLOW_PREVIEW would expose /email/send).
const SKIP = new Set(['ALLOW_PREVIEW'])

if (!existsSync('.dev.vars')) {
  console.error('No .dev.vars in this folder. Copy .dev.vars.example to .dev.vars and add your keys.')
  process.exit(1)
}
const all = readFileSync('.dev.vars', 'utf8')
  .split(/\r?\n/)
  .filter((l) => /^\s*[A-Z][A-Z0-9_]*\s*=/.test(l))
  .filter((l) => !SKIP.has(l.slice(0, l.indexOf('=')).trim()))
// Placeholder values copied from .dev.vars.example are skipped, so they can't overwrite a
// real key you typed into the Cloudflare dashboard.
const isPlaceholder = (l) => /replace_me/.test(l)
const lines = all.filter((l) => !isPlaceholder(l))
const placeholders = all.filter(isPlaceholder).map((l) => l.slice(0, l.indexOf('=')).trim())
if (placeholders.length) console.log(`Skipping ${placeholders.join(', ')} (still the example placeholder).`)
if (lines.length === 0) {
  console.error('.dev.vars has no real KEY=value lines. Nothing to upload.')
  process.exit(1)
}

const name = workerName()
const keys = lines.map((l) => l.slice(0, l.indexOf('=')).trim())
console.log(`Uploading ${keys.join(', ')} to Worker "${name}" (values hidden)…`)

// Upload a filtered copy, so skipped keys never leave this machine.
const dir = mkdtempSync(join(tmpdir(), 'bcc-secrets-'))
const file = join(dir, '.dev.vars')
try {
  writeFileSync(file, lines.join('\n') + '\n')
  execSync(`npx wrangler secret bulk "${file}" --name ${name}`, { stdio: 'inherit' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log('Done.')
