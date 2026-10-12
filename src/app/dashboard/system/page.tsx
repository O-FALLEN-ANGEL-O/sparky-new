import { Fragment } from 'react'
import os from 'node:os'
import { sql } from 'drizzle-orm'
import { PageHeader, Panel, Pill, Stat } from '@/components/dash/ui'
import { db } from '@/db'
import { requireUser } from '@/lib/server/auth'
import { razorpayConfigured } from '@/lib/server/razorpay'

export const metadata = { title: 'System health' }
export const dynamic = 'force-dynamic'

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`
const dur = (s: number) => (s > 86400 ? `${Math.floor(s / 86400)} d ${Math.floor((s % 86400) / 3600)} h` : s > 3600 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : `${Math.floor(s / 60)} min`)

export default async function System() {
  await requireUser({ permission: 'system.view' })
  const t0 = performance.now()
  await db.execute(sql`select 1`)
  const latency = performance.now() - t0
  const [size, counts, version] = await Promise.all([
    db.execute<{ size: string }>(sql`select pg_size_pretty(pg_database_size(current_database())) as size`),
    db.execute<{ t: string; n: number }>(sql`
      select 'orders' t, count(*)::int n from orders union all select 'products', count(*)::int from products
      union all select 'users', count(*)::int from users union all select 'audit log', count(*)::int from audit_logs
      union all select 'sessions', count(*)::int from sessions where expires_at > now()`),
    db.execute<{ v: string }>(sql`select split_part(version(), ' ', 2) as v`),
  ])
  const mem = process.memoryUsage()
  const load = os.loadavg()
  const checks: [string, boolean, string][] = [
    ['Database', latency < 500, `${latency.toFixed(1)} ms round trip`],
    ['Online payments', razorpayConfigured(), razorpayConfigured() ? 'Razorpay keys set' : 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to switch on'],
    ['Razorpay webhook', !!process.env.RAZORPAY_WEBHOOK_SECRET, process.env.RAZORPAY_WEBHOOK_SECRET ? 'Secret set' : 'Optional: set RAZORPAY_WEBHOOK_SECRET'],
    ['Demo mode', process.env.DEMO_MODE !== '1', process.env.DEMO_MODE === '1' ? 'Demo accounts shown on sign-in page — turn off before launch' : 'Off'],
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="System health" description="Live readings from the server and database this page was rendered on." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Database latency" value={`${latency.toFixed(0)} ms`} note={`PostgreSQL ${version.rows[0].v}`} />
        <Stat label="Database size" value={size.rows[0].size} note="All tables and indexes" />
        <Stat label="App memory" value={mb(mem.rss)} note={`Heap ${mb(mem.heapUsed)} of ${mb(mem.heapTotal)}`} />
        <Stat label="Process uptime" value={dur(process.uptime())} note={`Node ${process.version}`} />
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
        <Panel title="Server" bodyClassName="p-0">
          <dl className="grid grid-cols-[10rem_1fr] gap-y-2 px-5 py-4 text-sm">
            <dt className="text-muted-foreground">Host</dt><dd>{process.env.VERCEL ? `Vercel (${process.env.VERCEL_REGION ?? 'region'})` : os.hostname()}</dd>
            <dt className="text-muted-foreground">Platform</dt><dd>{os.type()} {os.release()} ({os.arch()})</dd>
            <dt className="text-muted-foreground">CPU load</dt><dd className="tabular">{load.map((l) => l.toFixed(2)).join(' · ')} (1, 5, 15 min)</dd>
            <dt className="text-muted-foreground">Machine memory</dt><dd className="tabular">{mb(os.totalmem() - os.freemem())} used of {mb(os.totalmem())}</dd>
            {counts.rows.map((c) => (<Fragment key={c.t}><dt className="capitalize text-muted-foreground">{c.t}</dt><dd className="tabular">{c.n.toLocaleString('en-IN')}</dd></Fragment>))}
          </dl>
        </Panel>
      </div>
    </div>
  )
}
