// Turns the dashboard's `data` object into the numbers for the weekly email.
// Same rules as the widgets: dates are "YYYY-MM-DD" and data.asOf counts as "today".

const DAY = 24 * 60 * 60 * 1000
const day = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function buildSummary(data) {
  const today = day(data.asOf)
  const out = {}

  const months = data.revenue?.monthly ?? []
  if (months.length) {
    const cur = months.at(-1)
    const prev = months.at(-2)
    out.revenue = {
      month: cur.month,
      amount: cur.amount,
      changePct: prev ? ((cur.amount - prev.amount) / prev.amount) * 100 : null,
    }
  }

  if (data.invoices) {
    const unpaid = data.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
    const overdue = unpaid.filter((i) => i.status === 'overdue' || day(i.due) < today)
    out.invoices = {
      unpaidTotal: unpaid.reduce((s, i) => s + i.amount, 0),
      unpaidCount: unpaid.length,
      overdueTotal: overdue.reduce((s, i) => s + i.amount, 0),
      overdue: overdue.map((i) => ({ client: i.client, amount: i.amount, daysLate: Math.round((today - day(i.due)) / DAY) })),
    }
  }

  if (data.bank) {
    const m = data.bank.months.at(-1)
    out.cash = {
      balance: data.bank.balance,
      month: m.month,
      in: m.in,
      out: m.out,
      topSpend: data.bank.spendByCategory.slice(0, 3),
    }
  }

  if (data.tasks) {
    const open = data.tasks.filter((t) => !t.done)
    out.tasks = {
      overdue: open.filter((t) => day(t.due) < today).map((t) => t.title),
      dueThisWeek: open.filter((t) => day(t.due) >= today && day(t.due) <= today + 7 * DAY).map((t) => t.title),
    }
  }

  if (data.leads) {
    const open = data.leads.filter((l) => !['won', 'lost'].includes(l.stage))
    out.leads = {
      openCount: open.length,
      openValue: open.reduce((s, l) => s + l.value, 0),
      won: data.leads.filter((l) => l.stage === 'won').length,
    }
  }

  return out
}
