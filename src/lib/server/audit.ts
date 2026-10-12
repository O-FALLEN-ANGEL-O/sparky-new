import 'server-only'
import { db, schema } from '@/db'
import { requestMeta } from './request'

export async function audit(
  action: string,
  opts: {
    user?: { id: number; email: string } | null
    email?: string
    entity?: string
    entityId?: string | number
    details?: string
    success?: boolean
  } = {},
) {
  try {
    const { ip } = await requestMeta()
    await db.insert(schema.auditLogs).values({
      userId: opts.user?.id ?? null,
      actorEmail: opts.user?.email ?? opts.email ?? null,
      action,
      entity: opts.entity ?? null,
      entityId: opts.entityId != null ? String(opts.entityId) : null,
      details: opts.details?.slice(0, 1000) ?? null,
      ip,
      success: opts.success ?? true,
    })
  } catch (e) {
    console.error('[audit] failed', e)
  }
}
