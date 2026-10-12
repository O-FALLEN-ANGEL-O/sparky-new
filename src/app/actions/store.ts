'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db, schema } from '@/db'
import { getCurrentUser } from '@/lib/server/auth'
import { setLine } from '@/lib/server/cart'
import { fieldErrors, type ActionState } from './types'

export async function addToCart(productId: number, quantity = 1): Promise<ActionState> {
  try {
    await setLine(productId, quantity, 'add')
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateCartLine(productId: number, quantity: number): Promise<ActionState> {
  try {
    await setLine(productId, quantity, 'set')
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function toggleWishlist(productId: number): Promise<{ saved: boolean } | { needsLogin: true }> {
  const user = await getCurrentUser()
  if (!user) return { needsLogin: true }
  const where = and(eq(schema.wishlist.userId, user.id), eq(schema.wishlist.productId, productId))
  const [existing] = await db.select().from(schema.wishlist).where(where)
  if (existing) await db.delete(schema.wishlist).where(where)
  else await db.insert(schema.wishlist).values({ userId: user.id, productId })
  revalidatePath('/account/wishlist')
  return { saved: !existing }
}

export async function subscribe(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.string().trim().email('Enter a valid email address.').safeParse(form.get('email'))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  await db.insert(schema.subscribers).values({ email: parsed.data.toLowerCase() }).onConflictDoNothing()
  return { ok: true, message: 'You’re on the list. We write once a month, never more.' }
}

const applicationSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number.'),
  portfolioUrl: z.union([z.literal(''), z.string().trim().url('Enter a full link, starting with https://')]).optional(),
  coverLetter: z.string().trim().min(40, 'Tell us a little more — at least a few sentences.').max(4000),
})

export async function applyForJob(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = applicationSchema.safeParse(Object.fromEntries(['jobId', 'name', 'email', 'phone', 'portfolioUrl', 'coverLetter'].map((k) => [k, form.get(k) ?? ''])))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, parsed.data.jobId))
  if (!job || !job.open) return { error: 'This role is no longer open.' }
  await db.insert(schema.applications).values({ ...parsed.data, portfolioUrl: parsed.data.portfolioUrl || null })
  return { ok: true, message: `Thanks, ${parsed.data.name.split(' ')[0]}. Our team reads every application and will reply within a week.` }
}

export async function searchRedirect(form: FormData) {
  const q = String(form.get('q') ?? '').trim()
  redirect(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
}
