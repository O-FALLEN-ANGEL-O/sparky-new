'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { OwnerDashboard } from '@/components/dashboard/dashboards/owner-dashboard';
import { AdminDashboard } from '@/components/dashboard/dashboards/admin-dashboard';
import { ManagerDashboard } from '@/components/dashboard/dashboards/manager-dashboard';
import { HRDashboard } from '@/components/dashboard/dashboards/hr-dashboard';
import { EmployeeDashboard } from '@/components/dashboard/dashboards/employee-dashboard';
import { ShareholderDashboard } from '@/components/dashboard/dashboards/shareholder-dashboard';

export default function DashboardRootPage() {
    const { user } = useAuth();
    
    if (!user) {
        return <Skeleton className="h-[80vh] w-full" />;
    }

    const renderDashboard = () => {
        switch(user.role) {
            case 'owner':
                return <OwnerDashboard />;
            case 'admin':
                return <AdminDashboard />;
            case 'manager':
                return <ManagerDashboard />;
            case 'hr':
                return <HRDashboard />;
            case 'shareholder':
                return <ShareholderDashboard />;
            case 'employee':
            default:
                return <EmployeeDashboard />;
        }
    }

    return (
        <div className="space-y-8">
            {renderDashboard()}
        </div>
    );
}
