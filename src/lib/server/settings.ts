import 'server-only'
import { eq } from 'drizzle-orm'
import { cache } from 'react'
import { db, schema } from '@/db'

export type Maintenance = { enabled: boolean; message: string }
export type StoreInfo = { name: string; email: string; phone: string; address: string }

const DEFAULTS = {
  maintenance: { enabled: false, message: 'We are polishing things up. Back shortly!' } as Maintenance,
  store: { name: 'Sparkle', email: 'hello@sparkle.com', phone: '+91 824 240 0000', address: 'Lighthouse Hill Road, Mangaluru 575001' } as StoreInfo,
}
type Key = keyof typeof DEFAULTS

export const getSetting = cache(async <K extends Key>(key: K): Promise<(typeof DEFAULTS)[K]> => {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key))
  return { ...DEFAULTS[key], ...((row?.value as object) ?? {}) } as (typeof DEFAULTS)[K]
})

export async function setSetting<K extends Key>(key: K, value: (typeof DEFAULTS)[K]) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } })
}
