import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}

export function Panel({ title, description, action, children, className, bodyClassName }: { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn('min-w-0 rounded-lg border bg-card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="font-headline text-xl">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

/** KPI tile: the number, what it is, and how it moved. Direction is shown with an icon and words, not colour alone. */
export function Stat({ label, value, change, note, href }: { label: string; value: string; change?: number | null; note?: string; href?: string }) {
  const up = (change ?? 0) >= 0
  const body = (
    <div className="h-full rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 sm:p-5">
      <p className="text-[13px] text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-2 font-headline text-[1.75rem] leading-none tabular sm:text-[2.1rem]">{value}</p>
      {change != null ? (
        <p className="mt-2 text-[13px] leading-snug sm:text-sm">
          <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap font-medium', up ? 'text-ok' : 'text-kumkum')}>
            {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {up ? 'Up' : 'Down'} {Math.abs(change * 100).toFixed(0)}%
          </span>{' '}
          <span className="text-muted-foreground">{note ?? 'vs previous period'}</span>
        </p>
      ) : note ? (
        <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      ) : null}
    </div>
  )
  return href ? <Link href={href} className="block">{body}</Link> : body
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="font-headline text-xl">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

/** Horizontal bars with the value written at the end. Sorted, one hue, readable without a legend. */
export function BarList({ rows, format, max }: { rows: { label: React.ReactNode; value: number; sub?: string }[]; format: (n: number) => string; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="space-y-1.5" title={`${typeof r.label === 'string' ? r.label : ''} ${format(r.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 tabular">
              {format(r.value)}
              {r.sub && <span className="ml-2 text-muted-foreground">{r.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (r.value / m) * 100)}%`, background: 'var(--series-1)' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'gold' | 'ok' | 'warn' | 'danger' | 'blue'; children: React.ReactNode }) {
  const t = {
    neutral: 'bg-muted text-muted-foreground',
    gold: 'bg-gold/15 text-[#7a5c17] dark:text-gilt',
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-[#b45309]/10 text-[#b45309] dark:text-[#f0b46a]',
    danger: 'bg-kumkum/10 text-kumkum',
    blue: 'bg-[#1d4ed8]/10 text-[#1d4ed8] dark:text-[#93b4ff]',
  }[tone]
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium', t)}>{children}</span>
}
