// The email Worker is bundled at deploy time and can't check for optional files at
// runtime, so this copies the bank data it should use into email-worker/.generated/
// (git-ignored): your imported src/data/bank.json if it exists, otherwise the fictional
// src/data/bank.sample.json. Run automatically by `npm run email:dev` / `email:deploy`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const real = 'src/data/bank.json'
const sample = 'src/data/bank.sample.json'
const useReal = existsSync(real)
const bank = JSON.parse(readFileSync(useReal ? real : sample, 'utf8'))
if (!useReal) bank.sample = true

mkdirSync('email-worker/.generated', { recursive: true })
writeFileSync('email-worker/.generated/bank.json', JSON.stringify(bank) + '\n')
console.log(`Email uses ${useReal ? `imported bank data (${bank.source})` : 'sample bank data'}.`)
