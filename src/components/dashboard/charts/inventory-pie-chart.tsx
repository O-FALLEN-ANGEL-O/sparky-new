"use client"

import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const data = [
  { name: "Rings", value: 400, color: "hsl(var(--chart-1))" },
  { name: "Necklaces", value: 300, color: "hsl(var(--chart-2))" },
  { name: "Bracelets", value: 300, color: "hsl(var(--chart-3))" },
  { name: "Earrings", value: 200, color: "hsl(var(--chart-4))" },
]

export function InventoryPieChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Summary</CardTitle>
        <CardDescription>Stock levels by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
