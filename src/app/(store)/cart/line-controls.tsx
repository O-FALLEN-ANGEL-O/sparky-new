'use client'

import { Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateCartLine } from '@/app/actions/store'

export function LineControls({ productId, quantity, max }: { productId: number; quantity: number; max: number }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()
  const set = (q: number) =>
    start(async () => {
      setError('')
      const res = await updateCartLine(productId, q)
      if (res?.error) setError(res.error)
      router.refresh()
    })
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4">
        <div className="flex h-10 items-center border" aria-busy={pending}>
          <button className="px-2.5 disabled:opacity-30" onClick={() => set(quantity - 1)} disabled={pending || quantity <= 1} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="tabular w-7 text-center">{quantity}</span>
          <button className="px-2.5 disabled:opacity-30" onClick={() => set(quantity + 1)} disabled={pending || quantity >= max} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => set(0)} disabled={pending}>
          Remove
        </button>
      </div>
      {error && <p className="text-sm text-kumkum" role="alert">{error}</p>}
    </div>
  )
}
