'use client'

import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/shop', label: 'Shop all' },
  { href: '/shop?category=rings', label: 'Rings' },
  { href: '/shop?category=necklaces', label: 'Necklaces' },
  { href: '/shop?category=earrings', label: 'Earrings' },
  { href: '/shop?category=bangles', label: 'Bangles' },
  { href: '/about', label: 'Our atelier' },
]

export function Header({ user, cartCount }: { user: { name: string; home: string } | null; cartCount: number }) {
  const pathname = usePathname()
  const overHero = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => setOpen(false), [pathname])

  // Over the velvet hero the header is light-on-dark; everywhere else it's a quiet paper bar.
  const dark = overHero
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-300',
        dark ? (scrolled ? 'bg-velvet/85 text-[#f6efe2] backdrop-blur-md' : 'bg-velvet text-[#f6efe2]') : 'border-b bg-background/90 text-foreground backdrop-blur-md',
      )}
    >
      <div className="container flex h-16 items-center gap-6 md:h-[72px]">
        <button className="-ml-2 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
        <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn('text-[15px] transition-opacity hover:opacity-100', dark ? 'opacity-80' : 'opacity-75')}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {searching ? (
            <form action="/shop" className="flex items-center" role="search">
              <input
                name="q"
                autoFocus
                placeholder="Search rings, rubies, 22K…"
                className={cn('h-9 w-44 border-b bg-transparent px-1 text-sm outline-none placeholder:opacity-60 sm:w-64', dark ? 'border-white/30' : 'border-foreground/30')}
                onBlur={(e) => !e.currentTarget.value && setSearching(false)}
              />
              <button type="button" className="p-2" onClick={() => setSearching(false)} aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button className="p-2" onClick={() => setSearching(true)} aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
          )}
          <Link href={user ? user.home : '/login'} className="hidden items-center gap-2 p-2 text-sm sm:flex" aria-label={user ? 'Your account' : 'Sign in'}>
            <User className="h-5 w-5" />
            <span className="hidden lg:inline">{user ? user.name.split(' ')[0] : 'Sign in'}</span>
          </Link>
          <Link href="/cart" className="relative p-2" aria-label={`Bag, ${cartCount} item${cartCount === 1 ? '' : 's'}`}>
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-velvet">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-velvet p-6 text-[#f6efe2]">
            <div className="flex items-center justify-between">
              <Logo />
              <button className="p-2" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-5 font-headline text-3xl" aria-label="Main">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-6 text-[15px] text-[#cbbfae]">
              <Link href={user ? user.home : '/login'}>{user ? `Signed in as ${user.name}` : 'Sign in or create an account'}</Link>
              <Link href="/careers">Careers</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
