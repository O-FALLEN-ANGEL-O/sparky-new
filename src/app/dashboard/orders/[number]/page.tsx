import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { OrderActions } from '@/components/dash/order-actions'
import { PageHeader, Panel, Pill } from '@/components/dash/ui'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { db, schema } from '@/db'
import { dateTime } from '@/lib/format'
import { DELIVERY_STATUS_LABEL, EVENT_LABEL } from '@/lib/order-status'
import { formatINR, GST_RATE } from '@/lib/pricing'
import { can } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { allowedTransitions } from '@/lib/server/orders'
import { agentLoad, deliveryAgents } from '@/lib/server/people'

export default async function OrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const user = await requireUser({ permission: 'orders.view' })
  const { number } = await params
  const [row] = await db.select({ o: schema.orders, customer: schema.users }).from(schema.orders).innerJoin(schema.users, eq(schema.users.id, schema.orders.userId)).where(eq(schema.orders.number, number))
  if (!row) notFound()
  const { o, customer } = row
  const [items, events, [delivery], agents, load] = await Promise.all([
    db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id)),
    db.select({ e: schema.orderEvents, by: schema.users.name }).from(schema.orderEvents).leftJoin(schema.users, eq(schema.users.id, schema.orderEvents.userId)).where(eq(schema.orderEvents.orderId, o.id)).orderBy(asc(schema.orderEvents.createdAt)),
    db.select({ d: schema.deliveries, agent: schema.users.name }).from(schema.deliveries).leftJoin(schema.users, eq(schema.users.id, schema.deliveries.agentId)).where(eq(schema.deliveries.orderId, o.id)),
    deliveryAgents(),
    agentLoad(),
  ])
  const canManage = can(user.role, 'orders.manage')
  const a = o.shippingAddress
  return (
    <div className="space-y-6">
      <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">All orders</Link>
      <PageHeader title={o.number} description={`Placed ${dateTime(o.createdAt)} by ${customer.name}`} actions={<OrderStatusBadge status={o.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items" bodyClassName="p-0">
            <ul className="divide-y">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                  <div className="relative h-14 w-14 shrink-0 rounded bg-[#f1ece2]">{i.image && <Image src={i.image} alt="" fill sizes="56px" className="rounded object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{i.name}</p>
                    <p className="text-sm text-muted-foreground">{i.quantity} × {formatINR(i.price)}</p>
                  </div>
                  <p className="shrink-0 tabular">{formatINR(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular">{formatINR(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">GST {GST_RATE * 100}%</dt><dd className="tabular">{formatINR(o.tax)}</dd></div>
              <div className="flex justify-between text-base"><dt>Total</dt><dd className="tabular">{formatINR(o.total)}</dd></div>
            </dl>
          </Panel>
          <Panel title="History">
            <ol className="space-y-3 border-l pl-4">
              {events.map(({ e, by }) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gold" aria-hidden />
                  <p>{EVENT_LABEL[e.status] ?? e.status}{e.note ? ` — ${e.note}` : ''}</p>
                  <p className="text-muted-foreground">{dateTime(e.createdAt)}{by ? ` · ${by}` : ''}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
        <div className="space-y-6">
          {canManage && (
            <Panel title="Next step">
              {allowedTransitions(o.status).length || delivery ? (
                <OrderActions
                  orderId={o.id}
                  transitions={allowedTransitions(o.status)}
                  agents={agents.map((g) => ({ ...g, load: load.get(g.id) ?? 0 }))}
                  currentAgentId={delivery?.d.agentId ?? null}
                  canAssign={can(user.role, 'deliveries.manage') && ['confirmed', 'processing'].includes(o.status)}
                  otpLocked={(delivery?.d.otpAttempts ?? 0) >= 5}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Nothing left to do on this order.</p>
              )}
            </Panel>
          )}
          <Panel title="Delivery">
            {delivery ? (
              <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd><Pill tone={delivery.d.status === 'delivered' ? 'ok' : delivery.d.status === 'pending' ? 'warn' : 'blue'}>{DELIVERY_STATUS_LABEL[delivery.d.status]}</Pill></dd>
                <dt className="text-muted-foreground">Partner</dt>
                <dd>{delivery.agent ?? 'Not assigned'}</dd>
                <dt className="text-muted-foreground">Code tries</dt>
                <dd>{delivery.d.otpAttempts} of 5{delivery.d.otpAttempts >= 5 ? ' — locked' : ''}</dd>
                {delivery.d.deliveredAt && (<><dt className="text-muted-foreground">Delivered</dt><dd>{dateTime(delivery.d.deliveredAt)}</dd></>)}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{o.status === 'pending_payment' ? 'Created once payment is received.' : 'No delivery for this order.'}</p>
            )}
          </Panel>
          <Panel title="Customer">
            <p>{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.email} · {customer.phone}</p>
            <p className="mt-3 text-sm leading-relaxed">
              {a.name}, {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}
            </p>
            {o.notes && <p className="mt-3 border-l-2 border-gold pl-3 text-sm">“{o.notes}”</p>}
          </Panel>
          <Panel title="Payment">
            <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Method</dt><dd>{o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Razorpay'}</dd>
              <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{o.paymentStatus}</dd>
              {o.razorpayPaymentId && (<><dt className="text-muted-foreground">Payment ID</dt><dd className="break-all">{o.razorpayPaymentId}</dd></>)}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}
