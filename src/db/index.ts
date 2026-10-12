import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.warn('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
}

// Reuse one pool across hot reloads in development and across invocations on Vercel.
const globalForDb = globalThis as unknown as { sparklePool?: Pool }
const pool =
  globalForDb.sparklePool ??
  new Pool({
    connectionString,
    max: process.env.VERCEL ? 3 : 10,
    ssl: connectionString && /sslmode=require|neon\.tech|supabase\.co/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
  })
globalForDb.sparklePool = pool

export const db = drizzle(pool, { schema })
export type DB = typeof db
export { schema }
