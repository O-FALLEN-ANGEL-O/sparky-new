import type { Metadata } from 'next'
import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { formatINR, GST_RATE, orderTotals } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { getCart } from '@/lib/server/cart'
import { razorpayConfigured } from '@/lib/server/razorpay'
import { CheckoutForm } from './checkout-form'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const user = await requireUser({ next: '/checkout' })
  const lines = await getCart()
  if (!lines.length) redirect('/cart')
  const addresses = await db.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id)).orderBy(desc(schema.addresses.isDefault), asc(schema.addresses.id))
  const totals = orderTotals(lines.map((l) => ({ price: l.product.price, quantity: l.quantity })))

  return (
    <div className="container py-12 md:py-16">
      <h1 className="mb-10 text-5xl md:text-6xl">Checkout</h1>
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <CheckoutForm addresses={addresses} razorpay={razorpayConfigured()} defaultName={user.name} defaultPhone={user.phone ?? ''} />
        <aside className="h-fit space-y-5 border p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">Your order</h2>
            <Link href="/cart" className="text-sm underline underline-offset-4">Edit bag</Link>
          </div>
          <ul className="space-y-4">
            {lines.map(({ product: p, quantity }) => (
              <li key={p.id} className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 bg-[#f1ece2]">
                  <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{p.name}</p>
                  <p className="text-sm text-muted-foreground">Qty {quantity}</p>
                </div>
                <p className="tabular">{formatINR(p.price * quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t pt-4 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular">{formatINR(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">GST ({GST_RATE * 100}%)</dt><dd className="tabular">{formatINR(totals.tax)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Insured delivery</dt><dd>Free</dd></div>
          </dl>
          <div className="flex justify-between border-t pt-4 text-xl">
            <span>Total</span>
            <span className="tabular">{formatINR(totals.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
