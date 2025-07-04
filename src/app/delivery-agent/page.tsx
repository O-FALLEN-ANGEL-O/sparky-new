import Link from 'next/link';
import { getDeliveries } from '@/lib/db';
import type { Delivery } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeliveryStatusBadge } from '@/components/delivery/delivery-status-badge';
import { MapPin, Phone, ArrowRight } from 'lucide-react';

async function getAgentTasks(agentId: string): Promise<Delivery[]> {
  const allDeliveries = await getDeliveries();
  return allDeliveries.filter(d => d.agentId === agentId && d.status !== 'delivered' && d.status !== 'failed');
}

export default async function DeliveryAgentDashboard() {
  const tasks = await getAgentTasks('agent-1'); // Hardcoded for demo

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Delivery Tasks</h1>
        <p className="text-muted-foreground">You have {tasks.length} active tasks.</p>
      </div>

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64">
            <CardHeader>
                <CardTitle>All Clear!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You have no pending deliveries.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order {task.orderId}</CardTitle>
                    <CardDescription>To: {task.customer.name}</CardDescription>
                  </div>
                  <DeliveryStatusBadge status={task.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{task.customer.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{task.customer.phone}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/delivery-agent/${task.id}`}>
                    View Details & Verify
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
