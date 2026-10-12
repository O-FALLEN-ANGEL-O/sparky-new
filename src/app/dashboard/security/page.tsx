import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { revokeSession } from '@/app/actions/staff'
import { ActionButton } from '@/components/dash/action-button'
import { Empty, PageHeader, Panel, Pill, Stat } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { ago, dateTime } from '@/lib/format'
import { ROLE_LABEL } from '@/lib/roles'
import { SESSION_COOKIE, currentSessionId, requireUser } from '@/lib/server/auth'

export const metadata = { title: 'Security' }

function device(ua: string | null) {
  if (!ua) return 'Unknown device'
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  return `${browser} on ${os}`
}

export default async function Security() {
  await requireUser({ permission: 'security.view' })
  const mine = currentSessionId((await cookies()).get(SESSION_COOKIE)?.value)
  const day = new Date(Date.now() - 86_400_000)
  const [sessions, failed, byEmail, [fail24], [ok24]] = await Promise.all([
    db
      .select({ s: schema.sessions, name: schema.users.name, email: schema.users.email, role: schema.users.role })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
      .where(and(gte(schema.sessions.expiresAt, new Date()), sql`${schema.users.role} <> 'customer'`))
      .orderBy(desc(schema.sessions.lastSeenAt)),
    db.select().from(schema.auditLogs).where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, false))).orderBy(desc(schema.auditLogs.createdAt)).limit(20),
    db
      .select({ email: schema.auditLogs.actorEmail, n: sql<number>`count(*)`, ips: sql<number>`count(distinct ${schema.auditLogs.ip})`, last: sql<Date>`max(${schema.auditLogs.createdAt})` })
      .from(schema.auditLogs)
      .where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, false), gte(schema.auditLogs.createdAt, new Date(Date.now() - 7 * 86_400_000))))
      .groupBy(schema.auditLogs.actorEmail)
      .orderBy(desc(sql`2`)),
    db.select({ n: sql<number>`count(*)` }).from(schema.auditLogs).where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, false), gte(schema.auditLogs.createdAt, day))),
    db.select({ n: sql<number>`count(*)` }).from(schema.auditLogs).where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, true), gte(schema.auditLogs.createdAt, day))),
  ])
  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Who is signed in to staff accounts, and failed sign-in attempts. Five wrong passwords lock an email for 15 minutes." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Staff sessions" value={String(sessions.length)} note="Signed-in devices" />
        <Stat label="Successful sign-ins" value={String(ok24.n)} note="Last 24 hours" />
        <Stat label="Failed sign-ins" value={String(fail24.n)} note="Last 24 hours" />
        <Stat label="Accounts targeted" value={String(byEmail.length)} note="With failures in 7 days" />
      </div>
      <Panel title="Active staff sessions" bodyClassName="p-0">
        <ul className="divide-y">
          {sessions.map(({ s, name, email, role }) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex-1">
                {name} <span className="text-muted-foreground">· {ROLE_LABEL[role]}</span>
                <span className="block text-sm text-muted-foreground">{device(s.userAgent)} · {s.ip} · active {ago(s.lastSeenAt)} · {email}</span>
              </span>
              {s.id === mine ? <Pill tone="ok">This device</Pill> : <ActionButton size="sm" variant="outline" confirm="Sign this device out?" action={revokeSession.bind(null, s.id)}>Sign out</ActionButton>}
            </li>
          ))}
        </ul>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Failed sign-ins by account" description="Last 7 days" bodyClassName="p-0">
          {byEmail.length ? (
            <ul className="divide-y">
              {byEmail.map((r) => (
                <li key={r.email} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="flex-1">{r.email}<span className="block text-muted-foreground">last {ago(new Date(r.last))} · from {r.ips} IP{r.ips === 1 ? '' : 's'}</span></span>
                  <Pill tone={r.n >= 5 ? 'danger' : r.n >= 2 ? 'warn' : 'neutral'}>{r.n} failed</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No failed sign-ins this week" />
          )}
        </Panel>
        <Panel title="Recent failures" bodyClassName="p-0">
          <ul className="divide-y">
            {failed.map((f) => (
              <li key={f.id} className="grid grid-cols-[1fr_auto] px-5 py-2.5 text-sm">
                <span>{f.actorEmail}<span className="block text-muted-foreground">{f.details}</span></span>
                <span className="text-right text-muted-foreground">{f.ip}<span className="block">{dateTime(f.createdAt)}</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
