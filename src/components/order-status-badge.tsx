import { ORDER_STATUS_LABEL } from '@/lib/order-status'
import { cn } from '@/lib/utils'

const TONE: Record<string, string> = {
  pending_payment: 'bg-kumkum/10 text-kumkum',
  confirmed: 'bg-gold/15 text-[#7a5c17] dark:text-gilt',
  processing: 'bg-gold/15 text-[#7a5c17] dark:text-gilt',
  out_for_delivery: 'bg-[#1d4ed8]/10 text-[#1d4ed8] dark:text-[#93b4ff]',
  delivered: 'bg-ok/10 text-ok',
  cancelled: 'bg-muted text-muted-foreground',
}

export function OrderStatusBadge({ status }: { status: keyof typeof ORDER_STATUS_LABEL }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-medium', TONE[status])}>{ORDER_STATUS_LABEL[status]}</span>
}
