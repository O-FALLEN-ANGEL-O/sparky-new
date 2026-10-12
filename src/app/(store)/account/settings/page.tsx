import type { Metadata } from 'next'
import { requireUser } from '@/lib/server/auth'
import { PasswordForm, ProfileForm } from './settings-forms'

export const metadata: Metadata = { title: 'Profile and password' }

export default async function Settings() {
  const user = await requireUser()
  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-6 text-3xl">Profile</h2>
        <ProfileForm name={user.name} phone={user.phone ?? ''} email={user.email} />
      </section>
      <section>
        <h2 className="mb-6 text-3xl">Password</h2>
        <PasswordForm />
      </section>
    </div>
  )
}
