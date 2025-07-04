'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, ShoppingCart, Package, Users, Settings, 
    Shield, Briefcase, BarChart3, Download, Globe, UserCog, Factory, LineChart, BrainCircuit, UsersRound, Building2, Truck, FileText
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Logo } from '../logo';
import type { Role } from '@/hooks/use-auth';

const navConfig = {
    owner: [
        { href: '/dashboard', label: 'Global Overview', icon: Globe },
        { href: '/dashboard/roles', label: 'Role Management', icon: UserCog },
        { href: '/dashboard/inventory', label: 'Live Inventory', icon: Factory },
        { href: '/dashboard/analytics', label: 'Revenue & Profit', icon: LineChart },
        { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
        { href: '/dashboard/ai-insights', label: 'AI Insights', icon: BrainCircuit },
        { href: '/dashboard/security', label: 'Security', icon: Shield },
        { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: FileText },
        { href: '/dashboard/reports', label: 'Download Reports', icon: Download },
    ],
    admin: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
        { href: '/dashboard/products', label: 'Products', icon: Package },
        { href: '/dashboard/deliveries', label: 'Deliveries', icon: Truck },
        { href: '/dashboard/staff', label: 'Staff', icon: Users },
        { href: '/dashboard/security', label: 'Security', icon: Shield },
        { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: FileText },
        { href: '/dashboard/server', label: 'Server Health', icon: Shield },
    ],
    manager: [
        { href: '/dashboard', label: 'Team Overview', icon: UsersRound },
        { href: '/dashboard/tasks', label: 'Task Tracker', icon: Briefcase },
        { href: '/dashboard/leaves', label: 'Leave Requests', icon: BarChart3 },
    ],
    hr: [
        { href: '/dashboard', label: 'Employee Directory', icon: Users },
        { href: '/dashboard/payroll', label: 'Payroll', icon: Briefcase },
        { href: '/dashboard/onboarding', label: 'Onboarding', icon: UserCog },
    ],
    employee: [
        { href: '/dashboard', label: 'My Tasks', icon: Briefcase },
        { href: '/dashboard/leaves', label: 'My Leaves', icon: BarChart3 },
        { href: '/dashboard/hr', label: 'HR Portal', icon: Users },
    ],
    shareholder: [
        { href: '/dashboard', label: 'Company KPIs', icon: Globe },
        { href: '/dashboard/stores', label: 'Top Stores', icon: Building2 },
        { href: '/dashboard/top-products', label: 'Top Products', icon: Package },
        { href: '/dashboard/reports', label: 'Monthly Reports', icon: Download },
    ],
    'delivery-agent': [
        { href: '/delivery-agent', label: 'My Deliveries', icon: Truck },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ]
};

const settingsItem = { href: '/dashboard/settings', label: 'Settings', icon: Settings };

type SidebarNavProps = {
    role: Role;
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const menuItems = navConfig[role] || [];

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === settingsItem.href}
                    tooltip={settingsItem.label}
                >
                  <Link href={settingsItem.href}>
                    <settingsItem.icon />
                    <span>{settingsItem.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
