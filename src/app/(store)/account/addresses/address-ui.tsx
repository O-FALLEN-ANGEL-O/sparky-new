'use client'

import { useActionState, useState, useTransition } from 'react'
import { deleteAddress, makeDefaultAddress, saveAddress } from '@/app/actions/checkout'
import { Field, FormMessage, Submit } from '@/components/forms'
import { Button } from '@/components/ui/button'

export function AddressActions({ id, isDefault }: { id: number; isDefault: boolean }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex gap-4 text-sm">
      {!isDefault && (
        <button disabled={pending} className="underline underline-offset-4" onClick={() => start(() => makeDefaultAddress(id))}>Make default</button>
      )}
      <button disabled={pending} className="text-kumkum underline underline-offset-4" onClick={() => start(() => deleteAddress(id))}>Remove</button>
    </div>
  )
}

export function NewAddress() {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(saveAddress, null)
  const fe = (state && 'fieldErrors' in state ? state.fieldErrors : {}) ?? {}
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Add an address</Button>
  return (
    <form action={action} className="grid gap-4 border p-5 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2"><FormMessage state={state && 'ok' in state ? { ok: true, message: state.message } : null} /></div>
      <Field label="Name" name="name" error={fe.name} />
      <Field label="Mobile number" name="phone" type="tel" maxLength={10} error={fe.phone} />
      <Field label="House number and street" name="line1" error={fe.line1} className="sm:col-span-2" />
      <Field label="Area or landmark (optional)" name="line2" className="sm:col-span-2" />
      <Field label="City" name="city" error={fe.city} />
      <Field label="PIN code" name="pincode" maxLength={6} error={fe.pincode} />
      <Field label="State" name="state" defaultValue="Karnataka" error={fe.state} />
      <div className="flex items-end gap-2">
        <Submit>Save address</Submit>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </form>
  )
}
