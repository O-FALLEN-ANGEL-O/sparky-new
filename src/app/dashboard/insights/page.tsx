import Link from 'next/link'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { Empty, PageHeader, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { msAgo } from '@/db/sql'
import { pct } from '@/lib/format'
import { formatCompactINR, formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { revenueByCategory, salesByCity, slowMovers } from '@/lib/server/analytics'

export const metadata = { title: 'Insights' }

type Insight = { tone: 'danger' | 'warn' | 'gold' | 'ok'; label: string; title: string; detail: string; why: string; href?: string; cta?: string }

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)

/**
 * Rule-based insights computed from the store's own data. Each one says what it
 * looked at, so nobody has to take a recommendation on trust.
 */
async function buildInsights(): Promise<Insight[]> {
  const out: Insight[] = []
  const sold30 = await db.all<{ id: number; name: string; stock: number; units: number }>(sql`
    select p.id, p.name, p.stock, coalesce(sum(oi.quantity) filter (where o.created_at >= ${msAgo(30)} and o.status not in ('cancelled','pending_payment')), 0) as units
    from products p left join order_items oi on oi.product_id = p.id left join orders o on o.id = oi.order_id
    where p.active group by p.id`)
  for (const p of sold30) {
    if (p.units === 0) continue
    const cover = Math.floor(p.stock / (p.units / 30))
    if (cover < 21) {
      out.push({
        tone: cover < 7 ? 'danger' : 'warn',
        label: 'Restock',
        title: p.stock === 0 ? `${p.name} is sold out` : `${p.name} will sell out in about ${cover} days`,
        detail: `${p.stock} left, selling ${p.units} a month. Ask the workshop for a new batch now; casting and setting take about three weeks.`,
        why: `Units sold in the last 30 days (${p.units}) against current stock (${p.stock}).`,
        href: `/dashboard/inventory?product=${p.id}`,
        cta: 'Open in inventory',
      })
    }
  }
  const slow = await slowMovers(60)
  if (slow.length) {
    const value = slow.reduce((s, p) => s + p.price * p.stock, 0)
    out.push({
      tone: 'gold',
      label: 'Merchandising',
      title: `${slow.length} piece${slow.length > 1 ? 's haven’t' : ' hasn’t'} sold in 60 days`,
      detail: `${slow.slice(0, 3).map((p) => p.name).join(', ')}${slow.length > 3 ? '…' : ''} — ${formatCompactINR(value)} of stock at retail. Try featuring them on the homepage or in the next newsletter.`,
      why: 'Active pieces with stock and no paid orders in the last 60 days.',
      href: '/dashboard/products',
      cta: 'Review products',
    })
  }
  const [cur, prev] = await Promise.all([revenueByCategory(30), db.all<{ name: string; revenue: number }>(sql`
    select c.name, sum(oi.price * oi.quantity) as revenue from order_items oi join orders o on o.id = oi.order_id
    join products p on p.id = oi.product_id join categories c on c.id = p.category_id
    where o.status not in ('cancelled','pending_payment') and o.created_at >= ${msAgo(60)} and o.created_at < ${msAgo(30)} group by c.name`)])
  const prevMap = new Map(prev.map((r) => [r.name, r.revenue]))
  const movers = cur
    .map((c) => ({ ...c, before: prevMap.get(c.name) ?? 0 }))
    .filter((c) => c.before > 0)
    .map((c) => ({ ...c, change: (c.revenue - c.before) / c.before }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  if (movers[0] && Math.abs(movers[0].change) > 0.2) {
    const m = movers[0]
    out.push({
      tone: m.change > 0 ? 'ok' : 'warn',
      label: 'Trend',
      title: `${m.name} revenue is ${m.change > 0 ? 'up' : 'down'} ${pct(Math.abs(m.change))} this month`,
      detail: `${formatINR(m.revenue)} in the last 30 days against ${formatINR(m.before)} in the 30 before.${m.change > 0 ? ' Make sure the best sellers in this collection are well stocked.' : ' Worth checking whether a popular piece sold out.'}`,
      why: 'Revenue per collection, last 30 days compared with the previous 30.',
      href: '/dashboard/analytics',
      cta: 'See analytics',
    })
  }
  const stuck = await db
    .select({ n: sql<number>`count(*)`, value: sql<number>`coalesce(sum(${schema.orders.total}),0)` })
    .from(schema.orders)
    .where(and(eq(schema.orders.status, 'pending_payment'), lt(schema.orders.createdAt, daysAgo(0.04))))
  if (stuck[0].n) {
    out.push({
      tone: 'warn',
      label: 'Follow up',
      title: `${stuck[0].n} order${stuck[0].n > 1 ? 's are' : ' is'} waiting for payment`,
      detail: `${formatINR(stuck[0].value)} started but not paid. A call often recovers these — customers can pay from their order page.`,
      why: 'Orders placed with online payment over an hour ago that are still unpaid.',
      href: '/dashboard/orders?status=pending_payment',
      cta: 'See these orders',
    })
  }
  const [c90] = await db
    .select({ all: sql<number>`count(*)`, cancelled: sql<number>`count(*) filter (where ${schema.orders.status} = 'cancelled')` })
    .from(schema.orders)
    .where(gte(schema.orders.createdAt, daysAgo(90)))
  if (c90.all > 10) {
    const rate = c90.cancelled / c90.all
    out.push({
      tone: rate > 0.08 ? 'warn' : 'ok',
      label: 'Health',
      title: `Cancellation rate is ${pct(rate)} over 90 days`,
      detail: rate > 0.08 ? 'Higher than the 5–8% typical for fine jewellery online. Check the cancellation reasons on recent orders.' : 'Within the usual range for fine jewellery online.',
      why: `${c90.cancelled} of ${c90.all} orders in the last 90 days were cancelled.`,
      href: '/dashboard/orders?status=cancelled',
      cta: 'Review cancellations',
    })
  }
  const cities = await salesByCity(90, 3)
  const total = cities.reduce((s, c) => s + c.revenue, 0)
  if (cities[0] && total) {
    out.push({
      tone: 'gold',
      label: 'Customers',
      title: `${cities[0].city} is your biggest market`,
      detail: `${cities.map((c) => `${c.city} ${formatCompactINR(c.revenue)}`).join(', ')} in the last 90 days. Consider a trunk show or a local delivery promise there.`,
      why: 'Revenue by delivery city, last 90 days.',
      href: '/dashboard/analytics',
      cta: 'See by city',
    })
  }
  return out
}

export default async function Insights() {
  await requireUser({ permission: 'analytics.view' })
  const items = await buildInsights()
  const rank = { danger: 0, warn: 1, gold: 2, ok: 3 }
  items.sort((a, b) => rank[a.tone] - rank[b.tone])
  return (
    <div>
      <PageHeader title="Insights" description="Suggestions worked out from your own orders and stock, most urgent first. Each one shows the data it’s based on." />
      {items.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((i) => (
            <li key={i.title} className="flex flex-col rounded-lg border bg-card p-5">
              <Pill tone={i.tone}>{i.label}</Pill>
              <h2 className="mt-3 font-headline text-2xl leading-tight">{i.title}</h2>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{i.detail}</p>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Based on: {i.why}</p>
              {i.href && <Link href={i.href} className="mt-3 text-sm underline underline-offset-4">{i.cta}</Link>}
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="Nothing stands out right now">Insights appear as orders come in.</Empty>
      )}
    </div>
  )
}
