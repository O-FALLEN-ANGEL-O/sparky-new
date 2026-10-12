'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { preparePayroll } from '@/app/actions/people'
import { Button } from '@/components/ui/button'

export function PrepareForm({ defaultMonth }: { defaultMonth: string }) {
  const [month, setMonth] = useState(defaultMonth)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ error?: string; message?: string }>({})
  const router = useRouter()
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          Month
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block h-10 rounded-md border bg-background px-2" />
        </label>
        <Button disabled={pending} onClick={() => start(async () => { const r = await preparePayroll(month); setMsg(r); router.push(`/dashboard/payroll?month=${month}`); router.refresh() })}>
          {pending ? 'Calculating…' : 'Prepare draft'}
        </Button>
      </div>
      {msg.error && <p className="text-sm text-kumkum" role="alert">{msg.error}</p>}
      {msg.message && <p className="text-sm text-ok" role="status">{msg.message}</p>}
    </div>
  )
}
