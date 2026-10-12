'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { cancelMyOrder, confirmRazorpayPayment, retryPayment } from '@/app/actions/checkout'
import { Button } from '@/components/ui/button'

export function CancelOrder({ orderId }: { orderId: number }) {
  const [pending, start] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  if (!confirming) return <Button variant="outline" onClick={() => setConfirming(true)}>Cancel order</Button>
  return (
    <div className="space-y-3 border p-4">
      <p className="text-sm">Cancel this order? Any online payment is refunded to the original method within 5–7 working days.</p>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelMyOrder(orderId)
              if (r && 'error' in r && r.error) setError(r.error)
              else router.refresh()
            })
          }
        >
          {pending ? 'Cancelling…' : 'Yes, cancel it'}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>Keep my order</Button>
      </div>
      {error && <p className="text-sm text-kumkum" role="alert">{error}</p>}
    </div>
  )
}

export function PayNow({ number }: { number: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [rp, setRp] = useState<null | { key: string; orderId: string; amount: number; number: string; name: string; email: string; phone: string }>(null)
  const router = useRouter()
  useEffect(() => {
    if (!rp) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => {
      const W = window as unknown as { Razorpay: new (o: Record<string, unknown>) => { open: () => void } }
      new W.Razorpay({
        key: rp.key,
        amount: rp.amount,
        currency: 'INR',
        name: 'Sparkle',
        order_id: rp.orderId,
        prefill: { name: rp.name, email: rp.email, contact: rp.phone },
        theme: { color: '#15110E' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const res = await confirmRazorpayPayment({ number: rp.number, ...r })
          if ('href' in res && res.href) router.push(res.href)
          else setError(res.error ?? 'Payment couldn’t be confirmed.')
        },
      }).open()
    }
    s.onerror = () => setError('Couldn’t load the payment window.')
    document.body.appendChild(s)
  }, [rp, router])
  return (
    <div className="space-y-2">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await retryPayment(number)
            if (r && 'razorpay' in r) setRp(r.razorpay)
            else if (r && 'error' in r) setError(r.error ?? '')
          })
        }
      >
        {pending ? 'Opening payment…' : 'Pay now'}
      </Button>
      {error && <p className="text-sm text-kumkum" role="alert">{error}</p>}
    </div>
  )
}
