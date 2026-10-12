'use client'

import {
  BookOpen, Boxes, Briefcase, CalendarDays, ChartColumn, CircleCheck, Contact, Download, Gauge, Gem, ListChecks, Menu, Receipt,
  ScrollText, Server, Settings, Shield, Sparkles, Truck, Users, Wallet, X, type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/logo'
import type { NavGroup } from '@/lib/staff-nav'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge, receipt: Receipt, truck: Truck, gem: Gem, boxes: Boxes, users: Users, chart: ChartColumn, sparkles: Sparkles,
  download: Download, contact: Contact, check: CircleCheck, calendar: CalendarDays, wallet: Wallet, list: ListChecks,
  briefcase: Briefcase, book: BookOpen, shield: Shield, scroll: ScrollText, server: Server, settings: Settings,
}

function Nav({ groups, badges }: { groups: NavGroup[]; badges: Record<string, number> }) {
  const path = usePathname()
  return (
    <nav aria-label="Dashboard" className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 px-3 text-xs text-[#8a7f70]">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const Icon = ICONS[it.icon] ?? Gauge
              const active = it.href === '/dashboard' ? path === it.href : path.startsWith(it.href)
              const badge = badges[it.href]
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center gap-3 rounded-md px-3 text-[14px] transition-colors',
                      active ? 'bg-white/[0.07] text-[#f6efe2]' : 'text-[#bdb2a2] hover:bg-white/[0.04] hover:text-[#f6efe2]',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-gold' : 'text-[#8a7f70]')} />
                    <span className="flex-1">{it.label}</span>
                    {badge ? <span className="rounded-full bg-gold/20 px-1.5 text-[11px] text-gilt tabular">{badge}</span> : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ groups, badges, user }: { groups: NavGroup[]; badges: Record<string, number>; user: { name: string; roleLabel: string } }) {
  const [open, setOpen] = useState(false)
  const path = usePathname()
  useEffect(() => setOpen(false), [path])
  const body = (
    <>
      <div className="flex h-16 items-center px-3">
        <Logo href="/dashboard" className="text-[#f6efe2]" />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-6 pt-2">
        <Nav groups={groups} badges={badges} />
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-sm">
        <p className="text-[#f6efe2]">{user.name}</p>
        <p className="text-xs text-[#8a7f70]">{user.roleLabel}</p>
      </div>
    </>
  )
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-velvet lg:flex">{body}</aside>
      <button className="fixed left-3 top-3 z-40 rounded-md bg-velvet p-2 text-[#f6efe2] lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-velvet">
            <button className="absolute right-3 top-4 p-1 text-[#f6efe2]" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
            {body}
          </aside>
        </div>
      )}
    </>
  )
}
