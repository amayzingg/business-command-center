// Build and deploy the dashboard, its API routes and the weekly email to Cloudflare
// Workers, using the settings (and the name) in wrangler.toml.
//
//   npm run deploy
import { execSync } from 'node:child_process'
import { workerName } from './worker-name.mjs'

const name = workerName()
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
run('node scripts/pick-bank.mjs')
run('npm run build')
console.log(`Deploying Worker "${name}"…`)
run('npx wrangler deploy')
