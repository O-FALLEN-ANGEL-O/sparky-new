import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { can, type Permission } from '@/lib/roles'
import { audit } from '@/lib/server/audit'
import { getCurrentUser } from '@/lib/server/auth'

/** CSV exports. Every report checks its own permission. */
const REPORTS: Record<string, { permission: Permission; filename: string; query: (from: string, to: string) => ReturnType<typeof sql> }> = {
  orders: {
    permission: 'reports.view',
    filename: 'orders',
    query: (from, to) => sql`
      select o.number as "Order", to_char(o.created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') as "Placed",
        u.name as "Customer", u.email as "Email", o.shipping_address->>'city' as "City", o.status as "Status",
        o.payment_method as "Payment", o.payment_status as "Payment status", o.subtotal as "Subtotal", o.tax as "GST", o.total as "Total"
      from orders o join users u on u.id = o.user_id
      where o.created_at >= ${from}::date and o.created_at < ${to}::date + 1 order by o.created_at`,
  },
  'sales-by-product': {
    permission: 'reports.view',
    filename: 'sales-by-product',
    query: (from, to) => sql`
      select p.name as "Piece", c.name as "Collection", sum(oi.quantity)::int as "Units", sum(oi.price * oi.quantity)::int as "Revenue (ex GST)"
      from order_items oi join orders o on o.id = oi.order_id join products p on p.id = oi.product_id join categories c on c.id = p.category_id
      where o.status not in ('cancelled','pending_payment') and o.created_at >= ${from}::date and o.created_at < ${to}::date + 1
      group by p.name, c.name order by 4 desc`,
  },
  'monthly-summary': {
    permission: 'reports.view',
    filename: 'monthly-summary',
    query: (from, to) => sql`
      select to_char(date_trunc('month', created_at), 'YYYY-MM') as "Month", count(*)::int as "Orders",
        sum(total)::int as "Revenue", round(avg(total))::int as "Average order", count(distinct user_id)::int as "Customers"
      from orders where status not in ('cancelled','pending_payment') and created_at >= ${from}::date and created_at < ${to}::date + 1
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
    query: (from, to) => sql`
      select r.month as "Month", e.employee_code as "Code", u.name as "Employee", e.department as "Department",
        s.basic as "Basic", s.hra as "HRA", s.allowances as "Allowances", s.gross as "Gross", s.pf as "PF",
        s.professional_tax as "Prof. tax", s.tds as "TDS", s.unpaid_leave_deduction as "Unpaid leave", s.net as "Net pay"
      from payslips s join payroll_runs r on r.id = s.run_id join users u on u.id = s.user_id join employees e on e.user_id = u.id
      where r.month >= to_char(${from}::date, 'YYYY-MM') and r.month <= to_char(${to}::date, 'YYYY-MM') order by r.month, e.employee_code`,
  },
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
  const to = iso.test(url.searchParams.get('to') ?? '') ? url.searchParams.get('to')! : new Date().toISOString().slice(0, 10)
  const from = iso.test(url.searchParams.get('from') ?? '') ? url.searchParams.get('from')! : new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10)
  const res = await db.execute(report.query(from, to))
  const rows = res.rows as Record<string, unknown>[]
  const cols = res.fields.map((f) => f.name)
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
