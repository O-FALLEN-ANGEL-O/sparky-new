'use client';

import { Badge } from "@/components/ui/badge"
import { type DeliveryStatus } from "@/lib/mock-data"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 capitalize",
  {
    variants: {
      status: {
        pending: "bg-gray-100 text-gray-800 border-transparent dark:bg-gray-700 dark:text-gray-300",
        assigned: "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/50 dark:text-blue-300",
        accepted: "bg-cyan-100 text-cyan-800 border-transparent dark:bg-cyan-900/50 dark:text-cyan-300",
        out_for_delivery: "bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900/50 dark:text-yellow-300",
        delivered: "bg-green-100 text-green-800 border-transparent dark:bg-green-900/50 dark:text-green-300",
        failed: "bg-red-100 text-red-800 border-transparent dark:bg-red-900/50 dark:text-red-300",
      },
    },
  }
)

export interface DeliveryStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
    status: DeliveryStatus;
}

export function DeliveryStatusBadge({ className, status, ...props }: DeliveryStatusBadgeProps) {
  return (
    <div className={cn(badgeVariants({ status }), className)} {...props}>
      {status.replace(/_/g, ' ')}
    </div>
  )
}
