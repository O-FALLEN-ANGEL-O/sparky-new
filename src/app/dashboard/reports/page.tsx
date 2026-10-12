import { PageHeader } from '@/components/dash/ui'
import { Button } from '@/components/ui/button'
import { can } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'

export const metadata = { title: 'Reports' }

const REPORTS = [
  { type: 'orders', title: 'Orders', body: 'Every order with customer, city, status, payment and totals.', range: true },
  { type: 'sales-by-product', title: 'Sales by piece', body: 'Units and revenue for each piece, best sellers first.', range: true },
  { type: 'monthly-summary', title: 'Monthly summary', body: 'Orders, revenue, average order and buying customers per month.', range: true },
  { type: 'inventory', title: 'Inventory snapshot', body: 'Current stock, reorder levels and stock value at retail.', range: false },
  { type: 'payroll', title: 'Payroll register', body: 'Every payslip with earnings and deductions. HR and owner only.', range: true, permission: 'payroll.manage' as const },
]

export default async function Reports() {
  const user = await requireUser({ permission: 'reports.view' })
  const today = new Date().toISOString().slice(0, 10)
  const start = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10)
  return (
    <div>
      <PageHeader title="Reports" description="Download as CSV. Opens in Excel, Google Sheets or Numbers; amounts are in rupees." />
      <ul className="grid gap-4 lg:grid-cols-2">
        {REPORTS.filter((r) => !r.permission || can(user.role, r.permission)).map((r) => (
          <li key={r.type} className="rounded-lg border bg-card p-5">
            <h2 className="font-headline text-2xl">{r.title}</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">{r.body}</p>
            <form action={`/dashboard/reports/download/${r.type}`} method="get" className="mt-4 flex flex-wrap items-end gap-3">
              {r.range && (
                <>
                  <label className="text-sm">From<input type="date" name="from" defaultValue={start} max={today} className="mt-1 block h-9 rounded-md border bg-background px-2" /></label>
                  <label className="text-sm">To<input type="date" name="to" defaultValue={today} max={today} className="mt-1 block h-9 rounded-md border bg-background px-2" /></label>
                </>
              )}
              <Button type="submit" variant="outline">Download CSV</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
