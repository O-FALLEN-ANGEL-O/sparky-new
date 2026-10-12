'use server'

import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/server/audit'
import { assertCan } from '@/lib/server/auth'
import { OrderError, agentAction, verifyOtp } from '@/lib/server/orders'

type Result = { ok?: boolean; error?: string; message?: string }

export async function deliveryStep(deliveryId: number, step: 'accept' | 'start' | 'fail', note?: string): Promise<Result> {
  try {
    const me = await assertCan('deliveries.run')
    await agentAction(deliveryId, me.id, step, note)
    await audit(`delivery.${step}`, { user: me, entity: 'delivery', entityId: deliveryId, details: note })
  } catch (e) {
    return { error: e instanceof OrderError || e instanceof Error ? e.message : 'Something went wrong.' }
  }
  revalidatePath('/delivery', 'layout')
  return { ok: true }
}

export async function confirmHandover(deliveryId: number, code: string): Promise<Result> {
  try {
    const me = await assertCan('deliveries.run')
    if (!/^\d{6}$/.test(code.trim())) return { error: 'Enter the 6-digit code.' }
    const number = await verifyOtp(deliveryId, me.id, code)
    await audit('delivery.complete', { user: me, entity: 'delivery', entityId: deliveryId, details: number })
    revalidatePath('/delivery', 'layout')
    return { ok: true, message: `Delivered. ${number} is complete.` }
  } catch (e) {
    revalidatePath('/delivery', 'layout')
    return { error: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}
