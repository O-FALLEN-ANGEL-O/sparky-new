/**
 * Sparkle D1 gateway: a tiny Worker that gives the site (when it runs on Vercel) access to the
 * D1 database over HTTPS. Every request must carry the shared secret as a Bearer token, so treat
 * GATEWAY_TOKEN like a database password.
 *
 * POST /query  { batch: boolean, statements: [{ sql, params, mode: 'all' | 'raw' | 'run' | 'first' }] }
 *   → { results: [...] }  (one entry per statement; a batch runs as a single D1 transaction)
 */
interface Env {
  DB: D1Database
  GATEWAY_TOKEN: string
}

type Statement = { sql: string; params?: (string | number | null)[]; mode?: 'all' | 'raw' | 'run' | 'first' }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

async function authorised(req: Request, secret: string | undefined) {
  if (!secret || secret.length < 32) return false // fail closed until a strong token is set
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const enc = new TextEncoder()
  // compare digests so the check takes the same time whatever the input
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(given)), crypto.subtle.digest('SHA-256', enc.encode(secret))])
  return crypto.subtle.timingSafeEqual(a, b)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)
    if (pathname === '/health') return json({ ok: true })
    if (pathname !== '/query') return json({ error: 'Not found' }, 404)
    if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)
    if (!(await authorised(req, env.GATEWAY_TOKEN))) return json({ error: 'Unauthorised' }, 401)

    let body: { batch?: boolean; statements?: Statement[] }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Body must be JSON' }, 400)
    }
    const list = body.statements
    if (!Array.isArray(list) || !list.length || list.length > 200 || list.some((s) => typeof s?.sql !== 'string')) return json({ error: 'Send 1–200 statements' }, 400)

    try {
      const prepared = list.map((s) => env.DB.prepare(s.sql).bind(...(s.params ?? [])))
      if (body.batch) return json({ results: await env.DB.batch(prepared) })
      const s = list[0]
      const stmt = prepared[0]
      const result = s.mode === 'raw' ? await stmt.raw() : s.mode === 'run' ? await stmt.run() : s.mode === 'first' ? await stmt.first() : await stmt.all()
      return json({ results: [result] })
    } catch (e) {
      const err = e as Error & { cause?: Error }
      const cause = err.cause?.message
      return json({ error: cause && !err.message.includes(cause) ? `${err.message}: ${cause}` : err.message }, 400)
    }
  },
}
