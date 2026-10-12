/**
 * Helpers for scripts that work with the D1 database.
 *
 * Scripts can't open a remote D1 database directly, so seeding builds the data in an in-memory
 * SQLite database (same schema, same migrations), dumps it to a .sql file and hands that to
 * `wrangler d1 execute`, which works the same for the local emulator and for Cloudflare.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from '../src/db/schema'

export const DB_NAME = 'sparkle'

/** A fresh in-memory database with every migration in ./drizzle applied, wrapped in Drizzle. */
export function memoryDb() {
  const raw = new DatabaseSync(':memory:')
  raw.exec('PRAGMA foreign_keys = ON')
  for (const file of readdirSync('drizzle').filter((f) => f.endsWith('.sql')).sort()) {
    for (const stmt of readFileSync(join('drizzle', file), 'utf8').split('--> statement-breakpoint')) if (stmt.trim()) raw.exec(stmt)
  }
  const db = drizzle(
    async (query, params, method) => {
      const stmt = raw.prepare(query)
      const args = params as (string | number | null | bigint | Uint8Array)[]
      if (method === 'run') {
        stmt.run(...args)
        return { rows: [] }
      }
      if (method === 'get') {
        const row = stmt.get(...args) as Record<string, unknown> | undefined
        return { rows: row ? (Object.values(row) as never[]) : (undefined as never) }
      }
      return { rows: (stmt.all(...args) as Record<string, unknown>[]).map((r) => Object.values(r)) as never[] }
    },
    { schema },
  )
  return { raw, db }
}

const literal = (v: unknown) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : `'${String(v).replace(/'/g, "''")}'`

/** Every row of every table as INSERT statements, parents before children. */
export function dumpSql(raw: DatabaseSync) {
  const tables = (raw.prepare(`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '\\_%' escape '\\' and name <> 'd1_migrations'`).all() as { name: string }[]).map((t) => t.name)
  const parents = new Map(tables.map((t) => [t, (raw.prepare(`select "table" as p from pragma_foreign_key_list(?)`).all(t) as { p: string }[]).map((r) => r.p).filter((p) => p !== t)]))
  const ordered: string[] = []
  const visit = (t: string) => {
    if (ordered.includes(t)) return
    for (const p of parents.get(t) ?? []) visit(p)
    ordered.push(t)
  }
  tables.forEach(visit)
  const lines: string[] = []
  for (const t of ordered) {
    const rows = raw.prepare(`select * from "${t}"`).all() as Record<string, unknown>[]
    if (!rows.length) continue
    const cols = Object.keys(rows[0]).map((c) => `"${c}"`).join(', ')
    for (const r of rows) lines.push(`INSERT INTO "${t}" (${cols}) VALUES (${Object.values(r).map(literal).join(', ')});`)
  }
  return lines.join('\n') + '\n'
}

export function writeSql(sqlText: string, file = '.wrangler/seed.sql') {
  mkdirSync('.wrangler', { recursive: true })
  writeFileSync(file, sqlText)
  return file
}

/** Run wrangler d1 with the project's local wrangler binary. */
export function wrangler(args: string[], opts: { capture?: boolean } = {}) {
  return execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['wrangler', 'd1', ...args], {
    stdio: opts.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
  })
}

/** Number of users in the target database, or null if the tables don't exist yet. */
export function userCount(target: '--local' | '--remote') {
  try {
    const out = wrangler(['execute', DB_NAME, target, '--json', '--command', 'select count(*) as n from users'], { capture: true })
    return (JSON.parse(out) as { results: { n: number }[] }[])[0].results[0].n
  } catch {
    return null
  }
}
