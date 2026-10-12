import { Footer } from '@/components/store/footer'
import { Header } from '@/components/store/header'
import { homeFor } from '@/lib/roles'
import { getCurrentUser } from '@/lib/server/auth'
import { cartCount } from '@/lib/server/cart'
import { getSetting } from '@/lib/server/settings'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [user, count, maintenance, store] = await Promise.all([getCurrentUser(), cartCount(), getSetting('maintenance'), getSetting('store')])
  return (
    <div className="flex min-h-dvh flex-col">
      {maintenance.enabled && (
        <div role="status" className="bg-kumkum px-4 py-2 text-center text-sm text-white">
          {maintenance.message} Checkout is paused for now.
        </div>
      )}
      <Header user={user ? { name: user.name, home: homeFor(user.role) } : null} cartCount={count} />
      <main id="main" className="flex-1">{children}</main>
      <Footer store={store} />
    </div>
  )
}
