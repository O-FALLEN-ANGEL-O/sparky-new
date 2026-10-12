'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db, schema } from '@/db'
import { chunks } from '@/db/sql'
import { daysInMonthOverlap, workingDays } from '@/lib/leave'
import { calculatePayslip } from '@/lib/payroll'
import { can } from '@/lib/roles'
import { audit } from '@/lib/server/audit'
import { assertCan, getCurrentUser } from '@/lib/server/auth'
import { leaveBalance } from '@/lib/server/people'
import { fieldErrors, type ActionState } from './types'

type Result = { ok?: boolean; error?: string; message?: string }
const fail = (e: unknown): Result => ({ error: e instanceof Error ? e.message : 'Something went wrong.' })
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.')

// ----------------------------------------------------------------- tasks

const taskSchema = z.object({
  title: z.string().trim().min(3, 'Describe the task.').max(200),
  description: z.string().trim().max(2000).optional(),
  assigneeId: z.coerce.number().int().positive('Choose who it’s for.'),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.union([z.literal(''), isoDate]).optional(),
})

export async function createTask(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('tasks.assign')
  const parsed = taskSchema.safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const d = parsed.data
  const [assignee] = await db.select().from(schema.employees).where(eq(schema.employees.userId, d.assigneeId))
  if (!assignee || (me.role === 'manager' && assignee.managerId !== me.id)) return { fieldErrors: { assigneeId: 'You can assign tasks to your own team.' } }
  await db.insert(schema.tasks).values({ ...d, description: d.description || null, dueDate: d.dueDate || null, createdById: me.id })
  await audit('task.create', { user: me, entity: 'task', details: d.title })
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: 'Task assigned.' }
}

export async function updateTaskProgress(taskId: number, progress: number): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { error: 'Please sign in again.' }
  const [t] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId))
  if (!t) return { error: 'Task not found.' }
  if (t.assigneeId !== me.id && t.createdById !== me.id && !can(me.role, 'tasks.assign')) return { error: 'This isn’t your task.' }
  const p = Math.max(0, Math.min(100, Math.round(progress / 10) * 10))
  const status = p === 100 ? 'done' : p === 0 ? 'todo' : 'in_progress'
  await db.update(schema.tasks).set({ progress: p, status, completedAt: p === 100 ? new Date() : null }).where(eq(schema.tasks.id, taskId))
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function deleteTask(taskId: number): Promise<Result> {
  try {
    const me = await assertCan('tasks.assign')
    await db.delete(schema.tasks).where(eq(schema.tasks.id, taskId))
    await audit('task.delete', { user: me, entity: 'task', entityId: taskId })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

// ----------------------------------------------------------------- leave

const leaveSchema = z
  .object({ type: z.enum(['casual', 'sick', 'earned', 'unpaid']), startDate: isoDate, endDate: isoDate, reason: z.string().trim().min(3, 'Add a short reason.').max(500) })
  .refine((d) => d.endDate >= d.startDate, { path: ['endDate'], message: 'The end date is before the start date.' })

export async function requestLeave(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('leave.own')
  const parsed = leaveSchema.safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const d = parsed.data
  const days = workingDays(d.startDate, d.endDate)
  if (days === 0) return { fieldErrors: { endDate: 'Those dates are all Sundays — no leave needed.' } }
  if (d.type !== 'unpaid') {
    const bal = (await leaveBalance(me.id)).find((b) => b.type === d.type)!
    if (days > bal.left) return { fieldErrors: { type: `You have ${bal.left} ${d.type} day${bal.left === 1 ? '' : 's'} left this year. Choose unpaid leave for the rest.` } }
  }
  const overlap = await db
    .select({ id: schema.leaveRequests.id })
    .from(schema.leaveRequests)
    .where(and(eq(schema.leaveRequests.userId, me.id), inArray(schema.leaveRequests.status, ['pending', 'approved'])))
  const existing = overlap.length
    ? await db.select().from(schema.leaveRequests).where(inArray(schema.leaveRequests.id, overlap.map((o) => o.id)))
    : []
  if (existing.some((l) => l.startDate <= d.endDate && l.endDate >= d.startDate)) return { fieldErrors: { startDate: 'You already have leave on some of these days.' } }
  await db.insert(schema.leaveRequests).values({ userId: me.id, ...d, days })
  await audit('leave.request', { user: me, entity: 'leave', details: `${d.type} ${d.startDate}..${d.endDate}` })
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: `Request sent for ${days} day${days === 1 ? '' : 's'}. Your manager will review it.` }
}

export async function reviewLeave(id: number, decision: 'approved' | 'rejected', note?: string): Promise<Result> {
  try {
    const me = await assertCan('leave.approve')
    const [l] = await db
      .select({ l: schema.leaveRequests, managerId: schema.employees.managerId })
      .from(schema.leaveRequests)
      .leftJoin(schema.employees, eq(schema.employees.userId, schema.leaveRequests.userId))
      .where(eq(schema.leaveRequests.id, id))
    if (!l || l.l.status !== 'pending') return { error: 'This request has already been handled.' }
    if (l.l.userId === me.id) return { error: 'You can’t approve your own leave.' }
    if (me.role === 'manager' && l.managerId !== me.id) return { error: 'Only their manager or HR can review this.' }
    if (decision === 'rejected' && !note?.trim()) return { error: 'Add a short note so they know why.' }
    await db.update(schema.leaveRequests).set({ status: decision, reviewerId: me.id, reviewNote: note?.trim() || null, reviewedAt: new Date() }).where(eq(schema.leaveRequests.id, id))
    await audit(`leave.${decision === 'approved' ? 'approve' : 'reject'}`, { user: me, entity: 'leave', entityId: id })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function cancelLeave(id: number): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { error: 'Please sign in again.' }
  const [l] = await db.select().from(schema.leaveRequests).where(and(eq(schema.leaveRequests.id, id), eq(schema.leaveRequests.userId, me.id)))
  if (!l || l.status !== 'pending') return { error: 'Only pending requests can be withdrawn.' }
  await db.update(schema.leaveRequests).set({ status: 'cancelled' }).where(eq(schema.leaveRequests.id, id))
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

// --------------------------------------------------------------- payroll

/** Create (or refresh) a draft payroll for a month from current salaries and approved unpaid leave. */
export async function preparePayroll(month: string): Promise<Result> {
  try {
    const me = await assertCan('payroll.manage')
    if (!/^\d{4}-\d{2}$/.test(month)) return { error: 'Choose a month.' }
    const [existing] = await db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.month, month))
    if (existing?.status === 'processed') return { error: 'That month has already been processed.' }
    const [y, m] = month.split('-').map(Number)
    const daysIn = new Date(y, m, 0).getDate()
    const monthEnd = `${month}-${String(daysIn).padStart(2, '0')}`
    const staff = await db
      .select({ id: schema.users.id, salary: schema.employees.monthlySalary, joinDate: schema.employees.joinDate })
      .from(schema.users)
      .innerJoin(schema.employees, eq(schema.employees.userId, schema.users.id))
      .where(eq(schema.users.active, true))
    const unpaid = await db.select().from(schema.leaveRequests).where(and(eq(schema.leaveRequests.type, 'unpaid'), eq(schema.leaveRequests.status, 'approved')))
    const slips = staff
      .filter((s) => s.salary > 0 && s.joinDate <= monthEnd)
      .map((s) => {
        const days = unpaid.filter((l) => l.userId === s.id).reduce((n, l) => n + daysInMonthOverlap(l.startDate, l.endDate, month), 0)
        return { userId: s.id, ...calculatePayslip(s.salary, days, daysIn) }
      })
    const runId = existing?.id ?? (await db.insert(schema.payrollRuns).values({ month }).returning())[0].id
    // replace the draft's payslips and totals in one all-or-nothing batch
    await db.batch([
      db.delete(schema.payslips).where(eq(schema.payslips.runId, runId)),
      ...chunks(schema.payslips, slips.map((s) => ({ ...s, runId }))).map((rows) => db.insert(schema.payslips).values(rows)),
      db
        .update(schema.payrollRuns)
        .set({ totalGross: slips.reduce((a, b) => a + b.gross, 0), totalNet: slips.reduce((a, b) => a + b.net, 0) })
        .where(eq(schema.payrollRuns.id, runId)),
    ])
    await audit('payroll.prepare', { user: me, details: month })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard/payroll')
  return { ok: true, message: 'Draft ready. Check the figures, then process it to release payslips.' }
}

export async function processPayroll(runId: number): Promise<Result> {
  try {
    const me = await assertCan('payroll.manage')
    const [run] = await db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.id, runId))
    if (!run || run.status === 'processed') return { error: 'Already processed.' }
    await db.update(schema.payrollRuns).set({ status: 'processed', processedAt: new Date(), processedById: me.id }).where(eq(schema.payrollRuns.id, runId))
    await audit('payroll.process', { user: me, details: run.month })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: 'Processed. Payslips are now in everyone’s HR portal.' }
}

// ------------------------------------------------------------ onboarding

export async function toggleOnboardingTask(id: number, done: boolean): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { error: 'Please sign in again.' }
  const [t] = await db.select().from(schema.onboardingTasks).where(eq(schema.onboardingTasks.id, id))
  if (!t) return { error: 'Not found.' }
  if (t.userId !== me.id && !can(me.role, 'onboarding.manage')) return { error: 'Not allowed.' }
  await db.update(schema.onboardingTasks).set({ done, completedAt: done ? new Date() : null }).where(eq(schema.onboardingTasks.id, id))
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}

export async function addOnboardingTask(userId: number, title: string): Promise<Result> {
  try {
    await assertCan('onboarding.manage')
    if (title.trim().length < 3) return { error: 'Describe the step.' }
    const rows = await db.select().from(schema.onboardingTasks).where(eq(schema.onboardingTasks.userId, userId))
    await db.insert(schema.onboardingTasks).values({ userId, title: title.trim().slice(0, 200), sort: rows.length })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard/onboarding')
  return { ok: true }
}

// ----------------------------------------------------------- recruitment

export async function setApplicationStatus(id: number, status: string): Promise<Result> {
  try {
    const me = await assertCan('recruitment.manage')
    if (!(schema.applicationStatusEnum.enumValues as readonly string[]).includes(status)) return { error: 'Unknown stage.' }
    await db.update(schema.applications).set({ status: status as never }).where(eq(schema.applications.id, id))
    await audit('application.stage', { user: me, entity: 'application', entityId: id, details: status })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard/recruitment')
  return { ok: true }
}

const jobSchema = z.object({
  title: z.string().trim().min(3, 'Enter the role title.').max(140),
  department: z.string().trim().min(2, 'Enter the department.').max(80),
  location: z.string().trim().min(2, 'Enter the location.').max(80),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  description: z.string().trim().min(30, 'Describe the role in a few sentences.'),
  requirements: z.string().trim().min(3, 'List at least one requirement.'),
})

export async function createJob(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('recruitment.manage')
  const parsed = jobSchema.safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  const d = parsed.data
  const base = d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let slug = base
  for (let i = 2; (await db.select({ id: schema.jobs.id }).from(schema.jobs).where(eq(schema.jobs.slug, slug))).length; i++) slug = `${base}-${i}`
  await db.insert(schema.jobs).values({ ...d, slug, requirements: d.requirements.split('\n').map((r) => r.replace(/^[-•*]\s*/, '').trim()).filter(Boolean) })
  await audit('job.create', { user: me, details: d.title })
  revalidatePath('/dashboard/recruitment')
  revalidatePath('/careers')
  return { ok: true, message: `“${d.title}” is live on the careers page.` }
}

export async function setJobOpen(id: number, open: boolean): Promise<Result> {
  try {
    const me = await assertCan('recruitment.manage')
    await db.update(schema.jobs).set({ open }).where(eq(schema.jobs.id, id))
    await audit(open ? 'job.open' : 'job.close', { user: me, entity: 'job', entityId: id })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard/recruitment')
  revalidatePath('/careers')
  return { ok: true }
}

// --------------------------------------------------------- announcements

export async function postAnnouncement(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await assertCan('announcements.manage')
  const parsed = z
    .object({ title: z.string().trim().min(3, 'Add a title.').max(200), body: z.string().trim().min(10, 'Write the announcement.').max(4000) })
    .safeParse(Object.fromEntries(form.entries()))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) }
  await db.insert(schema.announcements).values({ ...parsed.data, pinned: form.get('pinned') === 'on', authorId: me.id })
  await audit('announcement.post', { user: me, details: parsed.data.title })
  revalidatePath('/dashboard', 'layout')
  return { ok: true, message: 'Posted. Everyone sees it in the HR portal.' }
}

export async function deleteAnnouncement(id: number): Promise<Result> {
  try {
    const me = await assertCan('announcements.manage')
    await db.delete(schema.announcements).where(eq(schema.announcements.id, id))
    await audit('announcement.delete', { user: me, entity: 'announcement', entityId: id })
  } catch (e) {
    return fail(e)
  }
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}
