'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addOnboardingTask, toggleOnboardingTask } from '@/app/actions/people'
import { Button } from '@/components/ui/button'

export function Step({ id, title, done, due }: { id: number; title: string; done: boolean; due?: string }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        onChange={(e) => start(async () => { await toggleOnboardingTask(id, e.target.checked); router.refresh() })}
        className="mt-1 h-4 w-4 accent-[#15110E]"
      />
      <span className={done ? 'text-muted-foreground line-through' : ''}>
        {title}
        {due && !done && <span className="ml-2 text-xs text-muted-foreground no-underline">by {due}</span>}
      </span>
    </label>
  )
}

export function AddStep({ userId }: { userId: number }) {
  const [title, setTitle] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => { await addOnboardingTask(userId, title); setTitle(''); router.refresh() })
      }}
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a step" aria-label="New onboarding step" className="h-9 flex-1 rounded-md border bg-background px-3 text-sm" />
      <Button size="sm" variant="outline" disabled={pending || title.trim().length < 3}>Add</Button>
    </form>
  )
}
