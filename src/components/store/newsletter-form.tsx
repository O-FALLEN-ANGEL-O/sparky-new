'use client'

import { useActionState } from 'react'
import { subscribe } from '@/app/actions/store'

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribe, null)
  if (state?.ok) return <p className="text-sm text-gilt" role="status">{state.message}</p>
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex border-b border-white/25 focus-within:border-gold">
        <label htmlFor="nl-email" className="sr-only">Email address</label>
        <input id="nl-email" name="email" type="email" required placeholder="you@example.com" className="h-11 flex-1 bg-transparent text-sm text-[#f6efe2] outline-none placeholder:text-[#8a7f70]" />
        <button disabled={pending} className="px-2 text-sm text-gilt hover:text-[#f6efe2] disabled:opacity-50">
          {pending ? 'Joining…' : 'Join'}
        </button>
      </div>
      {state?.error && <p className="text-xs text-[#e5998f]" role="alert">{state.error}</p>}
    </form>
  )
}
