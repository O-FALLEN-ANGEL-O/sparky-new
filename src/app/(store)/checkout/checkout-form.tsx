'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { confirmRazorpayPayment, placeOrder, type CheckoutState } from '@/app/actions/checkout'
import { Field, Submit } from '@/components/forms'
import { cn } from '@/lib/utils'

const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

type Address = { id: number; name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean }

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: unknown) => void) => void }
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function CheckoutForm({ addresses, razorpay, defaultName, defaultPhone }: { addresses: Address[]; razorpay: boolean; defaultName: string; defaultPhone: string }) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, null)
  const [addressId, setAddressId] = useState<number | 'new'>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? 'new')
  const [payment, setPayment] = useState<'razorpay' | 'cod'>(razorpay ? 'razorpay' : 'cod')
  const [payError, setPayError] = useState('')
  const router = useRouter()
  const fe = state && 'fieldErrors' in state ? state.fieldErrors ?? {} : {}

  useEffect(() => {
    if (!state || !('razorpay' in state)) return
    const rp = state.razorpay
    loadRazorpay().then((ok) => {
      if (!ok || !window.Razorpay) return setPayError('Couldn’t load the payment window. Check your connection and try again.')
      const checkout = new window.Razorpay({
        key: rp.key,
        amount: rp.amount,
        currency: 'INR',
        name: 'Sparkle',
        description: `Order ${rp.number}`,
        order_id: rp.orderId,
        prefill: { name: rp.name, email: rp.email, contact: rp.phone },
        theme: { color: '#15110E' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const res = await confirmRazorpayPayment({ number: rp.number, ...r })
          if ('href' in res && res.href) router.push(res.href)
          else setPayError(res.error ?? 'Payment couldn’t be confirmed.')
        },
        modal: { ondismiss: () => setPayError(`Payment wasn’t completed. Your order ${rp.number} is saved — you can pay for it from your orders page.`) },
      })
      checkout.on('payment.failed', () => setPayError('The payment failed. No money was taken. Try again or choose cash on delivery.'))
      checkout.open()
    })
  }, [state, router])

  const error = (state && 'error' in state && state.error) || payError

  return (
    <form action={action} className="space-y-10" noValidate>
      {error && <p role="alert" className="border-l-2 border-kumkum bg-kumkum/5 px-4 py-3 text-sm text-kumkum">{error}</p>}

      <fieldset className="space-y-4">
        <legend className="mb-4 font-headline text-3xl">Delivery address</legend>
        {addresses.map((a) => (
          <label key={a.id} className={cn('flex cursor-pointer gap-4 border p-4 transition-colors', addressId === a.id ? 'border-foreground' : 'hover:border-foreground/40')}>
            <input type="radio" name="addressId" value={a.id} checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-[#15110E]" />
            <span className="text-[15px] leading-relaxed">
              <span className="font-medium">{a.name}</span>, {a.phone}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
            </span>
          </label>
        ))}
        {addresses.length > 0 && (
          <label className={cn('flex cursor-pointer items-center gap-4 border p-4', addressId === 'new' ? 'border-foreground' : 'hover:border-foreground/40')}>
            <input type="radio" name="addressId" value="" checked={addressId === 'new'} onChange={() => setAddressId('new')} className="accent-[#15110E]" />
            <span className="text-[15px]">Deliver somewhere else</span>
          </label>
        )}
        {addressId === 'new' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recipient’s name" name="name" defaultValue={defaultName} autoComplete="name" error={fe.name} />
            <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} defaultValue={defaultPhone} autoComplete="tel-national" error={fe.phone} />
            <Field label="House number and street" name="line1" autoComplete="address-line1" error={fe.line1} className="sm:col-span-2" />
            <Field label="Area or landmark (optional)" name="line2" autoComplete="address-line2" className="sm:col-span-2" />
            <Field label="City" name="city" autoComplete="address-level2" error={fe.city} />
            <Field label="PIN code" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" error={fe.pincode} />
            <Field label="State" name="state" error={fe.state} className="sm:col-span-2">
              <select id="f-state" name="state" defaultValue="Karnataka" className="h-11 w-full border bg-background px-3 text-[15px]">
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input type="checkbox" name="save" defaultChecked className="accent-[#15110E]" /> Save this address for next time
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-4 font-headline text-3xl">Payment</legend>
        <label className={cn('flex gap-4 border p-4', !razorpay && 'opacity-60', payment === 'razorpay' ? 'border-foreground' : 'hover:border-foreground/40', razorpay && 'cursor-pointer')}>
          <input type="radio" name="payment" value="razorpay" disabled={!razorpay} checked={payment === 'razorpay'} onChange={() => setPayment('razorpay')} className="mt-1 accent-[#15110E]" />
          <span>
            <span className="font-medium">Pay online</span>
            <span className="block text-sm text-muted-foreground">{razorpay ? 'UPI, cards, netbanking and wallets through Razorpay.' : 'Online payment isn’t switched on for this store yet.'}</span>
          </span>
        </label>
        <label className={cn('flex cursor-pointer gap-4 border p-4', payment === 'cod' ? 'border-foreground' : 'hover:border-foreground/40')}>
          <input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} className="mt-1 accent-[#15110E]" />
          <span>
            <span className="font-medium">Cash on delivery</span>
            <span className="block text-sm text-muted-foreground">Pay in cash or by UPI when the partner hands over your order.</span>
          </span>
        </label>
      </fieldset>

      <Field label="Note for us (optional)" name="notes" placeholder="Gift wrap, engraving request, best time to deliver…" />

      <Submit size="lg" className="w-full" pendingText="Placing order…">
        {payment === 'cod' ? 'Place order' : 'Continue to payment'}
      </Submit>
    </form>
  )
}
