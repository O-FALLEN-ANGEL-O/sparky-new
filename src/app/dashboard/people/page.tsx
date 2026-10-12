import { Fragment } from 'react'
import { setActive } from '@/app/actions/staff'
import { ActionButton } from '@/components/dash/action-button'
import { PageHeader, Pill } from '@/components/dash/ui'
import { ago, dateLong } from '@/lib/format'
import { formatINR } from '@/lib/pricing'
import { can, ROLE_LABEL } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { directory } from '@/lib/server/people'
import { AddStaffForm, EditPerson } from './people-forms'

export const metadata = { title: 'People' }

export default async function People({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string; all?: string }> }) {
  const me = await requireUser({ permission: 'people.view' })
  const sp = await searchParams
  const canManage = can(me.role, 'people.manage')
  const canRoles = can(me.role, 'roles.manage')
  const teamOnly = me.role === 'manager' && sp.all !== '1'
  let people = await directory({ managerId: teamOnly ? me.id : undefined, includeInactive: canRoles || canManage })
  if (sp.q?.trim()) {
    const q = sp.q.toLowerCase()
    people = people.filter((p) => [p.name, p.email, p.department, p.title].some((v) => v?.toLowerCase().includes(q)))
  }
  const managers = (await directory()).filter((p) => ['owner', 'manager', 'hr', 'admin'].includes(p.role)).map((p) => ({ value: String(p.id), label: p.name }))
  const showSalary = canManage
  return (
    <div className="space-y-6">
      <PageHeader
        title={teamOnly ? 'Your team' : 'People'}
        description={teamOnly ? 'Everyone who reports to you.' : `${people.length} people across the company.`}
        actions={
          <form className="flex gap-2" role="search">
            {me.role === 'manager' && <a href={teamOnly ? '/dashboard/people?all=1' : '/dashboard/people'} className="self-center text-sm underline underline-offset-4">{teamOnly ? 'Show everyone' : 'Only my team'}</a>}
            <input name="q" defaultValue={sp.q} placeholder="Name, team or title" aria-label="Search people" className="h-9 w-52 rounded-md border bg-background px-3 text-sm" />
          </form>
        }
      />
      {canManage && <AddStaffForm managers={managers} />}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[820px] text-[14px]">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Team</th>
              <th className="px-4 py-2.5 font-medium">Reports to</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
              {showSalary && <th className="px-4 py-2.5 text-right font-medium">Salary</th>}
              <th className="px-4 py-2.5 font-medium">Last sign-in</th>
              {(canManage || canRoles) && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {people.map((p) => (
              <Fragment key={p.id}>
                <tr className={p.active ? '' : 'opacity-60'}>
                  <td className="px-4 py-2.5">{p.name}<span className="block text-xs text-muted-foreground">{p.code} · {p.email}</span></td>
                  <td className="px-4 py-2.5">{p.active ? <Pill tone={p.role === 'owner' ? 'gold' : 'neutral'}>{ROLE_LABEL[p.role]}</Pill> : <Pill tone="danger">Deactivated</Pill>}</td>
                  <td className="px-4 py-2.5">{p.title}<span className="block text-xs text-muted-foreground">{p.department}</span></td>
                  <td className="px-4 py-2.5">{p.managerName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{dateLong(p.joinDate)}</td>
                  {showSalary && <td className="px-4 py-2.5 text-right tabular">{p.salary ? formatINR(p.salary) : '—'}</td>}
                  <td className="px-4 py-2.5 text-muted-foreground">{p.lastLoginAt ? ago(p.lastLoginAt) : 'Never'}</td>
                  {(canManage || canRoles) && (
                    <td className="px-4 py-2.5 text-right">
                      {p.role !== 'owner' && p.id !== me.id && (
                        <a href={sp.edit === String(p.id) ? '/dashboard/people' : `/dashboard/people?edit=${p.id}`} className="text-sm underline underline-offset-4">{sp.edit === String(p.id) ? 'Close' : 'Edit'}</a>
                      )}
                    </td>
                  )}
                </tr>
                {sp.edit === String(p.id) && (
                  <tr className="bg-muted/30">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="max-w-2xl flex-1">
                          <EditPerson person={{ id: p.id, role: p.role, department: p.department, title: p.title, salary: p.salary, managerId: p.managerId }} managers={managers} canRole={canRoles} canDetails={canManage} />
                        </div>
                        {canRoles && (
                          <ActionButton
                            variant={p.active ? 'destructive' : 'outline'}
                            size="sm"
                            confirm={p.active ? `Deactivate ${p.name.split(' ')[0]}? They’ll be signed out everywhere.` : undefined}
                            action={setActive.bind(null, p.id, !p.active)}
                          >
                            {p.active ? 'Deactivate account' : 'Reactivate account'}
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
