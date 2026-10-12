'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState, useTransition } from 'react'
import { createJob, setApplicationStatus } from '@/app/actions/people'
import { Field, FormMessage, Submit } from '@/components/forms'
import { Button } from '@/components/ui/button'
import { APPLICATION_STAGES as STAGES } from '@/lib/labels'


export function StageSelect({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <select
      aria-label="Stage"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(async () => { await setApplicationStatus(id, e.target.value); router.refresh() })}
      className="h-8 rounded-md border bg-background px-2 text-sm"
    >
      {STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  )
}

export function NewJobForm() {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(createJob, null)
  const e = state?.fieldErrors ?? {}
  if (!open) return <Button onClick={() => setOpen(true)}>Post a role</Button>
  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-4" noValidate>
      <div className="md:col-span-4"><FormMessage state={state} /></div>
      <Field label="Role title" name="title" error={e.title} className="md:col-span-2" />
      <Field label="Department" name="department" error={e.department} />
      <Field label="Location" name="location" defaultValue="Mangaluru" error={e.location} />
      <Field label="Type" name="type">
        <select id="f-type" name="type" className="h-11 w-full border bg-background px-3 text-[15px]">
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
      </Field>
      <Field label="About the role" name="description" error={e.description} className="md:col-span-3">
        <textarea id="f-description" name="description" rows={3} className="w-full border bg-background p-3 text-[15px]" />
      </Field>
      <Field label="Requirements, one per line" name="requirements" error={e.requirements} className="md:col-span-4">
        <textarea id="f-requirements" name="requirements" rows={3} className="w-full border bg-background p-3 text-[15px]" />
      </Field>
      <div className="flex gap-2 md:col-span-4">
        <Submit>Publish to careers page</Submit>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </form>
  )
}
