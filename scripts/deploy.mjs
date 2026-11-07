// Build and deploy the dashboard to Cloudflare Pages (production), using the project name
// in package.json → "config": { "pagesProject": "…" }. Always deploys as branch `main`
// so it goes to production, not a preview.
//
//   npm run deploy
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const project = JSON.parse(readFileSync('package.json', 'utf8')).config?.pagesProject
if (!project) {
  console.error('Set "config": { "pagesProject": "<your Pages project name>" } in package.json.')
  process.exit(1)
}
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
run('npm run build')
run(`npx wrangler pages deploy dist --project-name ${project} --branch main`)
