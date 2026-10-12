import { Fragment } from 'react'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { sql } from 'drizzle-orm'
import { PageHeader, Panel, Pill, Stat } from '@/components/dash/ui'
import { db } from '@/db'
import { requireUser } from '@/lib/server/auth'
import { razorpayConfigured } from '@/lib/server/razorpay'

export const metadata = { title: 'System health' }
export const dynamic = 'force-dynamic'

export default async function System() {
  await requireUser({ permission: 'system.view' })
  const t0 = performance.now()
  const ping = await db.run(sql`select 1`)
  const latency = performance.now() - t0
  const bytes = (ping.meta as { size_after?: number } | undefined)?.size_after ?? 0
  const [counts] = await Promise.all([
    db.all<{ t: string; n: number }>(sql`
      select 'orders' t, count(*) n from orders union all select 'products', count(*) from products
      union all select 'users', count(*) from users union all select 'audit log', count(*) from audit_logs
      union all select 'sessions', count(*) from sessions where expires_at > ${Date.now()}`),
  ])
  const cf = getCloudflareContext().cf as { colo?: string; country?: string } | undefined
  const checks: [string, boolean, string][] = [
    ['Database', latency < 500, `${latency.toFixed(1)} ms round trip`],
    ['Online payments', razorpayConfigured(), razorpayConfigured() ? 'Razorpay keys set' : 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to switch on'],
    ['Razorpay webhook', !!process.env.RAZORPAY_WEBHOOK_SECRET, process.env.RAZORPAY_WEBHOOK_SECRET ? 'Secret set' : 'Optional: set RAZORPAY_WEBHOOK_SECRET'],
    ['Demo mode', process.env.DEMO_MODE !== '1', process.env.DEMO_MODE === '1' ? 'Demo accounts shown on sign-in page — turn off before launch' : 'Off'],
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="System health" description="Live readings from the Worker and D1 database this page was rendered on." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Database latency" value={`${latency.toFixed(0)} ms`} note="Cloudflare D1 (SQLite)" />
        <Stat label="Database size" value={bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '—'} note="Free plan allows 5 GB" />
        <Stat label="Served from" value={cf?.colo ?? 'Local'} note={cf?.country ? `Visitor in ${cf.country}` : 'Development preview'} />
        <Stat label="Runtime" value="Workers" note="Cloudflare edge, no server to patch" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Checks" bodyClassName="p-0">
          <ul className="divide-y">
            {checks.map(([name, ok, detail]) => (
              <li key={name} className="flex items-center gap-3 px-5 py-3">
                <span className="flex-1">{name}<span className="block text-sm text-muted-foreground">{detail}</span></span>
                <Pill tone={ok ? 'ok' : 'warn'}>{ok ? 'OK' : 'Needs attention'}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Platform" bodyClassName="p-0">
          <dl className="grid grid-cols-[10rem_1fr] gap-y-2 px-5 py-4 text-sm">
            <dt className="text-muted-foreground">Host</dt><dd>Cloudflare Workers{cf?.colo ? ` (${cf.colo})` : ''}</dd>
            <dt className="text-muted-foreground">Database</dt><dd>D1 binding <code>DB</code></dd>
            {counts.map((c) => (<Fragment key={c.t}><dt className="capitalize text-muted-foreground">{c.t}</dt><dd className="tabular">{c.n.toLocaleString('en-IN')}</dd></Fragment>))}
          </dl>
        </Panel>
      </div>
    </div>
  )
}
