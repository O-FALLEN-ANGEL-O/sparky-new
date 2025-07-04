'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUserRoles } from "@/lib/db";
import type { UserRole } from "@/lib/mock-data";
import { PlusCircle, FileUp, Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function DirectorySkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


export function HRDashboard() {
  const [employees, setEmployees] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchData = async () => {
          const users = await getUserRoles();
          setEmployees(users.filter(u => u.role !== 'Owner'));
          setLoading(false);
      }
      fetchData();
  }, []);

  if (loading) {
      return <DirectorySkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Users className="h-8 w-8" />
            <div>
                <h1 className="text-3xl font-bold">Employee Directory</h1>
                <p className="text-muted-foreground">Search, manage, and view all employees.</p>
            </div>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>A list of all employees in the organization.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or email..." className="pl-10" />
                </div>
                <Button variant="outline"><FileUp className="mr-2 h-4 w-4" /> Manage Policies</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Activity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={`https://placehold.co/40x40.png`} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {user.email}
                            </div>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.lastActivity}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
