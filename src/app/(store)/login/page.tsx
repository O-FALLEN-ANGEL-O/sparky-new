import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { homeFor } from '@/lib/roles'
import { getCurrentUser } from '@/lib/server/auth'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(next?.startsWith('/') && !next.startsWith('//') ? next : homeFor(user.role))
  return (
    <div className="container grid max-w-5xl gap-16 py-16 md:grid-cols-2 md:py-24">
      <div>
        <h1 className="text-5xl md:text-6xl">Welcome back</h1>
        <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">Sign in to check out, track deliveries and see your saved pieces. Staff sign in here too.</p>
      </div>
      <LoginForm next={next} demo={process.env.DEMO_MODE === '1'} />
    </div>
  )
}
