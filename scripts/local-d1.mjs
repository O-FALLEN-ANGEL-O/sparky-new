/**
 * Open the local D1 database (the SQLite file that `wrangler` / `next dev` keep in .wrangler/state)
 * for scripts and tests. Accepts Postgres-style $1 placeholders for convenience.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function openLocalD1() {
  const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
  const file = existsSync(dir) && readdirSync(dir).find((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
  if (!file) throw new Error('No local D1 database yet. Run `npm run db:reset` first.')
  const db = new DatabaseSync(join(dir, file), { timeout: 5000 })
  const q = async (sql, params = []) => db.prepare(sql.replace(/\$\d+/g, '?')).all(...params)
  return { db, q, close: () => db.close() }
}
