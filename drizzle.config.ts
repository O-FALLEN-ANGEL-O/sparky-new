import { defineConfig } from 'drizzle-kit'

// Generates SQL migrations into ./drizzle; wrangler applies them to D1
// (npm run db:migrate locally, npm run db:migrate:remote in production).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
})
