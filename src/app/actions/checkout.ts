'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db, schema } from '@/db'
import { audit } from '@/lib/server/audit'
import { getCurrentUser } from '@/lib/server/auth'
import { clearCart, getCart } from '@/lib/server/cart'
import { OrderError, createOrder, customerCancel, markPaid } from '@/lib/server/orders'
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId, verifyPaymentSignature } from '@/lib/server/razorpay'
import { getSetting } from '@/lib/server/settings'
import { fieldErrors } from './types'

const addressSchema = z.object({
  name: z.string().trim().min(2, 'Enter the recipient’s name.').max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'),
  line1: z.string().trim().min(4, 'Enter the house number and street.').max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'Enter the city.').max(80),
  state: z.string().trim().min(2, 'Choose the state.').max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a 6-digit PIN code.'),
})

export type CheckoutState =
  | null
  | { error?: string; fieldErrors?: Record<string, string> }
  | { razorpay: { key: string; orderId: string; amount: number; number: string; name: string; email: string; phone: string } }

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/checkout')
  if ((await getSetting('maintenance')).enabled) return { error: 'Checkout is paused while we do maintenance. Please try again shortly.' }

  const method = form.get('payment') === 'razorpay' ? 'razorpay' : 'cod'
  if (method === 'razorpay' && !razorpayConfigured()) return { error: 'Online payment isn’t set up yet. Choose cash on delivery.' }

  // Address: a saved one, or a new one from the form.
  let address: z.infer<typeof addressSchema>
  const savedId = Number(form.get('addressId'))
  if (savedId) {
    const [a] = await db.select().from(schema.addresses).where(and(eq(schema.addresses.id, savedId), eq(schema.addresses.userId, user.id)))
    if (!a) return { error: 'Choose a delivery address.' }
    address = { name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pincode: a.pincode }
  } else {
    const parsed = addressSchema.safeParse(Object.fromEntries(['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'].map((k) => [k, form.get(k) ?? ''])))
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
    address = parsed.data
    if (form.get('save') === 'on') {
      const existing = await db.select({ id: schema.addresses.id }).from(schema.addresses).where(eq(schema.addresses.userId, user.id))
      await db.insert(schema.addresses).values({ ...address, line2: address.line2 || null, userId: user.id, isDefault: existing.length === 0 })
    }
  }

  const cart = await getCart()
  let order
  try {
    order = await createOrder({
      userId: user.id,
      lines: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      address: { ...address, line2: address.line2 || null },
      method,
      notes: String(form.get('notes') ?? '').slice(0, 500),
    })
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message }
    throw e
  }
  await audit('order.place', { user, entity: 'order', entityId: order.number, details: `${method}, ₹${order.total}` })

  if (method === 'cod') {
    await clearCart(user.id)
    revalidatePath('/', 'layout')
    redirect(`/account/orders/${order.number}?placed=1`)
  }

  try {
    const rp = await createRazorpayOrder(order.total, order.number)
    await db.update(schema.orders).set({ razorpayOrderId: rp.id }).where(eq(schema.orders.id, order.id))
    return { razorpay: { key: razorpayKeyId(), orderId: rp.id, amount: rp.amount, number: order.number, name: user.name, email: user.email, phone: user.phone ?? address.phone } }
  } catch (e) {
    console.error(e)
    return { error: 'We couldn’t reach the payment gateway. Your bag is saved — try again, or choose cash on delivery.' }
  }
}

export async function confirmRazorpayPayment(input: { number: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Please sign in again.' }
  const [order] = await db.select().from(schema.orders).where(and(eq(schema.orders.number, input.number), eq(schema.orders.userId, user.id)))
  if (!order || order.razorpayOrderId !== input.razorpay_order_id) return { error: 'This payment doesn’t match your order.' }
  if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    await audit('order.payment', { user, entity: 'order', entityId: order.number, details: 'Signature check failed', success: false })
    return { error: 'We couldn’t verify that payment. If money left your account, it will be refunded automatically within 5–7 days.' }
  }
  await markPaid(order.id, input.razorpay_payment_id)
  await clearCart(user.id)
  await audit('order.payment', { user, entity: 'order', entityId: order.number, details: input.razorpay_payment_id })
  revalidatePath('/', 'layout')
  return { ok: true, href: `/account/orders/${order.number}?placed=1` }
}

export async function cancelMyOrder(orderId: number) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  try {
    await customerCancel(orderId, user.id)
  } catch (e) {
    return { error: (e as Error).message }
  }
  await audit('order.cancel', { user, entity: 'order', entityId: orderId, details: 'Cancelled by customer' })
  revalidatePath('/account/orders')
  return { ok: true }
}

export async function saveAddress(_: unknown, form: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const parsed = addressSchema.safeParse(Object.fromEntries(['name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'].map((k) => [k, form.get(k) ?? ''])))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const existing = await db.select({ id: schema.addresses.id }).from(schema.addresses).where(eq(schema.addresses.userId, user.id))
  await db.insert(schema.addresses).values({ ...parsed.data, line2: parsed.data.line2 || null, userId: user.id, isDefault: existing.length === 0 })
  revalidatePath('/account/addresses')
  return { ok: true, message: 'Address saved.' }
}

export async function deleteAddress(id: number) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await db.delete(schema.addresses).where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)))
  revalidatePath('/account/addresses')
}

export async function makeDefaultAddress(id: number) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await db.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, user.id))
  await db.update(schema.addresses).set({ isDefault: true }).where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)))
  revalidatePath('/account/addresses')
}

/** Retry online payment for an order left awaiting payment. */
export async function retryPayment(number: string): Promise<CheckoutState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const [order] = await db.select().from(schema.orders).where(and(eq(schema.orders.number, number), eq(schema.orders.userId, user.id)))
  if (!order || order.status !== 'pending_payment') return { error: 'This order doesn’t need payment.' }
  if (!razorpayConfigured()) return { error: 'Online payment isn’t available right now.' }
  try {
    const rp = await createRazorpayOrder(order.total, order.number)
    await db.update(schema.orders).set({ razorpayOrderId: rp.id }).where(eq(schema.orders.id, order.id))
    return { razorpay: { key: razorpayKeyId(), orderId: rp.id, amount: rp.amount, number: order.number, name: user.name, email: user.email, phone: user.phone ?? order.shippingAddress.phone } }
  } catch {
    return { error: 'We couldn’t reach the payment gateway. Try again in a minute.' }
  }
}
