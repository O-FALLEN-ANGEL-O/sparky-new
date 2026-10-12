import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import { remoteD1 } from './remote-d1'
import * as schema from './schema'

export type DB = DrizzleD1Database<typeof schema>

const cache = new WeakMap<D1Database, DB>()

let gatewayDb: DB | undefined

/** True when the site reaches D1 through the gateway Worker (e.g. hosted on Vercel). */
export const viaGateway = () => !!(process.env.D1_GATEWAY_URL && process.env.D1_GATEWAY_TOKEN)

/**
 * The Sparkle database (Cloudflare D1).
 * - On Vercel or any Node host: through the D1 gateway Worker, when D1_GATEWAY_URL and D1_GATEWAY_TOKEN are set.
 * - On Cloudflare Workers and in `next dev`: the D1 binding named `DB` in wrangler.jsonc.
 */
export function getDb(): DB {
  if (viaGateway()) return (gatewayDb ??= drizzle(remoteD1(process.env.D1_GATEWAY_URL!, process.env.D1_GATEWAY_TOKEN!), { schema }))
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
