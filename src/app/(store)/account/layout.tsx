import { logout } from '@/app/actions/auth'
import { requireUser } from '@/lib/server/auth'
import { AccountNav } from './account-nav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser({ next: '/account' })
  return (
    <div className="container py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
          <h1 className="mt-1 text-4xl md:text-5xl">Hello, {user.name.split(' ')[0]}</h1>
        </div>
        <form action={logout}>
          <button className="text-sm underline underline-offset-4">Sign out</button>
        </form>
      </div>
      <div className="grid gap-10 md:grid-cols-[200px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
