'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { confirmHandover, deliveryStep } from '@/app/actions/delivery'
import { Button } from '@/components/ui/button'

export function Steps({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [code, setCode] = useState('')
  const [failing, setFailing] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()
  const step = (s: 'accept' | 'start' | 'fail', note?: string) =>
    start(async () => {
      setError('')
      const r = await deliveryStep(id, s, note)
      if (r.error) setError(r.error)
      setFailing(false)
      router.refresh()
    })

  if (done) return <p role="status" className="rounded-lg bg-ok/10 p-4 text-ok">{done}</p>

  return (
    <div className="space-y-4">
      {status === 'assigned' && (
        <Button size="lg" className="w-full" disabled={pending} onClick={() => step('accept')}>Accept this delivery</Button>
      )}
      {(status === 'assigned' || status === 'accepted') && (
        <Button size="lg" variant={status === 'accepted' ? 'default' : 'outline'} className="w-full" disabled={pending} onClick={() => step('start')}>I’ve picked it up — start delivery</Button>
      )}
      {status === 'out_for_delivery' && (
        <form
          className="space-y-3 rounded-lg border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault()
            start(async () => {
              setError('')
              const r = await confirmHandover(id, code)
              if (r.error) setError(r.error)
              else setDone(r.message ?? 'Delivered.')
              router.refresh()
            })
          }}
        >
          <label htmlFor="otp" className="block font-headline text-2xl">Customer’s code</label>
          <p className="text-sm text-muted-foreground">Ask the customer for the 6-digit code on their order page. Hand over the parcel only after it’s accepted.</p>
          <input
            id="otp"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            placeholder="••••••"
            className="h-16 w-full border bg-background text-center font-headline text-4xl tracking-[0.4em] tabular outline-none focus:border-foreground"
          />
          <Button size="lg" className="w-full" disabled={pending || code.length !== 6}>{pending ? 'Checking…' : 'Confirm delivery'}</Button>
        </form>
      )}
      {status === 'out_for_delivery' && !failing && (
        <button className="w-full text-center text-sm text-muted-foreground underline underline-offset-4" onClick={() => setFailing(true)}>Couldn’t deliver?</button>
      )}
      {failing && (
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <label htmlFor="reason" className="text-sm font-medium">What happened?</label>
          <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 w-full border bg-background px-3">
            <option value="">Choose a reason</option>
            <option>Customer not at home</option>
            <option>Customer not answering the phone</option>
            <option>Wrong or incomplete address</option>
            <option>Customer asked to come another day</option>
          </select>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!reason || pending} onClick={() => step('fail', reason)}>Report and return to store</Button>
            <Button variant="ghost" onClick={() => setFailing(false)}>Back</Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="rounded-lg bg-kumkum/10 p-3 text-sm text-kumkum">{error}</p>}
    </div>
  )
}
