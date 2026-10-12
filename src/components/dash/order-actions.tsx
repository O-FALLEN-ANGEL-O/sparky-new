'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { assignDelivery, setOrderStatus, unlockOtp } from '@/app/actions/staff'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/order-status'

const VERB: Partial<Record<OrderStatus, string>> = { processing: 'Start preparing', out_for_delivery: 'Hand to delivery partner', cancelled: 'Cancel order' }

export function OrderActions({ orderId, transitions, agents, currentAgentId, canAssign, otpLocked }: {
  orderId: number
  transitions: OrderStatus[]
  agents: { id: number; name: string; load: number }[]
  currentAgentId: number | null
  canAssign: boolean
  otpLocked: boolean
}) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({})
  const [agent, setAgent] = useState<string>(currentAgentId ? String(currentAgentId) : '')
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()
  const run = (fn: () => Promise<{ error?: string; message?: string }>, ok: string) =>
    start(async () => {
      const r = await fn()
      setMsg(r.error ? { error: r.error } : { ok: r.message ?? ok })
      router.refresh()
    })

  return (
    <div className="space-y-5">
      {canAssign && (
        <div className="space-y-2">
          <label htmlFor="agent" className="text-sm font-medium">Delivery partner</label>
          <div className="flex gap-2">
            <select id="agent" value={agent} onChange={(e) => setAgent(e.target.value)} className="h-10 flex-1 border bg-background px-2 text-sm">
              <option value="">Choose a partner…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.load} active</option>
              ))}
            </select>
            <Button variant="outline" disabled={!agent || pending || agent === String(currentAgentId)} onClick={() => run(() => assignDelivery(orderId, Number(agent)), 'Partner assigned.')}>
              {currentAgentId ? 'Reassign' : 'Assign'}
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {transitions
          .filter((t) => t !== 'cancelled')
          .map((t) => (
            <Button key={t} disabled={pending} onClick={() => run(() => setOrderStatus(orderId, t), `Marked as ${ORDER_STATUS_LABEL[t].toLowerCase()}.`)}>
              {VERB[t] ?? ORDER_STATUS_LABEL[t]}
            </Button>
          ))}
        {transitions.includes('cancelled') && !cancelling && (
          <Button variant="outline" disabled={pending} onClick={() => setCancelling(true)}>Cancel order</Button>
        )}
        {otpLocked && <Button variant="outline" disabled={pending} onClick={() => run(() => unlockOtp(orderId), 'Code unlocked.')}>Unlock delivery code</Button>}
      </div>
      {cancelling && (
        <div className="space-y-2 border p-4">
          <label htmlFor="reason" className="text-sm font-medium">Why is it being cancelled?</label>
          <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Customer request, payment issue…" className="h-10 w-full border bg-background px-3 text-sm" />
          <p className="text-xs text-muted-foreground">Stock goes back on sale. Paid orders are marked for refund.</p>
          <div className="flex gap-2">
            <Button variant="destructive" disabled={pending || reason.trim().length < 3} onClick={() => run(() => setOrderStatus(orderId, 'cancelled', reason.trim()), 'Order cancelled.')}>Cancel order</Button>
            <Button variant="ghost" onClick={() => setCancelling(false)}>Keep it</Button>
          </div>
        </div>
      )}
      {msg.error && <p className="text-sm text-kumkum" role="alert">{msg.error}</p>}
      {msg.ok && <p className="text-sm text-ok" role="status">{msg.ok}</p>}
    </div>
  )
}
