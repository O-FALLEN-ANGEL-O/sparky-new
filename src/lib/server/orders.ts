import 'server-only'
import { randomInt } from 'node:crypto'
import { and, eq, inArray, lt, ne, sql } from 'drizzle-orm'
import { db, schema } from '@/db'
import { chunks } from '@/db/sql'
import type { ShippingAddress } from '@/db/schema'
import { orderTotals } from '@/lib/pricing'

type Order = typeof schema.orders.$inferSelect
type Batch = Parameters<typeof db.batch>[0][number]

import { ORDER_STATUS_LABEL } from '@/lib/order-status'

export { ORDER_STATUS_LABEL, DELIVERY_STATUS_LABEL } from '@/lib/order-status'

export class OrderError extends Error {}

/*
 * D1 has no interactive transactions, so each change is either a single conditional
 * statement (a "claim" that only one caller can win) or a db.batch, which D1 runs as one
 * all-or-nothing transaction. The products.stock >= 0 CHECK makes an oversell abort the batch.
 */
const run = (statements: Batch[]) => (statements.length ? db.batch(statements as [Batch, ...Batch[]]) : Promise.resolve([]))
const isStockError = (e: unknown) => /products_stock_nonnegative|CHECK constraint failed/i.test(String((e as Error)?.message ?? e) + String((e as { cause?: Error })?.cause?.message ?? ''))

type Line = { productId: number | null; quantity: number }

/** Move stock for each line and log it; the movement records the stock left after the change. */
function stockStatements(lines: Line[], sign: 1 | -1, reason: 'sale' | 'cancellation', orderId: number, note: string, userId: number | null): Batch[] {
  return lines.flatMap((l) =>
    l.productId == null
      ? []
      : [
          db.update(schema.products).set({ stock: sql`${schema.products.stock} + ${sign * l.quantity}`, updatedAt: new Date() }).where(eq(schema.products.id, l.productId)),
          db.insert(schema.inventoryMovements).values({
            productId: l.productId,
            change: sign * l.quantity,
            stockAfter: sql`(select stock from products where id = ${l.productId})`,
            reason,
            orderId,
            note,
            userId,
          }),
        ],
  )
}

const newDelivery = (orderId: number) => db.insert(schema.deliveries).values({ orderId, otp: String(randomInt(100000, 1000000)) }).onConflictDoNothing()

/** Create an order from cart lines. Cash orders take stock in the same batch, so they can never oversell. */
export async function createOrder(input: {
  userId: number
  lines: { productId: number; quantity: number }[]
  address: ShippingAddress
  method: 'cod' | 'razorpay'
  notes?: string
}) {
  if (!input.lines.length) throw new OrderError('Your bag is empty.')
  const ids = input.lines.map((l) => l.productId)
  const products = await db.select().from(schema.products).where(inArray(schema.products.id, ids))
  const byId = new Map(products.map((p) => [p.id, p]))
  for (const l of input.lines) {
    const p = byId.get(l.productId)
    if (!p || !p.active) throw new OrderError('A piece in your bag is no longer available. Please review your bag.')
    if (p.stock < l.quantity) throw new OrderError(p.stock === 0 ? `${p.name} has just sold out.` : `Only ${p.stock} of ${p.name} left. Please update your bag.`)
  }
  const items = input.lines.map((l) => {
    const p = byId.get(l.productId)!
    return { productId: p.id, name: p.name, image: p.images[0] ?? null, price: p.price, quantity: l.quantity }
  })
  const totals = orderTotals(items)
  const cod = input.method === 'cod'
  const [order] = await db
    .insert(schema.orders)
    .values({
      number: `T${randomInt(1e9)}`, // replaced with SPK-<id> below
      userId: input.userId,
      status: cod ? 'confirmed' : 'pending_payment',
      paymentMethod: input.method,
      paymentStatus: 'pending',
      ...totals,
      shippingAddress: input.address,
      notes: input.notes || null,
      stockCommitted: cod,
    })
    .returning()
  const number = `SPK-${10000 + order.id}`
  try {
    await run([
      db.update(schema.orders).set({ number }).where(eq(schema.orders.id, order.id)),
      ...chunks(schema.orderItems, items.map((i) => ({ ...i, orderId: order.id }))).map((rows) => db.insert(schema.orderItems).values(rows)),
      db.insert(schema.orderEvents).values({ orderId: order.id, status: 'placed', note: cod ? 'Order placed (cash on delivery)' : 'Order placed, waiting for payment', userId: input.userId }),
      ...(cod
        ? [...stockStatements(items, -1, 'sale', order.id, number, input.userId), db.insert(schema.orderEvents).values({ orderId: order.id, status: 'confirmed', userId: input.userId }), newDelivery(order.id)]
        : []),
    ])
  } catch (e) {
    // nothing in the batch was applied; remove the empty order shell
    await db.delete(schema.orders).where(eq(schema.orders.id, order.id))
    if (isStockError(e)) throw new OrderError('A piece in your bag sold out a moment ago. Please review your bag.')
    throw e
  }
  return { ...order, number }
}

/** Take stock for an order exactly once. Returns false (and takes nothing) if any piece has run out. */
async function commitStock(order: Order, userId: number | null) {
  const claimed = await db
    .update(schema.orders)
    .set({ stockCommitted: true })
    .where(and(eq(schema.orders.id, order.id), eq(schema.orders.stockCommitted, false)))
    .returning({ id: schema.orders.id })
  if (!claimed.length) return true // already taken
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id))
  try {
    await run(stockStatements(items, -1, 'sale', order.id, order.number, userId))
    return true
  } catch (e) {
    await db.update(schema.orders).set({ stockCommitted: false }).where(eq(schema.orders.id, order.id))
    if (isStockError(e)) return false
    throw e
  }
}

/** Mark a Razorpay order paid. Safe to call twice (callback + webhook): only the first call wins the claim. */
export async function markPaid(orderId: number, razorpayPaymentId: string) {
  const [order] = await db
    .update(schema.orders)
    .set({ paymentStatus: 'paid', razorpayPaymentId, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), ne(schema.orders.paymentStatus, 'paid')))
    .returning()
  if (!order) {
    const [existing] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId))
    if (!existing) throw new OrderError('Order not found.')
    return existing
  }
  const ok = order.status === 'cancelled' ? false : await commitStock(order, order.userId)
  if (!ok) {
    // Paid, but the last unit sold (or the order was cancelled) in the meantime: cancel and flag for refund.
    await run([
      db.update(schema.orders).set({ status: 'cancelled', cancelReason: order.cancelReason ?? 'Out of stock after payment — refund due', updatedAt: new Date() }).where(eq(schema.orders.id, orderId)),
      db.insert(schema.orderEvents).values({ orderId, status: 'cancelled', note: 'Payment arrived after the piece sold out or the order was cancelled. Refund to be issued.' }),
    ])
    return { ...order, status: 'cancelled' as const }
  }
  await run([
    db.update(schema.orders).set({ status: 'confirmed', updatedAt: new Date() }).where(eq(schema.orders.id, orderId)),
    db.insert(schema.orderEvents).values([
      { orderId, status: 'paid', note: `Payment received via Razorpay (${razorpayPaymentId})` },
      { orderId, status: 'confirmed' },
    ]),
    newDelivery(orderId),
  ])
  return { ...order, status: 'confirmed' as const }
}

const NEXT_STATUS: Partial<Record<Order['status'], Order['status'][]>> = {
  pending_payment: ['cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
}

export function allowedTransitions(status: Order['status']) {
  return NEXT_STATUS[status] ?? []
}

/** Staff status change. Cancelling returns stock; delivery can only be completed by OTP. */
export async function changeOrderStatus(orderId: number, to: Order['status'], userId: number, note?: string) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId))
  if (!order) throw new OrderError('Order not found.')
  if (!allowedTransitions(order.status).includes(to)) throw new OrderError(`Can’t move an order from “${ORDER_STATUS_LABEL[order.status]}” to “${ORDER_STATUS_LABEL[to]}”.`)
  if (to === 'delivered') throw new OrderError('Orders are marked delivered when the partner enters the customer’s code.')
  if (to === 'out_for_delivery') {
    const [d] = await db.select().from(schema.deliveries).where(eq(schema.deliveries.orderId, orderId))
    if (!d?.agentId) throw new OrderError('Assign a delivery partner first.')
  }
  // Claim the transition: if someone else changed the order since we read it, nothing is updated.
  const moved = await db
    .update(schema.orders)
    .set({
      status: to,
      updatedAt: new Date(),
      cancelReason: to === 'cancelled' ? note || 'Cancelled by store' : order.cancelReason,
      paymentStatus: to === 'cancelled' && order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus,
    })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, order.status)))
    .returning({ id: schema.orders.id })
  if (!moved.length) throw new OrderError('This order was just updated by someone else. Refresh and try again.')
  const after: Batch[] = [db.insert(schema.orderEvents).values({ orderId, status: to, note: note || null, userId })]
  if (to === 'cancelled') {
    await restock(order, userId)
    after.push(db.update(schema.deliveries).set({ status: 'failed', note: 'Order cancelled', updatedAt: new Date() }).where(eq(schema.deliveries.orderId, orderId)))
  }
  if (to === 'out_for_delivery') after.push(db.update(schema.deliveries).set({ status: 'out_for_delivery', updatedAt: new Date() }).where(eq(schema.deliveries.orderId, orderId)))
  await run(after)
  return to
}

/** Put an order's stock back on sale, exactly once. */
async function restock(order: Order, userId: number | null) {
  const released = await db
    .update(schema.orders)
    .set({ stockCommitted: false })
    .where(and(eq(schema.orders.id, order.id), eq(schema.orders.stockCommitted, true)))
    .returning({ id: schema.orders.id })
  if (!released.length) return
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id))
  await run(stockStatements(items, 1, 'cancellation', order.id, order.number, userId))
}

/** Customer cancellation: allowed until the order is packed. */
export async function customerCancel(orderId: number, userId: number) {
  const [order] = await db.select().from(schema.orders).where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)))
  if (!order) throw new OrderError('Order not found.')
  if (!['pending_payment', 'confirmed'].includes(order.status)) throw new OrderError('This order is already being prepared. Call us and we’ll help.')
  return changeOrderStatus(orderId, 'cancelled', userId, 'Cancelled by customer')
}

export async function assignAgent(orderId: number, agentId: number, byUserId: number) {
  const [agent] = await db.select().from(schema.users).where(and(eq(schema.users.id, agentId), eq(schema.users.role, 'delivery_agent'), eq(schema.users.active, true)))
  if (!agent) throw new OrderError('Choose an active delivery partner.')
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId))
  if (!order || !['confirmed', 'processing'].includes(order.status)) throw new OrderError('Only confirmed or processing orders can be assigned.')
  await run([
    newDelivery(orderId),
    db.update(schema.deliveries).set({ agentId, status: 'assigned', assignedAt: new Date(), updatedAt: new Date() }).where(eq(schema.deliveries.orderId, orderId)),
    db.insert(schema.orderEvents).values({ orderId, status: 'assigned', note: `Assigned to ${agent.name}`, userId: byUserId }),
  ])
}

/** Delivery partner actions on their own deliveries. */
export async function agentAction(deliveryId: number, agentId: number, action: 'accept' | 'start' | 'fail', note?: string) {
  const [d] = await db.select().from(schema.deliveries).where(and(eq(schema.deliveries.id, deliveryId), eq(schema.deliveries.agentId, agentId)))
  if (!d) throw new OrderError('Delivery not found.')
  const map = { accept: ['assigned', 'accepted'], start: ['accepted', 'out_for_delivery'], fail: ['out_for_delivery', 'assigned'] } as const
  const [from, to] = map[action]
  if (d.status !== from && !(action === 'start' && d.status === 'assigned')) throw new OrderError('That step isn’t available right now.')
  const now = new Date()
  const moved = await db
    .update(schema.deliveries)
    // a failed attempt goes straight back into the partner's queue for another try
    .set({ status: to, note: note ?? d.note, updatedAt: now })
    .where(and(eq(schema.deliveries.id, deliveryId), eq(schema.deliveries.status, d.status)))
    .returning({ id: schema.deliveries.id })
  if (!moved.length) throw new OrderError('That step isn’t available right now.')
  if (action === 'start')
    await run([
      db.update(schema.orders).set({ status: 'out_for_delivery', updatedAt: now }).where(eq(schema.orders.id, d.orderId)),
      db.insert(schema.orderEvents).values({ orderId: d.orderId, status: 'out_for_delivery', userId: agentId }),
    ])
  if (action === 'fail')
    await run([
      db.insert(schema.orderEvents).values({ orderId: d.orderId, status: 'delivery_failed', note: note || 'Customer not available', userId: agentId }),
      db.update(schema.orders).set({ status: 'processing', updatedAt: now }).where(eq(schema.orders.id, d.orderId)),
    ])
}

/** Handover: the customer reads out their 6-digit code. Five wrong tries lock the code. */
export async function verifyOtp(deliveryId: number, agentId: number, code: string) {
  const [d] = await db.select().from(schema.deliveries).where(and(eq(schema.deliveries.id, deliveryId), eq(schema.deliveries.agentId, agentId)))
  if (!d) throw new OrderError('Delivery not found.')
  if (d.status !== 'out_for_delivery') throw new OrderError('Start the delivery before entering the code.')
  if (d.otpAttempts >= 5) throw new OrderError('Too many wrong codes. Call the store to unlock this delivery.')
  if (code.trim() !== d.otp) {
    const [u] = await db
      .update(schema.deliveries)
      .set({ otpAttempts: sql`${schema.deliveries.otpAttempts} + 1` })
      .where(eq(schema.deliveries.id, deliveryId))
      .returning({ n: schema.deliveries.otpAttempts })
    throw new OrderError(`That code is wrong. ${Math.max(0, 5 - u.n)} tries left.`)
  }
  const now = new Date()
  const done = await db
    .update(schema.deliveries)
    .set({ status: 'delivered', deliveredAt: now, updatedAt: now })
    .where(and(eq(schema.deliveries.id, deliveryId), eq(schema.deliveries.status, 'out_for_delivery'), lt(schema.deliveries.otpAttempts, 5)))
    .returning({ id: schema.deliveries.id })
  if (!done.length) throw new OrderError('This delivery was just updated. Refresh and try again.')
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, d.orderId))
  await run([
    db.update(schema.orders).set({ status: 'delivered', paymentStatus: order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus, updatedAt: now }).where(eq(schema.orders.id, d.orderId)),
    db.insert(schema.orderEvents).values({ orderId: d.orderId, status: 'delivered', note: order.paymentMethod === 'cod' ? 'Delivered, code verified, cash collected' : 'Delivered, code verified', userId: agentId }),
  ])
  return order.number
}

export async function resetOtpAttempts(orderId: number) {
  await db.update(schema.deliveries).set({ otpAttempts: 0 }).where(eq(schema.deliveries.orderId, orderId))
}
