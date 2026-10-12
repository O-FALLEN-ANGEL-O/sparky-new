import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { istDay, istMidnight } from '@/db/sql'
import { can, type Permission } from '@/lib/roles'
import { audit } from '@/lib/server/audit'
import { getCurrentUser } from '@/lib/server/auth'

/** CSV exports. Every report checks its own permission. */
const REPORTS: Record<string, { permission: Permission; filename: string; query: (from: number, to: number, fromMonth: string, toMonth: string) => ReturnType<typeof sql> }> = {
  orders: {
    permission: 'reports.view',
    filename: 'orders',
    query: (from, to) => sql`
      select o.number as "Order", strftime('%Y-%m-%d %H:%M', o.created_at / 1000, 'unixepoch', '+330 minutes') as "Placed",
        u.name as "Customer", u.email as "Email", json_extract(o.shipping_address, '$.city') as "City", o.status as "Status",
        o.payment_method as "Payment", o.payment_status as "Payment status", o.subtotal as "Subtotal", o.tax as "GST", o.total as "Total"
      from orders o join users u on u.id = o.user_id
      where o.created_at >= ${from} and o.created_at < ${to} order by o.created_at`,
  },
  'sales-by-product': {
    permission: 'reports.view',
    filename: 'sales-by-product',
    query: (from, to) => sql`
      select p.name as "Piece", c.name as "Collection", sum(oi.quantity) as "Units", sum(oi.price * oi.quantity) as "Revenue (ex GST)"
      from order_items oi join orders o on o.id = oi.order_id join products p on p.id = oi.product_id join categories c on c.id = p.category_id
      where o.status not in ('cancelled','pending_payment') and o.created_at >= ${from} and o.created_at < ${to}
      group by p.name, c.name order by 4 desc`,
  },
  'monthly-summary': {
    permission: 'reports.view',
    filename: 'monthly-summary',
    query: (from, to) => sql`
      select strftime('%Y-%m', created_at / 1000, 'unixepoch', '+330 minutes') as "Month", count(*) as "Orders",
        sum(total) as "Revenue", round(avg(total)) as "Average order", count(distinct user_id) as "Customers"
      from orders where status not in ('cancelled','pending_payment') and created_at >= ${from} and created_at < ${to}
      group by 1 order by 1`,
  },
  inventory: {
    permission: 'reports.view',
    filename: 'inventory',
    query: () => sql`
      select p.name as "Piece", c.name as "Collection", p.purity as "Purity", p.weight_grams as "Weight (g)", p.stock as "Stock",
        p.low_stock_threshold as "Reorder at", p.price as "Price", (p.stock * p.price) as "Stock value"
      from products p join categories c on c.id = p.category_id order by c.sort, p.name`,
  },
  payroll: {
    permission: 'payroll.manage',
    filename: 'payroll',
    query: (_f, _t, fromMonth, toMonth) => sql`
      select r.month as "Month", e.employee_code as "Code", u.name as "Employee", e.department as "Department",
        s.basic as "Basic", s.hra as "HRA", s.allowances as "Allowances", s.gross as "Gross", s.pf as "PF",
        s.professional_tax as "Prof. tax", s.tds as "TDS", s.unpaid_leave_deduction as "Unpaid leave", s.net as "Net pay"
      from payslips s join payroll_runs r on r.id = s.run_id join users u on u.id = s.user_id join employees e on e.user_id = u.id
      where r.month >= ${fromMonth} and r.month <= ${toMonth} order by r.month, e.employee_code`,
  },
}

/** Pull the quoted column aliases out of a query so an empty report still has a header row. */
function headerNames(q: ReturnType<typeof sql>) {
  const text = q.queryChunks.map((c) => (typeof c === 'object' && c && 'value' in c ? (c.value as string[]).join('') : '')).join('')
  const select = text.slice(0, text.search(/\bfrom\b/i))
  return [...select.matchAll(/as "([^"]+)"/g)].map((m) => m[1])
}

function csvCell(v: unknown) {
  if (v == null) return ''
  let s = String(v)
  // neutralise spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const report = REPORTS[type]
  const user = await getCurrentUser()
  if (!report) return NextResponse.json({ error: 'Unknown report' }, { status: 404 })
  if (!user || !can(user.role, report.permission)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  const url = new URL(req.url)
  const iso = /^\d{4}-\d{2}-\d{2}$/
  const to = iso.test(url.searchParams.get('to') ?? '') ? url.searchParams.get('to')! : istDay(Date.now())
  const from = iso.test(url.searchParams.get('from') ?? '') ? url.searchParams.get('from')! : istDay(Date.now() - 90 * 86_400_000)
  const toExclusive = istMidnight(to) + 86_400_000
  // Rows come back as objects in select-list order; an empty report still gets its header row
  const stmt = report.query(istMidnight(from), toExclusive, from.slice(0, 7), to.slice(0, 7))
  const rows = await db.all<Record<string, unknown>>(stmt)
  const cols = rows.length ? Object.keys(rows[0]) : headerNames(stmt)
  const body = '﻿' + [cols.map(csvCell).join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n')
  await audit('report.download', { user, details: `${type} ${from}..${to}` })
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sparkle-${report.filename}-${from}-to-${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
