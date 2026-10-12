import { getTableColumns, sql, type SQL, type SQLWrapper, type Table } from 'drizzle-orm'

/** SQLite helpers. Timestamps are epoch ms; reports bucket by Indian time (UTC+5:30). */
const IST = "'+330 minutes'"
export const monthOf = (col: SQLWrapper): SQL<string> => sql<string>`strftime('%Y-%m', ${col} / 1000, 'unixepoch', ${sql.raw(IST)})`
export const dayOf = (col: SQLWrapper): SQL<string> => sql<string>`strftime('%Y-%m-%d', ${col} / 1000, 'unixepoch', ${sql.raw(IST)})`
export const dateTimeOf = (col: SQLWrapper): SQL<string> => sql<string>`strftime('%Y-%m-%d %H:%M', ${col} / 1000, 'unixepoch', ${sql.raw(IST)})`
export const jsonField = (col: SQLWrapper, field: string): SQL<string> => sql<string>`json_extract(${col}, ${'$.' + field})`
export const msAgo = (days: number) => Date.now() - days * 86_400_000

/** Calendar key (YYYY-MM-DD) in Indian time for a JS date or epoch ms. */
export const istDay = (d: Date | number) => new Date((typeof d === 'number' ? d : d.getTime()) + 330 * 60_000).toISOString().slice(0, 10)
export const istMonth = (d: Date | number) => istDay(d).slice(0, 7)

/** Epoch ms of midnight IST on an ISO date. */
export const istMidnight = (isoDate: string) => Date.parse(`${isoDate}T00:00:00+05:30`)

/**
 * D1 allows at most 100 bound values per statement, so multi-row inserts are split into chunks.
 * Drizzle binds a value for every column of the table (defaults included), so size by the table.
 */
export function chunks<T extends object>(table: Table, rows: T[]): T[][] {
  if (!rows.length) return []
  const size = Math.max(1, Math.floor(100 / Object.keys(getTableColumns(table)).length))
  const out: T[][] = []
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size))
  return out
}
