'use server'

import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db, schema } from '@/db'
import { homeFor } from '@/lib/roles'
import { audit } from '@/lib/server/audit'
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  loginBlocked,
  verifyPassword,
} from '@/lib/server/auth'
import { mergeGuestCart } from '@/lib/server/cart'
import { fieldErrors, type ActionState } from './types'

function safeNext(next: FormDataEntryValue | null): string | null {
  const v = typeof next === 'string' ? next : ''
  return v.startsWith('/') && !v.startsWith('//') ? v : null
}

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const { email, password } = parsed.data

  if (await loginBlocked(email)) {
    return { error: 'Too many failed attempts. Wait 15 minutes and try again.' }
  }
  const [user] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = lower(${email})`).limit(1)
  const ok = !!user && (await verifyPassword(password, user.passwordHash))
  if (!user || !ok) {
    await audit('auth.login', { email, details: 'Wrong email or password', success: false })
    return { error: 'That email and password don’t match an account.' }
  }
  if (!user.active) {
    await audit('auth.login', { user, details: 'Account deactivated', success: false })
    return { error: 'This account has been deactivated. Contact the store.' }
  }
  await createSession(user)
  await mergeGuestCart(user.id)
  await audit('auth.login', { user })
  redirect(safeNext(form.get('next')) ?? homeFor(user.role))
}

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters.')
    .regex(/[A-Za-z]/, 'Include at least one letter.')
    .regex(/\d/, 'Include at least one number.'),
})

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(['name', 'email', 'phone', 'password'].map((k) => [k, form.get(k)])))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const { name, email, phone, password } = parsed.data
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = lower(${email})`)
  if (existing) return { fieldErrors: { email: 'An account with this email already exists. Sign in instead.' } }
  const [user] = await db
    .insert(schema.users)
    .values({ name, email: email.toLowerCase(), phone, passwordHash: await hashPassword(password), role: 'customer' })
    .returning()
  await createSession(user)
  await mergeGuestCart(user.id)
  await audit('auth.register', { user })
  redirect(safeNext(form.get('next')) ?? '/account')
}

export async function logout() {
  const user = await getCurrentUser()
  await destroySession()
  if (user) await audit('auth.logout', { user })
  redirect('/')
}

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password.'),
    next: z.string().min(8, 'Use at least 8 characters.').regex(/\d/, 'Include at least one number.'),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ['confirm'], message: 'The new passwords don’t match.' })

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await getCurrentUser()
  if (!me) redirect('/login')
  const parsed = passwordSchema.safeParse({ current: form.get('current'), next: form.get('next'), confirm: form.get('confirm') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id))
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) return { fieldErrors: { current: 'Your current password is wrong.' } }
  await db.update(schema.users).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(schema.users.id, me.id))
  await audit('auth.password_change', { user: me })
  return { ok: true, message: 'Password updated.' }
}

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'),
})

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await getCurrentUser()
  if (!me) redirect('/login')
  const parsed = profileSchema.safeParse({ name: form.get('name'), phone: form.get('phone') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  await db.update(schema.users).set(parsed.data).where(eq(schema.users.id, me.id))
  return { ok: true, message: 'Profile saved.' }
}
