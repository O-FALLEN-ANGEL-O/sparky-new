'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/settings', label: 'Profile and password' },
]

export function AccountNav() {
  const path = usePathname()
  return (
    <nav aria-label="Account" className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
      {LINKS.map((l) => {
        const active = l.href === '/account' ? path === l.href : path.startsWith(l.href)
        return (
          <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={cn('shrink-0 border-l-2 px-3 py-2 text-[15px]', active ? 'border-gold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
