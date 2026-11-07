import { useEffect, useState } from 'react'
import defaults from './brand.json'

const STORAGE_KEY = 'bcc-brand'

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

// Brand = src/brand.json defaults, overridden per device by the settings panel.
export function useBrand(fallbackName) {
  const [overrides, setOverrides] = useState(readOverrides)
  const brand = { ...defaults, ...overrides }
  const name = brand.name?.trim() || fallbackName

  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--brand', brand.primary)
    root.setProperty('--brand-accent', brand.accent)
    document.title = `${name} · Command center`
  }, [brand.primary, brand.accent, name])

  function update(changes) {
    const next = { ...overrides, ...changes }
    setOverrides(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked (private mode): changes still apply for this visit.
    }
  }

  function reset() {
    setOverrides({})
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  return { brand: { ...brand, name }, rawName: brand.name ?? '', update, reset, defaults }
}
