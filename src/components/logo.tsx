import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Sparkle mark: a ring seen from above with a brilliant's four-point glint at its heart,
 * and a small second glint catching the light. Drawn in currentColor plus soft facet
 * shading, so it works in gold on velvet and in ink on paper.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <circle cx="32" cy="33" r="21" fill="none" stroke="currentColor" strokeWidth="2.6" opacity=".9" />
      <path d="M32 10.5C33.6 26.2 38.8 31.4 54.5 33 38.8 34.6 33.6 39.8 32 55.5 30.4 39.8 25.2 34.6 9.5 33 25.2 31.4 30.4 26.2 32 10.5Z" fill="currentColor" />
      {/* facet light and shade */}
      <path d="M32 10.5C33.6 26.2 38.8 31.4 54.5 33H32Z" fill="#fff" opacity=".32" />
      <path d="M32 33H9.5C25.2 34.6 30.4 39.8 32 55.5Z" fill="#000" opacity=".16" />
      <path d="M49 11.5c.35 3 1 3.65 4 4-3 .35-3.65 1-4 4-.35-3-1-3.65-4-4 3-.35 3.65-1 4-4Z" fill="currentColor" />
    </svg>
  )
}

/** Mark + wordmark. The small "Fine jewellery" line appears from tablet width up. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex shrink-0 items-center gap-2 sm:gap-2.5', className)} aria-label="Sparkle — home">
      <Mark className="h-7 w-7 text-gold transition-transform duration-500 group-hover:rotate-[22.5deg] sm:h-8 sm:w-8" />
      <span className="flex flex-col leading-none">
        <span className="font-headline text-[1.4rem] font-medium tracking-[0.03em] sm:text-[1.6rem]">Sparkle</span>
        <span className="mt-1 hidden text-[0.5rem] font-medium uppercase tracking-[0.32em] opacity-60 md:block">Fine jewellery</span>
      </span>
    </Link>
  )
}
