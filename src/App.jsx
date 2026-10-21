import data from './data/sample.json'

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
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{data.business.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Command center</p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Data as of {new Date(`${data.asOf}T00:00`).toLocaleDateString()}
        </p>
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
  )
}
