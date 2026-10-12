import Link from 'next/link'
import { and, desc, eq, like, or, sql, type SQL } from 'drizzle-orm'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { PageHeader } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { jsonField } from '@/db/sql'
import { dateTime } from '@/lib/format'
import { ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/order-status'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { statusCounts } from '@/lib/server/analytics'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Orders' }
const PAGE = 25

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireUser({ permission: 'orders.view' })
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const where: SQL[] = []
  if (sp.status && sp.status in ORDER_STATUS_LABEL) where.push(eq(schema.orders.status, sp.status as OrderStatus))
  if (sp.q?.trim()) {
    const pattern = `%${sp.q.trim()}%`
    where.push(or(like(schema.orders.number, pattern), like(schema.users.name, pattern), like(schema.users.email, pattern), like(jsonField(schema.orders.shippingAddress, 'city'), pattern))!)
  }
  const [rows, counts, [{ total }]] = await Promise.all([
    db
      .select({ o: schema.orders, name: schema.users.name, items: sql<number>`(select sum(quantity) from order_items where order_id = ${schema.orders.id})` })
      .from(schema.orders)
      .innerJoin(schema.users, eq(schema.users.id, schema.orders.userId))
      .where(and(...where))
      .orderBy(desc(schema.orders.createdAt))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    statusCounts(),
    db.select({ total: sql<number>`count(*)` }).from(schema.orders).innerJoin(schema.users, eq(schema.users.id, schema.orders.userId)).where(and(...where)),
  ])
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][])
    return `/dashboard/orders${p.size ? `?${p}` : ''}`
  }
  const tabs: [string | undefined, string, number][] = [
    [undefined, 'All', Object.values(counts).reduce((a, b) => a + b, 0)],
    ...(['confirmed', 'processing', 'out_for_delivery', 'pending_payment', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => [s, ORDER_STATUS_LABEL[s], counts[s] ?? 0] as [string, string, number]),
  ]
  return (
    <div>
      <PageHeader title="Orders" description="Every order, newest first. Open one to prepare it, assign a delivery partner or cancel it." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="-mx-1 flex flex-wrap gap-1" aria-label="Filter by status">
          {tabs.map(([key, label, n]) => (
            <Link key={label} href={link({ status: key, page: undefined })} aria-current={sp.status === key ? 'page' : undefined} className={cn('rounded-md px-3 py-1.5 text-sm', sp.status === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>
              {label} <span className="tabular opacity-70">{n}</span>
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" role="search">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder="Order, customer or city" aria-label="Search orders" className="h-9 w-56 rounded-md border bg-background px-3 text-sm" />
        </form>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Order</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Placed</th>
              <th className="px-4 py-2.5 font-medium">Payment</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ o, name, items }) => (
              <tr key={o.id} className="hover:bg-muted/30">
                <td className="px-4 py-3"><Link href={`/dashboard/orders/${o.number}`} className="font-medium underline-offset-4 hover:underline">{o.number}</Link><span className="ml-2 text-muted-foreground">{items} pc{items === 1 ? '' : 's'}</span></td>
                <td className="px-4 py-3">{name}<span className="block text-xs text-muted-foreground">{o.shippingAddress.city}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{dateTime(o.createdAt)}</td>
                <td className="px-4 py-3">{o.paymentMethod === 'cod' ? 'Cash' : 'Razorpay'}<span className="block text-xs text-muted-foreground">{o.paymentStatus}</span></td>
                <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right tabular">{formatINR(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-8 text-center text-muted-foreground">No orders match. Try another filter.</p>}
      </div>
      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pages">
          <span className="text-muted-foreground">Page {page} of {pages} · {total} orders</span>
          <div className="flex gap-2">
            {page > 1 && <Link className="rounded-md border px-3 py-1.5" href={link({ page: String(page - 1) })}>Newer</Link>}
            {page < pages && <Link className="rounded-md border px-3 py-1.5" href={link({ page: String(page + 1) })}>Older</Link>}
          </div>
        </nav>
      )}
    </div>
  )
}
