'use client'

import Link from 'next/link'
import { useActionState, useRef } from 'react'
import { login } from '@/app/actions/auth'
import { Field, FormMessage, Submit } from '@/components/forms'

const DEMO = [
  ['Customer', 'customer@sparkle.com'],
  ['Owner', 'owner@sparkle.com'],
  ['Admin', 'admin@sparkle.com'],
  ['Manager', 'manager@sparkle.com'],
  ['HR', 'hr@sparkle.com'],
  ['Employee', 'employee@sparkle.com'],
  ['Shareholder', 'shareholder@sparkle.com'],
  ['Delivery partner', 'delivery@sparkle.com'],
] as const

export function LoginForm({ next, demo }: { next?: string; demo: boolean }) {
  const [state, action] = useActionState(login, null)
  const form = useRef<HTMLFormElement>(null)
  const fill = (email: string) => {
    const f = form.current
    if (!f) return
    ;(f.elements.namedItem('email') as HTMLInputElement).value = email
    ;(f.elements.namedItem('password') as HTMLInputElement).value = 'Sparkle@123'
    f.requestSubmit()
  }
  return (
    <div className="space-y-8">
      <form ref={form} action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next ?? ''} />
        <FormMessage state={state} />
        <Field label="Email" name="email" type="email" autoComplete="email" required error={state?.fieldErrors?.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required error={state?.fieldErrors?.password} />
        <Submit size="lg" className="w-full" pendingText="Signing in…">Sign in</Submit>
        <p className="text-sm text-muted-foreground">
          New to Sparkle?{' '}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-foreground underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </form>
      {demo && (
        <section className="border-t pt-6" aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-xl">Try a demo account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Each signs in with the password Sparkle@123 and shows that role’s view.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {DEMO.map(([role, email]) => (
              <button key={email} type="button" onClick={() => fill(email)} className="border px-3 py-2 text-left text-sm transition-colors hover:border-foreground">
                {role}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
