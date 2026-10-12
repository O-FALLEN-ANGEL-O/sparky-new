/** Apply pending migrations from ./drizzle. Run: npm run db:migrate */
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { loadEnv } from './env'

loadEnv()
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')
const pool = new Pool({ connectionString: url, ssl: /sslmode=require|neon\.tech|supabase\.co/.test(url) ? { rejectUnauthorized: false } : undefined })
async function main() {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' })
  await pool.end()
  console.log('Migrations applied.')
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
