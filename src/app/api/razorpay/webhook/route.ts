import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { markPaid } from '@/lib/server/orders'
import { verifyWebhookSignature } from '@/lib/server/razorpay'

/**
 * Razorpay webhook (payment.captured / order.paid). Confirms orders even if the
 * customer closed the tab before the checkout callback ran. Point Razorpay at
 * https://<your-domain>/api/razorpay/webhook and set RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  const event = JSON.parse(raw)
  const payment = event?.payload?.payment?.entity
  if (!payment?.order_id) return NextResponse.json({ ok: true, ignored: true })
  if (!['payment.captured', 'order.paid'].includes(event.event)) return NextResponse.json({ ok: true, ignored: true })
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.razorpayOrderId, payment.order_id))
  if (!order) return NextResponse.json({ ok: true, unknown: true })
  await markPaid(order.id, payment.id)
  return NextResponse.json({ ok: true })
}
