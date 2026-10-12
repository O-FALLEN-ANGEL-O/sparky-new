import Link from 'next/link'
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { db, schema } from '@/db'
import { DELIVERY_STATUS_LABEL } from '@/lib/order-status'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'

export default async function MyDeliveries() {
  const me = await requireUser({ permission: 'deliveries.run' })
  const base = () => db
    .select({ d: schema.deliveries, o: schema.orders, items: sql<number>`(select sum(quantity) from order_items where order_id = ${schema.orders.id})` })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
  const [open, done] = await Promise.all([
    base().where(and(eq(schema.deliveries.agentId, me.id), inArray(schema.deliveries.status, ['assigned', 'accepted', 'out_for_delivery']))).orderBy(sql`case ${schema.deliveries.status} when 'out_for_delivery' then 0 when 'accepted' then 1 else 2 end`, schema.deliveries.assignedAt),
    base().where(and(eq(schema.deliveries.agentId, me.id), eq(schema.deliveries.status, 'delivered'), gte(schema.deliveries.deliveredAt, new Date(Date.now() - 7 * 86_400_000)))).orderBy(desc(schema.deliveries.deliveredAt)),
  ])
  const cash = open.filter((r) => r.o.paymentMethod === 'cod').reduce((s, r) => s + r.o.total, 0)
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl">Your deliveries</h1>
        <p className="mt-1 text-muted-foreground">
          {open.length ? `${open.length} to deliver${cash ? ` · collect ${formatINR(cash)} in cash` : ''}` : 'Nothing assigned right now.'}
        </p>
      </div>
      <ul className="space-y-3">
        {open.map(({ d, o, items }) => (
          <li key={d.id}>
            <Link href={`/delivery/${d.id}`} className="block rounded-lg border bg-card p-4 active:bg-muted">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{o.shippingAddress.name}</p>
                  <p className="text-sm text-muted-foreground">{o.shippingAddress.line1}, {o.shippingAddress.city} {o.shippingAddress.pincode}</p>
                </div>
                <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs ${d.status === 'out_for_delivery' ? 'bg-[#1d4ed8]/10 text-[#1d4ed8]' : 'bg-gold/15 text-[#7a5c17]'}`}>{DELIVERY_STATUS_LABEL[d.status]}</span>
              </div>
              <p className="mt-3 text-sm">
                {o.number} · {items} piece{items === 1 ? '' : 's'} · {o.paymentMethod === 'cod' ? <strong>Collect {formatINR(o.total)}</strong> : 'Prepaid'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xl">Delivered this week</h2>
          <ul className="divide-y rounded-lg border bg-card">
            {done.map(({ d, o }) => (
              <li key={d.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{o.number} · {o.shippingAddress.city}</span>
                <span className="text-muted-foreground">{d.deliveredAt?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
