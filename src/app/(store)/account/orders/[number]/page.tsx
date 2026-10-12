import type { Metadata } from 'next'
import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { EVENT_LABEL } from '@/lib/order-status'
import { formatINR, GST_RATE } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { cn } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { CancelOrder, PayNow } from './order-actions'

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ placed?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order ${(await params).number}` }
}

const STEPS = ['placed', 'confirmed', 'processing', 'out_for_delivery', 'delivered'] as const

export default async function OrderDetail({ params, searchParams }: Props) {
  const user = await requireUser()
  const { number } = await params
  const { placed } = await searchParams
  const [order] = await db.select().from(schema.orders).where(and(eq(schema.orders.number, number), eq(schema.orders.userId, user.id)))
  if (!order) notFound()
  const [items, events, [delivery]] = await Promise.all([
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)),
    db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, order.id)).orderBy(asc(schema.orderEvents.createdAt)),
    db
      .select({ d: schema.deliveries, agentName: schema.users.name, agentPhone: schema.users.phone })
      .from(schema.deliveries)
      .leftJoin(schema.users, eq(schema.users.id, schema.deliveries.agentId))
      .where(eq(schema.deliveries.orderId, order.id)),
  ])
  const reached = order.status === 'cancelled' ? -1 : order.status === 'pending_payment' ? 0 : STEPS.indexOf(order.status as (typeof STEPS)[number])
  const showOtp = delivery && ['assigned', 'accepted', 'out_for_delivery'].includes(delivery.d.status) && order.status !== 'cancelled'
  const a = order.shippingAddress

  return (
    <div className="space-y-10">
      {placed && order.status !== 'pending_payment' && (
        <div role="status" className="border border-ok/40 bg-ok/5 p-5">
          <p className="font-headline text-2xl">Thank you — your order is confirmed.</p>
          <p className="mt-1 text-sm text-muted-foreground">We’ve started preparing it. You’ll see each step here, and your delivery code once a partner is assigned.</p>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">All orders</Link>
          <h2 className="mt-1 text-4xl">{order.number}</h2>
          <p className="text-sm text-muted-foreground">Placed {order.createdAt.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === 'pending_payment' && (
        <div className="space-y-3 border border-kumkum/30 bg-kumkum/5 p-5">
          <p>This order is waiting for payment. Pay now to confirm it — we hold your pieces once payment goes through.</p>
          <PayNow number={order.number} />
        </div>
      )}

      {order.status !== 'cancelled' ? (
        <ol className="grid grid-cols-5 gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="space-y-2">
              <div className={cn('h-1', i <= reached ? 'bg-gold' : 'bg-border')} />
              <p className={cn('text-xs sm:text-sm', i <= reached ? 'text-foreground' : 'text-muted-foreground')}>{EVENT_LABEL[s]}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-l-2 border-muted-foreground pl-4 text-muted-foreground">
          Cancelled{order.cancelReason ? ` — ${order.cancelReason}` : ''}.{order.paymentStatus === 'refunded' ? ' Your refund has been issued.' : ''}
        </p>
      )}

      {showOtp && (
        <section className="grid gap-6 border bg-velvet p-6 text-[#f6efe2] sm:grid-cols-[1fr_auto] sm:items-center" aria-labelledby="otp-heading">
          <div>
            <h3 id="otp-heading" className="text-2xl text-gilt">Your delivery code</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#cbbfae]">
              Share this code with {delivery.agentName ?? 'our delivery partner'} only when the parcel is in your hands. They can’t complete the delivery without it.
              {delivery.agentPhone ? ` Your partner’s number: ${delivery.agentPhone}.` : ''}
            </p>
          </div>
          <p className="font-headline text-5xl tracking-[0.3em] text-[#f6efe2] tabular" aria-label={`Code ${delivery.d.otp.split('').join(' ')}`}>{delivery.d.otp}</p>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="items-heading">
          <h3 id="items-heading" className="mb-4 text-2xl">Items</h3>
          <ul className="divide-y border-y">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0 bg-[#f1ece2]">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</div>
                <div className="flex-1">
                  <p>{i.name}</p>
                  <p className="text-sm text-muted-foreground">Qty {i.quantity} × {formatINR(i.price)}</p>
                </div>
                <p className="tabular">{formatINR(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular">{formatINR(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">GST ({GST_RATE * 100}%)</dt><dd className="tabular">{formatINR(order.tax)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-lg"><dt>Total</dt><dd className="tabular">{formatINR(order.total)}</dd></div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <dt>Payment</dt>
              <dd>{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Razorpay'} · {order.paymentStatus}</dd>
            </div>
          </dl>
        </section>
        <aside className="space-y-8">
          <section>
            <h3 className="mb-2 text-2xl">Delivering to</h3>
            <p className="leading-relaxed text-muted-foreground">
              {a.name}, {a.phone}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
          </section>
          <section>
            <h3 className="mb-3 text-2xl">History</h3>
            <ol className="space-y-3 border-l pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gold" aria-hidden />
                  <p>{EVENT_LABEL[e.status] ?? e.status}{e.note ? ` — ${e.note}` : ''}</p>
                  <p className="text-muted-foreground">{e.createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </li>
              ))}
            </ol>
          </section>
          {['pending_payment', 'confirmed'].includes(order.status) && <CancelOrder orderId={order.id} />}
        </aside>
      </div>
    </div>
  )
}
