import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { getDeliveries, getDeliveryAgents } from '@/lib/db';
import type { Delivery, DeliveryAgent } from '@/lib/mock-data';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DeliveryStatusBadge } from '@/components/delivery/delivery-status-badge';
import { formatDistanceToNow } from 'date-fns';

export async function DeliveriesTable() {
    const [deliveries, agents] = await Promise.all([
        getDeliveries(),
        getDeliveryAgents()
    ]);

    const getAgentName = (agentId: string) => {
        return agents.find((agent: DeliveryAgent) => agent.id === agentId)?.name || 'Unassigned';
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.orderId}</TableCell>
                        <TableCell>{delivery.customer.name}</TableCell>
                        <TableCell>{getAgentName(delivery.agentId)}</TableCell>
                        <TableCell>
                            <DeliveryStatusBadge status={delivery.status} />
                        </TableCell>
                        <TableCell>{formatDistanceToNow(new Date(delivery.lastUpdate), { addSuffix: true })}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Track on Map</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
