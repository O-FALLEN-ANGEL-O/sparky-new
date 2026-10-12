'use client'

import { useActionState } from 'react'
import { applyForJob } from '@/app/actions/store'
import { Field, FormMessage, Submit } from '@/components/forms'

export function ApplyForm({ jobId }: { jobId: number }) {
  const [state, action] = useActionState(applyForJob, null)
  if (state?.ok) return <FormMessage state={state} />
  const e = state?.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="jobId" value={jobId} />
      <FormMessage state={state} />
      <Field label="Full name" name="name" autoComplete="name" error={e.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" error={e.email} />
      <Field label="Mobile number" name="phone" type="tel" maxLength={10} error={e.phone} />
      <Field label="Portfolio or LinkedIn (optional)" name="portfolioUrl" type="url" placeholder="https://" error={e.portfolioUrl} />
      <Field label="Why this role?" name="coverLetter" error={e.coverLetter}>
        <textarea id="f-coverLetter" name="coverLetter" rows={6} aria-invalid={!!e.coverLetter} className="w-full border bg-background p-3 text-[15px] outline-none focus:border-foreground" />
      </Field>
      <Submit size="lg" className="w-full" pendingText="Sending…">Send application</Submit>
    </form>
  )
}
