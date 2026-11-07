import { useState } from 'react'

const PRESETS = [
  { primary: '#4f46e5', accent: '#10b981' },
  { primary: '#0f766e', accent: '#f59e0b' },
  { primary: '#be123c', accent: '#0ea5e9' },
  { primary: '#7c3aed', accent: '#ec4899' },
  { primary: '#1d4ed8', accent: '#22c55e' },
  { primary: '#334155', accent: '#f97316' },
]

export default function BrandSettings({ brand, rawName, placeholder, onChange, onReset }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Customize brand"
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Customize
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Brand name
            <input
              type="text"
              value={rawName}
              placeholder={placeholder}
              onChange={(e) => onChange({ name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-brand dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ColorField label="Primary" value={brand.primary} onChange={(v) => onChange({ primary: v })} />
            <ColorField label="Accent" value={brand.accent} onChange={(v) => onChange({ accent: v })} />
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">Presets</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.primary}
                type="button"
                onClick={() => onChange(p)}
                aria-label={`Use ${p.primary} and ${p.accent}`}
                className="flex h-7 w-11 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
              >
                <span className="flex-1" style={{ background: p.primary }} />
                <span className="w-3" style={{ background: p.accent }} />
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Done
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
            Saved on this device only. To change it everywhere, edit src/brand.json.
          </p>
        </div>
      )}
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
      <div className="mt-1 flex items-center gap-2 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-600">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{value}</span>
      </div>
    </label>
  )
}
