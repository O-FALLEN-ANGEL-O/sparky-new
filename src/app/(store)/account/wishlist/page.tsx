import type { Metadata } from 'next'
import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { ProductCard } from '@/components/store/product-card'
import { requireUser } from '@/lib/server/auth'

export const metadata: Metadata = { title: 'Wishlist' }

export default async function Wishlist() {
  const user = await requireUser()
  const rows = await db
    .select({ p: schema.products })
    .from(schema.wishlist)
    .innerJoin(schema.products, eq(schema.products.id, schema.wishlist.productId))
    .where(eq(schema.wishlist.userId, user.id))
    .orderBy(desc(schema.wishlist.createdAt))
  return (
    <div>
      <h2 className="mb-6 text-3xl">Wishlist</h2>
      {rows.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {rows.map(({ p }) => (
            <ProductCard key={p.id} product={p} saved />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          Tap the heart on any piece to save it here. <Link href="/shop" className="text-foreground underline underline-offset-4">Browse the collection</Link>.
        </p>
      )}
    </div>
  )
}
