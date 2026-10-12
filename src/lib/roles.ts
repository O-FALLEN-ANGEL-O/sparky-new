/** Roles, labels and what each role can do. Shared by server and client. */
export const ROLES = ['customer', 'owner', 'admin', 'manager', 'hr', 'employee', 'shareholder', 'delivery_agent'] as const
export type Role = (typeof ROLES)[number]
export const STAFF_ROLES = ROLES.filter((r) => r !== 'customer') as Exclude<Role, 'customer'>[]

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Customer',
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR',
  employee: 'Employee',
  shareholder: 'Shareholder',
  delivery_agent: 'Delivery partner',
}

export type Permission =
  | 'orders.view'
  | 'orders.manage'
  | 'products.manage'
  | 'inventory.manage'
  | 'deliveries.manage'
  | 'deliveries.run'
  | 'analytics.view'
  | 'customers.view'
  | 'people.view'
  | 'people.manage'
  | 'roles.manage'
  | 'security.view'
  | 'audit.view'
  | 'reports.view'
  | 'system.view'
  | 'settings.manage'
  | 'tasks.assign'
  | 'tasks.own'
  | 'leave.own'
  | 'leave.approve'
  | 'payroll.manage'
  | 'onboarding.manage'
  | 'recruitment.manage'
  | 'announcements.manage'
  | 'portal.view'

const ALL: Permission[] = [
  'orders.view', 'orders.manage', 'products.manage', 'inventory.manage', 'deliveries.manage', 'analytics.view',
  'customers.view', 'people.view', 'people.manage', 'roles.manage', 'security.view', 'audit.view', 'reports.view',
  'system.view', 'settings.manage', 'tasks.assign', 'leave.approve', 'payroll.manage', 'onboarding.manage',
  'recruitment.manage', 'announcements.manage', 'portal.view',
]

export const PERMISSIONS: Record<Role, Permission[]> = {
  customer: [],
  owner: ALL,
  admin: ['orders.view', 'orders.manage', 'products.manage', 'inventory.manage', 'deliveries.manage', 'analytics.view', 'customers.view', 'people.view', 'roles.manage', 'security.view', 'audit.view', 'reports.view', 'system.view', 'portal.view', 'leave.own'],
  manager: ['orders.view', 'orders.manage', 'inventory.manage', 'deliveries.manage', 'people.view', 'tasks.assign', 'tasks.own', 'leave.approve', 'leave.own', 'portal.view'],
  hr: ['people.view', 'people.manage', 'leave.approve', 'leave.own', 'payroll.manage', 'onboarding.manage', 'recruitment.manage', 'announcements.manage', 'portal.view', 'reports.view'],
  employee: ['tasks.own', 'leave.own', 'portal.view'],
  shareholder: ['analytics.view', 'reports.view'],
  delivery_agent: ['deliveries.run', 'leave.own', 'portal.view'],
}

export function can(role: Role | undefined | null, permission: Permission): boolean {
  return !!role && PERMISSIONS[role].includes(permission)
}

export function homeFor(role: Role): string {
  if (role === 'customer') return '/account'
  if (role === 'delivery_agent') return '/delivery'
  return '/dashboard'
}
