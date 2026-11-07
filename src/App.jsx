import sample from './data/sample.json'
import { useBrand } from './brand.js'
import { useLiveData } from './liveData.js'
import BrandSettings from './components/BrandSettings.jsx'
import BrandMark from './components/BrandMark.jsx'

// Every other JSON file in src/data/ is added as a field named after the file,
// e.g. src/data/bank.json → data.bank. Importers in scripts/ write these files and they're
// git-ignored; a committed `<name>.sample.json` is the fallback when no import exists.
const extraData = import.meta.glob(['./data/*.json', '!./data/sample.json'], { eager: true, import: 'default' })
const imported = {}
for (const [path, value] of Object.entries(extraData)) {
  const file = path.split('/').pop().replace('.json', '')
  const name = file.replace(/\.sample$/, '')
  const isSample = file.endsWith('.sample')
  if (!isSample || !(name in imported)) imported[name] = isSample ? { ...value, sample: true } : value
}
const baseData = { ...sample, ...imported }

function formatDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

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
  // Sample + imported data, then live API data (functions/api/) merged over it on load.
  // With a live source, data.asOf becomes today; it refetches on tab focus, every 5 min, and on Refresh.
  const { data, refresh, refreshing } = useLiveData(baseData)
  const liveSources = Object.keys(data.live ?? {})
  const { brand, rawName, update, reset } = useBrand(data.business.name)
  const time = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <>
    <div className="h-1 bg-gradient-to-r from-brand to-brand-accent" />
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark brand={brand} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{brand.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Command center · {liveSources.length ? 'Today' : 'Sample data as of'} {formatDay(data.asOf)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {liveSources.map((s) => (
                <span
                  key={s}
                  title={`Fetched ${new Date(data.live[s].fetchedAt).toLocaleString()}`}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live: {s}
                  {data.live[s]?.mode === 'test' ? ' (test)' : ''} · {time(data.live[s].fetchedAt)}
                </span>
              ))}
              {!liveSources.length && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  No live sources
                </span>
              )}
              <button
                type="button"
                onClick={() => refresh()}
                disabled={refreshing}
                aria-label="Refresh live data"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span className={refreshing ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
                {refreshing ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
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
