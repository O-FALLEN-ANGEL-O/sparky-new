'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleWishlist } from '@/app/actions/store'
import { cn } from '@/lib/utils'

export function WishlistButton({ productId, initial, withLabel = false }: { productId: number; initial: boolean; withLabel?: boolean }) {
  const [saved, setSaved] = useState(initial)
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={() =>
        start(async () => {
          const res = await toggleWishlist(productId)
          if ('needsLogin' in res) router.push(`/login?next=${encodeURIComponent(location.pathname)}`)
          else setSaved(res.saved)
        })
      }
      className={cn('inline-flex items-center gap-2 p-2 text-sm transition-colors', saved ? 'text-kumkum' : 'text-muted-foreground hover:text-foreground')}
    >
      <Heart className={cn('h-5 w-5', saved && 'fill-current')} />
      {withLabel && (saved ? 'Saved' : 'Save')}
    </button>
  )
}
