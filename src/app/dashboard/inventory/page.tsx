import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory } from 'lucide-react';
import { LiveInventoryTable } from '@/components/dashboard/inventory/live-inventory-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Factory className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Live Inventory Feed</h1>
          <p className="text-muted-foreground">Real-time view of stock levels across all stores.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>
            This is a live feed of product stock levels. Updates are pushed in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <LiveInventoryTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
