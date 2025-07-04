'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Store, AlertTriangle, Package, Repeat } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const kpiCards = [
    { title: "Total Sales", value: "$1,250,430.50", description: "+12.5% this month", icon: DollarSign, color: "text-green-500" },
    { title: "Growth", value: "+23.8%", description: "vs. previous quarter", icon: TrendingUp, color: "text-blue-500" },
    { title: "Active Users", value: "1,492", description: "+150 today", icon: Users, color: "text-indigo-500" },
    { title: "Total Stores", value: "24", description: "3 new stores added", icon: Store, color: "text-purple-500" },
];

export function OwnerDashboard() {
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const { toast } = useToast();

  const handleMaintenanceToggle = (checked: boolean) => {
    setIsMaintenance(checked);
    toast({
        title: `Emergency Maintenance ${checked ? 'Enabled' : 'Disabled'}`,
        description: checked
            ? 'The system is now in maintenance mode. Public access may be restricted.'
            : 'The system has returned to normal operation.',
        variant: checked ? 'destructive' : 'default',
        duration: 5000,
    });
  };

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold">Global Overview</h1>
            <p className="text-muted-foreground">Top-level metrics for your entire operation.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
            <Card key={card.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
            </Card>
        ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                    A list of the most recent orders from your store.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                    <RecentOrdersTable />
                </Suspense>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Valuation Metrics</CardTitle>
                    <CardDescription>Key startup-style performance indicators.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <p className="font-semibold">Monthly Recurring Revenue</p>
                        </div>
                        <p className="font-bold text-lg">$104,202</p>
                     </div>
                     <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Repeat className="h-5 w-5 text-primary" />
                            <p className="font-semibold">Repeat Customer Rate</p>
                        </div>
                        <p className="font-bold text-lg">27%</p>
                     </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>AI Insights</CardTitle>
                    <CardDescription>
                        Suggestions to improve your business.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="border p-3 rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <p className="font-semibold text-sm text-blue-800 dark:text-blue-300">🚀 Suggestion</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">Consider a 15% discount on 'Emerald Pendant Necklace' to boost sales by an estimated 25% this week.</p>
                     </div>
                     <div className="border p-3 rounded-lg bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                        <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300">⚠️ Low Stock Alert</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">'Diamond Tennis Bracelet' is running low. Only 7 units left. Reorder soon.</p>
                     </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>System Controls</CardTitle>
                    <CardDescription>High-level system-wide actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50 border-destructive/20 dark:bg-red-950/50">
                        <div>
                            <h4 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Emergency Shutdown</h4>
                            <p className="text-sm text-muted-foreground pl-6">Activate maintenance mode.</p>
                        </div>
                        <Switch
                            checked={isMaintenance}
                            onCheckedChange={handleMaintenanceToggle}
                            aria-label="Emergency Shutdown Switch"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
