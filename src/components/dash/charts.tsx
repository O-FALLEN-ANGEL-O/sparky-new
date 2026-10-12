'use client'

import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const axis = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-4 tabular">{inr.format(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

/** One series over time: revenue by month. */
export function RevenueTrend({ data, height = 260 }: { data: { label: string; revenue: number }[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label={`Revenue by month: ${data.map((d) => `${d.label} ${inr.format(d.revenue)}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} />
          <YAxis tickLine={false} axisLine={false} tick={axis} width={56} tickFormatter={(v) => `₹${compact.format(v)}`} />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: 'hsl(var(--border))' }} />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--series-1)" strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** This period against the previous one, day by day. Two validated hues plus a legend. */
export function CompareDaily({ data, height = 260 }: { data: { label: string; current: number; previous: number }[]; height?: number }) {
  return (
    <div>
      <div className="mb-3 flex gap-5 text-sm text-muted-foreground" aria-hidden>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5" style={{ background: 'var(--series-1)' }} />Last 30 days</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed" style={{ borderColor: 'var(--series-2)' }} />30 days before</span>
      </div>
      <div style={{ height }} role="img" aria-label="Daily revenue for the last 30 days compared with the 30 days before">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} interval={6} />
            <YAxis tickLine={false} axisLine={false} tick={axis} width={56} tickFormatter={(v) => `₹${compact.format(v)}`} />
            <Tooltip content={<TooltipBox />} cursor={{ stroke: 'hsl(var(--border))' }} />
            <Line type="monotone" dataKey="previous" name="30 days before" stroke="var(--series-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="current" name="Last 30 days" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
