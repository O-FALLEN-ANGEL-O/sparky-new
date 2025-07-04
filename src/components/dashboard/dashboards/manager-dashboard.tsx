'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Check, X, MessageSquare } from "lucide-react";
import { getTeamMembers, getLeaveRequests, getTeamTaskData } from "@/lib/db";
import type { TeamMember, LeaveRequest, TeamTask } from "@/lib/mock-data";
import { TaskTrackerChart } from "../charts/task-tracker-chart";
import { RevenueChart } from "../owner/revenue-chart";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        </div>
    )
}

export function ManagerDashboard() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [taskData, setTaskData] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
        const [teamData, requestsData, tasks] = await Promise.all([
            getTeamMembers(),
            getLeaveRequests(),
            getTeamTaskData()
        ]);
        setTeam(teamData);
        setRequests(requestsData);
        setTaskData(tasks);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
      return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-muted-foreground">Manage your team, assign tasks, and approve leaves.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Assign New Task
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskTrackerChart data={taskData} />
        <Card>
            <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Task completion rates over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
               <RevenueChart />
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>Your direct reports and their current status.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.avatar} alt={member.name}/>
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                        </div>
                        <Badge variant={member.status === 'Online' ? 'default' : 'outline'} className={member.status === 'Online' ? 'bg-green-500/20 text-green-700 dark:bg-green-500/10 dark:text-green-400 border-green-500/30' : ''}>
                            {member.status}
                        </Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Review and approve leave requests.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {requests.map(req => (
                    <div key={req.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{req.employeeName}</p>
                            <Badge variant="secondary">{req.days} days</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">{req.dateRange}</p>
                        <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="w-full"><MessageSquare className="mr-2 h-4 w-4"/> Comment</Button>
                            <Button size="sm" variant="destructive" className="w-1/3"><X className="h-4 w-4"/></Button>
                            <Button size="sm" className="w-1/3"><Check className="h-4 w-4"/></Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
