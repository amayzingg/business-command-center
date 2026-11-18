export const meta = { title: 'Leads pipeline', order: 30, size: 'md' }

// Pipeline order; any other stage names from your data are shown after these.
const STAGES = ['new', 'qualified', 'proposal', 'negotiation']
const CLOSED = ['won', 'lost']
const label = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Where the leads came from: live Google Sheet, an uploaded CSV, or the sample file.
function sourceNote(data) {
  const sheet = data.live?.sheets?.tabs?.leads
  if (sheet) return { text: `Live from Google Sheet · tab “${sheet.tab}”` }
  const up = data.uploads?.leads
  if (up) return { text: `Uploaded ${new Date(up.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} from ${up.source}` }
  return { text: 'Connect a Google Sheet or use “Upload CSV”', sample: true }
}

export default function LeadsPipeline({ data }) {
  const leads = data.leads ?? []
  const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: data.business.currency,
    maximumFractionDigits: 0,
  })
  const open = leads.filter((l) => !CLOSED.includes(l.stage))
  const stages = [...STAGES, ...new Set(open.map((l) => l.stage).filter((s) => !STAGES.includes(s)))]
  const rows = stages
    .map((stage) => {
      const inStage = open.filter((l) => l.stage === stage)
      return { stage, count: inStage.length, value: inStage.reduce((sum, l) => sum + l.value, 0) }
    })
    .filter((r) => r.count > 0 || STAGES.includes(r.stage))
  const maxValue = Math.max(1, ...rows.map((r) => r.value))
  const openValue = open.reduce((sum, l) => sum + l.value, 0)
  const won = leads.filter((l) => l.stage === 'won')
  const lost = leads.filter((l) => l.stage === 'lost')
  const note = sourceNote(data)

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums">{money.format(openValue)}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          open across {open.length} lead{open.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.stage}>
            <div className="flex justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                {label(r.stage)} <span className="text-slate-400 dark:text-slate-500">· {r.count}</span>
              </span>
              <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{money.format(r.value)}</span>
            </div>
            <div className="mt-0.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${(r.value / maxValue) * 100}%`, minWidth: r.value ? '0.25rem' : 0 }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          ▲ Won {won.length} · {money.format(won.reduce((s, l) => s + l.value, 0))}
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          Lost {lost.length} · {money.format(lost.reduce((s, l) => s + l.value, 0))}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
        {note.sample ? (
          <>
            <span className="rounded bg-amber-100 px-1 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Sample leads
            </span>{' '}
            {note.text}
          </>
        ) : (
          note.text
        )}
      </p>
    </div>
  )
}
