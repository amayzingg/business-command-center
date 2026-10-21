# Starter prompts

Copy, paste, then change the details to fit your business.

## Widgets (sample data)
- Add a widget showing open tasks due in the next 7 days, overdue ones highlighted in red.
- Add a leads pipeline widget: count and total value per stage, as a horizontal bar.
- Add an invoices widget that shows overdue and unpaid totals, and lists overdue invoices.
- Add a "lead sources" widget comparing where won and open leads came from.
- Add a full-width "today" widget: date, top 3 priorities, and money due this week.

## Techniques
- **Plan mode:** "Plan a widget that forecasts next month's revenue from the last
  6 months. Don't write code yet."
- **Parallel work:** run two or three Claude sessions in separate worktrees, each
  building a different widget. Widgets are separate files, so they won't conflict.
- **Subagents:** "Use a subagent to review every widget for phone-width layout and
  missing dark-mode styles, then fix what it finds."
- **Hooks:** "Add a hook that runs `npm run build` after every file edit and shows
  me the errors."
- **Custom command/skill:** "Create a /new-widget command that takes a one-line
  description and builds a widget following CLAUDE.md."

## Real data
- Replace the sample invoices with data from [Stripe / QuickBooks / a Google Sheet]
  using a Cloudflare Pages Function in `functions/api/`. Keep the API key in an
  environment variable.
- Use the [Notion / Gmail / Calendar] connector to pull [my tasks / unread
  client emails / today's meetings] into a widget.

## Stretch
- Make it installable on my phone's home screen (web app manifest + icons).
- Add a scheduled task that writes a morning summary of the dashboard.
- Add a light/dark toggle that remembers my choice.
