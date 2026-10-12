import Link from 'next/link'
import { asc, desc, eq } from 'drizzle-orm'
import { processPayroll } from '@/app/actions/people'
import { ActionButton } from '@/components/dash/action-button'
import { Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { dateLong, monthLabel } from '@/lib/format'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { cn } from '@/lib/utils'
import { PrepareForm } from './payroll-ui'

export const metadata = { title: 'Payroll' }

export default async function Payroll({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireUser({ permission: 'payroll.manage' })
  const runs = await db.select().from(schema.payrollRuns).orderBy(desc(schema.payrollRuns.month))
  const sp = await searchParams
  const selected = runs.find((r) => r.month === sp.month) ?? runs[0]
  const slips = selected
    ? await db
        .select({ s: schema.payslips, name: schema.users.name, code: schema.employees.employeeCode, dept: schema.employees.department })
        .from(schema.payslips)
        .innerJoin(schema.users, eq(schema.users.id, schema.payslips.userId))
        .innerJoin(schema.employees, eq(schema.employees.userId, schema.payslips.userId))
        .where(eq(schema.payslips.runId, selected.id))
        .orderBy(asc(schema.employees.employeeCode))
    : []
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const sum = (k: keyof (typeof slips)[number]['s']) => slips.reduce((a, b) => a + (b.s[k] as number), 0)
  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" description="Salaries are calculated from each person’s monthly pay: basic 50%, HRA 20%, allowances 30%; PF, professional tax and TDS (new regime) are deducted, plus any approved unpaid leave." />
      <Panel title="Run payroll">
        <PrepareForm defaultMonth={runs.some((r) => r.month === thisMonth && r.status === 'processed') ? thisMonth : thisMonth} />
      </Panel>
      <div className="grid gap-6 xl:grid-cols-[16rem_1fr]">
        <Panel title="Months" bodyClassName="p-0">
          <ul className="divide-y">
            {runs.map((r) => (
              <li key={r.id}>
                <Link href={`/dashboard/payroll?month=${r.month}`} className={cn('flex items-center justify-between px-5 py-3 hover:bg-muted/30', selected?.id === r.id && 'bg-muted/50')}>
                  <span>{monthLabel(r.month)}</span>
                  <Pill tone={r.status === 'processed' ? 'ok' : 'gold'}>{r.status}</Pill>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        {selected ? (
          <Panel
            title={`${monthLabel(selected.month)} — ${selected.status === 'processed' ? 'processed' : 'draft'}`}
            description={selected.processedAt ? `Processed ${dateLong(selected.processedAt)}. Payslips are visible to staff.` : 'Not yet visible to staff. Check the figures, then process.'}
            action={
              selected.status === 'draft' ? (
                <ActionButton confirm={`Process ${monthLabel(selected.month)} payroll for ${slips.length} people?`} action={processPayroll.bind(null, selected.id)}>Process payroll</ActionButton>
              ) : (
                <a href={`/dashboard/reports/download/payroll?from=${selected.month}-01&to=${selected.month}-28`} className="text-sm underline underline-offset-4">Download CSV</a>
              )
            }
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-[13.5px]">
                <thead className="border-b bg-muted/40 text-right text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Employee</th>
                    <th className="px-3 py-2.5 font-medium">Gross</th>
                    <th className="px-3 py-2.5 font-medium">PF</th>
                    <th className="px-3 py-2.5 font-medium">Prof. tax</th>
                    <th className="px-3 py-2.5 font-medium">TDS</th>
                    <th className="px-3 py-2.5 font-medium">Unpaid leave</th>
                    <th className="px-4 py-2.5 font-medium">Net pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-right tabular">
                  {slips.map(({ s, name, code, dept }) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 text-left">{name}<span className="block text-xs text-muted-foreground">{code} · {dept}</span></td>
                      <td className="px-3 py-2.5">{formatINR(s.gross)}</td>
                      <td className="px-3 py-2.5">{formatINR(s.pf)}</td>
                      <td className="px-3 py-2.5">{formatINR(s.professionalTax)}</td>
                      <td className="px-3 py-2.5">{formatINR(s.tds)}</td>
                      <td className="px-3 py-2.5">{s.unpaidLeaveDeduction ? formatINR(s.unpaidLeaveDeduction) : '—'}</td>
                      <td className="px-4 py-2.5 font-medium">{formatINR(s.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-muted/40 text-right font-medium tabular">
                  <tr>
                    <td className="px-4 py-2.5 text-left">{slips.length} people</td>
                    <td className="px-3 py-2.5">{formatINR(sum('gross'))}</td>
                    <td className="px-3 py-2.5">{formatINR(sum('pf'))}</td>
                    <td className="px-3 py-2.5">{formatINR(sum('professionalTax'))}</td>
                    <td className="px-3 py-2.5">{formatINR(sum('tds'))}</td>
                    <td className="px-3 py-2.5">{formatINR(sum('unpaidLeaveDeduction'))}</td>
                    <td className="px-4 py-2.5">{formatINR(sum('net'))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        ) : (
          <Empty title="No payroll yet">Prepare the first month above.</Empty>
        )}
      </div>
    </div>
  )
}
