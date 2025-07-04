import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';

export default function AiInsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BrainCircuit className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground">AI-generated business suggestions and performance analysis.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Today's Insights</CardTitle>
          <CardDescription>
            This is a placeholder for a more advanced AI insights panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border p-4 rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <p className="font-semibold text-sm text-blue-800 dark:text-blue-300">🚀 Sales Opportunity</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">Trending search data suggests a high demand for 'rose gold' items. Consider launching a new collection or promoting existing rose gold products.</p>
            </div>
            <div className="border p-4 rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <p className="font-semibold text-sm text-green-800 dark:text-green-300">✅ Top Performer</p>
                <p className="text-sm text-green-700 dark:text-green-400">The 'Vintage Pearl Choker' has a 35% higher conversion rate on social media ads compared to other products. Allocate more budget to its campaign.</p>
            </div>
            <div className="border p-4 rounded-lg bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-300">⚠️ Potential Issue</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">Customer feedback indicates confusion about the return policy. Suggestion: Simplify the policy page and add an FAQ section.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
