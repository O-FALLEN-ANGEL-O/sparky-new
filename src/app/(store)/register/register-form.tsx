'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { register } from '@/app/actions/auth'
import { Field, FormMessage, Submit } from '@/components/forms'

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(register, null)
  const e = state?.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <FormMessage state={state} />
      <Field label="Full name" name="name" autoComplete="name" required error={e.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={e.email} />
      <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="98xxxxxxxx" required error={e.phone} hint="Our delivery partner calls this number before arriving." />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required error={e.password} hint="At least 8 characters, with a letter and a number." />
      <Submit size="lg" className="w-full" pendingText="Creating account…">Create account</Submit>
      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-foreground underline underline-offset-4">Sign in</Link>
      </p>
    </form>
  )
}
