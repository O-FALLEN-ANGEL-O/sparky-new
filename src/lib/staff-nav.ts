import type { Permission, Role } from './roles'

export type NavItem = { href: string; label: string; icon: string; any?: Permission[]; roles?: Role[] }
export type NavGroup = { label: string; items: NavItem[] }

/** Staff navigation. An item shows if the user has any listed permission (or role). */
export const STAFF_NAV: NavGroup[] = [
  {
    label: 'Store',
    items: [
      { href: '/dashboard', label: 'Overview', icon: 'gauge' },
      { href: '/dashboard/orders', label: 'Orders', icon: 'receipt', any: ['orders.view'] },
      { href: '/dashboard/deliveries', label: 'Deliveries', icon: 'truck', any: ['deliveries.manage'] },
      { href: '/dashboard/products', label: 'Products', icon: 'gem', any: ['products.manage'] },
      { href: '/dashboard/inventory', label: 'Inventory', icon: 'boxes', any: ['inventory.manage'] },
      { href: '/dashboard/customers', label: 'Customers', icon: 'users', any: ['customers.view'] },
    ],
  },
  {
    label: 'Insight',
    items: [
      { href: '/dashboard/analytics', label: 'Sales analytics', icon: 'chart', any: ['analytics.view'] },
      { href: '/dashboard/insights', label: 'Insights', icon: 'sparkles', any: ['analytics.view'] },
      { href: '/dashboard/reports', label: 'Reports', icon: 'download', any: ['reports.view'] },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/dashboard/people', label: 'People', icon: 'contact', any: ['people.view'] },
      { href: '/dashboard/tasks', label: 'Tasks', icon: 'check', any: ['tasks.assign', 'tasks.own'] },
      { href: '/dashboard/leave', label: 'Leave', icon: 'calendar', any: ['leave.own', 'leave.approve'] },
      { href: '/dashboard/payroll', label: 'Payroll', icon: 'wallet', any: ['payroll.manage'] },
      { href: '/dashboard/onboarding', label: 'Onboarding', icon: 'list', any: ['onboarding.manage'] },
      { href: '/dashboard/recruitment', label: 'Recruitment', icon: 'briefcase', any: ['recruitment.manage'] },
      { href: '/dashboard/portal', label: 'HR portal', icon: 'book', any: ['portal.view'] },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/dashboard/security', label: 'Security', icon: 'shield', any: ['security.view'] },
      { href: '/dashboard/audit', label: 'Audit log', icon: 'scroll', any: ['audit.view'] },
      { href: '/dashboard/system', label: 'System health', icon: 'server', any: ['system.view'] },
      { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]
