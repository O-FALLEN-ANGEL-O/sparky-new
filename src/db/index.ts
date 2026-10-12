import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

export type DB = DrizzleD1Database<typeof schema>

const cache = new WeakMap<D1Database, DB>()

/** The D1 database bound as `DB` in wrangler.jsonc (local D1 in `next dev`, real D1 on Cloudflare). */
export function getDb(): DB {
  const { env } = getCloudflareContext()
  const binding = (env as { DB?: D1Database }).DB
  if (!binding) throw new Error('No D1 binding named DB. Check wrangler.jsonc.')
  let db = cache.get(binding)
  if (!db) {
    db = drizzle(binding, { schema })
    cache.set(binding, db)
  }
  return db
}

/**
 * `db` reads like a normal client but resolves the binding on each use, because
 * Cloudflare only exposes bindings inside a request.
 */
export const db = new Proxy({} as DB, {
  get(_, prop) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>
    const value = real[prop]
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value
  },
})

export { schema }
