import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { logout } from '@/app/actions/auth'
import { Sidebar } from '@/components/dash/sidebar'
import { ThemeToggle } from '@/components/dash/theme-toggle'
import { db, schema } from '@/db'
import { can, ROLE_LABEL } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { STAFF_NAV } from '@/lib/staff-nav'
import Link from 'next/link'

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s · Sparkle staff' }, robots: { index: false } }

const count = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser({ next: '/dashboard' })
  if (user.role === 'customer') redirect('/account')
  if (user.role === 'delivery_agent') redirect('/delivery')

  const groups = STAFF_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => (!i.any && !i.roles) || i.any?.some((p) => can(user.role, p)) || i.roles?.includes(user.role)),
  })).filter((g) => g.items.length)

  const badges: Record<string, number> = {}
  if (can(user.role, 'orders.view')) {
    badges['/dashboard/orders'] = await count(db.select({ n: sql<number>`count(*)` }).from(schema.orders).where(eq(schema.orders.status, 'confirmed')))
  }
  if (can(user.role, 'deliveries.manage')) {
    badges['/dashboard/deliveries'] = await count(
      db.select({ n: sql<number>`count(*)` }).from(schema.deliveries).where(eq(schema.deliveries.status, 'pending')),
    )
  }
  if (can(user.role, 'leave.approve')) {
    badges['/dashboard/leave'] = await count(db.select({ n: sql<number>`count(*)` }).from(schema.leaveRequests).where(eq(schema.leaveRequests.status, 'pending')))
  }
  if (can(user.role, 'recruitment.manage')) {
    badges['/dashboard/recruitment'] = await count(db.select({ n: sql<number>`count(*)` }).from(schema.applications).where(eq(schema.applications.status, 'new')))
  }
  if (can(user.role, 'tasks.own')) {
    badges['/dashboard/tasks'] = await count(
      db.select({ n: sql<number>`count(*)` }).from(schema.tasks).where(and(eq(schema.tasks.assigneeId, user.id), inArray(schema.tasks.status, ['todo', 'in_progress']))),
    )
  }

  return (
    <div className="flex min-h-dvh bg-[#f7f5f0] dark:bg-background">
      <Sidebar groups={groups} badges={badges} user={{ name: user.name, roleLabel: ROLE_LABEL[user.role] }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">View store</Link>
          <ThemeToggle />
          <form action={logout}>
            <button className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground">Sign out</button>
          </form>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
