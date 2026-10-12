/** Wipe the local D1 database, re-apply migrations and re-seed. Never touches Cloudflare. */
import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
rmSync('.wrangler/state/v3/d1', { recursive: true, force: true })
execFileSync(npx, ['wrangler', 'd1', 'migrations', 'apply', 'sparkle', '--local'], { stdio: 'inherit' })
execFileSync(npx, ['tsx', 'scripts/seed.ts'], { stdio: 'inherit' })
