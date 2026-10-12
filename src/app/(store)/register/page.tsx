import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/server/auth'
import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Create an account' }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  if (await getCurrentUser()) redirect('/account')
  return (
    <div className="container grid max-w-5xl gap-16 py-16 md:grid-cols-2 md:py-24">
      <div>
        <h1 className="text-5xl md:text-6xl">Create your account</h1>
        <ul className="mt-6 max-w-sm space-y-3 leading-relaxed text-muted-foreground">
          <li>Track every order to your door.</li>
          <li>Save pieces to your wishlist.</li>
          <li>Keep your bag across devices.</li>
        </ul>
      </div>
      <RegisterForm next={next} />
    </div>
  )
}
