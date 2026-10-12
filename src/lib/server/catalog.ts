import 'server-only'
import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from 'drizzle-orm'
import { cache } from 'react'
import { db, schema } from '@/db'

export type Product = typeof schema.products.$inferSelect
export type Category = typeof schema.categories.$inferSelect

export const METAL_LABEL: Record<Product['metal'], string> = {
  yellow_gold: 'Yellow gold',
  rose_gold: 'Rose gold',
  white_gold: 'White gold',
  platinum: 'Platinum',
  silver: 'Silver',
}
export const GEM_LABEL: Record<Product['gem'], string> = {
  diamond: 'Diamond',
  emerald: 'Emerald',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  pearl: 'Pearl',
  none: 'Plain metal',
}

export const getCategories = cache(async () =>
  db.select().from(schema.categories).orderBy(asc(schema.categories.sort)),
)

export type ShopFilters = {
  category?: string
  metal?: string[]
  gem?: string[]
  min?: number
  max?: number
  q?: string
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'newest' | 'rating'
  inStock?: boolean
}

export async function listProducts(f: ShopFilters = {}) {
  const where: SQL[] = [eq(schema.products.active, true)]
  if (f.category) {
    const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.slug, f.category))
    if (cat) where.push(eq(schema.products.categoryId, cat.id))
  }
  if (f.metal?.length) where.push(inArray(schema.products.metal, f.metal as Product['metal'][]))
  if (f.gem?.length) where.push(inArray(schema.products.gem, f.gem as Product['gem'][]))
  if (f.min) where.push(gte(schema.products.price, f.min))
  if (f.max) where.push(lte(schema.products.price, f.max))
  if (f.inStock) where.push(sql`${schema.products.stock} > 0`)
  if (f.q?.trim()) {
    const terms = f.q.trim().split(/\s+/).slice(0, 6)
    for (const t of terms) {
      const like = `%${t.replace(/[%_]/g, '')}%`
      where.push(
        or(
          ilike(schema.products.name, like),
          ilike(schema.products.description, like),
          ilike(sql`${schema.products.metal}::text`, like.replace(' ', '_')),
          ilike(sql`${schema.products.gem}::text`, like),
          ilike(sql`${schema.products.jewelType}::text`, like.replace(/s%$/, '%')),
          ilike(schema.products.purity, like),
        )!,
      )
    }
  }
  const order =
    f.sort === 'price_asc'
      ? [asc(schema.products.price)]
      : f.sort === 'price_desc'
        ? [desc(schema.products.price)]
        : f.sort === 'newest'
          ? [desc(schema.products.createdAt)]
          : f.sort === 'rating'
            ? [desc(schema.products.rating), desc(schema.products.reviewCount)]
            : [desc(schema.products.featured), desc(schema.products.reviewCount)]
  return db
    .select()
    .from(schema.products)
    .where(and(...where))
    .orderBy(...order)
}

export const getProductBySlug = cache(async (slug: string) => {
  const rows = await db
    .select({ product: schema.products, category: schema.categories })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
    .where(and(eq(schema.products.slug, slug), eq(schema.products.active, true)))
    .limit(1)
  return rows[0] ?? null
})

export async function getFeatured(limit = 8) {
  return db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.active, true), eq(schema.products.featured, true)))
    .orderBy(desc(schema.products.reviewCount))
    .limit(limit)
}

export async function getRelated(product: Product, limit = 4) {
  return db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.active, true), ne(schema.products.id, product.id), or(eq(schema.products.categoryId, product.categoryId), eq(schema.products.metal, product.metal))))
    .orderBy(sql`case when ${schema.products.categoryId} = ${product.categoryId} then 0 else 1 end`, desc(schema.products.reviewCount))
    .limit(limit)
}

export async function priceBounds() {
  const [r] = await db
    .select({ min: sql<number>`min(${schema.products.price})::int`, max: sql<number>`max(${schema.products.price})::int` })
    .from(schema.products)
    .where(eq(schema.products.active, true))
  return r
}

export async function wishlistIds(userId: number) {
  const rows = await db.select({ id: schema.wishlist.productId }).from(schema.wishlist).where(eq(schema.wishlist.userId, userId))
  return new Set(rows.map((r) => r.id))
}
