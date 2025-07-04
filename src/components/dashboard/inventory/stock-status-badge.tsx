'use client';

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
  {
    variants: {
      level: {
        inStock: "bg-green-100 text-green-800 border-transparent dark:bg-green-900/50 dark:text-green-300",
        lowStock: "bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900/50 dark:text-yellow-300",
        outOfStock: "bg-red-100 text-red-800 border-transparent dark:bg-red-900/50 dark:text-red-300",
      },
    },
  }
)

export interface StockStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
    stock: number;
}

export function StockStatusBadge({ className, stock, ...props }: StockStatusBadgeProps) {
    let level: "inStock" | "lowStock" | "outOfStock" = "inStock";
    let text = "In Stock";
    if (stock > 0 && stock <= 10) {
        level = "lowStock";
        text = "Low Stock";
    } else if (stock === 0) {
        level = "outOfStock";
        text = "Out of Stock";
    }
    
    return (
        <div className={cn(badgeVariants({ level }), className)} {...props}>
            {text}
        </div>
    )
}
