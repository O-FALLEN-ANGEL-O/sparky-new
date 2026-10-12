import { desc, eq, or } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { deleteTask } from '@/app/actions/people'
import { ActionButton } from '@/components/dash/action-button'
import { Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { dateShort } from '@/lib/format'
import { can } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { directory } from '@/lib/server/people'
import { NewTaskForm, ProgressControl } from './task-ui'

export const metadata = { title: 'Tasks' }
const assignee = alias(schema.users, 'assignee')
const COLUMNS = [
  ['in_progress', 'In progress'],
  ['todo', 'Not started'],
  ['done', 'Done'],
] as const

export default async function Tasks({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const me = await requireUser()
  if (!can(me.role, 'tasks.assign') && !can(me.role, 'tasks.own')) return <Empty title="Tasks aren’t part of your role" />
  const assigner = can(me.role, 'tasks.assign')
  const team = assigner ? await directory(me.role === 'manager' ? { managerId: me.id } : {}) : []
  const rows = await db
    .select({ t: schema.tasks, who: assignee.name })
    .from(schema.tasks)
    .innerJoin(assignee, eq(assignee.id, schema.tasks.assigneeId))
    .where(assigner ? (me.role === 'manager' ? or(eq(schema.tasks.createdById, me.id), eq(schema.tasks.assigneeId, me.id)) : undefined) : eq(schema.tasks.assigneeId, me.id))
    .orderBy(desc(schema.tasks.createdAt))
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="space-y-6">
      <PageHeader title={assigner ? 'Team tasks' : 'My tasks'} description={assigner ? 'Assign work to your team and see how it’s going.' : 'Update progress as you go — your manager sees it straight away.'} />
      {assigner && team.length > 0 && <NewTaskForm team={team.map((t) => ({ value: String(t.id), label: t.name }))} startOpen={(await searchParams).new === '1'} />}
      <div className="grid gap-6 xl:grid-cols-3">
        {COLUMNS.map(([status, label]) => {
          const list = rows.filter((r) => r.t.status === status)
          return (
            <Panel key={status} title={`${label} (${list.length})`} bodyClassName="p-0">
              {list.length ? (
                <ul className="divide-y">
                  {list.map(({ t, who }) => (
                    <li key={t.id} className="space-y-2 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{t.title}</p>
                        <Pill tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'gold' : 'neutral'}>{t.priority}</Pill>
                      </div>
                      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                      <p className="text-sm text-muted-foreground">
                        {assigner ? `${who} · ` : ''}
                        {t.dueDate ? <span className={t.status !== 'done' && t.dueDate < today ? 'text-kumkum' : ''}>{t.status !== 'done' && t.dueDate < today ? 'Overdue, was due ' : 'Due '}{dateShort(t.dueDate)}</span> : 'No due date'}
                      </p>
                      <ProgressControl id={t.id} progress={t.progress} editable={t.assigneeId === me.id || assigner} />
                      {assigner && t.createdById === me.id && (
                        <ActionButton size="sm" variant="ghost" confirm="Delete this task?" action={deleteTask.bind(null, t.id)}>Delete</ActionButton>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="Nothing here" />
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
