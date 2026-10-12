import type { Metadata } from 'next'
import Link from 'next/link'
import { desc, eq, inArray } from 'drizzle-orm'
import { JewelImage as Image } from '@/components/jewel-image'
import { db, schema } from '@/db'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { OrderStatusBadge } from '@/components/order-status-badge'

export const metadata: Metadata = { title: 'Your orders' }

export default async function Orders() {
  const user = await requireUser()
  const orders = await db.select().from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt))
  const items = orders.length ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orders.map((o) => o.id))) : []
  return (
    <div>
      <h2 className="mb-6 text-3xl">Orders</h2>
      {!orders.length && <p className="text-muted-foreground">You haven’t ordered anything yet.</p>}
      <ul className="space-y-4">
        {orders.map((o) => {
          const its = items.filter((i) => i.orderId === o.id)
          return (
            <li key={o.id}>
              <Link href={`/account/orders/${o.number}`} className="block border p-5 transition-colors hover:border-foreground">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{o.number}</p>
                    <p className="text-sm text-muted-foreground">Placed {o.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex -space-x-3">
                    {its.slice(0, 4).map((i) => (
                      <div key={i.id} className="relative h-14 w-14 border-2 border-background bg-[#f1ece2]">
                        {i.image && <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />}
                      </div>
                    ))}
                  </div>
                  <p className="tabular text-lg">{formatINR(o.total)}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
