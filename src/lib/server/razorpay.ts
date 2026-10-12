import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Razorpay integration. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test keys start with rzp_test_).
 * Optional RAZORPAY_WEBHOOK_SECRET enables /api/razorpay/webhook as a safety net.
 */
export function razorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? ''
}

export async function createRazorpayOrder(amountRupees: number, receipt: string): Promise<{ id: string; amount: number; currency: string }> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountRupees * 100, currency: 'INR', receipt, payment_capture: 1 }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Razorpay rejected the order (${res.status}): ${body.slice(0, 200)}`)
  }
  return res.json()
}

function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Checkout callback signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret = process.env.RAZORPAY_KEY_SECRET ?? '') {
  if (!secret || !/^[0-9a-f]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqualHex(expected, signature)
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string, secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '') {
  if (!secret || !/^[0-9a-f]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}
