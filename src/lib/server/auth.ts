import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db, schema } from '@/db'
import { can, type Permission, type Role } from '@/lib/roles'
import { requestMeta } from './request'

export const SESSION_COOKIE = 'spk_session'
const CUSTOMER_TTL_DAYS = 30
const STAFF_TTL_DAYS = 7

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

export type CurrentUser = {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
}

export { hashPassword, verifyPassword } from '@/lib/password'

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const id = sha256(token)
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      active: schema.users.active,
      lastSeenAt: schema.sessions.lastSeenAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
    .limit(1)
  const row = rows[0]
  if (!row || !row.active) return null
  if (Date.now() - row.lastSeenAt.getTime() > 10 * 60_000) {
    await db.update(schema.sessions).set({ lastSeenAt: new Date() }).where(eq(schema.sessions.id, id))
  }
  return { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role }
})

export async function createSession(user: { id: number; role: Role }) {
  const token = randomBytes(32).toString('base64url')
  const days = user.role === 'customer' ? CUSTOMER_TTL_DAYS : STAFF_TTL_DAYS
  const expiresAt = new Date(Date.now() + days * 86_400_000)
  const { ip, userAgent } = await requestMeta()
  await db.insert(schema.sessions).values({ id: sha256(token), userId: user.id, expiresAt, ip, userAgent })
  await db.update(schema.users).set({ lastLoginAt: new Date(), lastLoginIp: ip }).where(eq(schema.users.id, user.id))
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)))
  store.delete(SESSION_COOKIE)
}

export function currentSessionId(token: string | undefined) {
  return token ? sha256(token) : null
}

/** Too many failed sign-ins for this email or IP in the last 15 minutes? */
export async function loginBlocked(email: string): Promise<boolean> {
  const { ip } = await requestMeta()
  const since = new Date(Date.now() - 15 * 60_000)
  const [byEmail] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, false), sql`lower(${schema.auditLogs.actorEmail}) = lower(${email})`, gt(schema.auditLogs.createdAt, since)))
  const [byIp] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.action, 'auth.login'), eq(schema.auditLogs.success, false), eq(schema.auditLogs.ip, ip), gt(schema.auditLogs.createdAt, since)))
  return byEmail.n >= 5 || byIp.n >= 20
}

/** Page guard: signed in (optionally with a permission or role), else redirect. */
export async function requireUser(opts: { permission?: Permission; roles?: Role[]; next?: string } = {}): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login${opts.next ? `?next=${encodeURIComponent(opts.next)}` : ''}`)
  if (opts.permission && !can(user.role, opts.permission)) redirect('/forbidden')
  if (opts.roles && !opts.roles.includes(user.role)) redirect('/forbidden')
  return user
}

/** Server-action guard: throws instead of redirecting. */
export async function assertCan(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Please sign in again.')
  if (!can(user.role, permission)) throw new Error('You don’t have permission to do that.')
  return user
}
