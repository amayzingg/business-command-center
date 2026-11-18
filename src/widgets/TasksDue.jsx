export const meta = { title: 'Tasks due this week', order: 20, size: 'md' }

const MAX_ROWS = 6
const PRIORITY = { high: 0, medium: 1, low: 2 }
const DOT = { high: 'bg-brand', medium: 'bg-brand-accent', low: 'bg-slate-300 dark:bg-slate-600' }

function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000)

function whenLabel(diff, due) {
  if (diff < 0) return `${-diff}d overdue`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return parseDay(due).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
}

// Where the tasks came from: live Google Sheet, an uploaded CSV, or the sample file.
function sourceNote(data) {
  const sheet = data.live?.sheets?.tabs?.tasks
  if (sheet) return { text: `Live from Google Sheet · tab “${sheet.tab}”` }
  const up = data.uploads?.tasks
  if (up) return { text: `Uploaded ${new Date(up.uploadedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} from ${up.source}` }
  return { text: 'Connect a Google Sheet or use “Upload CSV”', sample: true }
}

export default function TasksDue({ data }) {
  const tasks = data.tasks ?? []
  const today = data.asOf
  const open = tasks.filter((t) => !t.done && t.due)
  const withDiff = open.map((t) => ({ ...t, diff: daysBetween(today, t.due) }))
  const overdue = withDiff.filter((t) => t.diff < 0)
  const thisWeek = withDiff.filter((t) => t.diff >= 0 && t.diff <= 7)
  const later = withDiff.filter((t) => t.diff > 7).length
  const list = [...overdue, ...thisWeek].sort(
    (a, b) => a.diff - b.diff || (PRIORITY[a.priority] ?? 1) - (PRIORITY[b.priority] ?? 1),
  )
  const note = sourceNote(data)

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums">{thisWeek.length}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">due in the next 7 days</span>
        {overdue.length > 0 && (
          <span className="text-sm font-medium text-rose-600 dark:text-rose-400">▼ {overdue.length} overdue</span>
        )}
      </div>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
          Nothing due this week{tasks.length ? '. Nice.' : ' (no tasks yet).'}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {list.slice(0, MAX_ROWS).map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span
                title={`${t.priority} priority`}
                className={`h-2 w-2 shrink-0 rounded-full ${DOT[t.priority] ?? DOT.medium}`}
              />
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span
                className={`shrink-0 text-xs tabular-nums ${
                  t.diff < 0 ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {whenLabel(t.diff, t.due)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
        {list.length > MAX_ROWS && <>+{list.length - MAX_ROWS} more · </>}
        {later > 0 && <>{later} later · </>}
        {note.sample ? (
          <>
            <span className="rounded bg-amber-100 px-1 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Sample tasks
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
