import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { DELIVERY_STATUS_LABEL } from '@/lib/order-status'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { Steps } from './handover'

export default async function DeliveryDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser({ permission: 'deliveries.run' })
  const id = Number((await params).id)
  const [row] = await db
    .select({ d: schema.deliveries, o: schema.orders, customer: schema.users })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.userId))
    .where(and(eq(schema.deliveries.id, id), eq(schema.deliveries.agentId, me.id)))
  if (!row) notFound()
  const { d, o } = row
  const a = o.shippingAddress
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id))
  const mapQuery = encodeURIComponent(`${a.line1}, ${a.line2 ?? ''}, ${a.city} ${a.pincode}`)
  return (
    <div className="space-y-6">
      <Link href="/delivery" className="text-sm text-muted-foreground">All deliveries</Link>
      <div>
        <p className="text-sm text-muted-foreground">{o.number} · {DELIVERY_STATUS_LABEL[d.status]}</p>
        <h1 className="text-4xl">{a.name}</h1>
      </div>
      <section className="space-y-3 rounded-lg border bg-card p-4">
        <p className="leading-relaxed">{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}</p>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:+91${a.phone}`} className="flex h-11 items-center justify-center border text-sm">Call {a.phone}</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer noopener" className="flex h-11 items-center justify-center border text-sm">Open in Maps</a>
        </div>
      </section>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-xl">In the parcel</h2>
        <ul className="space-y-1 text-[15px]">
          {items.map((i) => <li key={i.id}>{i.quantity} × {i.name}</li>)}
        </ul>
        <p className="mt-3 border-t pt-3 text-lg">{o.paymentMethod === 'cod' ? <>Collect <strong className="tabular">{formatINR(o.total)}</strong> in cash or UPI</> : 'Prepaid — nothing to collect'}</p>
        {o.notes && <p className="mt-2 text-sm text-muted-foreground">Customer note: “{o.notes}”</p>}
      </section>
      {d.status === 'delivered' ? (
        <p className="rounded-lg bg-ok/10 p-4 text-ok">Delivered {d.deliveredAt?.toLocaleString('en-IN')}.</p>
      ) : (
        <Steps id={d.id} status={d.status} />
      )}
      {d.otpAttempts > 0 && d.status !== 'delivered' && <p className="text-sm text-muted-foreground">{d.otpAttempts} wrong code{d.otpAttempts > 1 ? 's' : ''} entered. After 5 the code locks and the store must unlock it.</p>}
    </div>
  )
}
