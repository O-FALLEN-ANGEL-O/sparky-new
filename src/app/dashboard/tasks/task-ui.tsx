'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState, useTransition } from 'react'
import { createTask, updateTaskProgress } from '@/app/actions/people'
import { Field, FormMessage, Submit } from '@/components/forms'
import { Button } from '@/components/ui/button'

export function NewTaskForm({ team, startOpen }: { team: { value: string; label: string }[]; startOpen?: boolean }) {
  const [open, setOpen] = useState(!!startOpen)
  const [state, action] = useActionState(createTask, null)
  const e = state?.fieldErrors ?? {}
  if (!open) return <Button onClick={() => setOpen(true)}>Assign a task</Button>
  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-4" noValidate>
      <div className="md:col-span-4"><FormMessage state={state} /></div>
      <Field label="Task" name="title" error={e.title} className="md:col-span-2" />
      <Field label="For" name="assigneeId" error={e.assigneeId}>
        <select id="f-assigneeId" name="assigneeId" className="h-11 w-full border bg-background px-3 text-[15px]">
          {team.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>
      <Field label="Due" name="dueDate" type="date" />
      <Field label="Details (optional)" name="description" className="md:col-span-2" />
      <Field label="Priority" name="priority">
        <select id="f-priority" name="priority" defaultValue="medium" className="h-11 w-full border bg-background px-3 text-[15px]">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </Field>
      <div className="flex items-end gap-2">
        <Submit>Assign</Submit>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </form>
  )
}

export function ProgressControl({ id, progress, editable }: { id: number; progress: number; editable: boolean }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const set = (p: number) => start(async () => { await updateTaskProgress(id, p); router.refresh() })
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--series-1)' }} />
      </div>
      <span className="w-10 text-sm tabular">{progress}%</span>
      {editable && progress < 100 && (
        <span className="flex gap-1">
          <Button size="sm" variant="outline" disabled={pending} onClick={() => set(progress + 20)}>+20%</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => set(100)}>Done</Button>
        </span>
      )}
      {editable && progress === 100 && (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => set(80)}>Reopen</Button>
      )}
    </div>
  )
}
