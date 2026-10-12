'use client'

import { useActionState, useState } from 'react'
import { postAnnouncement } from '@/app/actions/people'
import { Field, FormMessage, Submit } from '@/components/forms'
import { Button } from '@/components/ui/button'

export function AnnounceForm() {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(postAnnouncement, null)
  const e = state?.fieldErrors ?? {}
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Post an announcement</Button>
  return (
    <form action={action} className="space-y-3 rounded-lg border bg-card p-5" noValidate>
      <FormMessage state={state} />
      <Field label="Title" name="title" error={e.title} />
      <Field label="Message" name="body" error={e.body}>
        <textarea id="f-body" name="body" rows={4} className="w-full border bg-background p-3 text-[15px]" />
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="accent-[#15110E]" /> Pin to the top</label>
      <div className="flex gap-2"><Submit>Post</Submit><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button></div>
    </form>
  )
}
