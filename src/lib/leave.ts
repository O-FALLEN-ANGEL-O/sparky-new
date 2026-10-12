/** Yearly leave allowances. Unpaid leave has no cap but is deducted in payroll. */
export const LEAVE_ALLOWANCE = { casual: 12, sick: 10, earned: 15, unpaid: 0 } as const
export type LeaveType = keyof typeof LEAVE_ALLOWANCE

export const LEAVE_LABEL: Record<LeaveType, string> = {
  casual: 'Casual',
  sick: 'Sick',
  earned: 'Earned',
  unpaid: 'Unpaid',
}

/** Working days between two ISO dates, inclusive, excluding Sundays. */
export function workingDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T00:00:00Z')
  if (e < s) return 0
  let days = 0
  for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) days++
  }
  return days
}

/** Days of `leave` that fall inside the month `ym` (YYYY-MM), excluding Sundays. */
export function daysInMonthOverlap(start: string, end: string, ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  const monthStart = `${ym}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const monthEnd = `${ym}-${String(last).padStart(2, '0')}`
  const s = start > monthStart ? start : monthStart
  const e = end < monthEnd ? end : monthEnd
  return s <= e ? workingDays(s, e) : 0
}
