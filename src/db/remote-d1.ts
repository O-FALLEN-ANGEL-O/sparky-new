/**
 * A D1Database look-alike that runs every query through the Sparkle D1 gateway Worker
 * (see d1-gateway/). It lets the site run off Cloudflare (on Vercel) while the data stays in D1.
 *
 * Drizzle's D1 driver only uses prepare → bind → all/raw/run/first and batch, so that is all
 * this implements. A batch is still one all-or-nothing D1 transaction on the gateway side.
 */
type Param = string | number | null
type Mode = 'all' | 'raw' | 'run' | 'first'
type Wire = { sql: string; params: Param[]; mode: Mode }

export class D1GatewayError extends Error {}

export function remoteD1(url: string, token: string): D1Database {
  const endpoint = url.replace(/\/+$/, '') + '/query'

  async function send(statements: Wire[], batch: boolean) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ batch, statements }),
      cache: 'no-store',
    })
    const body = (await res.json().catch(() => null)) as { results?: unknown[]; error?: string } | null
    if (!res.ok || !body?.results) throw new D1GatewayError(body?.error ?? `D1 gateway answered ${res.status}`)
    return body.results
  }

  class Statement {
    constructor(
      readonly sql: string,
      readonly params: Param[] = [],
    ) {}
    bind(...values: unknown[]) {
      return new Statement(
        this.sql,
        values.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : typeof v === 'bigint' ? Number(v) : (v as Param))),
      )
    }
    wire(mode: Mode): Wire {
      return { sql: this.sql, params: this.params, mode }
    }
    async all() {
      return (await send([this.wire('all')], false))[0]
    }
    async run() {
      return (await send([this.wire('run')], false))[0]
    }
    async raw() {
      return (await send([this.wire('raw')], false))[0]
    }
    async first(column?: string) {
      const row = (await send([this.wire('first')], false))[0] as Record<string, unknown> | null
      return column && row ? row[column] : row
    }
  }

  return {
    prepare: (sql: string) => new Statement(sql),
    batch: (stmts: Statement[]) => send(stmts.map((s) => s.wire('all')), true),
    exec: () => Promise.reject(new D1GatewayError('exec is not available through the gateway')),
    dump: () => Promise.reject(new D1GatewayError('dump is not available through the gateway')),
    withSession: () => {
      throw new D1GatewayError('sessions are not available through the gateway')
    },
  } as unknown as D1Database
}
