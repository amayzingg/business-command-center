// A stand-in for a Cloudflare KV store, kept in memory. Lets "Upload CSV" work on your
// computer before the real store is set up (npm run setup:bank-store). Everything in it
// is gone when the dev server stops. Never used by the deployed site.
const store = new Map()

export const memoryKv = {
  async get(key, type) {
    const v = store.get(key)
    return v == null ? null : type === 'json' ? JSON.parse(v) : v
  },
  async put(key, value) {
    store.set(key, String(value))
  },
  async delete(key) {
    store.delete(key)
  },
}
