import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db, schema } from '@/db'
import { getCurrentUser } from './auth'

const GUEST_COOKIE = 'spk_cart'
const MAX_QTY = 10

type Line = { productId: number; quantity: number }

async function readGuest(): Promise<Line[]> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as [number, number][]
    return parsed
      .filter((x) => Array.isArray(x) && Number.isInteger(x[0]) && Number.isInteger(x[1]) && x[1] > 0)
      .slice(0, 30)
      .map(([productId, quantity]) => ({ productId, quantity: Math.min(quantity, MAX_QTY) }))
  } catch {
    return []
  }
}

async function writeGuest(lines: Line[]) {
  const store = await cookies()
  if (!lines.length) {
    store.delete(GUEST_COOKIE)
    return
  }
  store.set(GUEST_COOKIE, JSON.stringify(lines.map((l) => [l.productId, l.quantity])), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

async function readLines(): Promise<Line[]> {
  const user = await getCurrentUser()
  if (!user) return readGuest()
  return db
    .select({ productId: schema.cartItems.productId, quantity: schema.cartItems.quantity })
    .from(schema.cartItems)
    .where(eq(schema.cartItems.userId, user.id))
}

export type CartLine = {
  productId: number
  quantity: number
  product: typeof schema.products.$inferSelect
}

export const getCart = cache(async (): Promise<CartLine[]> => {
  const lines = await readLines()
  if (!lines.length) return []
  const products = await db
    .select()
    .from(schema.products)
    .where(and(inArray(schema.products.id, lines.map((l) => l.productId)), eq(schema.products.active, true)))
  const byId = new Map(products.map((p) => [p.id, p]))
  return lines
    .filter((l) => byId.has(l.productId))
    .map((l) => ({ ...l, product: byId.get(l.productId)! }))
})

export async function cartCount(): Promise<number> {
  const lines = await readLines()
  return lines.reduce((n, l) => n + l.quantity, 0)
}

export async function setLine(productId: number, quantity: number, mode: 'set' | 'add' = 'set') {
  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId)).limit(1)
  if (!product || !product.active) throw new Error('This piece is no longer available.')
  const user = await getCurrentUser()
  const lines = await readLines()
  const current = lines.find((l) => l.productId === productId)?.quantity ?? 0
  let next = mode === 'add' ? current + quantity : quantity
  next = Math.max(0, Math.min(next, MAX_QTY))
  if (next > product.stock) {
    if (product.stock === 0) throw new Error(`${product.name} is out of stock.`)
    throw new Error(`Only ${product.stock} of ${product.name} left in stock.`)
  }
  if (user) {
    if (next === 0) {
      await db.delete(schema.cartItems).where(and(eq(schema.cartItems.userId, user.id), eq(schema.cartItems.productId, productId)))
    } else {
      await db
        .insert(schema.cartItems)
        .values({ userId: user.id, productId, quantity: next })
        .onConflictDoUpdate({ target: [schema.cartItems.userId, schema.cartItems.productId], set: { quantity: next, updatedAt: new Date() } })
    }
    return
  }
  const others = lines.filter((l) => l.productId !== productId)
  await writeGuest(next === 0 ? others : [...others, { productId, quantity: next }])
}

/** After sign-in: move the guest cookie cart into the user's saved cart. */
export async function mergeGuestCart(userId: number) {
  const guest = await readGuest()
  if (!guest.length) return
  for (const l of guest) {
    const [product] = await db.select({ stock: schema.products.stock }).from(schema.products).where(eq(schema.products.id, l.productId))
    if (!product) continue
    const [existing] = await db
      .select({ q: schema.cartItems.quantity })
      .from(schema.cartItems)
      .where(and(eq(schema.cartItems.userId, userId), eq(schema.cartItems.productId, l.productId)))
    const q = Math.min(Math.max(existing?.q ?? 0, l.quantity), product.stock, MAX_QTY)
    if (q <= 0) continue
    await db
      .insert(schema.cartItems)
      .values({ userId, productId: l.productId, quantity: q })
      .onConflictDoUpdate({ target: [schema.cartItems.userId, schema.cartItems.productId], set: { quantity: q } })
  }
  await writeGuest([])
}

export async function clearCart(userId: number) {
  await db.delete(schema.cartItems).where(eq(schema.cartItems.userId, userId))
}
