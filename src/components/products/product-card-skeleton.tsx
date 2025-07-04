import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export function ProductCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="p-0">
        <Skeleton className="w-full aspect-square" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-9 w-2/4" />
      </CardFooter>
    </Card>
  );
}
