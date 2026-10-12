import { sql } from 'drizzle-orm'
import { PageHeader } from '@/components/dash/ui'
import { db } from '@/db'
import { dateLong } from '@/lib/format'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'

export const metadata = { title: 'Customers' }

type Row = { id: number; name: string; email: string; phone: string | null; joined: number; orders: number; spent: number; last: number | null; city: string | null }

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser({ permission: 'customers.view' })
  const { q } = await searchParams
  const pattern = q?.trim() ? `%${q.trim()}%` : null
  const rows = await db.all<Row>(sql`
    select u.id, u.name, u.email, u.phone, u.created_at as joined,
      count(o.id) filter (where o.status not in ('cancelled','pending_payment')) as orders,
      coalesce(sum(o.total) filter (where o.status not in ('cancelled','pending_payment')), 0) as spent,
      max(o.created_at) as last,
      (select city from addresses a where a.user_id = u.id order by is_default desc limit 1) as city
    from users u left join orders o on o.user_id = u.id
    where u.role = 'customer' ${pattern ? sql`and (u.name like ${pattern} or u.email like ${pattern})` : sql``}
    group by u.id order by spent desc`)
  return (
    <div>
      <PageHeader title="Customers" description={`${rows.length} customer accounts, ranked by lifetime spend.`} actions={<form role="search"><input name="q" defaultValue={q} placeholder="Name or email" aria-label="Search customers" className="h-9 w-56 rounded-md border bg-background px-3 text-sm" /></form>} />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">City</th>
              <th className="px-4 py-2.5 text-right font-medium">Orders</th>
              <th className="px-4 py-2.5 text-right font-medium">Lifetime spend</th>
              <th className="px-4 py-2.5 font-medium">Last order</th>
              <th className="px-4 py-2.5 font-medium">Customer since</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">{r.name}<span className="block text-xs text-muted-foreground">{r.email}</span></td>
                <td className="px-4 py-2.5">{r.city ?? '—'}</td>
                <td className="px-4 py-2.5 text-right tabular">{r.orders}</td>
                <td className="px-4 py-2.5 text-right tabular">{formatINR(r.spent)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.last ? dateLong(new Date(r.last)) : 'Never'}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{dateLong(new Date(r.joined))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
