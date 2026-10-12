'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db, schema } from '@/db'
import { audit } from '@/lib/server/audit'
import { assertCan, getCurrentUser, hashPassword } from '@/lib/server/auth'
import { OrderError, assignAgent, changeOrderStatus, resetOtpAttempts } from '@/lib/server/orders'
import { setSetting } from '@/lib/server/settings'
import { fieldErrors, type ActionState } from './types'

type Result = { ok?: boolean; error?: string; message?: string }
const fail = (e: unknown): Result => ({ error: e instanceof OrderError || e instanceof Error ? e.message : 'Something went wrong.' })

// ---------------------------------------------------------------- orders

export async function setOrderStatus(orderId: number, to: string, note?: string): Promise<Result> {
  try {
    const user = await assertCan('orders.manage')
    await changeOrderStatus(orderId, to as never, user.id, note)
    await audit(`order.${to}`, { user, entity: 'order', entityId: orderId, details: note })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function assignDelivery(orderId: number, agentId: number): Promise<Result> {
  try {
    const user = await assertCan('deliveries.manage')
    await assignAgent(orderId, agentId, user.id)
    await audit('delivery.assign', { user, entity: 'order', entityId: orderId, details: `agent ${agentId}` })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function unlockOtp(orderId: number): Promise<Result> {
  try {
    const user = await assertCan('deliveries.manage')
    await resetOtpAttempts(orderId)
    await audit('delivery.unlock_code', { user, entity: 'order', entityId: orderId })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: 'Code unlocked. The partner can try again.' }
}

// -------------------------------------------------------------- products

const productSchema = z.object({
  name: z.string().trim().min(3, 'Give the piece a name.').max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.')
    .max(140),
  description: z.string().trim().min(20, 'Write at least a sentence or two.'),
  categoryId: z.coerce.number().int().positive('Choose a category.'),
  price: z.coerce.number().int('Whole rupees only.').min(100, 'Price looks too low.'),
  compareAtPrice: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
  metal: z.enum(schema.metalEnum.enumValues),
  gem: z.enum(schema.gemEnum.enumValues),
  design: z.enum(schema.designEnum.enumValues),
  purity: z.string().trim().min(2).max(20),
  weightGrams: z.coerce.number().positive('Enter the weight in grams.'),
  caratWeight: z.union([z.literal(''), z.coerce.number().positive()]).optional(),
  lowStockThreshold: z.coerce.number().int().min(0),
  featured: z.boolean(),
  active: z.boolean(),
  certificateNo: z.string().trim().max(40).optional(),
})

export async function saveProduct(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await assertCan('products.manage')
  const raw = Object.fromEntries(form.entries())
  const parsed = productSchema.safeParse({ ...raw, featured: form.get('featured') === 'on', active: form.get('active') === 'on' })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const d = parsed.data
  const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.id, d.categoryId))
  if (!cat) return { fieldErrors: { categoryId: 'Choose a category.' } }
  const id = Number(form.get('id')) || null
  const [clash] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, d.slug))
  if (clash && clash.id !== id) return { fieldErrors: { slug: 'Another piece already uses this web address.' } }
  const values = {
    name: d.name,
    slug: d.slug,
    description: d.description,
    categoryId: d.categoryId,
    jewelType: cat.jewelType,
    price: d.price,
    compareAtPrice: d.compareAtPrice === '' || d.compareAtPrice == null ? null : d.compareAtPrice,
    metal: d.metal,
    gem: d.gem,
    design: d.design,
    purity: d.purity,
    weightGrams: d.weightGrams,
    caratWeight: d.caratWeight === '' || d.caratWeight == null ? null : d.caratWeight,
    lowStockThreshold: d.lowStockThreshold,
    featured: d.featured,
    active: d.active,
    certificateNo: d.certificateNo || null,
    updatedAt: new Date(),
  }
  let productId = id
  if (id) {
    await db.update(schema.products).set(values).where(eq(schema.products.id, id))
    await audit('product.update', { user, entity: 'product', entityId: id, details: d.name })
  } else {
    const opening = Math.max(0, Number(form.get('openingStock')) || 0)
    const [p] = await db
      .insert(schema.products)
      .values({ ...values, stock: opening, images: [1, 2, 3].map((n) => `/products/${d.slug}-${n}.webp`) })
      .returning()
    productId = p.id
    if (opening) await db.insert(schema.inventoryMovements).values({ productId: p.id, change: opening, stockAfter: opening, reason: 'restock', note: 'Opening stock', userId: user.id })
    await audit('product.create', { user, entity: 'product', entityId: p.id, details: d.name })
  }
  revalidatePath('/', 'layout')
  redirect(`/dashboard/products/${productId}?saved=1`)
}

const adjustSchema = z.object({
  productId: z.coerce.number().int().positive(),
  change: z.coerce.number().int().refine((n) => n !== 0, 'Enter a number other than zero.'),
  reason: z.enum(['restock', 'adjustment', 'return']),
  note: z.string().trim().max(200).optional(),
})

export async function adjustStock(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await assertCan('inventory.manage')
  const parsed = adjustSchema.safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const { productId, change, reason, note } = parsed.data
  try {
    await db.transaction(async (tx) => {
      const [p] = await tx.select().from(schema.products).where(eq(schema.products.id, productId)).for('update')
      if (!p) throw new Error('Product not found.')
      if (p.stock + change < 0) throw new Error(`Only ${p.stock} in stock — you can’t remove ${Math.abs(change)}.`)
      await tx.update(schema.products).set({ stock: p.stock + change, updatedAt: new Date() }).where(eq(schema.products.id, productId))
      await tx.insert(schema.inventoryMovements).values({ productId, change, stockAfter: p.stock + change, reason, note: note || null, userId: user.id })
    })
  } catch (e) {
    return { error: (e as Error).message }
  }
  await audit('inventory.adjust', { user, entity: 'product', entityId: productId, details: `${change > 0 ? '+' : ''}${change} (${reason})${note ? `: ${note}` : ''}` })
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: 'Stock updated.' }
}

// ---------------------------------------------------------------- people

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Enter the full name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number.'),
  role: z.enum(['admin', 'manager', 'hr', 'employee', 'shareholder', 'delivery_agent']),
  department: z.string().trim().min(2, 'Enter the department.').max(80),
  title: z.string().trim().min(2, 'Enter the job title.').max(120),
  managerId: z.union([z.literal(''), z.coerce.number().int().positive()]).optional(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the joining date.'),
  monthlySalary: z.coerce.number().int().min(0),
  location: z.string().trim().max(80).optional(),
})

const ONBOARDING = ['Sign offer letter and NDA', 'Submit ID and bank details', 'Laptop and email set up', 'Store safety and vault training', 'Meet the team', 'Shadow a senior colleague', '30-day check-in with manager']

export async function addStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('people.manage')
  const parsed = staffSchema.safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const d = parsed.data
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${d.email}`)
  if (exists) return { fieldErrors: { email: 'Someone already uses this email.' } }
  // A temporary password the new hire changes on first sign-in.
  const temp = `Sparkle-${Math.random().toString(36).slice(2, 8)}`
  const user = await db.transaction(async (tx) => {
    const [u] = await tx.insert(schema.users).values({ name: d.name, email: d.email, phone: d.phone, role: d.role, passwordHash: await hashPassword(temp) }).returning()
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(schema.employees)
    await tx.insert(schema.employees).values({
      userId: u.id,
      employeeCode: `SPK-E${101 + n}`,
      department: d.department,
      title: d.title,
      managerId: d.managerId === '' || d.managerId == null ? null : d.managerId,
      joinDate: d.joinDate,
      monthlySalary: d.monthlySalary,
      location: d.location || null,
    })
    await tx.insert(schema.onboardingTasks).values(
      ONBOARDING.map((title, i) => {
        const due = new Date(d.joinDate)
        due.setDate(due.getDate() + i * 4)
        return { userId: u.id, title, sort: i, dueDate: due.toISOString().slice(0, 10) }
      }),
    )
    return u
  })
  await audit('user.create', { user: me, entity: 'user', entityId: user.id, details: `${d.name} as ${d.role}` })
  revalidatePath('/dashboard/people')
  return { ok: true, message: `${d.name} added. Their temporary password is ${temp} — share it privately; they can change it in Settings.` }
}

export async function updateStaff(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await getCurrentUser()
  if (!me) redirect('/login')
  const id = Number(form.get('id'))
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, id))
  if (!target) return { error: 'Person not found.' }
  const role = String(form.get('role') ?? target.role)
  const roleChanged = role !== target.role
  if (roleChanged) {
    await assertCan('roles.manage')
    if (target.role === 'owner' || role === 'owner') return { error: 'The owner role can’t be changed here.' }
    if (target.id === me.id) return { error: 'You can’t change your own role.' }
  }
  const detailsChanged = ['department', 'title', 'monthlySalary', 'managerId'].some((k) => form.has(k))
  if (detailsChanged) await assertCan('people.manage')
  if (roleChanged) {
    await db.update(schema.users).set({ role: role as never }).where(eq(schema.users.id, id))
    await audit('user.role_change', { user: me, entity: 'user', entityId: id, details: `${target.role} → ${role}` })
  }
  if (detailsChanged) {
    const salary = Number(form.get('monthlySalary'))
    const managerId = Number(form.get('managerId')) || null
    if (managerId === id) return { error: 'Someone can’t report to themselves.' }
    await db
      .update(schema.employees)
      .set({
        department: String(form.get('department') ?? '').trim() || undefined,
        title: String(form.get('title') ?? '').trim() || undefined,
        monthlySalary: Number.isFinite(salary) && salary >= 0 ? salary : undefined,
        managerId,
      })
      .where(eq(schema.employees.userId, id))
    await audit('user.update', { user: me, entity: 'user', entityId: id, details: 'Job details updated' })
  }
  revalidatePath('/dashboard/people')
  return { ok: true, message: 'Saved.' }
}

export async function setActive(userId: number, active: boolean): Promise<Result> {
  try {
    const me = await assertCan('roles.manage')
    const [target] = await db.select().from(schema.users).where(eq(schema.users.id, userId))
    if (!target || target.role === 'owner') return { error: 'The owner account can’t be deactivated.' }
    if (target.id === me.id) return { error: 'You can’t deactivate yourself.' }
    await db.update(schema.users).set({ active }).where(eq(schema.users.id, userId))
    if (!active) await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId))
    await audit(active ? 'user.activate' : 'user.deactivate', { user: me, entity: 'user', entityId: userId, details: target.name })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard/people')
  return { ok: true }
}

export async function revokeSession(sessionId: string): Promise<Result> {
  try {
    const me = await assertCan('security.view')
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId))
    await audit('session.revoke', { user: me, entity: 'session', entityId: sessionId.slice(0, 8) })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard/security')
  return { ok: true }
}

// -------------------------------------------------------------- settings

export async function saveMaintenance(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('settings.manage')
  const enabled = form.get('enabled') === 'on'
  const message = String(form.get('message') ?? '').trim().slice(0, 200) || 'We are polishing things up. Back shortly!'
  await setSetting('maintenance', { enabled, message })
  await audit('settings.maintenance', { user: me, details: enabled ? 'Checkout paused' : 'Checkout resumed' })
  revalidatePath('/', 'layout')
  return { ok: true, message: enabled ? 'Checkout is paused and a banner is showing on the store.' : 'Checkout is open again.' }
}

export async function saveStoreInfo(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('settings.manage')
  const parsed = z
    .object({ name: z.string().trim().min(2), email: z.string().trim().email('Enter a valid email.'), phone: z.string().trim().min(6), address: z.string().trim().min(6) })
    .safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  await setSetting('store', parsed.data)
  await audit('settings.store', { user: me })
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Store details saved.' }
}

