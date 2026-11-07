// HTML + plain-text email. Email clients ignore <style> and modern CSS, so this uses
// tables and inline styles. Brand colors come from src/brand.json.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const monthName = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })
}

export function renderEmail({ config, brand, currency, summary, notes, asOf: asOfIso }) {
  const [y, m, d] = asOfIso.split('-').map(Number)
  const asOf = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const money = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  const primary = brand.primary || '#4f46e5'
  const accent = brand.accent || '#10b981'
  const green = '#059669'
  const red = '#e11d48'
  const muted = '#64748b'

  // Each section returns { title, rows: [[label, value, color?]], list?: [...] } and a text version.
  const builders = {
    revenue: (r) =>
      r && {
        title: `Revenue · ${monthName(r.month)}`,
        rows: [
          ['This month', money(r.amount)],
          r.changePct != null && [
            'vs last month',
            `${r.changePct >= 0 ? '▲' : '▼'} ${Math.abs(r.changePct).toFixed(1)}%`,
            r.changePct >= 0 ? green : red,
          ],
        ],
      },
    invoices: (i) =>
      i && {
        title: 'Invoices',
        rows: [
          ['Unpaid', `${money(i.unpaidTotal)} (${i.unpaidCount})`],
          ['Overdue', money(i.overdueTotal), i.overdueTotal > 0 ? red : green],
        ],
        list: i.overdue.map((o) => `${o.client}: ${money(o.amount)}, ${o.daysLate} days late`),
      },
    cash: (c) =>
      c && {
        title: `Cash · ${monthName(c.month)}`,
        rows: [
          ['Bank balance', money(c.balance)],
          ['Money in', money(c.in), green],
          ['Money out', money(c.out)],
        ],
        list: c.topSpend.map((s) => `${s.name}: ${money(s.total)}`),
      },
    tasks: (t) =>
      t && {
        title: 'Tasks',
        rows: [
          ['Overdue', String(t.overdue.length), t.overdue.length ? red : green],
          ['Due this week', String(t.dueThisWeek.length)],
        ],
        list: [...t.overdue.map((x) => `⚠ ${x}`), ...t.dueThisWeek],
      },
    leads: (l) =>
      l && {
        title: 'Pipeline',
        rows: [
          ['Open leads', `${l.openCount} · ${money(l.openValue)}`],
          ['Won', String(l.won), green],
        ],
      },
  }

  const sections = config.sections.map((key) => builders[key]?.(summary[key])).filter(Boolean)

  const sectionHtml = sections
    .map(
      (s) => `
      <tr><td style="padding:16px 24px 4px;font:600 13px/1.4 system-ui,sans-serif;color:${primary};text-transform:uppercase;letter-spacing:.04em">${esc(s.title)}</td></tr>
      <tr><td style="padding:0 24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${s.rows
            .filter(Boolean)
            .map(
              ([label, value, color]) => `
            <tr>
              <td style="padding:4px 0;font:14px/1.4 system-ui,sans-serif;color:${muted}">${esc(label)}</td>
              <td align="right" style="padding:4px 0;font:600 14px/1.4 system-ui,sans-serif;color:${color || '#0f172a'}">${esc(value)}</td>
            </tr>`,
            )
            .join('')}
        </table>
        ${
          s.list?.length
            ? `<ul style="margin:4px 0 0;padding-left:18px;font:13px/1.5 system-ui,sans-serif;color:#334155">${s.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
            : ''
        }
      </td></tr>`,
    )
    .join('')

  const header = config.logoUrl
    ? `<img src="${esc(config.logoUrl)}" alt="${esc(brand.name)}" height="36" style="display:block;height:36px">`
    : `<span style="display:inline-block;width:36px;height:36px;border-radius:9px;background:${primary};color:#fff;font:700 18px/36px system-ui,sans-serif;text-align:center">${esc(brand.name.charAt(0).toUpperCase())}</span>`

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(brand.name)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <tr><td style="height:4px;background:linear-gradient(90deg,${primary},${accent});background-color:${primary}"></td></tr>
    <tr><td style="padding:20px 24px 4px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle">${header}</td>
        <td style="vertical-align:middle;padding-left:12px;font:700 18px/1.3 system-ui,sans-serif;color:#0f172a">${esc(brand.name)}
          <div style="font:400 13px/1.3 system-ui,sans-serif;color:${muted}">Weekly summary · data as of ${esc(asOf)}</div></td>
      </tr></table>
    </td></tr>
    ${config.intro ? `<tr><td style="padding:12px 24px 0;font:14px/1.5 system-ui,sans-serif;color:#334155">${esc(config.intro)}</td></tr>` : ''}
    ${sectionHtml}
    ${
      config.dashboardUrl
        ? `<tr><td style="padding:20px 24px 4px"><a href="${esc(config.dashboardUrl)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:${primary};color:#fff;font:600 14px system-ui,sans-serif;text-decoration:none">Open dashboard</a></td></tr>`
        : ''
    }
    <tr><td style="padding:16px 24px 20px;font:12px/1.5 system-ui,sans-serif;color:#94a3b8">${[...notes, config.signoff].filter(Boolean).map(esc).join('<br>')}</td></tr>
  </table>
</body></html>`

  const text = [
    `${brand.name} · weekly summary (data as of ${asOf})`,
    config.intro,
    ...sections.map((s) =>
      [`\n${s.title.toUpperCase()}`, ...s.rows.filter(Boolean).map(([l, v]) => `${l}: ${v}`), ...(s.list ?? []).map((x) => `- ${x}`)].join('\n'),
    ),
    config.dashboardUrl && `\nDashboard: ${config.dashboardUrl}`,
    ...notes,
    config.signoff,
  ]
    .filter(Boolean)
    .join('\n')

  return { html, text }
}
