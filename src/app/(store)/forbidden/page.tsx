import Link from 'next/link'
import { homeFor } from '@/lib/roles'
import { getCurrentUser } from '@/lib/server/auth'

export default async function Forbidden() {
  const user = await getCurrentUser()
  return (
    <div className="container max-w-xl py-24 text-center">
      <h1 className="text-5xl">This page isn’t part of your role</h1>
      <p className="mt-4 text-muted-foreground">Your account doesn’t have access here. If you think it should, ask the store owner or an admin to update your role.</p>
      <Link href={user ? homeFor(user.role) : '/'} className="mt-8 inline-block underline underline-offset-4">Go to your home page</Link>
    </div>
  )
}
