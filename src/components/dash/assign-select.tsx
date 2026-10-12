'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { assignDelivery } from '@/app/actions/staff'

export function AssignSelect({ orderId, agents, current }: { orderId: number; agents: { id: number; name: string; load: number }[]; current?: number | null }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()
  return (
    <div>
      <select
        aria-label="Assign a delivery partner"
        disabled={pending}
        defaultValue={current ?? ''}
        onChange={(e) =>
          e.target.value &&
          start(async () => {
            const r = await assignDelivery(orderId, Number(e.target.value))
            if (r.error) setError(r.error)
            router.refresh()
          })
        }
        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
      >
        <option value="">{pending ? 'Assigning…' : 'Assign partner…'}</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name} ({a.load} active)</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-kumkum">{error}</p>}
    </div>
  )
}
