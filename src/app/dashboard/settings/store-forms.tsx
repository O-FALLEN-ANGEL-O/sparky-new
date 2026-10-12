'use client'

import { useActionState } from 'react'
import { saveMaintenance, saveStoreInfo } from '@/app/actions/staff'
import { Field, FormMessage, Submit } from '@/components/forms'

export function MaintenanceForm({ enabled, message }: { enabled: boolean; message: string }) {
  const [state, action] = useActionState(saveMaintenance, null)
  return (
    <form action={action} className="max-w-xl space-y-4">
      <FormMessage state={state} />
      <label className="flex items-start gap-3">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="mt-1 h-4 w-4 accent-[#9B2C23]" />
        <span>
          <span className="font-medium">Pause checkout</span>
          <span className="block text-sm text-muted-foreground">Customers can still browse. A banner explains why, and new orders are refused until you switch it off.</span>
        </span>
      </label>
      <Field label="Banner message" name="message" defaultValue={message} />
      <Submit>Save</Submit>
    </form>
  )
}

export function StoreInfoForm({ store }: { store: { name: string; email: string; phone: string; address: string } }) {
  const [state, action] = useActionState(saveStoreInfo, null)
  const e = state?.fieldErrors ?? {}
  return (
    <form action={action} className="grid max-w-2xl gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2"><FormMessage state={state} /></div>
      <Field label="Store name" name="name" defaultValue={store.name} error={e.name} />
      <Field label="Customer email" name="email" defaultValue={store.email} error={e.email} />
      <Field label="Phone" name="phone" defaultValue={store.phone} error={e.phone} />
      <Field label="Address" name="address" defaultValue={store.address} error={e.address} />
      <div><Submit>Save details</Submit></div>
    </form>
  )
}
