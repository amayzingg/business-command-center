export const meta = { title: 'Cash flow (bank)', order: 15, size: 'md' }

function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function CashFlow({ data }) {
  const bank = data.bank
  if (!bank) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No bank data yet. Run <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run import:bank</code>.
      </p>
    )
  }

  const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: data.business.currency,
    maximumFractionDigits: 0,
  })
  const months = bank.months.slice(-3)
  const current = months.at(-1)
  const net = current.in - current.out
  const maxFlow = Math.max(...months.flatMap((m) => [m.in, m.out]))
  const topSpend = bank.spendByCategory.slice(0, 4)
  const maxSpend = topSpend[0]?.total ?? 1
  const monthLabel = (ym) => {
    const [y, m] = ym.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' })
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums">{money.format(bank.balance)}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          balance on {parseDay(bank.asOf).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <p className={`mt-1 text-sm font-medium ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {net >= 0 ? '▲' : '▼'} {money.format(Math.abs(net))} net in {monthLabel(current.month)}
        <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
          ({money.format(current.in)} in · {money.format(current.out)} out)
        </span>
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">In vs out</p>
          <div className="flex h-24 gap-3">
            {months.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col">
                <div className="flex min-h-0 flex-1 items-end gap-0.5">
                  <div
                    title={`In ${money.format(m.in)}`}
                    className="flex-1 rounded-t bg-brand"
                    style={{ height: `${(m.in / maxFlow) * 100}%` }}
                  />
                  <div
                    title={`Out ${money.format(m.out)}`}
                    className="flex-1 rounded-t bg-slate-300 dark:bg-slate-600"
                    style={{ height: `${(m.out / maxFlow) * 100}%` }}
                  />
                </div>
                <span className="mt-1 text-center text-[10px] text-slate-500 dark:text-slate-400">{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-3 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand" />In</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-slate-600" />Out</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            Top spending, {monthLabel(current.month)}
          </p>
          <ul className="space-y-1.5">
            {topSpend.map((c) => (
              <li key={c.name}>
                <div className="flex justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{money.format(c.total)}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-accent" style={{ width: `${(c.total / maxSpend) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
        {bank.sample ? (
          <>
            <span className="rounded bg-amber-100 px-1 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Sample bank data
            </span>{' '}
            Import yours with /update-bank or npm run import:bank
          </>
        ) : (
          <>
            Imported{' '}
            {bank.importedAt
              ? new Date(bank.importedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
              : ''}{' '}
            from {bank.source}
          </>
        )}
      </p>
    </div>
  )
}
