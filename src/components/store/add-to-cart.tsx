'use client'

import { Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/store'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function AddToCart({ productId, name, stock }: { productId: number; name: string; stock: number }) {
  const [qty, setQty] = useState(1)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  if (stock === 0) {
    return (
      <div className="space-y-2">
        <Button size="lg" disabled className="w-full">Sold out</Button>
        <p className="text-sm text-muted-foreground">Call us and we can make this piece to order in about three weeks.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex h-12 items-center border">
          <button type="button" className="px-3 disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="tabular w-8 text-center" aria-live="polite">{qty}</span>
          <button type="button" className="px-3 disabled:opacity-30" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={qty >= stock} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError('')
              const res = await addToCart(productId, qty)
              if (res?.error) return setError(res.error)
              router.refresh()
              toast({
                title: 'Added to your bag',
                description: `${qty} × ${name}`,
                action: (
                  <Link href="/cart" className="text-sm font-medium underline underline-offset-4">
                    View bag
                  </Link>
                ) as never,
              })
            })
          }
        >
          {pending ? 'Adding…' : 'Add to bag'}
        </Button>
      </div>
      {error && <p className="text-sm text-kumkum" role="alert">{error}</p>}
    </div>
  )
}
