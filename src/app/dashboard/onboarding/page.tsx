import { asc, eq } from 'drizzle-orm'
import { Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { dateLong, dateShort } from '@/lib/format'
import { requireUser } from '@/lib/server/auth'
import { AddStep, Step } from './onboarding-ui'

export const metadata = { title: 'Onboarding' }

export default async function Onboarding() {
  await requireUser({ permission: 'onboarding.manage' })
  const rows = await db
    .select({ t: schema.onboardingTasks, name: schema.users.name, title: schema.employees.title, joinDate: schema.employees.joinDate })
    .from(schema.onboardingTasks)
    .innerJoin(schema.users, eq(schema.users.id, schema.onboardingTasks.userId))
    .innerJoin(schema.employees, eq(schema.employees.userId, schema.onboardingTasks.userId))
    .orderBy(asc(schema.onboardingTasks.sort))
  const people = [...new Map(rows.map((r) => [r.t.userId, r])).values()]
  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" description="A checklist starts automatically for everyone you add in People. New hires can tick off their own steps in the HR portal." />
      {people.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {people.map((p) => {
            const steps = rows.filter((r) => r.t.userId === p.t.userId)
            const done = steps.filter((s) => s.t.done).length
            return (
              <Panel key={p.t.userId} title={p.name} description={`${p.title} · joined ${dateLong(p.joinDate)}`} action={<Pill tone={done === steps.length ? 'ok' : 'gold'}>{done} of {steps.length} done</Pill>}>
                <div className="divide-y">
                  {steps.map((s) => <Step key={s.t.id} id={s.t.id} title={s.t.title} done={s.t.done} due={s.t.dueDate ? dateShort(s.t.dueDate) : undefined} />)}
                </div>
                <AddStep userId={p.t.userId} />
              </Panel>
            )
          })}
        </div>
      ) : (
        <Empty title="Nobody is onboarding">Add a person in People to start a checklist.</Empty>
      )}
    </div>
  )
}
