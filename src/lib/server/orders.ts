import 'server-only'
import { randomInt } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db, schema } from '@/db'
import type { ShippingAddress } from '@/db/schema'
import { orderTotals } from '@/lib/pricing'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Order = typeof schema.orders.$inferSelect

import { ORDER_STATUS_LABEL } from '@/lib/order-status'

export { ORDER_STATUS_LABEL, DELIVERY_STATUS_LABEL } from '@/lib/order-status'

export class OrderError extends Error {}

/** Create an order from cart lines. Stock is checked under row locks. */
export async function createOrder(input: {
  userId: number
  lines: { productId: number; quantity: number }[]
  address: ShippingAddress
  method: 'cod' | 'razorpay'
  notes?: string
}) {
  if (!input.lines.length) throw new OrderError('Your bag is empty.')
  return db.transaction(async (tx) => {
    const ids = input.lines.map((l) => l.productId)
    const products = await tx
      .select()
      .from(schema.products)
      .where(inArray(schema.products.id, ids))
      .for('update')
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
    const [order] = await tx
      .insert(schema.orders)
      .values({
        number: `T${randomInt(1e9)}`, // replaced with SPK-<id> below; column is varchar(20)
        userId: input.userId,
        status: input.method === 'cod' ? 'confirmed' : 'pending_payment',
        paymentMethod: input.method,
        paymentStatus: 'pending',
        ...totals,
        shippingAddress: input.address,
        notes: input.notes || null,
      })
      .returning()
    const number = `SPK-${10000 + order.id}`
    await tx.update(schema.orders).set({ number }).where(eq(schema.orders.id, order.id))
    await tx.insert(schema.orderItems).values(items.map((i) => ({ ...i, orderId: order.id })))
    await tx.insert(schema.orderEvents).values({
      orderId: order.id,
      status: 'placed',
      note: input.method === 'cod' ? 'Order placed (cash on delivery)' : 'Order placed, waiting for payment',
      userId: input.userId,
    })
    if (input.method === 'cod') {
      await commitStock(tx, order.id, input.userId)
      await tx.insert(schema.orderEvents).values({ orderId: order.id, status: 'confirmed', userId: input.userId })
      await ensureDelivery(tx, order.id)
    }
    return { ...order, number }
  })
}

/** Take stock for an order exactly once (idempotent via stockCommitted). */
async function commitStock(tx: Tx, orderId: number, userId: number | null) {
  const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for('update')
  if (order.stockCommitted) return true
  const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId))
  for (const it of items) {
    if (!it.productId) continue
    const [p] = await tx.select().from(schema.products).where(eq(schema.products.id, it.productId)).for('update')
    if (!p || p.stock < it.quantity) return false
  }
  for (const it of items) {
    if (!it.productId) continue
    const [p] = await tx
      .update(schema.products)
      .set({ stock: sql`${schema.products.stock} - ${it.quantity}`, updatedAt: new Date() })
      .where(eq(schema.products.id, it.productId))
      .returning({ stock: schema.products.stock })
    await tx.insert(schema.inventoryMovements).values({ productId: it.productId, change: -it.quantity, stockAfter: p.stock, reason: 'sale', orderId, note: order.number, userId })
  }
  await tx.update(schema.orders).set({ stockCommitted: true }).where(eq(schema.orders.id, orderId))
  return true
}

async function ensureDelivery(tx: Tx, orderId: number) {
  await tx
    .insert(schema.deliveries)
    .values({ orderId, otp: String(randomInt(100000, 1000000)) })
    .onConflictDoNothing()
}

/** Mark a Razorpay order paid. Safe to call twice (callback + webhook). */
export async function markPaid(orderId: number, razorpayPaymentId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for('update')
    if (!order) throw new OrderError('Order not found.')
    if (order.paymentStatus === 'paid') return order
    const ok = await commitStock(tx, orderId, order.userId)
    if (!ok) {
      // Paid, but the last unit sold in the meantime: cancel and flag for refund.
      await tx.update(schema.orders).set({ paymentStatus: 'paid', razorpayPaymentId, status: 'cancelled', cancelReason: 'Out of stock after payment — refund due', updatedAt: new Date() }).where(eq(schema.orders.id, orderId))
      await tx.insert(schema.orderEvents).values({ orderId, status: 'cancelled', note: 'Sold out before payment completed. Refund to be issued.' })
      return { ...order, status: 'cancelled' as const }
    }
    await tx.update(schema.orders).set({ paymentStatus: 'paid', razorpayPaymentId, status: 'confirmed', updatedAt: new Date() }).where(eq(schema.orders.id, orderId))
    await tx.insert(schema.orderEvents).values([
      { orderId, status: 'paid', note: `Payment received via Razorpay (${razorpayPaymentId})` },
      { orderId, status: 'confirmed' },
    ])
    await ensureDelivery(tx, orderId)
    return { ...order, status: 'confirmed' as const, paymentStatus: 'paid' as const }
  })
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
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).for('update')
    if (!order) throw new OrderError('Order not found.')
    if (!allowedTransitions(order.status).includes(to)) throw new OrderError(`Can’t move an order from “${ORDER_STATUS_LABEL[order.status]}” to “${ORDER_STATUS_LABEL[to]}”.`)
    if (to === 'delivered') throw new OrderError('Orders are marked delivered when the partner enters the customer’s code.')
    if (to === 'cancelled') {
      await restock(tx, order, userId)
      await tx.update(schema.deliveries).set({ status: 'failed', note: 'Order cancelled', updatedAt: new Date() }).where(eq(schema.deliveries.orderId, orderId))
    }
    if (to === 'out_for_delivery') {
      const [d] = await tx.select().from(schema.deliveries).where(eq(schema.deliveries.orderId, orderId))
      if (!d?.agentId) throw new OrderError('Assign a delivery partner first.')
      await tx.update(schema.deliveries).set({ status: 'out_for_delivery', updatedAt: new Date() }).where(eq(schema.deliveries.orderId, orderId))
    }
    await tx
      .update(schema.orders)
      .set({
        status: to,
        updatedAt: new Date(),
        cancelReason: to === 'cancelled' ? note || 'Cancelled by store' : order.cancelReason,
        paymentStatus: to === 'cancelled' && order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus,
      })
      .where(eq(schema.orders.id, orderId))
    await tx.insert(schema.orderEvents).values({ orderId, status: to, note: note || null, userId })
    return to
  })
}

async function restock(tx: Tx, order: Order, userId: number | null) {
  if (!order.stockCommitted) return
  const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id))
  for (const it of items) {
    if (!it.productId) continue
    const [p] = await tx
      .update(schema.products)
      .set({ stock: sql`${schema.products.stock} + ${it.quantity}` })
      .where(eq(schema.products.id, it.productId))
      .returning({ stock: schema.products.stock })
    await tx.insert(schema.inventoryMovements).values({ productId: it.productId, change: it.quantity, stockAfter: p.stock, reason: 'cancellation', orderId: order.id, note: order.number, userId })
  }
  await tx.update(schema.orders).set({ stockCommitted: false }).where(eq(schema.orders.id, order.id))
}

/** Customer cancellation: allowed until the order is packed. */
export async function customerCancel(orderId: number, userId: number) {
  const [order] = await db.select().from(schema.orders).where(and(eq(schema.orders.id, orderId), eq(schema.orders.userId, userId)))
  if (!order) throw new OrderError('Order not found.')
  if (!['pending_payment', 'confirmed'].includes(order.status)) throw new OrderError('This order is already being prepared. Call us and we’ll help.')
  return changeOrderStatus(orderId, 'cancelled', userId, 'Cancelled by customer')
}

export async function assignAgent(orderId: number, agentId: number, byUserId: number) {
  return db.transaction(async (tx) => {
    const [agent] = await tx.select().from(schema.users).where(and(eq(schema.users.id, agentId), eq(schema.users.role, 'delivery_agent'), eq(schema.users.active, true)))
    if (!agent) throw new OrderError('Choose an active delivery partner.')
    const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, orderId))
    if (!order || !['confirmed', 'processing'].includes(order.status)) throw new OrderError('Only confirmed or processing orders can be assigned.')
    await ensureDelivery(tx, orderId)
    await tx.update(schema.deliveries).set({ agentId, status: 'assigned', assignedAt: new Date(), updatedAt: new Date() }).where(eq(schema.deliveries.orderId, orderId))
    await tx.insert(schema.orderEvents).values({ orderId, status: 'assigned', note: `Assigned to ${agent.name}`, userId: byUserId })
  })
}

/** Delivery partner actions on their own deliveries. */
export async function agentAction(deliveryId: number, agentId: number, action: 'accept' | 'start' | 'fail', note?: string) {
  return db.transaction(async (tx) => {
    const [d] = await tx.select().from(schema.deliveries).where(and(eq(schema.deliveries.id, deliveryId), eq(schema.deliveries.agentId, agentId))).for('update')
    if (!d) throw new OrderError('Delivery not found.')
    const map = { accept: ['assigned', 'accepted'], start: ['accepted', 'out_for_delivery'], fail: ['out_for_delivery', 'failed'] } as const
    const [from, to] = map[action]
    if (d.status !== from && !(action === 'start' && d.status === 'assigned')) throw new OrderError('That step isn’t available right now.')
    await tx.update(schema.deliveries).set({ status: to, note: note ?? d.note, updatedAt: new Date() }).where(eq(schema.deliveries.id, deliveryId))
    if (action === 'start') {
      await tx.update(schema.orders).set({ status: 'out_for_delivery', updatedAt: new Date() }).where(eq(schema.orders.id, d.orderId))
      await tx.insert(schema.orderEvents).values({ orderId: d.orderId, status: 'out_for_delivery', userId: agentId })
    }
    if (action === 'fail') {
      await tx.insert(schema.orderEvents).values({ orderId: d.orderId, status: 'delivery_failed', note: note || 'Customer not available', userId: agentId })
      // back in the queue for another attempt
      await tx.update(schema.deliveries).set({ status: 'assigned' }).where(eq(schema.deliveries.id, deliveryId))
      await tx.update(schema.orders).set({ status: 'processing', updatedAt: new Date() }).where(eq(schema.orders.id, d.orderId))
    }
  })
}

/** Handover: the customer reads out their 6-digit code. Five wrong tries lock the code. */
export async function verifyOtp(deliveryId: number, agentId: number, code: string) {
  return db.transaction(async (tx) => {
    const [d] = await tx.select().from(schema.deliveries).where(and(eq(schema.deliveries.id, deliveryId), eq(schema.deliveries.agentId, agentId))).for('update')
    if (!d) throw new OrderError('Delivery not found.')
    if (d.status !== 'out_for_delivery') throw new OrderError('Start the delivery before entering the code.')
    if (d.otpAttempts >= 5) throw new OrderError('Too many wrong codes. Call the store to unlock this delivery.')
    if (code.trim() !== d.otp) {
      await tx.update(schema.deliveries).set({ otpAttempts: d.otpAttempts + 1 }).where(eq(schema.deliveries.id, deliveryId))
      throw new OrderError(`That code is wrong. ${4 - d.otpAttempts} tries left.`)
    }
    const now = new Date()
    await tx.update(schema.deliveries).set({ status: 'delivered', deliveredAt: now, updatedAt: now }).where(eq(schema.deliveries.id, deliveryId))
    const [order] = await tx.select().from(schema.orders).where(eq(schema.orders.id, d.orderId))
    await tx
      .update(schema.orders)
      .set({ status: 'delivered', paymentStatus: order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus, updatedAt: now })
      .where(eq(schema.orders.id, d.orderId))
    await tx.insert(schema.orderEvents).values({ orderId: d.orderId, status: 'delivered', note: order.paymentMethod === 'cod' ? 'Delivered, code verified, cash collected' : 'Delivered, code verified', userId: agentId })
    return order.number
  })
}

export async function resetOtpAttempts(orderId: number) {
  await db.update(schema.deliveries).set({ otpAttempts: 0 }).where(eq(schema.deliveries.orderId, orderId))
}
