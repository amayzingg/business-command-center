// Example widget. Copy this file as the pattern for new ones:
// a default-exported component that receives `data`, plus a `meta` export.
export const meta = {
  title: 'Revenue this month',
  order: 10,
  size: 'md', // sm = 1 column, md = 2 columns, lg = full width
}

export default function RevenueCard({ data }) {
  const { currency } = data.business
  const months = data.revenue.monthly
  const current = months.at(-1)
  const previous = months.at(-2)
  const change = previous ? (current.amount - previous.amount) / previous.amount : 0
  const max = Math.max(...months.map((m) => m.amount))

  const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })
  const up = change >= 0

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-semibold tabular-nums">{money.format(current.amount)}</p>
        <p className={`text-sm font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {up ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1)}% vs last month
        </p>
      </div>

      <div className="mt-4 flex h-20 items-end gap-1" aria-label="Revenue for the last 12 months">
        {months.map((m) => (
          <div
            key={m.month}
            title={`${m.month}: ${money.format(m.amount)}`}
            className={`flex-1 rounded-t ${m === current ? 'bg-indigo-500' : 'bg-indigo-200 dark:bg-indigo-900'}`}
            style={{ height: `${(m.amount / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{months[0].month}</span>
        <span>{current.month}</span>
      </div>
    </div>
  )
}
