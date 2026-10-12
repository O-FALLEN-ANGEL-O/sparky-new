import Link from 'next/link'
import { CompareDaily, RevenueTrend } from '@/components/dash/charts'
import { BarList, PageHeader, Panel, Stat } from '@/components/dash/ui'
import { monthLabel, pct } from '@/lib/format'
import { formatCompactINR } from '@/lib/pricing'
import { kpis, paymentMix, revenueByCategory, revenueByDay, revenueByMonth, salesByCity, topProducts } from '@/lib/server/analytics'
import { requireUser } from '@/lib/server/auth'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Sales analytics' }
const RANGES = [7, 30, 90]

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireUser({ permission: 'analytics.view' })
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30
  const [k, daily, months, cats, cities, top, mix] = await Promise.all([kpis(days), revenueByDay(30), revenueByMonth(6), revenueByCategory(days * 2), salesByCity(days * 2, 8), topProducts(days, 8), paymentMix(days)])
  const mixTotal = mix.reduce((s, m) => s + m.orders, 0)
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales analytics"
        description="Revenue counts paid orders and cash-on-delivery orders, excluding cancellations. GST included."
        actions={
          <nav className="flex rounded-md border bg-card p-0.5 text-sm" aria-label="Period">
            {RANGES.map((r) => (
              <Link key={r} href={`/dashboard/analytics?days=${r}`} aria-current={r === days ? 'page' : undefined} className={cn('rounded px-3 py-1.5', r === days ? 'bg-foreground text-background' : 'text-muted-foreground')}>
                {r} days
              </Link>
            ))}
          </nav>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={formatCompactINR(k.current.revenue)} change={k.change.revenue} note={`vs previous ${days} days`} />
        <Stat label="Orders" value={String(k.current.orders)} change={k.change.orders} note={`vs previous ${days} days`} />
        <Stat label="Average order" value={formatCompactINR(k.current.aov)} change={k.change.aov} note={`vs previous ${days} days`} />
        <Stat label="Buying customers" value={String(k.current.customers)} change={k.change.customers} note={`vs previous ${days} days`} />
      </div>
      <Panel title="Daily revenue" description="Each day of the last 30, against the same day in the 30 before">
        <CompareDaily data={daily} />
      </Panel>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Revenue by month" description="Current month is so far">
          <RevenueTrend data={months.map((m) => ({ label: monthLabel(m.month), revenue: m.revenue }))} height={240} />
        </Panel>
        <Panel title="How customers pay" description={`Last ${days} days`}>
          <BarList rows={mix.map((m) => ({ label: m.method === 'cod' ? 'Cash on delivery' : 'Razorpay (online)', value: m.orders, sub: mixTotal ? pct(m.orders / mixTotal) : '' }))} format={(n) => `${n} orders`} />
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="By collection" description={`Last ${days * 2} days`}>
          <BarList rows={cats.map((c) => ({ label: c.name, value: c.revenue, sub: `${c.units} pcs` }))} format={formatCompactINR} />
        </Panel>
        <Panel title="By city" description={`Last ${days * 2} days`}>
          <BarList rows={cities.map((c) => ({ label: c.city, value: c.revenue, sub: `${c.orders} orders` }))} format={formatCompactINR} />
        </Panel>
        <Panel title="Best sellers" description={`Last ${days} days`}>
          <BarList rows={top.map((t) => ({ label: t.name, value: t.revenue, sub: `${t.units} sold` }))} format={formatCompactINR} />
        </Panel>
      </div>
    </div>
  )
}
