import type { Metadata } from 'next'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { Logo } from '@/components/logo'
import { requireUser } from '@/lib/server/auth'

export const metadata: Metadata = { title: { default: 'Deliveries', template: '%s · Sparkle delivery' }, robots: { index: false } }

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser({ permission: 'deliveries.run', next: '/delivery' })
  return (
    <div className="min-h-dvh bg-[#f7f5f0]">
      <header className="sticky top-0 z-10 bg-velvet text-[#f6efe2]">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Logo href="/delivery" />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#cbbfae]">{me.name.split(' ')[0]}</span>
            <Link href="/dashboard/settings" className="sr-only">Settings</Link>
            <form action={logout}><button className="text-gilt">Sign out</button></form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  )
}
