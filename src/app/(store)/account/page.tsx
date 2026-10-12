import Link from 'next/link'
import { count, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { OrderStatusBadge } from '@/components/order-status-badge'

export default async function AccountHome() {
  const user = await requireUser()
  const [orders, [wish]] = await Promise.all([
    db.select().from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt)).limit(3),
    db.select({ n: count() }).from(schema.wishlist).where(eq(schema.wishlist.userId, user.id)),
  ])
  const active = orders.find((o) => ['confirmed', 'processing', 'out_for_delivery'].includes(o.status))
  return (
    <div className="space-y-10">
      {active && (
        <Link href={`/account/orders/${active.number}`} className="block border border-gold/50 bg-gold/5 p-5 transition-colors hover:bg-gold/10">
          <p className="text-sm text-muted-foreground">On its way</p>
          <p className="mt-1 font-headline text-2xl">Order {active.number} is {active.status === 'out_for_delivery' ? 'out for delivery today' : 'being prepared'}.</p>
          <p className="mt-2 text-sm underline underline-offset-4">Track it and see your delivery code</p>
        </Link>
      )}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-3xl">Recent orders</h2>
          <Link href="/account/orders" className="text-sm underline underline-offset-4">All orders</Link>
        </div>
        {orders.length ? (
          <ul className="divide-y border-y">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-muted/40">
                  <span className="font-medium">{o.number}</span>
                  <span className="text-sm text-muted-foreground">{o.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="tabular">{formatINR(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No orders yet. <Link href="/shop" className="text-foreground underline underline-offset-4">Find your first piece</Link>.
          </p>
        )}
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/wishlist" className="border p-5 hover:border-foreground">
          <p className="font-headline text-2xl">Wishlist</p>
          <p className="text-sm text-muted-foreground">{wish.n} saved piece{wish.n === 1 ? '' : 's'}</p>
        </Link>
        <Link href="/account/addresses" className="border p-5 hover:border-foreground">
          <p className="font-headline text-2xl">Addresses</p>
          <p className="text-sm text-muted-foreground">Manage where we deliver</p>
        </Link>
      </section>
    </div>
  )
}
