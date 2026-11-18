// The Worker's name from wrangler.toml (`name = "…"`), used by the deploy scripts.
import { readFileSync } from 'node:fs'

export function workerName() {
  const name = readFileSync('wrangler.toml', 'utf8').match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1]
  if (!name) {
    console.error('Set name = "<your worker name>" at the top of wrangler.toml.')
    process.exit(1)
  }
  return name
}
