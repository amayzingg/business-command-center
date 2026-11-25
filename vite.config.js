import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { devApi } from './worker/vite-dev.js'

export default defineConfig({
  // devApi(): "Upload CSV" works in the local preview too (kept in memory, see worker/vite-dev.js).
  plugins: [react(), tailwindcss(), devApi()],
})
