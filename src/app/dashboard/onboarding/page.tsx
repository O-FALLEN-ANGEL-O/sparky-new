import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getHrOnboardingTasks } from '@/lib/db';
import { UserCog, UserPlus, FileEdit } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function OnboardingTasks() {
    const onboardingTasks = await getHrOnboardingTasks();
    const completedTasks = onboardingTasks.filter(t => t.completed).length;
    const progress = (completedTasks / onboardingTasks.length) * 100;

    return (
        <>
        <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold">Overall Progress:</span>
            <Progress value={progress} className="w-[60%]" />
            <span>{Math.round(progress)}%</span>
        </div>
        <div className="space-y-3">
            {onboardingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                    <Checkbox defaultChecked={task.completed} id={`task-${task.id}`} />
                    <label htmlFor={`task-${task.id}`} className="text-sm font-medium flex-1 cursor-pointer">{task.task}</label>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileEdit className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
        </>
    );
}

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <UserCog className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Employee Onboarding</h1>
              <p className="text-muted-foreground">Manage and track the onboarding process for new hires.</p>
            </div>
        </div>
        <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Start New Onboarding
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist for Alex Ray</CardTitle>
          <CardDescription>Status of tasks for the newest joinee.</CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
                <OnboardingTasks />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
