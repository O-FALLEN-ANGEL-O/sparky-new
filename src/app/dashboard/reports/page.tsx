import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart2 } from 'lucide-react';

const reports = [
    { title: "Q2 2024 Financial Summary", icon: FileText, description: "Complete breakdown of revenue, profit, and expenses." },
    { title: "2024 Sales Performance", icon: BarChart2, description: "Product and store-level sales data." },
    { title: "Annual Inventory Report", icon: FileText, description: "Stock levels, turnover rates, and valuation." }
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Download className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Downloadable Reports</h1>
          <p className="text-muted-foreground">Access and download comprehensive business reports.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Download reports in PDF or Excel format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.map(report => (
            <div key={report.title} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                    <report.icon className="h-6 w-6 text-primary"/>
                    <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
