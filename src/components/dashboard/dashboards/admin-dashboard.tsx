'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cpu, HardDrive, MemoryStick, AlertTriangle, ShieldCheck, Server, ToggleRight, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { getSecurityAlerts, getUserRoles } from "@/lib/db";
import type { SecurityAlert, UserRole } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /><Skeleton className="h-2 w-full mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /><Skeleton className="h-2 w-full mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /><Skeleton className="h-2 w-full mt-2" /></CardContent></Card>
            </div>
        </div>
    );
}

export function AdminDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        const [securityAlerts, userRoles] = await Promise.all([
            getSecurityAlerts(),
            getUserRoles()
        ]);
        setAlerts(securityAlerts);
        setUsers(userRoles);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
      return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System health, user sessions, and security monitoring.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2 / 16 GB</div>
            <Progress value={51} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
            <HardDrive className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150 / 512 GB</div>
            <Progress value={29} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Internal Services</CardTitle>
            <CardDescription>Manage the status of internal system modules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5" />
                <div>
                    <h4 className="font-semibold">Real-time Analytics Engine</h4>
                    <p className="text-sm text-muted-foreground">Status: Active</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <ToggleRight className="h-5 w-5" />
                <div>
                    <h4 className="font-semibold">AI Insight Generation</h4>
                    <p className="text-sm text-muted-foreground">Status: Inactive</p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                    </div>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>User Sessions</CardTitle>
                <CardDescription>View live user activity and security risk scores.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>There are currently {users.length} active sessions.</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/security"><ShieldCheck className="mr-2 h-4 w-4" /> Go to Security Monitoring</Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Track all critical actions performed within the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>System logs are rotated hourly. View the latest events now.</p>
                 <Button asChild className="mt-4">
                    <Link href="/dashboard/audit-logs"><FileText className="mr-2 h-4 w-4" /> Go to Audit Logs</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
