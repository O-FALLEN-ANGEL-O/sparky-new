'use client'

import { useActionState, useEffect, useRef } from 'react'
import { adjustStock } from '@/app/actions/staff'
import { Field, FormMessage, Submit } from '@/components/forms'

export function AdjustForm({ products, initialProductId }: { products: { id: number; name: string; stock: number }[]; initialProductId?: number }) {
  const [state, action] = useActionState(adjustStock, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.ok) ref.current?.reset()
  }, [state])
  const e = state?.fieldErrors ?? {}
  return (
    <form ref={ref} action={action} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]" noValidate>
      <div className="md:col-span-3"><FormMessage state={state} /></div>
      <Field label="Piece" name="productId" error={e.productId}>
        <select id="f-productId" name="productId" defaultValue={initialProductId} className="h-11 w-full border bg-background px-3 text-[15px]">
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>)}
        </select>
      </Field>
      <Field label="Change" name="change" type="number" placeholder="+5 or -1" error={e.change} hint="Use a minus sign to remove" />
      <Field label="Reason" name="reason">
        <select id="f-reason" name="reason" className="h-11 w-full border bg-background px-3 text-[15px]">
          <option value="restock">Restock from workshop</option>
          <option value="adjustment">Count correction</option>
          <option value="return">Customer return</option>
        </select>
      </Field>
      <Field label="Note (optional)" name="note" className="md:col-span-2" placeholder="Batch number, who counted…" />
      <div className="flex items-end"><Submit className="w-full">Update stock</Submit></div>
    </form>
  )
}
