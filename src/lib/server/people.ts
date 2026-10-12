import 'server-only'
import { and, asc, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { db, schema } from '@/db'
import { LEAVE_ALLOWANCE, type LeaveType } from '@/lib/leave'

export async function leaveBalance(userId: number, year = new Date().getFullYear()) {
  const rows = await db
    .select({ type: schema.leaveRequests.type, days: sql<number>`sum(${schema.leaveRequests.days})` })
    .from(schema.leaveRequests)
    .where(
      and(
        eq(schema.leaveRequests.userId, userId),
        eq(schema.leaveRequests.status, 'approved'),
        gte(schema.leaveRequests.startDate, `${year}-01-01`),
      ),
    )
    .groupBy(schema.leaveRequests.type)
  const used = Object.fromEntries(rows.map((r) => [r.type, r.days])) as Partial<Record<LeaveType, number>>
  return (Object.keys(LEAVE_ALLOWANCE) as LeaveType[]).map((type) => ({
    type,
    allowance: LEAVE_ALLOWANCE[type],
    used: used[type] ?? 0,
    left: Math.max(0, LEAVE_ALLOWANCE[type] - (used[type] ?? 0)),
  }))
}

const manager = alias(schema.users, 'manager')

/** Staff directory rows (everyone except customers). */
export async function directory(opts: { managerId?: number; includeInactive?: boolean } = {}) {
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      role: schema.users.role,
      active: schema.users.active,
      lastLoginAt: schema.users.lastLoginAt,
      code: schema.employees.employeeCode,
      department: schema.employees.department,
      title: schema.employees.title,
      joinDate: schema.employees.joinDate,
      salary: schema.employees.monthlySalary,
      location: schema.employees.location,
      managerId: schema.employees.managerId,
      managerName: manager.name,
    })
    .from(schema.users)
    .innerJoin(schema.employees, eq(schema.employees.userId, schema.users.id))
    .leftJoin(manager, eq(manager.id, schema.employees.managerId))
    .where(
      and(
        ne(schema.users.role, 'customer'),
        opts.managerId ? eq(schema.employees.managerId, opts.managerId) : undefined,
        opts.includeInactive ? undefined : eq(schema.users.active, true),
      ),
    )
    .orderBy(asc(schema.employees.department), asc(schema.users.name))
}

export async function pendingLeave(forManagerId?: number) {
  const requester = alias(schema.users, 'requester')
  return db
    .select({ leave: schema.leaveRequests, name: requester.name, title: schema.employees.title })
    .from(schema.leaveRequests)
    .innerJoin(requester, eq(requester.id, schema.leaveRequests.userId))
    .leftJoin(schema.employees, eq(schema.employees.userId, schema.leaveRequests.userId))
    .where(and(eq(schema.leaveRequests.status, 'pending'), forManagerId ? eq(schema.employees.managerId, forManagerId) : undefined))
    .orderBy(asc(schema.leaveRequests.startDate))
}

export async function myTasks(userId: number) {
  return db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.assigneeId, userId))
    .orderBy(sql`case ${schema.tasks.status} when 'in_progress' then 0 when 'todo' then 1 else 2 end`, asc(schema.tasks.dueDate))
}

export async function latestPayslip(userId: number) {
  const [row] = await db
    .select({ slip: schema.payslips, month: schema.payrollRuns.month })
    .from(schema.payslips)
    .innerJoin(schema.payrollRuns, eq(schema.payrollRuns.id, schema.payslips.runId))
    .where(and(eq(schema.payslips.userId, userId), eq(schema.payrollRuns.status, 'processed')))
    .orderBy(desc(schema.payrollRuns.month))
    .limit(1)
  return row ?? null
}

export async function announcements(limit = 5) {
  return db
    .select({ a: schema.announcements, author: schema.users.name })
    .from(schema.announcements)
    .leftJoin(schema.users, eq(schema.users.id, schema.announcements.authorId))
    .orderBy(desc(schema.announcements.pinned), desc(schema.announcements.createdAt))
    .limit(limit)
}

export async function deliveryAgents() {
  return db
    .select({ id: schema.users.id, name: schema.users.name, phone: schema.users.phone })
    .from(schema.users)
    .where(and(eq(schema.users.role, 'delivery_agent'), eq(schema.users.active, true)))
}

export async function agentLoad() {
  const rows = await db
    .select({ agentId: schema.deliveries.agentId, n: sql<number>`count(*)` })
    .from(schema.deliveries)
    .where(inArray(schema.deliveries.status, ['assigned', 'accepted', 'out_for_delivery']))
    .groupBy(schema.deliveries.agentId)
  return new Map(rows.map((r) => [r.agentId, r.n]))
}
