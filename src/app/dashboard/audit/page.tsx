import Link from 'next/link'
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { PageHeader, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { dateTime } from '@/lib/format'
import { requireUser } from '@/lib/server/auth'

export const metadata = { title: 'Audit log' }
const PAGE = 50

export default async function Audit({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; page?: string }> }) {
  await requireUser({ permission: 'audit.view' })
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const where: SQL[] = []
  if (sp.area) where.push(ilike(schema.auditLogs.action, `${sp.area.replace(/[%_]/g, '')}.%`))
  if (sp.q?.trim()) {
    const like = `%${sp.q.trim()}%`
    where.push(or(ilike(schema.auditLogs.actorEmail, like), ilike(schema.auditLogs.details, like), ilike(schema.auditLogs.entityId, like), ilike(schema.auditLogs.ip, like))!)
  }
  const [rows, areas] = await Promise.all([
    db.select().from(schema.auditLogs).where(and(...where)).orderBy(desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id)).limit(PAGE + 1).offset((page - 1) * PAGE),
    db.select({ a: sql<string>`split_part(${schema.auditLogs.action}, '.', 1)`, n: sql<number>`count(*)::int` }).from(schema.auditLogs).groupBy(sql`1`).orderBy(sql`1`),
  ])
  const more = rows.length > PAGE
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][])
    return `/dashboard/audit${p.size ? `?${p}` : ''}`
  }
  return (
    <div>
      <PageHeader title="Audit log" description="Every sign-in, order change, stock movement, pay run and setting change, with who did it and from where." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1 text-sm" aria-label="Area">
          <Link href={link({ area: undefined, page: undefined })} className={`rounded-md px-3 py-1.5 ${!sp.area ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}>All</Link>
          {areas.map((a) => (
            <Link key={a.a} href={link({ area: a.a, page: undefined })} className={`rounded-md px-3 py-1.5 capitalize ${sp.area === a.a ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}>{a.a} <span className="opacity-70 tabular">{a.n}</span></Link>
          ))}
        </nav>
        <form role="search">{sp.area && <input type="hidden" name="area" value={sp.area} />}<input name="q" defaultValue={sp.q} placeholder="Email, IP or detail" aria-label="Search the log" className="h-9 w-56 rounded-md border bg-background px-3 text-sm" /></form>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[760px] text-[13.5px]">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr><th className="px-4 py-2.5 font-medium">When</th><th className="px-4 py-2.5 font-medium">Who</th><th className="px-4 py-2.5 font-medium">Action</th><th className="px-4 py-2.5 font-medium">Detail</th><th className="px-4 py-2.5 font-medium">IP</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.slice(0, PAGE).map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{dateTime(r.createdAt)}</td>
                <td className="px-4 py-2">{r.actorEmail ?? 'System'}</td>
                <td className="px-4 py-2"><code className="text-[12.5px]">{r.action}</code> {!r.success && <Pill tone="danger">failed</Pill>}</td>
                <td className="max-w-md px-4 py-2 text-muted-foreground">{[r.entity && `${r.entity} ${r.entityId ?? ''}`.trim(), r.details].filter(Boolean).join(' — ')}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="mt-4 flex justify-end gap-2 text-sm" aria-label="Pages">
        {page > 1 && <Link className="rounded-md border px-3 py-1.5" href={link({ page: String(page - 1) })}>Newer</Link>}
        {more && <Link className="rounded-md border px-3 py-1.5" href={link({ page: String(page + 1) })}>Older</Link>}
      </nav>
    </div>
  )
}
