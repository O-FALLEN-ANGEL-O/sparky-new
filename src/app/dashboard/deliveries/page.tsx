import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DeliveriesTable } from '@/components/dashboard/deliveries/deliveries-table';
import Image from 'next/image';

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Truck className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Live Delivery Monitoring</h1>
          <p className="text-muted-foreground">Real-time tracking of all active and completed deliveries.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Live Delivery Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full bg-muted rounded-lg flex items-center justify-center">
             <Image 
                src="https://placehold.co/1200x400.png"
                width={1200}
                height={400}
                alt="Map placeholder"
                className="object-cover rounded-md"
                data-ai-hint="city map"
             />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Deliveries</CardTitle>
          <CardDescription>
            A list of all deliveries, their status, and assigned agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <DeliveriesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
