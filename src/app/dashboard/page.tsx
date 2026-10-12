import Link from 'next/link'
import { and, count, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { OrderStatusBadge } from '@/components/order-status-badge'
import { RevenueTrend } from '@/components/dash/charts'
import { BarList, Empty, PageHeader, Panel, Pill, Stat } from '@/components/dash/ui'
import { Button } from '@/components/ui/button'
import { db, schema } from '@/db'
import { ago, dateShort, monthLabel, pct } from '@/lib/format'
import { LEAVE_LABEL } from '@/lib/leave'
import { formatCompactINR, formatINR } from '@/lib/pricing'
import { ROLE_LABEL } from '@/lib/roles'
import { customerStats, kpis, lowStock, recentOrders, revenueByCategory, revenueByMonth, salesByCity, topProducts } from '@/lib/server/analytics'
import { requireUser, type CurrentUser } from '@/lib/server/auth'
import { announcements, directory, latestPayslip, leaveBalance, myTasks, pendingLeave } from '@/lib/server/people'

export const metadata = { title: 'Overview' }

function greeting() {
  const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default async function Overview() {
  const user = await requireUser()
  const title = `${greeting()}, ${user.name.split(' ')[0]}`
  switch (user.role) {
    case 'owner':
      return <Owner user={user} title={title} />
    case 'admin':
      return <Admin title={title} />
    case 'manager':
      return <Manager user={user} title={title} />
    case 'hr':
      return <HR title={title} />
    case 'shareholder':
      return <Shareholder title={title} />
    default:
      return <Employee user={user} title={title} />
  }
}

async function SalesKpis({ days = 30 }: { days?: number }) {
  const [k, cs] = await Promise.all([kpis(days), customerStats()])
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label={`Revenue, last ${days} days`} value={formatCompactINR(k.current.revenue)} change={k.change.revenue} note={`vs previous ${days} days`} href="/dashboard/analytics" />
      <Stat label="Orders" value={String(k.current.orders)} change={k.change.orders} note={`vs previous ${days} days`} href="/dashboard/orders" />
      <Stat label="Average order" value={formatCompactINR(k.current.aov)} change={k.change.aov} note={`vs previous ${days} days`} />
      <Stat label="Repeat customers" value={pct(cs.repeatRate)} note={`${cs.customers} customers have bought`} />
    </div>
  )
}

async function RecentOrdersPanel() {
  const rows = await recentOrders(7)
  return (
    <Panel title="Latest orders" action={<Link href="/dashboard/orders" className="text-sm underline underline-offset-4">All orders</Link>} bodyClassName="p-0">
      <ul className="divide-y">
        {rows.map(({ order, customer }) => (
          <li key={order.id}>
            <Link href={`/dashboard/orders/${order.number}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-muted/40 sm:grid-cols-[7rem_1fr_auto_auto]">
              <span className="font-medium tabular">{order.number}</span>
              <span className="truncate text-sm text-muted-foreground sm:text-[15px] sm:text-foreground">{customer}</span>
              <OrderStatusBadge status={order.status} />
              <span className="text-right tabular">{formatINR(order.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

async function AttentionPanel() {
  const [unassigned, toConfirm, low, failedLogins, leave] = await Promise.all([
    db.select({ n: count() }).from(schema.deliveries).where(eq(schema.deliveries.status, 'pending')),
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.status, 'confirmed')),
    lowStock(),
    db.select({ n: count() }).from(schema.auditLogs).where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, false), gte(schema.auditLogs.createdAt, new Date(Date.now() - 86_400_000)))),
    db.select({ n: count() }).from(schema.leaveRequests).where(eq(schema.leaveRequests.status, 'pending')),
  ])
  const items = [
    { n: toConfirm[0].n, text: 'new orders to pack', href: '/dashboard/orders?status=confirmed' },
    { n: unassigned[0].n, text: 'deliveries without a partner', href: '/dashboard/deliveries' },
    { n: low.length, text: 'pieces low on stock', href: '/dashboard/inventory?filter=low' },
    { n: leave[0].n, text: 'leave requests waiting', href: '/dashboard/leave' },
    { n: failedLogins[0].n, text: 'failed sign-ins in 24 hours', href: '/dashboard/security' },
  ].filter((i) => i.n > 0)
  return (
    <Panel title="Needs attention">
      {items.length ? (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.href}>
              <Link href={i.href} className="flex items-baseline gap-3 hover:underline">
                <span className="w-8 font-headline text-2xl tabular">{i.n}</span>
                <span className="text-[15px]">{i.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="All clear">Nothing is waiting on you right now.</Empty>
      )}
    </Panel>
  )
}

async function RevenuePanel() {
  const months = await revenueByMonth(6)
  return (
    <Panel title="Revenue by month" description="Paid and cash-on-delivery orders, excluding cancellations">
      <RevenueTrend data={months.map((m) => ({ label: monthLabel(m.month), revenue: m.revenue }))} />
    </Panel>
  )
}

async function TopProductsPanel() {
  const rows = await topProducts(90, 6)
  return (
    <Panel title="Best sellers" description="Last 90 days, by revenue">
      <BarList rows={rows.map((r) => ({ label: r.name, value: r.revenue, sub: `${r.units} sold` }))} format={formatCompactINR} />
    </Panel>
  )
}

async function Owner({ title }: { user: CurrentUser; title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="How the store is doing, and what needs you today." />
      <SalesKpis />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <RevenuePanel />
        <AttentionPanel />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <RecentOrdersPanel />
        <TopProductsPanel />
      </div>
    </div>
  )
}

async function Admin({ title }: { title: string }) {
  const [open, sessions, low] = await Promise.all([
    db.select({ n: count() }).from(schema.orders).where(inArray(schema.orders.status, ['confirmed', 'processing', 'out_for_delivery'])),
    db.select({ n: count() }).from(schema.sessions).where(gte(schema.sessions.expiresAt, new Date())),
    lowStock(),
  ])
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Operations, accounts and system health." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open orders" value={String(open[0].n)} note="Confirmed, packing or on the way" href="/dashboard/orders" />
        <Stat label="Low-stock pieces" value={String(low.length)} note="At or below their reorder level" href="/dashboard/inventory?filter=low" />
        <Stat label="Active sessions" value={String(sessions[0].n)} note="Signed-in devices right now" href="/dashboard/security" />
        <Stat label="System" value="Healthy" note="Database and app responding" href="/dashboard/system" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <RecentOrdersPanel />
        <AttentionPanel />
      </div>
    </div>
  )
}

async function Manager({ user, title }: { user: CurrentUser; title: string }) {
  const [team, leave, teamTasks] = await Promise.all([
    directory({ managerId: user.id }),
    pendingLeave(user.id),
    db
      .select({ status: schema.tasks.status, n: count() })
      .from(schema.tasks)
      .where(eq(schema.tasks.createdById, user.id))
      .groupBy(schema.tasks.status),
  ])
  const t = Object.fromEntries(teamTasks.map((r) => [r.status, r.n])) as Record<string, number>
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Your team, their work and today’s orders." actions={<Button asChild><Link href="/dashboard/tasks?new=1">Assign a task</Link></Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Team members" value={String(team.length)} note="Reporting to you" href="/dashboard/people" />
        <Stat label="Tasks in progress" value={String(t.in_progress ?? 0)} note={`${t.todo ?? 0} not started`} href="/dashboard/tasks" />
        <Stat label="Tasks done" value={String(t.done ?? 0)} note="Assigned by you" href="/dashboard/tasks" />
        <Stat label="Leave to review" value={String(leave.length)} note="Waiting for your decision" href="/dashboard/leave" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <RecentOrdersPanel />
        <Panel title="Leave requests" action={<Link href="/dashboard/leave" className="text-sm underline underline-offset-4">Review</Link>}>
          {leave.length ? (
            <ul className="space-y-3">
              {leave.slice(0, 5).map(({ leave: l, name }) => (
                <li key={l.id} className="text-[15px]">
                  <p>{name}</p>
                  <p className="text-sm text-muted-foreground">
                    {LEAVE_LABEL[l.type]} leave, {dateShort(l.startDate)} – {dateShort(l.endDate)} ({l.days} day{l.days === 1 ? '' : 's'})
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No requests waiting" />
          )}
        </Panel>
      </div>
    </div>
  )
}

async function HR({ title }: { title: string }) {
  const [people, leave, apps, runs, onboarding] = await Promise.all([
    directory(),
    pendingLeave(),
    db.select({ status: schema.applications.status, n: count() }).from(schema.applications).groupBy(schema.applications.status),
    db.select().from(schema.payrollRuns).orderBy(desc(schema.payrollRuns.month)).limit(1),
    db
      .select({ name: schema.users.name, done: sql<number>`count(*) filter (where ${schema.onboardingTasks.done})`, total: count() })
      .from(schema.onboardingTasks)
      .innerJoin(schema.users, eq(schema.users.id, schema.onboardingTasks.userId))
      .groupBy(schema.users.name),
  ])
  const a = Object.fromEntries(apps.map((r) => [r.status, r.n])) as Record<string, number>
  const thisMonth = new Date().toISOString().slice(0, 7)
  const lastRun = runs[0]
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="People, pay and hiring at a glance." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Headcount" value={String(people.filter((p) => p.role !== 'shareholder').length)} note="Active staff" href="/dashboard/people" />
        <Stat label="Leave to review" value={String(leave.length)} note="Across all teams" href="/dashboard/leave" />
        <Stat label="New applications" value={String(a.new ?? 0)} note={`${(a.interview ?? 0) + (a.offer ?? 0)} in interview or offer`} href="/dashboard/recruitment" />
        <Stat label="Last payroll" value={lastRun ? monthLabel(lastRun.month) : 'None yet'} note={lastRun?.month === thisMonth ? 'This month is done' : 'This month not run yet'} href="/dashboard/payroll" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Onboarding in progress" action={<Link href="/dashboard/onboarding" className="text-sm underline underline-offset-4">Open</Link>}>
          {onboarding.length ? (
            <BarList rows={onboarding.map((o) => ({ label: o.name, value: o.done, sub: `of ${o.total} steps` }))} format={(n) => String(n)} max={Math.max(...onboarding.map((o) => o.total))} />
          ) : (
            <Empty title="Nobody is onboarding right now" />
          )}
        </Panel>
        <AnnouncementsPanel />
      </div>
    </div>
  )
}

async function AnnouncementsPanel() {
  const rows = await announcements(4)
  return (
    <Panel title="Announcements" action={<Link href="/dashboard/portal" className="text-sm underline underline-offset-4">HR portal</Link>}>
      <ul className="space-y-4">
        {rows.map(({ a, author }) => (
          <li key={a.id}>
            <p className="font-medium">{a.title} {a.pinned && <Pill tone="gold">Pinned</Pill>}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{author ?? 'HR'} · {ago(a.createdAt)}</p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

async function Shareholder({ title }: { title: string }) {
  const [cats, cities] = await Promise.all([revenueByCategory(180), salesByCity(180, 8)])
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Company performance. Figures update as orders come in." actions={<Button asChild variant="outline"><Link href="/dashboard/reports">Download reports</Link></Button>} />
      <SalesKpis />
      <RevenuePanel />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue by collection" description="Last six months">
          <BarList rows={cats.map((c) => ({ label: c.name, value: c.revenue, sub: `${c.units} pcs` }))} format={formatCompactINR} />
        </Panel>
        <Panel title="Top cities" description="Last six months">
          <BarList rows={cities.map((c) => ({ label: c.city, value: c.revenue, sub: `${c.orders} orders` }))} format={formatCompactINR} />
        </Panel>
        <TopProductsPanel />
      </div>
    </div>
  )
}

async function Employee({ user, title }: { user: CurrentUser; title: string }) {
  const [tasks, balance, slip] = await Promise.all([myTasks(user.id), leaveBalance(user.id), latestPayslip(user.id)])
  const open = tasks.filter((t) => t.status !== 'done')
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={`${ROLE_LABEL[user.role]} portal — your work, leave and pay.`} actions={<Button asChild><Link href="/dashboard/leave?new=1">Request leave</Link></Button>} />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="My tasks" action={<Link href="/dashboard/tasks" className="text-sm underline underline-offset-4">All tasks</Link>} bodyClassName="p-0">
          {open.length ? (
            <ul className="divide-y">
              {open.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="flex-1">{t.title}</span>
                  {t.dueDate && <span className="text-sm text-muted-foreground">Due {dateShort(t.dueDate)}</span>}
                  <Pill tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'gold' : 'neutral'}>{t.priority} priority</Pill>
                  <span className="w-12 text-right text-sm tabular">{t.progress}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No open tasks">Your manager will assign work here.</Empty>
          )}
        </Panel>
        <div className="space-y-6">
          <Panel title="Leave left this year">
            <BarList rows={balance.filter((b) => b.allowance > 0).map((b) => ({ label: `${LEAVE_LABEL[b.type]}`, value: b.left, sub: `of ${b.allowance}` }))} format={(n) => `${n} days`} max={15} />
          </Panel>
          <Panel title="Latest payslip" action={<Link href="/dashboard/portal#payslips" className="text-sm underline underline-offset-4">All payslips</Link>}>
            {slip ? (
              <div>
                <p className="text-sm text-muted-foreground">{monthLabel(slip.month)} take-home</p>
                <p className="font-headline text-3xl tabular">{formatINR(slip.slip.net)}</p>
              </div>
            ) : (
              <Empty title="No payslips yet" />
            )}
          </Panel>
        </div>
      </div>
      <AnnouncementsPanel />
    </div>
  )
}
