
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Payroll } from "@/lib/mock-data"

type PayrollChartProps = {
    data: Payroll[];
}

export function PayrollChart({ data }: PayrollChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Overview</CardTitle>
        <CardDescription>Monthly payouts for the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                        }}
                    />
                    <Bar dataKey="payout" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
