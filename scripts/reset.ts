/** Drop everything, re-apply migrations and seed. Local development only. */
import { execSync } from 'node:child_process'
import { Pool } from 'pg'
import { loadEnv } from './env'

loadEnv()
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')
if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('Refusing to reset a production database')

async function main() {
  const pool = new Pool({ connectionString: url })
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;')
  await pool.end()
  execSync('npx tsx scripts/migrate.ts', { stdio: 'inherit' })
  execSync('npx tsx scripts/seed.ts', { stdio: 'inherit' })
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
