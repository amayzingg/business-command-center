import data from './data/sample.json'
import { useBrand } from './brand.js'
import BrandSettings from './components/BrandSettings.jsx'

// Every file in src/widgets/ is picked up automatically, so adding a widget
// never means editing this file (and parallel sessions don't conflict here).
const modules = import.meta.glob('./widgets/*.jsx', { eager: true })

const widgets = Object.entries(modules)
  .map(([path, mod]) => ({ id: path, Component: mod.default, ...mod.meta }))
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

const sizeClasses = {
  sm: 'sm:col-span-1',
  md: 'sm:col-span-2',
  lg: 'sm:col-span-2 lg:col-span-4',
}

export default function App() {
  const { brand, rawName, update, reset } = useBrand(data.business.name)

  return (
    <>
    <div className="h-1 bg-gradient-to-r from-brand to-brand-accent" />
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            {brand.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{brand.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Command center · Data as of {new Date(`${data.asOf}T00:00`).toLocaleDateString()}
            </p>
          </div>
        </div>
        <BrandSettings
          brand={brand}
          rawName={rawName}
          placeholder={data.business.name}
          onChange={update}
          onReset={reset}
        />
      </header>

      <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.map(({ id, Component, title, size = 'sm' }) => (
          <section
            key={id}
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${sizeClasses[size]}`}
          >
            <h2 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h2>
            <Component data={data} />
          </section>
        ))}
      </main>
    </div>
    </>
  )
}
