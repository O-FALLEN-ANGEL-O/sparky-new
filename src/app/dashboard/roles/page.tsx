import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { RoleManagementTable } from '@/components/dashboard/owner/role-management-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RoleManagementPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Role Management</h1>
                    <p className="text-muted-foreground">Add, remove, or modify user roles and permissions.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New User
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Active Users</CardTitle>
                    <CardDescription>Manage your team and their account permissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                        <RoleManagementTable />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
