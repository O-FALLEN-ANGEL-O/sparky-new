'use client';

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Download, BookOpen, Send, CheckCircle, Hourglass } from "lucide-react";
import { getEmployeeTasks, getHrDocuments, getHrAnnouncements, getEmployeeLeaveBalance } from "@/lib/db";
import type { EmployeeTask, HrDocument, HrAnnouncement, LeaveBalance } from "@/lib/mock-data";
import { LeaveBalanceChart } from "../charts/leave-balance-chart";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2"><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        </div>
    )
}

export function EmployeeDashboard() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [documents, setDocuments] = useState<HrDocument[]>([]);
  const [announcements, setAnnouncements] = useState<HrAnnouncement[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        const [
            tasksData,
            docsData,
            announcementsData,
            leaveBalanceData
        ] = await Promise.all([
            getEmployeeTasks(),
            getHrDocuments(),
            getHrAnnouncements(),
            getEmployeeLeaveBalance()
        ]);
        setTasks(tasksData);
        setDocuments(docsData);
        setAnnouncements(announcementsData);
        setLeaveBalance(leaveBalanceData);
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
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        <p className="text-muted-foreground">Your personal portal for tasks, leaves, and HR information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Here are your tasks for this week. Keep up the great work!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox id={`task-${task.id}`} defaultChecked={task.status === 'Completed'} />
                    <label htmlFor={`task-${task.id}`} className="font-medium">{task.title}</label>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {task.status === 'Completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Hourglass className="h-4 w-4 text-yellow-500" />}
                    {task.status}
                  </div>
                </div>
                <Progress value={task.progress} className="mt-2 h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
            <LeaveBalanceChart data={leaveBalance} />
            <Button size="lg" className="w-full"><Send className="mr-2 h-4 w-4" /> Apply for Leave</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Work Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border p-0"
                />
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>HR Corner</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative h-20 w-full overflow-hidden rounded-lg bg-accent p-4">
                    <div className="absolute inset-0 flex items-center animate-[scroll_15s_linear_infinite]">
                        {announcements.map((ann, index) => (
                            <p key={index} className="text-accent-foreground font-medium whitespace-nowrap px-8">{ann.message}</p>
                        ))}
                         {announcements.map((ann, index) => (
                            <p key={`dup-${index}`} className="text-accent-foreground font-medium whitespace-nowrap px-8">{ann.message}</p>
                        ))}
                    </div>
                    <style jsx>{`
                        @keyframes scroll {
                            from { transform: translateX(0); }
                            to { transform: translateX(-50%); }
                        }
                    `}</style>
                </div>
                <div className="mt-4 space-y-3">
                    <h4 className="font-semibold">Documents</h4>
                    {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">{doc.title}</p>
                                    <p className="text-xs text-muted-foreground">{doc.date}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="icon"><Download className="h-4 w-4"/></Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
