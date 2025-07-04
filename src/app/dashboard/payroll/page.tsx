import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayrollChart } from '@/components/dashboard/charts/payroll-chart';
import { getPayrollData } from '@/lib/db';
import { Briefcase, Download, Upload } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function PayrollData() {
    const payrollData = await getPayrollData();
    return <PayrollChart data={payrollData} />;
}

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Briefcase className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Payroll Management</h1>
              <p className="text-muted-foreground">Review monthly payouts and manage payroll records.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Timesheets
            </Button>
            <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Payroll Data
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>Monthly payouts for the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <PayrollData />
            </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
