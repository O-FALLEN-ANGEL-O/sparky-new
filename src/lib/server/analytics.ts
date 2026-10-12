import 'server-only'
import { and, desc, eq, gte, lt, ne, sql } from 'drizzle-orm'
import { db, schema } from '@/db'

const o = schema.orders
/** Orders that count as sales: anything not cancelled and not stuck awaiting payment. */
const SOLD = and(ne(o.status, 'cancelled'), ne(o.status, 'pending_payment'))

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

export async function kpis(days = 30) {
  const now = daysAgo(0)
  const cur = daysAgo(days)
  const prev = daysAgo(days * 2)
  const period = async (from: Date, to: Date) => {
    const [r] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${o.total}), 0)::int`,
        orders: sql<number>`count(*)::int`,
        customers: sql<number>`count(distinct ${o.userId})::int`,
      })
      .from(o)
      .where(and(SOLD, gte(o.createdAt, from), lt(o.createdAt, to)))
    return { ...r, aov: r.orders ? Math.round(r.revenue / r.orders) : 0 }
  }
  const [a, b] = await Promise.all([period(cur, now), period(prev, cur)])
  const change = (x: number, y: number) => (y ? (x - y) / y : null)
  return {
    current: a,
    previous: b,
    change: { revenue: change(a.revenue, b.revenue), orders: change(a.orders, b.orders), aov: change(a.aov, b.aov), customers: change(a.customers, b.customers) },
  }
}

export async function revenueByMonth(months = 6) {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${o.createdAt}), 'YYYY-MM')`,
      revenue: sql<number>`sum(${o.total})::int`,
      orders: sql<number>`count(*)::int`,
    })
    .from(o)
    .where(and(SOLD, gte(o.createdAt, sql`date_trunc('month', now()) - (${months - 1} || ' months')::interval`)))
    .groupBy(sql`1`)
    .orderBy(sql`1`)
  return rows
}

export async function revenueByDay(days = 30) {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${o.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<number>`sum(${o.total})::int`,
    })
    .from(o)
    .where(and(SOLD, gte(o.createdAt, daysAgo(days * 2))))
    .groupBy(sql`1`)
    .orderBy(sql`1`)
  const map = new Map(rows.map((r) => [r.day, r.revenue]))
  const out: { day: string; label: string; current: number; previous: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i)
    const p = daysAgo(i + days)
    const key = d.toISOString().slice(0, 10)
    out.push({
      day: key,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      current: map.get(key) ?? 0,
      previous: map.get(p.toISOString().slice(0, 10)) ?? 0,
    })
  }
  return out
}

export async function revenueByCategory(days = 180) {
  return db
    .select({
      name: schema.categories.name,
      revenue: sql<number>`sum(${schema.orderItems.price} * ${schema.orderItems.quantity})::int`,
      units: sql<number>`sum(${schema.orderItems.quantity})::int`,
    })
    .from(schema.orderItems)
    .innerJoin(o, eq(o.id, schema.orderItems.orderId))
    .innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId))
    .innerJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
    .where(and(SOLD, gte(o.createdAt, daysAgo(days))))
    .groupBy(schema.categories.name)
    .orderBy(desc(sql`2`))
}

export async function topProducts(days = 90, limit = 8) {
  return db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      slug: schema.products.slug,
      stock: schema.products.stock,
      revenue: sql<number>`sum(${schema.orderItems.price} * ${schema.orderItems.quantity})::int`,
      units: sql<number>`sum(${schema.orderItems.quantity})::int`,
    })
    .from(schema.orderItems)
    .innerJoin(o, eq(o.id, schema.orderItems.orderId))
    .innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId))
    .where(and(SOLD, gte(o.createdAt, daysAgo(days))))
    .groupBy(schema.products.id)
    .orderBy(desc(sql`5`))
    .limit(limit)
}

export async function salesByCity(days = 180, limit = 10) {
  return db
    .select({
      city: sql<string>`${o.shippingAddress}->>'city'`,
      revenue: sql<number>`sum(${o.total})::int`,
      orders: sql<number>`count(*)::int`,
    })
    .from(o)
    .where(and(SOLD, gte(o.createdAt, daysAgo(days))))
    .groupBy(sql`1`)
    .orderBy(desc(sql`2`))
    .limit(limit)
}

export async function paymentMix(days = 90) {
  return db
    .select({ method: o.paymentMethod, orders: sql<number>`count(*)::int`, revenue: sql<number>`sum(${o.total})::int` })
    .from(o)
    .where(and(SOLD, gte(o.createdAt, daysAgo(days))))
    .groupBy(o.paymentMethod)
}

export async function statusCounts() {
  const rows = await db.select({ status: o.status, n: sql<number>`count(*)::int` }).from(o).groupBy(o.status)
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>
}

export async function lowStock() {
  return db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.active, true), sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`))
    .orderBy(schema.products.stock)
}

export async function customerStats() {
  const res = await db.execute<{ customers: number; repeat: number }>(sql`
    select count(*)::int as customers, count(*) filter (where n > 1)::int as repeat
    from (select user_id, count(*) n from orders where status not in ('cancelled','pending_payment') group by user_id) t`)
  const r = res.rows[0]
  return { customers: r.customers, repeatRate: r.customers ? r.repeat / r.customers : 0 }
}

export async function recentOrders(limit = 8) {
  return db
    .select({ order: o, customer: schema.users.name })
    .from(o)
    .innerJoin(schema.users, eq(schema.users.id, o.userId))
    .orderBy(desc(o.createdAt))
    .limit(limit)
}

/** Slow movers: in stock, no sales in the window. */
export async function slowMovers(days = 60) {
  const sold = db
    .selectDistinct({ id: schema.orderItems.productId })
    .from(schema.orderItems)
    .innerJoin(o, eq(o.id, schema.orderItems.orderId))
    .where(and(SOLD, gte(o.createdAt, daysAgo(days))))
  const soldIds = (await sold).map((r) => r.id).filter((x): x is number => x != null)
  const all = await db.select().from(schema.products).where(and(eq(schema.products.active, true), sql`${schema.products.stock} > 0`))
  return all.filter((p) => !soldIds.includes(p.id))
}

