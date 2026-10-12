import type { Metadata } from 'next'
import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatINR, GST_RATE, orderTotals } from '@/lib/pricing'
import { getCart } from '@/lib/server/cart'
import { LineControls } from './line-controls'

export const metadata: Metadata = { title: 'Your bag' }

export default async function CartPage() {
  const lines = await getCart()
  const totals = orderTotals(lines.map((l) => ({ price: l.product.price, quantity: l.quantity })))
  const short = lines.filter((l) => l.quantity > l.product.stock)

  if (!lines.length) {
    return (
      <div className="container max-w-2xl py-24 text-center">
        <h1 className="text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-muted-foreground">Pieces you add will wait here, even if you sign in on another device.</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/shop">Browse the collection</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-12 md:py-16">
      <h1 className="mb-10 text-5xl md:text-6xl">Your bag</h1>
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y border-y">
          {lines.map(({ product: p, quantity }) => (
            <li key={p.id} className="grid grid-cols-[96px_1fr] gap-5 py-6 sm:grid-cols-[120px_1fr_auto]">
              <Link href={`/products/${p.slug}`} className="relative aspect-square bg-[#f1ece2]">
                <Image src={p.images[0]} alt={p.name} fill sizes="120px" className="object-cover" />
              </Link>
              <div className="space-y-3">
                <div>
                  <Link href={`/products/${p.slug}`} className="font-headline text-2xl leading-tight hover:underline">{p.name}</Link>
                  <p className="text-sm text-muted-foreground">{p.purity}, {p.weightGrams} g · {formatINR(p.price)} each</p>
                </div>
                <LineControls productId={p.id} quantity={quantity} max={Math.min(p.stock, 10)} />
                {quantity > p.stock && <p className="text-sm text-kumkum">Only {p.stock} left — reduce the quantity to continue.</p>}
              </div>
              <p className="tabular col-start-2 text-lg sm:col-start-3 sm:text-right">{formatINR(p.price * quantity)}</p>
            </li>
          ))}
        </ul>
        <aside className="h-fit space-y-4 border p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="text-2xl">Summary</h2>
          <dl className="space-y-2 text-[15px]">
            <Row label="Subtotal" value={formatINR(totals.subtotal)} />
            <Row label={`GST (${GST_RATE * 100}%)`} value={formatINR(totals.tax)} />
            <Row label="Insured delivery" value="Free" />
          </dl>
          <div className="flex justify-between border-t pt-4 text-xl">
            <span>Total</span>
            <span className="tabular">{formatINR(totals.total)}</span>
          </div>
          {short.length ? (
            <Button size="lg" className="w-full" disabled>Update your bag to continue</Button>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">Continue to checkout</Link>
            </Button>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">Pay securely with UPI, cards or netbanking through Razorpay, or in cash when your order arrives.</p>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  )
}
