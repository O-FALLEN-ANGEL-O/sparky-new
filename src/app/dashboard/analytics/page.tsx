import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/owner/revenue-chart';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <LineChart className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Revenue & Profit Tracker</h1>
          <p className="text-muted-foreground">Analyze financial performance across all stores.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>
            Showing revenue for the last 6 months.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[350px] w-full" />}>
                <RevenueChart />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
