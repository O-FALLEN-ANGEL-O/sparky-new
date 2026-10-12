import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Wordmark: a faceted gem outline and the name in the display serif. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Sparkle home">
      <svg viewBox="0 0 32 32" className="h-6 w-6 text-gold" aria-hidden>
        <path d="M16 3 27 13 16 29 5 13Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M5 13h22M11.5 13 16 29l4.5-16M11 3.8 16 13l5-9.2" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity=".7" />
      </svg>
      <span className="font-headline text-[1.6rem] font-medium leading-none tracking-[0.02em]">Sparkle</span>
    </Link>
  )
}
