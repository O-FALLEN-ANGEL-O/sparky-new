import Link from 'next/link'
import { Logo } from '@/components/logo'
import { NewsletterForm } from './newsletter-form'

export function Footer({ store }: { store: { email: string; phone: string; address: string } }) {
  return (
    <footer className="bg-velvet text-[#cbbfae]">
      <div className="container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div className="space-y-4">
          <Logo className="text-[#f6efe2]" />
          <p className="max-w-xs text-sm leading-relaxed">{store.address}</p>
          <p className="text-sm">
            <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="hover:text-gilt">{store.phone}</a>
            <br />
            <a href={`mailto:${store.email}`} className="hover:text-gilt">{store.email}</a>
          </p>
        </div>
        <nav aria-label="Shop" className="space-y-3 text-sm">
          <p className="font-headline text-lg text-[#f6efe2]">Shop</p>
          <Link className="block hover:text-gilt" href="/shop?category=rings">Rings</Link>
          <Link className="block hover:text-gilt" href="/shop?category=necklaces">Necklaces</Link>
          <Link className="block hover:text-gilt" href="/shop?category=earrings">Earrings</Link>
          <Link className="block hover:text-gilt" href="/shop?category=bangles">Bangles</Link>
          <Link className="block hover:text-gilt" href="/shop?category=pendants">Pendants</Link>
        </nav>
        <nav aria-label="Company" className="space-y-3 text-sm">
          <p className="font-headline text-lg text-[#f6efe2]">Sparkle</p>
          <Link className="block hover:text-gilt" href="/about">Our atelier</Link>
          <Link className="block hover:text-gilt" href="/careers">Careers</Link>
          <Link className="block hover:text-gilt" href="/account/orders">Track an order</Link>
          <Link className="block hover:text-gilt" href="/login">Staff sign in</Link>
        </nav>
        <div className="space-y-3">
          <p className="font-headline text-lg text-[#f6efe2]">New pieces, once a month</p>
          <p className="text-sm">First look at each collection before it reaches the store.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-[#9a8e7e] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Sparkle Jewellers. BIS hallmarked gold. Prices include making charges; GST added at checkout.</p>
          <p>Made in Mangaluru</p>
        </div>
      </div>
    </footer>
  )
}
