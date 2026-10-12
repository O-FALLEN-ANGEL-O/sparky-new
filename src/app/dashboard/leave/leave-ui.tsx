'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState, useTransition } from 'react'
import { requestLeave, reviewLeave } from '@/app/actions/people'
import { Field, FormMessage, Submit } from '@/components/forms'
import { Button } from '@/components/ui/button'

export function LeaveForm({ startOpen }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(!!startOpen)
  const [state, action] = useActionState(requestLeave, null)
  const e = state?.fieldErrors ?? {}
  const today = new Date().toISOString().slice(0, 10)
  if (!open) return <Button onClick={() => setOpen(true)}>Request leave</Button>
  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-4" noValidate>
      <div className="md:col-span-4"><FormMessage state={state} /></div>
      <Field label="Type" name="type" error={e.type}>
        <select id="f-type" name="type" className="h-11 w-full border bg-background px-3 text-[15px]">
          <option value="casual">Casual</option>
          <option value="sick">Sick</option>
          <option value="earned">Earned</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </Field>
      <Field label="From" name="startDate" type="date" min={today} defaultValue={today} error={e.startDate} />
      <Field label="To" name="endDate" type="date" min={today} defaultValue={today} error={e.endDate} />
      <Field label="Reason" name="reason" error={e.reason} />
      <div className="flex items-end gap-2 md:col-span-4">
        <Submit>Send request</Submit>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        <span className="text-sm text-muted-foreground">Sundays aren’t counted.</span>
      </div>
    </form>
  )
}

export function Review({ id }: { id: number }) {
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const act = (d: 'approved' | 'rejected') =>
    start(async () => {
      const r = await reviewLeave(id, d, note)
      if (r.error) setError(r.error)
      router.refresh()
    })
  return (
    <div className="space-y-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (needed to decline)" aria-label="Note" className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => act('approved')}>Approve</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => act('rejected')}>Decline</Button>
      </div>
      {error && <p className="text-xs text-kumkum" role="alert">{error}</p>}
    </div>
  )
}
